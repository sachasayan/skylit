package com.wesbos.homehq;

import android.content.Context;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import org.json.JSONObject;
import javax.net.ssl.*;
import javax.security.auth.x500.X500Principal;
import java.io.*;
import java.math.BigInteger;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.cert.Certificate;
import java.util.*;
import java.util.concurrent.*;

/** Explicit, short-lived TLS service on the frame's Wi-Fi address. No bridge is served. */
final class PhoneManagement implements AutoCloseable {
  interface Dashboard {String request(JSONObject action,long version) throws Exception;void imported();}
  private final Context context;private final PhotoStore photos;private final LocalMedia media;private final Dashboard dashboard;
  private final SecureRandom random=new SecureRandom();private final ScheduledExecutorService timer=Executors.newSingleThreadScheduledExecutor();
  private final ThreadPoolExecutor clients=new ThreadPoolExecutor(2,2,0L,TimeUnit.MILLISECONDS,new ArrayBlockingQueue<>(4),new ThreadPoolExecutor.AbortPolicy());
  private final Set<Socket> sockets=Collections.synchronizedSet(new HashSet<>());
  private volatile SSLServerSocket server;private volatile long expires;private volatile String address="",fingerprint="";private final PhonePairing pairing=new PhonePairing();private volatile long generation;
  PhoneManagement(Context context,PhotoStore photos,LocalMedia media,Dashboard dashboard){this.context=context;this.photos=photos;this.media=media;this.dashboard=dashboard;}
  synchronized boolean start(){stop();try{
    InetAddress bind=null;Enumeration<NetworkInterface> interfaces=NetworkInterface.getNetworkInterfaces();while(interfaces.hasMoreElements()){NetworkInterface network=interfaces.nextElement();if(!network.getName().startsWith("wlan")||!network.isUp())continue;Enumeration<InetAddress> addresses=network.getInetAddresses();while(addresses.hasMoreElements()){InetAddress candidate=addresses.nextElement();if(candidate instanceof Inet4Address&&candidate.isSiteLocalAddress())bind=candidate;}}
    if(bind==null)return false;KeyStore keys=KeyStore.getInstance("AndroidKeyStore");keys.load(null);String alias="skylit-local-management-tls";
    if(!keys.containsAlias(alias)){KeyPairGenerator generator=KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC,"AndroidKeyStore");// Conscrypt uses a precomputed TLS signature digest; authorize DIGEST_NONE for this isolated server key.
    generator.initialize(new KeyGenParameterSpec.Builder(alias,KeyProperties.PURPOSE_SIGN|KeyProperties.PURPOSE_VERIFY).setDigests(KeyProperties.DIGEST_NONE,KeyProperties.DIGEST_SHA256,KeyProperties.DIGEST_SHA384,KeyProperties.DIGEST_SHA512).setCertificateSubject(new X500Principal("CN=Skylit local management")).setCertificateSerialNumber(new BigInteger(96,random)).setCertificateNotBefore(new Date(System.currentTimeMillis()-86400000L)).setCertificateNotAfter(new Date(System.currentTimeMillis()+10L*365*86400000L)).build());generator.generateKeyPair();}
    final PrivateKey privateKey=(PrivateKey)keys.getKey(alias,null);final java.security.cert.X509Certificate[] chain={ (java.security.cert.X509Certificate)keys.getCertificate(alias) };final String serverAlias=alias;
    X509KeyManager manager=new X509KeyManager(){
      public String[] getClientAliases(String type,Principal[] issuers){return null;}
      public String chooseClientAlias(String[] types,Principal[] issuers,Socket socket){return null;}
      public String[] getServerAliases(String type,Principal[] issuers){return "EC".equals(type)?new String[]{serverAlias}:null;}
      public String chooseServerAlias(String type,Principal[] issuers,Socket socket){return "EC".equals(type)?serverAlias:null;}
      public java.security.cert.X509Certificate[] getCertificateChain(String name){return serverAlias.equals(name)?chain:null;}
      public PrivateKey getPrivateKey(String name){return serverAlias.equals(name)?privateKey:null;}
    };
    SSLContext tls=SSLContext.getInstance("TLS");tls.init(new KeyManager[]{manager},null,random);
    Certificate certificate=keys.getCertificate(alias);StringBuilder hex=new StringBuilder();for(byte b:MessageDigest.getInstance("SHA-256").digest(certificate.getEncoded())){if(hex.length()>0)hex.append(':');hex.append(String.format(Locale.ROOT,"%02X",b&255));}fingerprint=hex.toString();
    SSLServerSocket listener=(SSLServerSocket)tls.getServerSocketFactory().createServerSocket(0,6,bind);List<String> supported=Arrays.asList(listener.getSupportedProtocols());listener.setEnabledProtocols(supported.contains("TLSv1.3")?new String[]{"TLSv1.3","TLSv1.2"}:new String[]{"TLSv1.2"});server=listener;address="https://"+bind.getHostAddress()+":"+listener.getLocalPort();long now=System.currentTimeMillis();expires=now+15*60000L;pairing.start(now);final long version=++generation;
    timer.schedule(()->{synchronized(PhoneManagement.this){if(generation==version)stop();}},15,TimeUnit.MINUTES);
    Thread accept=new Thread(()->{while(server==listener){try{Socket socket=listener.accept();socket.setSoTimeout(8000);sockets.add(socket);try{clients.execute(()->serve(socket,version));}catch(RejectedExecutionException e){sockets.remove(socket);socket.close();}}catch(IOException e){break;}}},"skylit-phone");accept.setDaemon(true);accept.start();return true;
    }catch(Exception ignored){stop();return false;}}
  synchronized String status(){try{long now=System.currentTimeMillis();boolean active=server!=null&&now<expires;String ticket=active?pairing.invitation(now):"";return new JSONObject().put("active",active).put("address",active?address:"").put("invite",ticket.isEmpty()?"":address+"/#pair="+ticket).put("request",active?pairing.request(now):"").put("number",active?pairing.number(now):"").put("paired",active&&pairing.paired(now)).put("fingerprint",active?fingerprint:"").put("expires",active?expires:0).toString();}catch(Exception ignored){return "{}";}}
  synchronized boolean decide(String request,boolean allow){return server!=null&&System.currentTimeMillis()<expires&&pairing.decide(request,allow,System.currentTimeMillis());}
  synchronized void stop(){generation++;SSLServerSocket old=server;server=null;pairing.clear();address="";expires=0;if(old!=null)try{old.close();}catch(IOException ignored){}synchronized(sockets){for(Socket socket:sockets)try{socket.close();}catch(IOException ignored){}sockets.clear();}clients.getQueue().clear();}
  boolean active(long version){return server!=null&&generation==version&&System.currentTimeMillis()<expires;}
  private static String line(InputStream input,int max) throws IOException {ByteArrayOutputStream out=new ByteArrayOutputStream();int b;while((b=input.read())!=-1){if(b=='\n')break;if(out.size()>=max)throw new IOException("Header too long");if(b!='\r')out.write(b);}if(b==-1&&out.size()==0)return null;return out.toString("US-ASCII");}
  private static boolean equal(String a,String b){return MessageDigest.isEqual(a.getBytes(StandardCharsets.US_ASCII),b.getBytes(StandardCharsets.US_ASCII));}
  private String cookie(Map<String,String> headers){for(String entry:headers.getOrDefault("cookie","").split(";")){String value=entry.trim();if(value.startsWith("skylitPhotoSession="))return value.substring(19);}return "";}
  private boolean authorized(Map<String,String> headers){return pairing.authorized(cookie(headers),System.currentTimeMillis());}
  private void serve(Socket socket,long version){try(Socket managed=socket){((SSLSocket)socket).setUseClientMode(false);((SSLSocket)socket).startHandshake();if(!active(version))return;InputStream input=socket.getInputStream();String first=line(input,4096);if(first==null)return;String[] request=first.split(" ");if(request.length!=3||!"HTTP/1.1".equals(request[2]))return;String method=request[0],path=request[1];Map<String,String> headers=new HashMap<>();int total=0;for(int i=0;i<40;i++){String line=line(input,4096);if(line==null)return;total+=line.length();if(total>16384)return;if(line.isEmpty())break;int colon=line.indexOf(':');if(colon<=0)return;String key=line.substring(0,colon).toLowerCase(Locale.ROOT);if(headers.put(key,line.substring(colon+1).trim())!=null)return;if(i==39)return;}
      if(!active(version))return;String expected=address.substring(8);if(!expected.equals(headers.get("host"))||headers.containsKey("transfer-encoding")||headers.containsKey("origin")&&!address.equals(headers.get("origin"))){respond(socket,403,"application/json","{}",null);return;}
      int length=0;try{length=Integer.parseInt(headers.getOrDefault("content-length","0"));}catch(Exception ignored){return;}int limit="/upload-video".equals(path)?32*1024*1024:"/upload".equals(path)?PhotoPolicy.MAX_DOWNLOAD:65536;if(length<0||length>limit){respond(socket,413,"application/json","{}",null);return;}
      if("GET".equals(method)&&("/".equals(path)||"/manage.js".equals(path))){try(InputStream file=context.getAssets().open("/".equals(path)?"manage.html":"manage.js")){respond(socket,200,"/".equals(path)?"text/html; charset=utf-8":"text/javascript; charset=utf-8",LocalMedia.read(file,65536),null);}return;}
      if("POST".equals(method)&&"/pair".equals(path)){
        if(!"application/json".equals(headers.get("content-type"))){respond(socket,403,"application/json","{}",null);return;}JSONObject row=new JSONObject(new String(readBody(input,length),StandardCharsets.UTF_8));String pendingCookie="";
        synchronized(this){if(active(version)&&pairing.claim(row.optString("ticket"),System.currentTimeMillis()))pendingCookie=pairing.pendingCookie();}
        if(pendingCookie.isEmpty()){respond(socket,403,"application/json","{}",null);if(pairing.exhausted())stop();return;}
        respond(socket,200,"application/json",new JSONObject().put("state","pending").put("number",pairing.number(System.currentTimeMillis())).toString(),"skylitPhotoSession="+pendingCookie+"; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=900");return;
      }
      if("GET".equals(method)&&"/pair-state".equals(path)){long now=System.currentTimeMillis();String state=pairing.state(cookie(headers),now);if("unavailable".equals(state)){respond(socket,403,"application/json","{}",null);return;}respond(socket,200,"application/json",new JSONObject().put("state",state).put("number","pending".equals(state)?pairing.number(now):"").toString(),null);return;}
      if(!authorized(headers)){respond(socket,403,"application/json","{}",null);return;}
      if("GET".equals(method)&&"/state".equals(path)){String state=dashboard.request(null,version);if(!active(version))return;respond(socket,state==null?503:200,"application/json",state==null?"{}":state,null);return;}
      if("GET".equals(method)&&path.matches("/photo/[a-f0-9]{64}\\.jpg")){String id=path.substring(7,path.length()-4);try(InputStream photo=photos.open(id)){respond(socket,200,"image/jpeg",LocalMedia.read(photo,PhotoPolicy.MAX_JPEG),null);}catch(Exception ignored){respond(socket,404,"application/json","{}",null);}return;}
      if("POST".equals(method)&&"/action".equals(path)&&"application/json".equals(headers.get("content-type"))){JSONObject action=new JSONObject(new String(readBody(input,length),StandardCharsets.UTF_8));if(!active(version))return;String response=dashboard.request(action,version);respond(socket,"true".equals(response)?200:400,"application/json","{\"ok\":"+("true".equals(response)?"true":"false")+"}",null);return;}
      if("POST".equals(method)&&"/upload".equals(path)&&"image/jpeg".equals(headers.get("content-type"))){byte[] bytes=readBody(input,length);if(!active(version))return;if(bytes.length<3||bytes[0]!=(byte)0xff||bytes[1]!=(byte)0xd8){respond(socket,400,"application/json","{}",null);return;}String id=photos.importImage(bytes,()->active(version));if(id.isEmpty()||!active(version)){respond(socket,400,"application/json","{}",null);return;}photos.review(id,true);photos.keeper(id,true);dashboard.imported();respond(socket,200,"application/json","{\"ok\":true}",null);return;}
      if("POST".equals(method)&&"/upload-video".equals(path)&&"video/mp4".equals(headers.get("content-type"))){byte[] bytes=readBody(input,length);if(!active(version))return;media.clipBytes(bytes,()->active(version));dashboard.imported();respond(socket,200,"application/json","{\"ok\":true}",null);return;}
      respond(socket,404,"application/json","{}",null);
    }catch(Exception ignored){}finally{sockets.remove(socket);}}
  private static byte[] readBody(InputStream input,int length) throws IOException {byte[] bytes=new byte[length];int offset=0;while(offset<length){int n=input.read(bytes,offset,length-offset);if(n<0)throw new IOException("Incomplete body");offset+=n;}return bytes;}
  private void respond(Socket socket,int status,String mime,String body,String cookie) throws IOException {respond(socket,status,mime,body.getBytes(StandardCharsets.UTF_8),cookie);}
  private void respond(Socket socket,int status,String mime,byte[] body,String cookie) throws IOException {OutputStream out=socket.getOutputStream();String reason=status==200?"OK":status==403?"Forbidden":status==404?"Not Found":status==503?"Unavailable":"Bad Request";String header="HTTP/1.1 "+status+" "+reason+"\r\nContent-Type: "+mime+"\r\nContent-Length: "+body.length+"\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nReferrer-Policy: no-referrer\r\nContent-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'\r\nConnection: close\r\n"+(cookie==null?"":"Set-Cookie: "+cookie+"\r\n")+"\r\n";out.write(header.getBytes(StandardCharsets.US_ASCII));out.write(body);out.flush();}
  @Override public void close(){stop();timer.shutdownNow();clients.shutdownNow();}
}
