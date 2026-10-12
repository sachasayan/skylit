package com.wesbos.homehq;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import org.json.JSONObject;
import org.json.JSONArray;
import java.util.HashSet;
import javax.mail.Address;
import javax.mail.internet.InternetAddress;
import java.util.Date;
import java.util.Properties;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import javax.mail.Folder;
import javax.mail.Message;
import javax.mail.Session;
import javax.mail.Store;
import javax.mail.AuthenticationFailedException;
import javax.mail.search.ComparisonTerm;
import javax.mail.search.ReceivedDateTerm;
import com.sun.mail.imap.IMAPSSLStore;

/** Read-only Gmail IMAPS importer. Only decoded, resized images reach PhotoStore. */
final class PhotoMail {
  interface Listener {void changed();}
  private final SharedPreferences preferences;
  private final PhotoStore photos;
  private final ExecutorService worker=Executors.newSingleThreadExecutor();
  private final Handler main;
  private final Listener listener;
  private final ScheduledExecutorService deadline=Executors.newSingleThreadScheduledExecutor();
  private volatile MailCheck current;
  private boolean closed;
  private volatile String error="";

  PhotoMail(Context context,PhotoStore store,Listener changed){this(context.getSharedPreferences("skylit-photo-mail",Context.MODE_PRIVATE),store,new Handler(Looper.getMainLooper()),changed);}
  PhotoMail(SharedPreferences prefs,PhotoStore store,Handler handler,Listener changed){preferences=prefs;photos=store;main=handler;listener=changed;if(!preferences.contains("epoch"))preferences.edit().putString("epoch",java.util.UUID.randomUUID().toString()).apply();photos.prune(days(),maximum());}

