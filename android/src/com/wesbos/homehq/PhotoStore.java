package com.wesbos.homehq;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.os.Build;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;

/** Small, private, metadata-free photo cache. No mail body is persisted. */
final class PhotoStore {
  private final File directory;
  private final SharedPreferences preferences;
  private static final int MAX_EXCLUDED=4096;
  static final int MAX_FILES=300,MAX_KEEPERS=100;
  static final long MAX_STORAGE=256L*1024*1024,KEEPER_STORAGE=128L*1024*1024;
  private long generation;
  private final java.util.concurrent.Semaphore decoding=new java.util.concurrent.Semaphore(1);
  private static final class Item {String id,taken="",visual="";long at;int width,height;float x=.5f,y=.5f;boolean recent=true;Item(String i,long t){id=i;at=t;}}
  private static HashSet<String> checkedIds(String raw) throws Exception {JSONArray rows=new JSONArray(raw);if(rows.length()>300)throw new IllegalArgumentException();HashSet<String> ids=new HashSet<>();for(int i=0;i<rows.length();i++){String id=rows.getString(i);if(!PhotoPolicy.photoId(id))throw new IllegalArgumentException();ids.add(id);}return ids;}
  synchronized boolean excludeMany(String raw,boolean value){try{HashSet<String> changes=checkedIds(raw),ids=exclusions();if(value)ids.addAll(changes);else ids.removeAll(changes);if(ids.size()>MAX_EXCLUDED)return false;return preferences.edit().putString("excluded",new JSONArray(ids).toString()).commit();}catch(Exception ignored){return false;}}
  synchronized boolean keeperMany(String raw,boolean value){try{HashSet<String> changes=checkedIds(raw),ids=keepers();if(value){for(String id:changes)if(!new File(directory,id+".jpg").isFile())return false;ids.addAll(changes);}else ids.removeAll(changes);if(ids.size()>MAX_KEEPERS)return false;long bytes=0;for(String id:ids)bytes+=size(id);if(bytes>KEEPER_STORAGE)return false;return preferences.edit().putString("keepers",new JSONArray(ids).toString()).commit();}catch(Exception ignored){return false;}}
  synchronized boolean reviewMany(String raw,boolean approve){try{HashSet<String> changes=checkedIds(raw),waiting=pending();changes.retainAll(waiting);HashSet<String> blocked=exclusions();if(!approve){blocked.addAll(changes);if(blocked.size()>MAX_EXCLUDED)return false;}waiting.removeAll(changes);return preferences.edit().putString("pending",new JSONArray(waiting).toString()).putString("excluded",new JSONArray(blocked).toString()).commit();}catch(Exception ignored){return false;}}
  private HashSet<String> keepers(){HashSet<String> result=new HashSet<>();try{JSONArray rows=new JSONArray(preferences.getString("keepers","[]"));for(int i=0;i<rows.length()&&result.size()<MAX_KEEPERS;i++){String id=rows.optString(i);if(PhotoPolicy.photoId(id))result.add(id);}}catch(Exception ignored){}return result;}
  synchronized boolean keeper(String id,boolean keep){if(!PhotoPolicy.photoId(id))return false;HashSet<String> ids=keepers();if(keep){if(!new File(directory,id+".jpg").isFile()||(!ids.contains(id)&&ids.size()>=MAX_KEEPERS))return false;long bytes=0;for(String key:ids)bytes+=size(key);if(!ids.contains(id)&&bytes+size(id)>KEEPER_STORAGE)return false;ids.add(id);}else ids.remove(id);return preferences.edit().putString("keepers",new JSONArray(ids).toString()).commit();}
  private long size(String id){return new File(directory,id+".jpg").length()+new File(directory,id+".mp4").length();}
  synchronized boolean review(String id,boolean approve){if(!PhotoPolicy.photoId(id))return false;HashSet<String> waiting=pending();waiting.remove(id);if(!approve&&!exclude(id,true))return false;return preferences.edit().putString("pending",new JSONArray(waiting).toString()).commit();}
  private HashSet<String> pending(){HashSet<String> result=new HashSet<>();try{JSONArray rows=new JSONArray(preferences.getString("pending","[]"));for(int i=0;i<rows.length()&&result.size()<MAX_FILES;i++)if(PhotoPolicy.photoId(rows.optString(i)))result.add(rows.optString(i));}catch(Exception ignored){}return result;}
  synchronized boolean importOptions(boolean review,boolean dates){return preferences.edit().putBoolean("review",review).putBoolean("dates",dates).commit();}
  synchronized JSONObject storage(){JSONObject row=new JSONObject();try{long used=0,pinned=0;HashSet<String> ids=keepers();for(Item item:read()){used+=size(item.id);if(ids.contains(item.id))pinned+=size(item.id);}row.put("used",used).put("limit",MAX_STORAGE).put("keepers",ids.size()).put("keeperBytes",pinned).put("keeperLimit",KEEPER_STORAGE).put("review",preferences.getBoolean("review",false)).put("dates",preferences.getBoolean("dates",false));}catch(Exception ignored){}return row;}
  PhotoStore(Context context){this(new File(context.getFilesDir(),"mail-photos"),context.getSharedPreferences("skylit-photo-index",Context.MODE_PRIVATE));}
  PhotoStore(File files,SharedPreferences prefs){directory=files;directory.mkdirs();preferences=prefs;File[] abandoned=directory.listFiles(file->file.getName().endsWith(".tmp"));if(abandoned!=null)for(File file:abandoned)file.delete();}
  private HashSet<String> exclusions(){HashSet<String> ids=new HashSet<>();try{JSONArray rows=new JSONArray(preferences.getString("excluded","[]"));for(int i=0;i<rows.length()&&ids.size()<MAX_EXCLUDED;i++){String id=rows.optString(i);if(PhotoPolicy.photoId(id))ids.add(id);}}catch(Exception ignored){}return ids;}
  synchronized JSONArray excluded(){return new JSONArray(exclusions());}
  synchronized boolean exclude(String id,boolean value){if(!PhotoPolicy.photoId(id))return false;HashSet<String> ids=exclusions();if(value){if(!ids.contains(id)&&ids.size()>=MAX_EXCLUDED)return false;ids.add(id);}else ids.remove(id);return preferences.edit().putString("excluded",new JSONArray(ids).toString()).commit();}
  synchronized boolean restoreExcluded(){return preferences.edit().remove("excluded").commit();}
  private ArrayList<Item> read(){ArrayList<Item> list=new ArrayList<>();try{JSONArray rows=new JSONArray(preferences.getString("items","[]"));for(int i=0;i<rows.length();i++){JSONObject row=rows.getJSONObject(i);String id=row.optString("id");if(PhotoPolicy.photoId(id)){Item item=new Item(id,row.optLong("at"));item.width=row.optInt("width");item.height=row.optInt("height");item.taken=row.optString("taken");item.visual=row.optString("visual");item.x=(float)row.optDouble("x",.5);item.y=(float)row.optDouble("y",.5);item.recent=row.optBoolean("recent",true);list.add(item);}}}catch(Exception ignored){}return list;}
  private void write(ArrayList<Item> list){JSONArray rows=new JSONArray();for(Item item:list){JSONObject row=new JSONObject();try{row.put("id",item.id);row.put("at",item.at).put("width",item.width).put("height",item.height).put("taken",item.taken).put("visual",item.visual).put("x",item.x).put("y",item.y).put("recent",item.recent);rows.put(row);}catch(Exception ignored){}}preferences.edit().putString("items",rows.toString()).commit();}
  private static byte[] bounded(InputStream stream) throws Exception {ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] buffer=new byte[32768];int n,total=0;while((n=stream.read(buffer))!=-1){total+=n;if(total>PhotoPolicy.MAX_DOWNLOAD)throw new IllegalArgumentException("Photo exceeds size limit");out.write(buffer,0,n);}return out.toByteArray();}
  static String digest(byte[] data) throws Exception {byte[] hash=MessageDigest.getInstance("SHA-256").digest(data);StringBuilder result=new StringBuilder();for(byte b:hash)result.append(String.format(java.util.Locale.ROOT,"%02x",b&255));return result.toString();}
  private static int orientation(byte[] data){if(Build.VERSION.SDK_INT<24)return 1;try{return new android.media.ExifInterface(new ByteArrayInputStream(data)).getAttributeInt(android.media.ExifInterface.TAG_ORIENTATION,1);}catch(Exception ignored){return 1;}}
  private static Bitmap rotate(Bitmap image,int orientation){Matrix matrix=new Matrix();switch(orientation){case 2:matrix.postScale(-1,1);break;case 3:matrix.postRotate(180);break;case 4:matrix.postScale(1,-1);break;case 5:matrix.postRotate(90);matrix.postScale(-1,1);break;case 6:matrix.postRotate(90);break;case 7:matrix.postRotate(270);matrix.postScale(-1,1);break;case 8:matrix.postRotate(270);break;default:return image;}Bitmap result=Bitmap.createBitmap(image,0,0,image.getWidth(),image.getHeight(),matrix,true);image.recycle();return result;}
  boolean add(InputStream input,long receivedAt) throws Exception {return add(input,receivedAt,()->true);}
  boolean add(InputStream input,long receivedAt,java.util.function.BooleanSupplier active) throws Exception {return add(input,receivedAt,active,id->{});}
  boolean add(InputStream input,long receivedAt,java.util.function.BooleanSupplier active,java.util.function.Consumer<String> identity) throws Exception {
    final long version;synchronized(this){version=generation;}byte[] original=bounded(input);return addBytes(original,receivedAt,active,identity,version,false,null);
  }
  private boolean addBytes(byte[] original,long receivedAt,java.util.function.BooleanSupplier active,java.util.function.Consumer<String> identity) throws Exception {
    final long version;synchronized(this){version=generation;}return addBytes(original,receivedAt,active,identity,version,false,null);
  }
  private boolean addBytes(byte[] original,long receivedAt,java.util.function.BooleanSupplier active,java.util.function.Consumer<String> identity,long version,boolean owner,String sourceId) throws Exception {
    if(original.length<(owner?32:4096)||original.length>PhotoPolicy.MAX_DOWNLOAD)return false;
    String id=sourceId==null?digest(original):sourceId;if(!PhotoPolicy.photoId(id))return false;
    synchronized(this){
      if(version!=generation||!active.getAsBoolean())return false;if(exclusions().contains(id)){identity.accept(id);return false;}
      ArrayList<Item> existing=read();
      for(Item item:existing)if(item.id.equals(id)&&cached(id)){item.at=Math.max(item.at,receivedAt);write(existing);identity.accept(id);return false;}
    }
    decoding.acquire();try{if(!active.getAsBoolean())return false;
    BitmapFactory.Options options=new BitmapFactory.Options();options.inJustDecodeBounds=true;BitmapFactory.decodeByteArray(original,0,original.length,options);
    if(owner?options.outWidth<32||options.outHeight<32||options.outWidth>20000||options.outHeight>20000:!PhotoPolicy.imageSize(options.outWidth,options.outHeight))return false;
    int sample=PhotoPolicy.sampleSize(options.outWidth,options.outHeight);
    options.inJustDecodeBounds=false;options.inSampleSize=sample;Bitmap image=BitmapFactory.decodeByteArray(original,0,original.length,options);if(image==null)return false;
    try{
      image=rotate(image,orientation(original));final int width=image.getWidth(),height=image.getHeight();final String visual=visualHash(image),taken=preferences.getBoolean("dates",false)?taken(original):"";final float[] focus=focus(image);ByteArrayOutputStream output=new ByteArrayOutputStream();
      for(int quality=86;quality>=60;quality-=13){output.reset();if(!image.compress(Bitmap.CompressFormat.JPEG,quality,output))return false;if(output.size()<=PhotoPolicy.MAX_JPEG)break;}
      if(output.size()>PhotoPolicy.MAX_JPEG)return false;
      File temporary=File.createTempFile("pending-",".tmp",directory);
      try{
        try(FileOutputStream file=new FileOutputStream(temporary)){file.write(output.toByteArray());file.getFD().sync();}
        // Only publication holds the cache lock; network reads, decoding and JPEG writes do not.
        synchronized(this){
          if(version!=generation||!active.getAsBoolean()||exclusions().contains(id))return false;
          ArrayList<Item> items=read();
          for(int i=0;i<items.size();i++)if(items.get(i).id.equals(id)){
            if(cached(id)){items.get(i).at=Math.max(items.get(i).at,receivedAt);write(items);identity.accept(id);return false;}
            items.remove(i);break;
          }
          File target=new File(directory,id+".jpg");
          if(!temporary.renameTo(target))throw new java.io.IOException("Could not save image");
          long bytes=0;for(Item entry:items)bytes+=size(entry.id);HashSet<String> pins=keepers();
          while(items.size()>=MAX_FILES||bytes+target.length()>MAX_STORAGE){Item oldest=null;for(Item entry:items)if(!pins.contains(entry.id)&&(oldest==null||entry.at<oldest.at))oldest=entry;if(oldest==null){target.delete();return false;}bytes-=size(oldest.id);new File(directory,oldest.id+".jpg").delete();new File(directory,oldest.id+".mp4").delete();items.remove(oldest);}
          Item item=new Item(id,receivedAt);item.width=width;item.height=height;item.visual=visual;item.taken=taken;item.x=focus[0];item.y=focus[1];items.add(item);write(items);
          if(preferences.getBoolean("review",false)){HashSet<String> waiting=pending();waiting.add(id);preferences.edit().putString("pending",new JSONArray(waiting).toString()).commit();}identity.accept(id);return true;
        }
      }finally{temporary.delete();}
    }finally{if(!image.isRecycled())image.recycle();}
    }finally{decoding.release();}
  }
  synchronized int prune(int days,int maximum){
    if(!PhotoPolicy.limits(days,maximum))throw new IllegalArgumentException("Invalid photo limits");
    long now=System.currentTimeMillis(),bytes=0;ArrayList<Item> items=read(),kept=new ArrayList<>();Collections.sort(items,(a,b)->Long.compare(b.at,a.at));HashSet<String> ids=new HashSet<>(),blocked=exclusions(),pins=keepers();int recent=0;
    for(Item item:items){item.recent=false;if(pins.contains(item.id)&&new File(directory,item.id+".jpg").isFile()){kept.add(item);ids.add(item.id);bytes+=size(item.id);}}
    for(Item item:items)if(!blocked.contains(item.id)&&PhotoPolicy.retain(item.at,now,days)&&recent<maximum&&new File(directory,item.id+".jpg").isFile()){
      if(ids.contains(item.id)){item.recent=true;recent++;}else if(kept.size()<MAX_FILES&&bytes+size(item.id)<=MAX_STORAGE){item.recent=true;kept.add(item);ids.add(item.id);bytes+=size(item.id);recent++;}
    }
    // Preserve a bounded Undo cache, while hash-only exclusions outlive its images.
    int undo=0;for(Item item:items)if(blocked.contains(item.id)&&!ids.contains(item.id)&&PhotoPolicy.retain(item.at,now,days)&&kept.size()<Math.min(MAX_FILES,Math.max(50,maximum)+pins.size())&&undo<50&&bytes+size(item.id)<=MAX_STORAGE&&new File(directory,item.id+".jpg").isFile()){kept.add(item);ids.add(item.id);bytes+=size(item.id);undo++;}
    write(kept);HashSet<String> waiting=pending();waiting.retainAll(ids);preferences.edit().putString("pending",new JSONArray(waiting).toString()).commit();File[] files=directory.listFiles();if(files!=null)for(File file:files)if((file.getName().endsWith(".jpg")||file.getName().endsWith(".mp4"))&&!ids.contains(file.getName().replace(".jpg","").replace(".mp4","")))file.delete();return kept.size();
  }
  synchronized JSONArray list(){ArrayList<Item> items=read();Collections.sort(items,(a,b)->Long.compare(b.at,a.at));HashSet<String> pins=keepers(),waiting=pending();JSONArray rows=new JSONArray();for(Item item:items)if(new File(directory,item.id+".jpg").isFile()){JSONObject row=new JSONObject();try{row.put("id",item.id).put("at",item.at).put("width",item.width).put("height",item.height).put("taken",item.taken).put("visual",item.visual).put("focalX",item.x).put("focalY",item.y).put("keeper",pins.contains(item.id)).put("pending",waiting.contains(item.id)).put("recent",item.recent).put("kind",new File(directory,item.id+".mp4").isFile()?"video":"image").put("url","https://appassets.androidplatform.net/private-photos/"+item.id+".jpg");if(new File(directory,item.id+".mp4").isFile())row.put("media","https://appassets.androidplatform.net/private-clips/"+item.id+".mp4");rows.put(row);}catch(Exception ignored){}}return rows;}
  synchronized boolean cached(String id){if(!PhotoPolicy.photoId(id))return false;File file=new File(directory,id+".jpg");if(!file.isFile())return false;BitmapFactory.Options options=new BitmapFactory.Options();options.inJustDecodeBounds=true;BitmapFactory.decodeFile(file.getAbsolutePath(),options);return options.outWidth>0&&options.outHeight>0;}
  synchronized boolean known(String id){return PhotoPolicy.photoId(id)&&(exclusions().contains(id)||cached(id));}
  private static String taken(byte[] source){try{String value=new android.media.ExifInterface(new ByteArrayInputStream(source)).getAttribute(android.media.ExifInterface.TAG_DATETIME_ORIGINAL);if(value!=null&&value.matches("[0-9]{4}:[0-9]{2}:[0-9]{2} .*")){java.text.SimpleDateFormat f=new java.text.SimpleDateFormat("yyyy:MM:dd",java.util.Locale.ROOT);f.setLenient(false);java.util.Date date=f.parse(value.substring(0,10));return new java.text.SimpleDateFormat("yyyy-MM-dd",java.util.Locale.ROOT).format(date);}}catch(Exception ignored){}return "";}
  private static String visualHash(Bitmap image){Bitmap small=Bitmap.createScaledBitmap(image,9,8,true);long hash=0;for(int y=0;y<8;y++)for(int x=0;x<8;x++){int a=small.getPixel(x,y),b=small.getPixel(x+1,y);int ga=((a>>16)&255)*3+((a>>8)&255)*6+(a&255),gb=((b>>16)&255)*3+((b>>8)&255)*6+(b&255);hash=(hash<<1)|(ga>gb?1:0);}if(small!=image)small.recycle();return String.format(java.util.Locale.ROOT,"%016x",hash);}
  private static float[] focus(Bitmap image){float[] point={.5f,.5f};Bitmap scaled=null;try{int width=Math.min(360,image.getWidth());width-=width%2;int height=Math.max(2,image.getHeight()*width/image.getWidth());Bitmap temp=Bitmap.createScaledBitmap(image,width,height,true);scaled=temp.copy(Bitmap.Config.RGB_565,false);if(temp!=image)temp.recycle();android.media.FaceDetector.Face[] faces=new android.media.FaceDetector.Face[8];int count=new android.media.FaceDetector(width,height,8).findFaces(scaled,faces);float x=0,y=0;int accepted=0;for(int i=0;i<count;i++)if(faces[i].confidence()>=.5){android.graphics.PointF p=new android.graphics.PointF();faces[i].getMidPoint(p);x+=p.x/width;y+=p.y/height;accepted++;}if(accepted>0){point[0]=x/accepted;point[1]=y/accepted;}}catch(Exception ignored){}finally{if(scaled!=null)scaled.recycle();}return point;}
  String importImage(byte[] bytes) throws Exception {return importImage(bytes,()->true);}
  String importImage(byte[] bytes,java.util.function.BooleanSupplier active) throws Exception {String id=digest(bytes);if(!active.getAsBoolean())return "";final long version;synchronized(this){version=generation;}addBytes(bytes,System.currentTimeMillis(),active,idValue->{},version,true,null);synchronized(this){return active.getAsBoolean()&&!exclusions().contains(id)&&new File(directory,id+".jpg").isFile()?id:"";}}
  String importPoster(byte[] bytes,String sourceId,java.util.function.BooleanSupplier active) throws Exception {if(!PhotoPolicy.photoId(sourceId)||!active.getAsBoolean())return "";final long version;synchronized(this){version=generation;}addBytes(bytes,System.currentTimeMillis(),active,id->{},version,true,sourceId);synchronized(this){return active.getAsBoolean()&&!exclusions().contains(sourceId)&&new File(directory,sourceId+".jpg").isFile()?sourceId:"";}}
  synchronized boolean attachClip(String id,File source){if(!PhotoPolicy.photoId(id)||exclusions().contains(id)||!new File(directory,id+".jpg").isFile()||source.length()>32L*1024*1024)return false;int clips=0;long bytes=source.length();for(Item item:read()){bytes+=size(item.id);if(new File(directory,item.id+".mp4").isFile())clips++;}if(new File(directory,id+".mp4").isFile())return true;if(clips>=20||bytes>MAX_STORAGE)return false;if(keepers().contains(id)){long pinned=source.length();for(String key:keepers())pinned+=size(key);if(pinned>KEEPER_STORAGE)return false;}return source.renameTo(new File(directory,id+".mp4"));}
  synchronized void rollbackPoster(String id){if(!PhotoPolicy.photoId(id)||keepers().contains(id)||new File(directory,id+".mp4").isFile())return;ArrayList<Item> items=read();items.removeIf(item->item.id.equals(id));write(items);HashSet<String> waiting=pending();waiting.remove(id);preferences.edit().putString("pending",new JSONArray(waiting).toString()).commit();new File(directory,id+".jpg").delete();}
  synchronized File clip(String id){if(!PhotoPolicy.photoId(id))throw new IllegalArgumentException();return new File(directory,id+".mp4");}
  synchronized InputStream open(String id) throws Exception {if(!PhotoPolicy.photoId(id))throw new IllegalArgumentException("Invalid photo");File image=new File(directory,id+".jpg");if(!image.isFile())throw new java.io.FileNotFoundException();return new FileInputStream(image);}
  synchronized void clear(){generation++;preferences.edit().remove("items").remove("excluded").remove("keepers").remove("pending").commit();File[] files=directory.listFiles();if(files!=null)for(File file:files)file.delete();}
}
