package com.wesbos.homehq;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.graphics.Bitmap;
import android.media.MediaCodec;
import android.media.MediaExtractor;
import android.media.MediaFormat;
import android.media.MediaMetadataRetriever;
import android.media.MediaMuxer;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import java.io.*;
import java.nio.ByteBuffer;
import java.util.*;

/** Owner-selected media only. URI capabilities never reach web or remote pages. */
final class LocalMedia {
  private final Context context;private final PhotoStore photos;private final File scratch,music;
  private java.util.function.BooleanSupplier active=()->true;void guard(java.util.function.BooleanSupplier value){active=value;}
  private String exportId="";private File exportFile;private long exportBytes;private long exportStarted;
  LocalMedia(Context context,PhotoStore photos){this.context=context;this.photos=photos;scratch=new File(context.getCacheDir(),"local-media");scratch.mkdirs();music=new File(context.getFilesDir(),"slideshow-music.m4a");for(File f:scratch.listFiles())f.delete();}
  static byte[] read(InputStream input,int max) throws IOException {ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] buffer=new byte[32768];int n,total=0;while((n=input.read(buffer))!=-1){if((total+=n)>max)throw new IOException("Media too large");out.write(buffer,0,n);}return out.toByteArray();}
  String image(Uri uri) throws Exception {try(InputStream input=context.getContentResolver().openInputStream(uri)){byte[] bytes=read(input,PhotoPolicy.MAX_DOWNLOAD);if(bytes.length>=6&&bytes[0]=='G'&&bytes[1]=='I'&&bytes[2]=='F')return animated(bytes,active);String id=photos.importImage(bytes,active);if(id.isEmpty())throw new IOException("Image unavailable");photos.review(id,true);boolean kept=photos.keeper(id,true);return kept?"Imported to Keepers.":"Imported to Recent photos; Keepers is full.";}}
  String clip(Uri uri) throws Exception {try(InputStream input=context.getContentResolver().openInputStream(uri)){return clipBytes(read(input,32*1024*1024),active);}}
  String animated(byte[] bytes,java.util.function.BooleanSupplier guard) throws Exception {File clean=File.createTempFile("gif-",".mp4",scratch);try{GifClip.encode(bytes,clean,guard);return publishClip(clean,bytes,guard);}finally{clean.delete();}}
  String clipBytes(byte[] bytes,java.util.function.BooleanSupplier guard) throws Exception {File original=File.createTempFile("clip-",".source",scratch),clean=File.createTempFile("clip-",".mp4",scratch);try{try(FileOutputStream out=new FileOutputStream(original)){out.write(bytes);}if(!guard.getAsBoolean())throw new IOException("Import cancelled");remux(original,clean,false);return publishClip(clean,bytes,guard);}finally{original.delete();clean.delete();}}
  private String publishClip(File clean,byte[] source,java.util.function.BooleanSupplier guard) throws Exception {MediaMetadataRetriever retriever=new MediaMetadataRetriever();Bitmap poster=null;try{retriever.setDataSource(clean.getAbsolutePath());poster=retriever.getFrameAtTime(0,MediaMetadataRetriever.OPTION_CLOSEST_SYNC);if(poster==null)throw new IOException("Clip poster unavailable");ByteArrayOutputStream image=new ByteArrayOutputStream();poster.compress(Bitmap.CompressFormat.JPEG,86,image);image.write(PhotoStore.digest(source).getBytes(java.nio.charset.StandardCharsets.US_ASCII));while(image.size()<4096)image.write(0);byte[] bytes=image.toByteArray();String candidate=PhotoStore.digest(source);boolean existing=photos.cached(candidate);String id=photos.importPoster(bytes,candidate,guard);if(id.isEmpty()||!guard.getAsBoolean()||!photos.attachClip(id,clean)){if(!existing&&!id.isEmpty())photos.rollbackPoster(id);throw new IOException("Clip capacity reached");}photos.review(id,true);boolean kept=photos.keeper(id,true);return kept?"Imported muted clip to Keepers.":"Imported muted clip to Recent photos; Keepers is full.";}finally{retriever.release();if(poster!=null)poster.recycle();}}
  void soundtrack(Uri uri) throws Exception {File original=File.createTempFile("music-",".source",scratch),clean=File.createTempFile("music-",".m4a",scratch);try{try(InputStream input=context.getContentResolver().openInputStream(uri);FileOutputStream out=new FileOutputStream(original)){out.write(read(input,20*1024*1024));}remux(original,clean,true);if(!active.getAsBoolean())throw new IOException("Import cancelled");if(!clean.renameTo(music))throw new IOException("Could not save soundtrack");}finally{original.delete();clean.delete();}}
  // Rebuild the container; location, file names, EXIF and container tags are not copied.
  private static void remux(File original,File clean,boolean audio) throws Exception {
    MediaExtractor extractor=new MediaExtractor();MediaMuxer muxer=null;boolean started=false;
    try{extractor.setDataSource(original.getAbsolutePath());muxer=new MediaMuxer(clean.getAbsolutePath(),MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4);int selected=-1,target=-1;
      for(int i=0;i<extractor.getTrackCount();i++){MediaFormat format=extractor.getTrackFormat(i);String mime=format.getString(MediaFormat.KEY_MIME);if(audio?"audio/mp4a-latm".equals(mime):"video/avc".equals(mime)){long duration=format.containsKey(MediaFormat.KEY_DURATION)?format.getLong(MediaFormat.KEY_DURATION):0;if(duration<=0||duration>(audio?20*60:30)*1000000L)throw new IOException("Media duration exceeds limit");if(!audio&&(!PhotoPolicy.imageSize(format.getInteger(MediaFormat.KEY_WIDTH),format.getInteger(MediaFormat.KEY_HEIGHT))||Math.max(format.getInteger(MediaFormat.KEY_WIDTH),format.getInteger(MediaFormat.KEY_HEIGHT))>2400))throw new IOException("Clip dimensions unsupported");if(!audio){MediaMetadataRetriever metadata=new MediaMetadataRetriever();try{metadata.setDataSource(original.getAbsolutePath());String value=metadata.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION);int rotation=value==null?0:Integer.parseInt(value);if(rotation==0||rotation==90||rotation==180||rotation==270)muxer.setOrientationHint(rotation);}finally{metadata.release();}}selected=i;target=muxer.addTrack(format);extractor.selectTrack(i);break;}}
      if(selected<0)throw new IOException("Choose H.264 MP4 video or AAC M4A audio");muxer.start();started=true;ByteBuffer buffer=ByteBuffer.allocate(4*1024*1024);MediaCodec.BufferInfo info=new MediaCodec.BufferInfo();int frames=0;
      while(extractor.getSampleTrackIndex()>=0){if(++frames>100000)throw new IOException("Media sample limit");buffer.clear();int size=extractor.readSampleData(buffer,0);if(size<0)break;if(size>buffer.capacity()||(extractor.getSampleFlags()&MediaExtractor.SAMPLE_FLAG_ENCRYPTED)!=0)throw new IOException("Unsupported media sample");info.set(0,size,extractor.getSampleTime(),extractor.getSampleFlags()&MediaExtractor.SAMPLE_FLAG_SYNC);muxer.writeSampleData(target,buffer,info);extractor.advance();}
    }finally{extractor.release();if(muxer!=null){try{if(started)muxer.stop();}finally{muxer.release();}}}
  }
  boolean hasMusic(){return music.isFile();}InputStream openMusic() throws IOException {return new FileInputStream(music);}void eraseMusic(){music.delete();}
  synchronized String beginExport(){cancelExport();exportId=UUID.randomUUID().toString();exportFile=new File(scratch,"export-"+exportId+".webm");exportBytes=0;exportStarted=System.currentTimeMillis();return exportId;}
  synchronized boolean appendExport(String id,String encoded){if(!exportId.equals(id)||exportFile==null||System.currentTimeMillis()-exportStarted>180000||encoded==null||encoded.length()>65536)return false;try{byte[] bytes=android.util.Base64.decode(encoded,android.util.Base64.DEFAULT);if(exportBytes+bytes.length>48L*1024*1024)return false;try(FileOutputStream out=new FileOutputStream(exportFile,true)){out.write(bytes);}exportBytes+=bytes.length;return true;}catch(Exception ignored){return false;}}
  private synchronized void checkExport(String id)throws IOException{if(!exportId.equals(id)||exportFile==null)throw new IOException("Export cancelled");}
  String finishExport(String id) throws IOException {
    final File source;
    synchronized(this){checkExport(id);if(exportBytes<32)throw new IOException("Export unavailable");source=exportFile;}
    try(FileInputStream test=new FileInputStream(source)){byte[] magic=new byte[4];if(test.read(magic)!=4||magic[0]!=(byte)0x1a||magic[1]!=(byte)0x45||magic[2]!=(byte)0xdf||magic[3]!=(byte)0xa3)throw new IOException("Export is not WebM");}
    if(Build.VERSION.SDK_INT<29)throw new IOException("Downloads export requires Android 10 or newer");ContentResolver resolver=context.getContentResolver();Uri target=null;
    try{ContentValues values=new ContentValues();values.put(MediaStore.MediaColumns.DISPLAY_NAME,"Skylit-slideshow-"+System.currentTimeMillis()+".webm");values.put(MediaStore.MediaColumns.MIME_TYPE,"video/webm");if(Build.VERSION.SDK_INT>=29){values.put(MediaStore.MediaColumns.RELATIVE_PATH,"Download/");values.put(MediaStore.MediaColumns.IS_PENDING,1);}checkExport(id);target=resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI,values);if(target==null)throw new IOException("Downloads unavailable");try(InputStream input=new FileInputStream(source);OutputStream out=resolver.openOutputStream(target)){byte[] buffer=new byte[32768];int n;while((n=input.read(buffer))!=-1){checkExport(id);out.write(buffer,0,n);}}checkExport(id);if(Build.VERSION.SDK_INT>=29){values.clear();values.put(MediaStore.MediaColumns.IS_PENDING,0);resolver.update(target,values,null,null);}synchronized(this){checkExport(id);cancelExport();}return "Saved video in Downloads.";}catch(Exception e){if(target!=null)resolver.delete(target,null,null);synchronized(this){if(exportId.equals(id))cancelExport();}throw new IOException("Could not save export",e);}
  }
  synchronized void cancelExport(){if(exportFile!=null)exportFile.delete();exportId="";exportFile=null;exportBytes=0;}
}
