package com.wesbos.homehq;

import android.content.SharedPreferences;
import android.graphics.Bitmap;
import org.json.*;
import java.io.*;
import java.util.*;
import java.util.concurrent.*;

/** Actual Android image/JSON/storage behavior in an isolated shell-owned directory. */
public final class PhotoStoreTest {
  static int checks;
  static void check(boolean value,String message){if(!value)throw new AssertionError(message);checks++;}
  static class Memory implements SharedPreferences {
    final Map<String,String> data=new ConcurrentHashMap<>();
    public Map<String,?> getAll(){return data;}
    public String getString(String k,String d){return data.containsKey(k)?data.get(k):d;}
    public boolean contains(String k){return data.containsKey(k);}
    public Set<String> getStringSet(String k,Set<String> d){return d;}
    public int getInt(String k,int d){return data.containsKey(k)?Integer.parseInt(data.get(k)):d;}public long getLong(String k,long d){return data.containsKey(k)?Long.parseLong(data.get(k)):d;}
    public float getFloat(String k,float d){return d;}public boolean getBoolean(String k,boolean d){return data.containsKey(k)?Boolean.parseBoolean(data.get(k)):d;}
    public void registerOnSharedPreferenceChangeListener(OnSharedPreferenceChangeListener l){}
    public void unregisterOnSharedPreferenceChangeListener(OnSharedPreferenceChangeListener l){}
    public Editor edit(){return new Editor(){
      public Editor putString(String k,String v){data.put(k,v);return this;}
      public Editor putStringSet(String k,Set<String> v){return this;}
      public Editor putInt(String k,int v){data.put(k,String.valueOf(v));return this;}public Editor putLong(String k,long v){data.put(k,String.valueOf(v));return this;}
      public Editor putFloat(String k,float v){return this;}public Editor putBoolean(String k,boolean v){data.put(k,String.valueOf(v));return this;}
      public Editor remove(String k){data.remove(k);return this;}public Editor clear(){data.clear();return this;}
      public boolean commit(){return true;}public void apply(){}
    };}
  }
  static byte[] image(int seed){Bitmap b=Bitmap.createBitmap(400,300,Bitmap.Config.ARGB_8888);Random random=new Random(seed);int[] pixels=new int[400*300];for(int i=0;i<pixels.length;i++)pixels[i]=0xff000000|random.nextInt(0xffffff);b.setPixels(pixels,0,400,0,0,400,300);ByteArrayOutputStream out=new ByteArrayOutputStream();b.compress(Bitmap.CompressFormat.PNG,100,out);b.recycle();return out.toByteArray();}
  static void remove(File f){if(f.isDirectory()){File[] files=f.listFiles();if(files!=null)for(File child:files)remove(child);}f.delete();}
  static boolean excluded(PhotoStore store,String id){return store.excluded().toString().contains(id);}
  static InputStream stalled(byte[] bytes,CountDownLatch entered,CountDownLatch release){return new FilterInputStream(new ByteArrayInputStream(bytes)){
    boolean waiting=true;
    public int read(byte[] buffer,int offset,int length)throws IOException{
      if(waiting){waiting=false;entered.countDown();try{release.await();}catch(InterruptedException e){throw new InterruptedIOException();}}
      return in.read(buffer,offset,length);
    }
  };}
  static void responsive(PhotoStore store)throws Exception{
    ExecutorService probe=Executors.newSingleThreadExecutor();
    try{check(probe.submit(()->store.list().length()).get(1,TimeUnit.SECONDS)==0,"cache status stays responsive during blocked read");}finally{probe.shutdownNow();}
  }
  public static void main(String[] args)throws Exception{
    File root=new File(args[0]);root.mkdirs();long now=System.currentTimeMillis(),day=86400000L;byte[] first=image(1),second=image(2);
    try{
      Memory memory=new Memory();File folder=new File(root,"persistence");PhotoStore store=new PhotoStore(folder,memory);
      check(store.add(new ByteArrayInputStream(first),now-day),"initial image saved");String id=store.list().getJSONObject(0).getString("id");
      check(!store.add(new ByteArrayInputStream(first),now),"duplicate deduplicated");check(store.list().length()==1,"duplicate count");
      check(store.exclude(id,true),"exclude saved");check(!store.exclude("../escape",true),"invalid exclusion rejected");
      store=new PhotoStore(folder,memory);check(excluded(store,id),"exclusion survives reopening");
      check(!store.add(new ByteArrayInputStream(first),now),"same source rejected by check");
      store.prune(30,30);check(store.list().length()==1,"excluded cache retained for undo when space permits");
      check(store.exclude(id,false)&&!excluded(store,id),"undo restores eligibility");
      check(!store.add(new ByteArrayInputStream(first),now),"undo retains cached duplicate");
      store.exclude(id,true);new File(folder,id+".jpg").delete();store.prune(7,30);check(store.list().length()==0,"missing cache pruned");
      check(excluded(store,id),"pruning never forgets exclusion");check(!store.add(new ByteArrayInputStream(first),now),"pruned excluded source cannot reimport");
      check(store.restoreExcluded(),"restore exclusions");check(store.add(new ByteArrayInputStream(first),now),"restored source imports again");
      store.exclude(id,true);store.clear();check(store.excluded().length()==0&&store.list().length()==0,"explicit clear removes images and exclusions");
      // Exercise every date option against received dates on Android, without real email.
      for(int days:new int[]{7,30,90,180}){
        PhotoStore aged=new PhotoStore(new File(root,"age"+days),new Memory());int expected=0;
        for(int i=0;i<6;i++){long age=new long[]{1,5,20,45,120,220}[i];aged.add(new ByteArrayInputStream(image(10+i)),now-age*day);if(age<=days)expected++;}
        aged.prune(days,50);check(aged.list().length()==expected,"received-date window "+days);
      }
      // Count mode spans old dates; exclusions never consume visible slots and total files stay bounded.
      ArrayList<byte[]> images=new ArrayList<>();for(int i=0;i<60;i++)images.add(image(100+i));
      for(int limit:new int[]{10,20,30,40,50}){
        PhotoStore counted=new PhotoStore(new File(root,"count"+limit),new Memory());String excludedId="";
        for(int i=0;i<60;i++){counted.add(new ByteArrayInputStream(images.get(i)),now-(200+i)*day);if(i==0)excludedId=counted.list().getJSONObject(0).getString("id");}
        counted.exclude(excludedId,true);counted.prune(0,limit);JSONArray rows=counted.list();int visible=0;long newest=0;
        for(int i=0;i<rows.length();i++){JSONObject row=rows.getJSONObject(i);if(!row.getString("id").equals(excludedId)){visible++;newest=Math.max(newest,row.getLong("at"));}}
        check(visible==limit,"count window "+limit);check(rows.length()<=50,"hard cache bound "+limit);check(newest==now-201*day,"excluded newest does not use slot "+limit);check(excluded(counted,excludedId),"count prune retains rule "+limit);
      }
      PhotoStore restoredLimit=new PhotoStore(new File(root,"restore-limit"),new Memory());String oldId="";
      for(int i=0;i<31;i++){restoredLimit.add(new ByteArrayInputStream(images.get(i)),now-(200+i)*day);if(i==30)oldId=restoredLimit.list().getJSONObject(30).getString("id");}
      restoredLimit.exclude(oldId,true);restoredLimit.prune(0,30);check(restoredLimit.list().length()==31,"excluded cache can occupy spare space");
      restoredLimit.restoreExcluded();restoredLimit.prune(0,30);check(restoredLimit.list().length()==30,"restore respects selected gallery capacity");
      // Interleaved importer/owner exclusion resolves safely under the store lock.
      PhotoStore raced=new PhotoStore(new File(root,"race"),new Memory());raced.add(new ByteArrayInputStream(second),now);String racedId=raced.list().getJSONObject(0).getString("id");
      final PhotoStore race=raced;Thread importer=new Thread(()->{try{for(int i=0;i<10;i++)race.add(new ByteArrayInputStream(second),now);}catch(Exception e){throw new RuntimeException(e);}});importer.start();raced.exclude(racedId,true);importer.join();check(!raced.add(new ByteArrayInputStream(second),now)&&excluded(raced,racedId),"refresh/exclusion race cannot resurrect source");
      memory.data.put("excluded",new JSONArray(Arrays.asList(id,"invalid",id)).toString());check(new PhotoStore(folder,memory).excluded().length()==1,"loaded exclusions validate and deduplicate");
      // A slow attachment never holds the cache monitor; clear rejects its eventual publication.
      PhotoStore blocked=new PhotoStore(new File(root,"blocked"),new Memory());CountDownLatch entered=new CountDownLatch(1),release=new CountDownLatch(1);
      java.util.concurrent.atomic.AtomicReference<Throwable> problem=new java.util.concurrent.atomic.AtomicReference<>();
      Thread pending=new Thread(()->{try{check(!blocked.add(stalled(second,entered,release),now),"clear fences an in-flight image");}catch(Throwable e){problem.set(e);}});pending.start();
      check(entered.await(2,TimeUnit.SECONDS),"attachment entered blocked read");
      try{responsive(blocked);blocked.clear();}finally{release.countDown();pending.join(3000);}
      check(!pending.isAlive()&&problem.get()==null,"blocked import completes without resurrection");check(blocked.list().length()==0,"clear remains empty after late completion");
      // Privacy controls cancel an active check and erase storage even while its input is stalled.
      android.os.Looper.prepare();android.os.Handler handler=new android.os.Handler(android.os.Looper.myLooper());
      for(boolean disconnect:new boolean[]{false,true}){
        PhotoStore privateCache=new PhotoStore(new File(root,"privacy"+disconnect),new Memory());Memory mailPrefs=new Memory();mailPrefs.data.put("secret","synthetic-sealed-secret");
        PhotoMail mail=new PhotoMail(mailPrefs,privateCache,handler,()->{});MailCheck active=new MailCheck(60000);
        java.lang.reflect.Field current=PhotoMail.class.getDeclaredField("current");current.setAccessible(true);current.set(mail,active);
        CountDownLatch started=new CountDownLatch(1),finish=new CountDownLatch(1);Thread slow=new Thread(()->{try{privateCache.add(active.guard(stalled(second,started,finish)),now,active::active);}catch(Exception expected){}});slow.start();
        check(started.await(2,TimeUnit.SECONDS),"privacy import starts");String oldEpoch=mail.status().getString("epoch");
        try{check(disconnect?mail.disconnect():mail.eraseCache(),"privacy control succeeds during check");check(!mail.status().getBoolean("busy"),"cancelled check stops reporting busy");check(!oldEpoch.equals(mail.status().getString("epoch")),"privacy control changes cache epoch");check(mailPrefs.contains("secret")!=disconnect,"erase keeps delivery; disconnect removes secret");}finally{finish.countDown();slow.join(3000);mail.close();}
        check(privateCache.list().length()==0&&!active.active(),"late import cannot repopulate privacy-erased cache");
      }
      System.out.println("PhotoStore: "+checks+" isolated Android checks passed");
    }finally{remove(root);}
  }
}