  int days(){int value=preferences.getInt("days",30);return PhotoPolicy.limits(value,30)?value:30;}
  int maximum(){int value=preferences.getInt("maximum",30);return Math.max(5,Math.min(200,value));}
  private void notifyChange(){main.post(()->listener.changed());}
  boolean configure(int days,int maximum){if(!PhotoPolicy.limits(days,maximum))return false;preferences.edit().putInt("days",days).putInt("maximum",maximum).apply();photos.prune(days,maximum);notifyChange();return true;}
  boolean exclude(String id,boolean value){boolean saved=photos.exclude(id,value);if(saved){photos.prune(days(),maximum());notifyChange();}return saved;}
  boolean restoreExcluded(){boolean saved=photos.restoreExcluded();if(saved){photos.prune(days(),maximum());notifyChange();}return saved;}
  private int interval(){int value=preferences.getInt("interval",86400);return MailImportPolicy.interval(value)?value:86400;}
  synchronized boolean delivery(String raw){if(current!=null)return false;try{JSONObject row=new JSONObject(raw);int seconds=row.getInt("interval");JSONArray addresses=row.getJSONArray("senders");if(!MailImportPolicy.interval(seconds)||addresses.length()>50)return false;JSONArray clean=new JSONArray();HashSet<String> unique=new HashSet<>();for(int i=0;i<addresses.length();i++){String value=MailImportPolicy.address(addresses.getString(i));if(value.isEmpty())return false;if(unique.add(value))clean.put(value);}boolean trusted=row.getBoolean("trusted");if(trusted&&clean.length()==0)return false;boolean saved=preferences.edit().putInt("interval",seconds).putBoolean("trusted",trusted).putString("senders",clean.toString()).commit();if(saved)notifyChange();return saved;}catch(Exception ignored){return false;}}
  String deliverySettings(){try{return new JSONObject().put("interval",interval()).put("trusted",preferences.getBoolean("trusted",false)).put("senders",new JSONArray(preferences.getString("senders","[]"))).toString();}catch(Exception ignored){return "{}";}}
  synchronized boolean eraseCache(){cancel();photos.clear();preferences.edit().putString("epoch",java.util.UUID.randomUUID().toString()).apply();notifyChange();return true;}
  synchronized boolean connect(String email,String password){if(current!=null)return false;String account=email==null?"":email.trim().toLowerCase(java.util.Locale.ROOT),secret=password==null?"":password.replace(" ","");if(!PhotoPolicy.gmail(account)||secret.length()!=16)return false;try{String sealed=MailSecret.seal(secret,account);String previous=preferences.getString("email","");if(!preferences.edit().putString("email",account).putString("secret",sealed).remove("lastSync").commit())return false;if(!account.equals(previous)){photos.clear();preferences.edit().remove("seen").putString("epoch",java.util.UUID.randomUUID().toString()).putBoolean("trusted",false).putString("senders","[]").remove("lastAttempt").remove("failures").apply();}error="";notifyChange();sync();return true;}catch(Exception ignored){error="Could not protect the app password on this device.";notifyChange();return false;}}
  synchronized boolean disconnect(){cancel();preferences.edit().remove("seen").remove("email").remove("secret").remove("lastSync").remove("lastAttempt").remove("failures").remove("senders").remove("trusted").putString("epoch",java.util.UUID.randomUUID().toString()).commit();try{MailSecret.forget();}catch(Exception ignored){}photos.clear();error="";notifyChange();return true;}
  JSONObject status(){MailCheck check=current;boolean busy=check!=null;JSONObject row=new JSONObject();try{row.put("connected",preferences.contains("secret"));row.put("email",preferences.getString("email",""));row.put("days",days());row.put("maximum",maximum());row.put("lastSync",preferences.getLong("lastSync",0));row.put("busy",busy);row.put("epoch",preferences.getString("epoch",""));row.put("interval",interval());row.put("imported",busy?check.imported:preferences.getInt("imported",0));row.put("visited",busy?check.visited:0);row.put("skipped",busy?check.skipped:preferences.getInt("skipped",0));row.put("trusted",preferences.getBoolean("trusted",false));row.put("error",error);row.put("photos",photos.list());row.put("storage",photos.storage());row.put("excluded",photos.excluded());}catch(Exception ignored){}return row;}
  void maybeSync(){if(preferences.contains("secret")&&MailImportPolicy.due(preferences.getLong("lastSync",0),preferences.getLong("lastAttempt",0),preferences.getInt("failures",0),System.currentTimeMillis(),interval()))sync();}
  private void cancel(){MailCheck check=current;if(check!=null){current=null;check.stop(false,true);}error="";}
  synchronized void sync(){
    if(closed||current!=null||!preferences.contains("secret"))return;
    final MailCheck check=new MailCheck(120000L);current=check;error="";
    final String account=preferences.getString("email",""),sealed=preferences.getString("secret","");
    preferences.edit().putLong("lastAttempt",System.currentTimeMillis()).apply();notifyChange();
    final ScheduledFuture<?> timeout=deadline.schedule(()->{check.stop(true,true);synchronized(PhotoMail.this){if(current==check){current=null;error="Mail check timed out. Saved pictures kept; try again.";preferences.edit().putInt("failures",Math.min(10,preferences.getInt("failures",0)+1)).apply();notifyChange();}}},120,TimeUnit.SECONDS);
    worker.execute(()->{
      Store store=null;Folder folder=null;String failure="";
      try{
        check.attach();check.ensure();String password=MailSecret.open(sealed,account);
        Properties p=new Properties();p.setProperty("mail.store.protocol","imaps");p.setProperty("mail.imaps.host","imap.gmail.com");p.setProperty("mail.imaps.port","993");p.setProperty("mail.imaps.ssl.enable","true");p.setProperty("mail.imaps.ssl.checkserveridentity","true");p.setProperty("mail.imaps.connectiontimeout","15000");p.setProperty("mail.imaps.timeout","20000");p.setProperty("mail.imaps.fetchsize","262144");p.setProperty("mail.imaps.writetimeout","20000");
        p.put("mail.imaps.ssl.socketFactory",check.socketFactory());p.setProperty("mail.imaps.ssl.socketFactory.fallback","false");
        Session session=Session.getInstance(p);store=new IMAPSSLStore(session,null);check.ensure();store.connect("imap.gmail.com",account,password);check.ensure();
        folder=store.getFolder("INBOX");folder.open(Folder.READ_ONLY);check.ensure();
        int window=days();long cutoff=window==0?0:System.currentTimeMillis()-(long)window*86400000L;int count=folder.getMessageCount();Message[] messages=window==0?(count==0?new Message[0]:folder.getMessages(Math.max(1,count-999),count)):folder.search(new ReceivedDateTerm(ComparisonTerm.GE,new Date(cutoff)));
        final boolean trusted=preferences.getBoolean("trusted",false);HashSet<String> approved=new HashSet<>();JSONArray senders=new JSONArray(preferences.getString("senders","[]"));for(int n=0;n<senders.length();n++)approved.add(senders.getString(n));
        JSONObject seen;try{seen=new JSONObject(preferences.getString("seen","{}"));}catch(Exception ignored){seen=new JSONObject();}int attachments=0,remembered=0;
        for(int i=messages.length-1;i>=0&&check.visited<1000&&attachments<300;i--,check.visited++){
          check.ensure();Message message=messages[i];
          try{
            Date received=message.getReceivedDate();if(received==null||received.getTime()<cutoff)continue;
            Address[] rawFrom=message.getFrom();String[] from=rawFrom==null?null:new String[rawFrom.length];if(from!=null)for(int n=0;n<rawFrom.length;n++)from[n]=rawFrom[n] instanceof InternetAddress?((InternetAddress)rawFrom[n]).getAddress():"";
            if(!MailImportPolicy.allowed(trusted,approved,from)){check.skipped++;continue;}
            String messageKey="";if(folder instanceof javax.mail.UIDFolder){javax.mail.UIDFolder uid=(javax.mail.UIDFolder)folder;long validity=uid.getUIDValidity(),messageUid=uid.getUID(message);if(validity>0&&messageUid>0)messageKey=PhotoStore.digest((validity+":"+messageUid).getBytes(java.nio.charset.StandardCharsets.US_ASCII));}
            JSONArray known=messageKey.isEmpty()?null:seen.optJSONArray(messageKey);boolean cached=known!=null;if(cached)for(int n=0;n<known.length();n++)if(!photos.known(known.optString(n))){cached=false;break;}if(cached)continue;
            final java.util.ArrayList<String> importedIds=new java.util.ArrayList<>();final int budget=300-attachments;
            int scanned=MailParts.collect(message,received.getTime(),budget,(input,at)->{check.ensure();if(photos.add(check.guard(input),at,check::active,importedIds::add)){check.imported++;notifyChange();}check.ensure();photos.prune(days(),maximum());},()->check.skipped++);attachments+=scanned;
            if(!messageKey.isEmpty()&&scanned<budget){seen.put(messageKey,new JSONArray(importedIds));remembered++;if(remembered%10==0){while(seen.length()>1000||seen.toString().length()>524288)seen.remove(seen.keys().next());synchronized(PhotoMail.this){if(current==check&&check.active())preferences.edit().putString("seen",seen.toString()).apply();}}}

          }catch(javax.mail.FolderClosedException|javax.mail.StoreClosedException e){throw e;}
          catch(javax.mail.MessagingException e){check.ensure();if(MailParts.connectionFailure(e))throw e;check.skipped++;}
        }
        check.ensure();photos.prune(days(),maximum());while(seen.length()>1000||seen.toString().length()>524288)seen.remove(seen.keys().next());
        synchronized(PhotoMail.this){if(current==check&&check.active())preferences.edit().putLong("lastSync",System.currentTimeMillis()).putString("seen",seen.toString()).putInt("failures",0).putInt("imported",check.imported).putInt("skipped",check.skipped).apply();}
      }catch(AuthenticationFailedException e){failure="Sign-in failed. Check the account and its app password.";}
      catch(Exception e){failure="Could not refresh email photos. Check Wi-Fi and try again.";}
      finally{
        timeout.cancel(false);check.stop(check.timedOut(),false);
        // Closed sockets make cleanup local; never wait for a graceful network logout after cancellation.
        try{if(folder!=null&&folder.isOpen())folder.close(false);}catch(Exception ignored){}
        try{if(store!=null)store.close();}catch(Exception ignored){}
        synchronized(PhotoMail.this){if(current==check){current=null;error=failure;if(!failure.isEmpty())preferences.edit().putInt("failures",Math.min(10,preferences.getInt("failures",0)+1)).apply();notifyChange();}}
      }
    });
  }
  synchronized void close(){closed=true;cancel();deadline.shutdownNow();worker.shutdownNow();}
}
