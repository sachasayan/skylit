package com.wesbos.homehq;

/** Side-effect-free limits shared by mail import and private photo storage. */
final class PhotoPolicy {
  static final int MAX_DOWNLOAD=12*1024*1024,MAX_JPEG=4*1024*1024;
  static final int THUMB_EDGE=384,MAX_THUMB_BYTES=128*1024;
  private PhotoPolicy(){}
  static boolean gmail(String email){return email!=null&&(email.matches("[^\\s@]+@gmail\\.com")||email.matches("[^\\s@]+@googlemail\\.com"));}
  static final long CLEANUP_INTERVAL=96L*60*60*1000;
  static final long FREE_RESERVE=256L*1024*1024;
  static boolean limits(int days,int maximum){return days==0&&(maximum==12||maximum==30||maximum==60||maximum==90);}
  static int count(int value){return limits(0,value)?value:30;}
  static boolean cleanupDue(long last,long now){return last<=0||last>now||now-last>=CLEANUP_INTERVAL;}
  static long reserve(long total){return Math.max(FREE_RESERVE,total/20);}
  static boolean imageSize(int width,int height){return width>=320&&height>=240&&width<=20000&&height<=20000;}
  static int sampleSize(int width,int height){int sample=1;while(Math.max(width,height)/sample>2400||(long)(width/sample)*(height/sample)>10000000L)sample*=2;return sample;}
  static boolean photoId(String id){return id!=null&&id.matches("[a-f0-9]{64}");}
}
