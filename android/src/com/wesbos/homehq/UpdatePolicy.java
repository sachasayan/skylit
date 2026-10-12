package com.wesbos.homehq;
import java.net.URI;
/** Pure update boundaries; no network, credentials or Android state. */
final class UpdatePolicy {
  static final String REPOSITORY="/sachasayan/skylit/releases/download/";
  static boolean version(String value){return value!=null&&value.matches("[0-9]{1,4}\\.[0-9]{1,4}\\.[0-9]{1,4}");}
  static boolean asset(String url,String version,String file){try{URI u=new URI(url);return version(version)&&file.matches("(?:skylit-[0-9.]+\\.apk|update\\.json)")&&"https".equals(u.getScheme())&&"github.com".equals(u.getHost())&&u.getUserInfo()==null&&u.getPort()==-1&&u.getQuery()==null&&u.getFragment()==null&&u.getRawPath().equals(REPOSITORY+"v"+version+"/"+file);}catch(Exception e){return false;}}
  static boolean downloadHost(String url){try{URI u=new URI(url);return "https".equals(u.getScheme())&&u.getUserInfo()==null&&(u.getPort()==-1||u.getPort()==443)&&u.getFragment()==null&&("github.com".equals(u.getHost())||"release-assets.githubusercontent.com".equals(u.getHost())||"objects.githubusercontent.com".equals(u.getHost()));}catch(Exception e){return false;}}
  static boolean hash(String hash){return hash!=null&&hash.matches("[a-f0-9]{64}");}
  static boolean newer(long installed,long candidate){return installed>0&&candidate>installed&&candidate<=Integer.MAX_VALUE;}
  static boolean window(int hour,int start,int end){return hour>=0&&hour<24&&start>=0&&start<24&&end>=0&&end<24&&start!=end&&(start<end?hour>=start&&hour<end:hour>=start||hour<end);}
  static boolean idle(long now,long touch,long heartbeat,boolean eligible){return eligible&&touch>=0&&now>=touch&&now-touch>=300000&&heartbeat>0&&now>=heartbeat&&now-heartbeat<90000;}
}
