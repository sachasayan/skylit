package com.wesbos.homehq;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.*;
import android.widget.*;
import org.json.JSONObject;
import java.io.ByteArrayInputStream;
import java.io.IOException;

/** A local dashboard plus isolated, unprivileged Google service and YouTube web views. */
public class MainActivity extends Activity {
  private static final String TAG="Skylit";
  private static final String LOCAL="https://appassets.androidplatform.net/index.html";
  private final Handler handler=new Handler(Looper.getMainLooper());
  private FrameLayout root;
  private WebView dashboard, remote;
  private View fullScreen;
  private WebChromeClient.CustomViewCallback fullScreenCallback;
  private Button returnButton;
  private TextView photoHint;
  private SharedPreferences prefs;
  private CalendarStore calendars;
  private PhotoStore photos;
  private PhotoMail photoMail;
  private LocalMedia media;
  private PhoneManagement phone;
  private AppUpdates updates;
  private final java.util.concurrent.ExecutorService imports=java.util.concurrent.Executors.newSingleThreadExecutor();
  private int pickerKind;
  private volatile long importGeneration;
  private boolean idlePhotos,localPhotosOpen,remotePhotos,foreground,slideshowScheduled,slideshowStarted;
  private boolean swallowIdleTouch,quietOpen;
  private int idleGeneration,localPhotoGeneration;
  private int remoteGeneration=0, dashboardCrashes=0;
  private boolean exitArmed;
  private float exitX,exitY;
  private final Runnable idleTask=()->{final int generation=idleGeneration;if(dashboard==null)return;dashboard.evaluateJavascript("window.SkylitApp&&window.SkylitApp.settingsOpen&&window.SkylitApp.settingsOpen()?null:!!(window.SkylitWorkspace&&window.SkylitWorkspace.idle())",value->{if(generation!=idleGeneration||!foreground||remote!=null||localPhotosOpen)return;if("null".equals(value)){resetIdle();return;}if("true".equals(value)){quietOpen=true;pauseMomo(true);dashboard.evaluateJavascript("window.SkylitWorkspace&&window.SkylitWorkspace.pause(true)",null);}else if(prefs.getInt("idle",120)>0&&"email".equals(prefs.getString("photo_source","album"))&&photos.list().length()>0){dashboard.evaluateJavascript("!window.SkylitPlayer||SkylitPlayer.canIdle()",allowed->{if(generation==idleGeneration&&foreground&&remote==null&&!localPhotosOpen){if("true".equals(allowed))openLocalPhotos(true);else resetIdle();}});}else if(prefs.getInt("idle",120)>0&&validAlbum(prefs.getString("album","")))openRemote(prefs.getString("album",""),true,true);else resetIdle();});};
  private final Runnable photoCheckTask=new Runnable(){@Override public void run(){if(photoMail!=null)photoMail.maybeSync();handler.postDelayed(this,60000L);}};
  private final Runnable exitTask=()->{exitArmed=false;openStockApp();};

  @Override public void onCreate(Bundle state){
    super.onCreate(state);
    prefs=getSharedPreferences("skylit",MODE_PRIVATE);
    updates=AppUpdates.get(this);
    calendars=new CalendarStore(getSharedPreferences("skylit-calendars",MODE_PRIVATE));
    photos=new PhotoStore(this);photoMail=new PhotoMail(this,photos,()->{if(dashboard!=null)dashboard.evaluateJavascript("window.SkylitPhotos&&window.SkylitPhotos.receive("+photoMail.status().toString()+")",null);});
    media=new LocalMedia(this,photos);phone=new PhoneManagement(this,photos,media,new PhoneManagement.Dashboard(){
      public String request(JSONObject action,long version) throws Exception {
        java.util.concurrent.CompletableFuture<String> result=new java.util.concurrent.CompletableFuture<>();
        runOnUiThread(()->{if(dashboard==null||!phone.active(version)){result.complete(null);return;}String operation=action==null?"SkylitLibrary.remoteState()":"SkylitLibrary.remoteApply("+action.toString()+")";dashboard.evaluateJavascript("JSON.stringify(window.SkylitLibrary&&Skylit.photoManagementCurrent("+version+")?"+operation+":null)",value->{try{Object decoded=new org.json.JSONTokener(value).nextValue();result.complete(decoded instanceof String?(String)decoded:null);}catch(Exception ignored){result.complete(null);}});});return result.get(5,java.util.concurrent.TimeUnit.SECONDS);
      }
      public void imported(){notifyLibrary();}
    });
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON|WindowManager.LayoutParams.FLAG_FULLSCREEN);
    WebView.setWebContentsDebuggingEnabled(getIntent().getBooleanExtra("debug",false));
    root=new FrameLayout(this);root.setBackgroundColor(Color.rgb(238,232,221));setContentView(root);
    createDashboard();handler.post(photoCheckTask);
  }
  private void settings(WebView web){WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setUseWideViewPort(true);s.setLoadWithOverviewMode(true);s.setMediaPlaybackRequiresUserGesture(false);s.setAllowFileAccess(false);s.setAllowContentAccess(false);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);}
  private void createDashboard(){
    calendars.resetRequests();
    dashboard=new WebView(this);settings(dashboard);
    // The privileged bridge exists only in this local, navigation-restricted view.
    dashboard.addJavascriptInterface(new DashboardBridge(),"Skylit");
    dashboard.setWebViewClient(new WebViewClient(){
      @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
        Uri target=request.getUrl();return !"https".equals(target.getScheme())||!"appassets.androidplatform.net".equals(target.getHost());
      }
      @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){
        Uri u=request.getUrl();if(!"https".equals(u.getScheme())||!"appassets.androidplatform.net".equals(u.getHost()))return null;
        String path=u.getPath();if(path==null||"/".equals(path))path="/index.html";
        if(path.startsWith("/private-photos/")){String id=path.substring("/private-photos/".length());if(!id.matches("[a-f0-9]{64}\\.jpg"))return missing();try{java.util.Map<String,String> headers=new java.util.HashMap<>();headers.put("Cache-Control","no-store");return new WebResourceResponse("image/jpeg",null,200,"OK",headers,photos.open(id.substring(0,64)));}catch(Exception e){return missing();}}
        if(path.startsWith("/private-clips/")){String id=path.substring("/private-clips/".length());if(!id.matches("[a-f0-9]{64}\\.mp4"))return missing();try{return mediaResponse(photos.clip(id.substring(0,64)),"video/mp4",request.getRequestHeaders().containsKey("Range")?request.getRequestHeaders().get("Range"):request.getRequestHeaders().get("range"));}catch(Exception ignored){return missing();}}
        if("/private-music/soundtrack.m4a".equals(path)){try{java.util.Map<String,String> headers=new java.util.HashMap<>();headers.put("Cache-Control","no-store");return new WebResourceResponse("audio/mp4",null,200,"OK",headers,media.openMusic());}catch(Exception ignored){return missing();}}
        if(path.contains(".."))return missing();
        String mime=path.endsWith(".txt")?"text/plain":path.endsWith(".js")?"text/javascript":path.endsWith(".css")?"text/css":path.endsWith(".svg")?"image/svg+xml":path.endsWith(".png")?"image/png":"text/html";
        try{return new WebResourceResponse(mime,"UTF-8",getAssets().open(path.substring(1)));}catch(IOException e){return missing();}
      }
      @Override public void onPageFinished(WebView view,String url){view.evaluateJavascript("JSON.stringify(window.SkylitApp?{ready:true,tab:window.SkylitApp.status().tab}:{ready:false})",v->Log.i(TAG,"Dashboard ready: "+v));pauseMomo(!foreground||remote!=null);resetIdle();}
      @Override public boolean onRenderProcessGone(WebView view,RenderProcessGoneDetail detail){
        root.removeView(view);view.destroy();dashboard=null;localPhotoGeneration++;idleGeneration++;quietOpen=false;localPhotosOpen=false;idlePhotos=false;swallowIdleTouch=false;
        if(++dashboardCrashes<=2)handler.postDelayed(()->{createDashboard();},1000);
        else showFailure("The dashboard browser stopped repeatedly. Restart the frame to try again.");
        Log.e(TAG,"Dashboard renderer stopped; recovered="+(dashboardCrashes<=2));return true;
      }
    });
    dashboard.setWebChromeClient(new WebChromeClient(){@Override public boolean onConsoleMessage(ConsoleMessage m){if(m.messageLevel()==ConsoleMessage.MessageLevel.ERROR)Log.e(TAG,"Dashboard: "+m.message());return true;}});
    root.addView(dashboard,0,new FrameLayout.LayoutParams(-1,-1));dashboard.loadUrl(LOCAL);
  }
  private WebResourceResponse mediaResponse(java.io.File file,String mime,String range) throws Exception {if(!file.isFile())return missing();long length=file.length(),start=0,end=length-1;java.util.Map<String,String> headers=new java.util.HashMap<>();headers.put("Cache-Control","no-store");headers.put("Accept-Ranges","bytes");int status=200;
    if(range!=null){java.util.regex.Matcher match=java.util.regex.Pattern.compile("bytes=([0-9]+)-([0-9]*)").matcher(range);if(!match.matches())throw new java.io.IOException();start=Long.parseLong(match.group(1));if(!match.group(2).isEmpty())end=Math.min(end,Long.parseLong(match.group(2)));if(start>end||start>=length)throw new java.io.IOException();status=206;headers.put("Content-Range","bytes "+start+"-"+end+"/"+length);}headers.put("Content-Length",String.valueOf(end-start+1));java.io.FileInputStream source=new java.io.FileInputStream(file);source.getChannel().position(start);final long bytes=end-start+1;java.io.InputStream bounded=new java.io.FilterInputStream(source){long remaining=bytes;@Override public int read() throws java.io.IOException {if(remaining<=0)return -1;int value=super.read();if(value>=0)remaining--;return value;}@Override public int read(byte[] b,int off,int count)throws java.io.IOException {if(remaining<=0)return -1;int n=in.read(b,off,(int)Math.min(count,remaining));if(n>0)remaining-=n;return n;}};return new WebResourceResponse(mime,null,status,status==206?"Partial Content":"OK",headers,bounded);
  }
  private WebResourceResponse missing(){return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",null,new ByteArrayInputStream(new byte[0]));}
  private boolean validAlbum(String url){try{Uri u=Uri.parse(url);return "https".equals(u.getScheme())&&("photos.app.goo.gl".equals(u.getHost())||"photos.google.com".equals(u.getHost()));}catch(Exception e){return false;}}
  private boolean validHome(String url){try{Uri u=Uri.parse(url);return "https".equals(u.getScheme())&&"home.google.com".equals(u.getHost());}catch(Exception e){return false;}}
  private boolean validCalendar(String url){try{Uri u=Uri.parse(url);return "https".equals(u.getScheme())&&"calendar.google.com".equals(u.getHost())&&u.getUserInfo()==null;}catch(Exception e){return false;}}
  private boolean validYouTube(String url){try{Uri u=Uri.parse(url);return "https".equals(u.getScheme())&&("www.youtube.com".equals(u.getHost())||"m.youtube.com".equals(u.getHost())||"youtube.com".equals(u.getHost()));}catch(Exception e){return false;}}

  public class DashboardBridge {
    @JavascriptInterface public String updateStatus(){return updates.status();}
    @JavascriptInterface public void updateBackgroundCheck(){updates.check(false,null);}
    @JavascriptInterface public void updateCheck(){updates.check(true,null);}
    @JavascriptInterface public void updateDownload(){updates.download();}
    @JavascriptInterface public boolean updateConfigure(String settings){return updates.configure(settings);}
    @JavascriptInterface public void updateInstall(){runOnUiThread(()->updates.install(MainActivity.this,false));}
    @JavascriptInterface public void updatePermission(){runOnUiThread(()->updates.permission(MainActivity.this));}
    @JavascriptInterface public void updateHeartbeat(boolean ready){runOnUiThread(()->{updates.activity((ready||idlePhotos||quietOpen)&&foreground&&(remote==null||idlePhotos&&remotePhotos)&&(!localPhotosOpen||idlePhotos));updates.install(MainActivity.this,true);});}
    @JavascriptInterface public String calendarList(){return calendars.snapshot();}
    @JavascriptInterface public String calendarAdd(String name,String color,String url){return calendars.add(name,color,url);}
    @JavascriptInterface public boolean calendarMetadata(String id,String name,String color){return calendars.metadata(id,name,color);}
    @JavascriptInterface public boolean calendarRemove(String id){return calendars.remove(id);}
    @JavascriptInterface public void calendarRefresh(String id){calendars.refresh(id,result->runOnUiThread(()->{if(dashboard!=null)dashboard.evaluateJavascript("window.SkylitCalendar&&window.SkylitCalendar.receive("+result+")",null);}));}
    @JavascriptInterface public boolean calendarAccept(String id,String request,boolean valid){return calendars.accept(id,request,valid);}

    @JavascriptInterface public String photoStatus(){return photoMail.status().toString();}
    @JavascriptInterface public boolean photoConnect(String email,String appPassword){phone.stop();importGeneration++;return photoMail.connect(email,appPassword);}
    @JavascriptInterface public boolean photoConfigure(int days,int maximum){return photoMail.configure(days,maximum);}
    @JavascriptInterface public boolean photoExclude(String id,boolean excluded){return photoMail.exclude(id,excluded);}
    @JavascriptInterface public boolean photoRestoreExcluded(){return photoMail.restoreExcluded();}
    @JavascriptInterface public boolean photoDelivery(String raw){return photoMail.delivery(raw);}
    @JavascriptInterface public String photoDeliverySettings(){return photoMail.deliverySettings();}
    @JavascriptInterface public boolean photoEraseCache(){phone.stop();importGeneration++;media.cancelExport();return photoMail.eraseCache();}
    @JavascriptInterface public void photoRefresh(){photoMail.sync();}
    @JavascriptInterface public void photoOpen(boolean idle){runOnUiThread(()->openLocalPhotos(idle));}
    @JavascriptInterface public void photoBrowse(int index){runOnUiThread(()->openLocalPhotos(false,index,false));}
    @JavascriptInterface public boolean photoDisconnect(){phone.stop();importGeneration++;media.cancelExport();boolean removed=photoMail.disconnect();if(removed)runOnUiThread(()->{if(localPhotosOpen&&dashboard!=null)dashboard.evaluateJavascript("window.SkylitPhotos&&window.SkylitPhotos.close()",null);});return removed;}
    @JavascriptInterface public void photoSource(String source){if(!"email".equals(source)&&!"album".equals(source))return;prefs.edit().putString("photo_source",source).apply();runOnUiThread(()->resetIdle());}
    @JavascriptInterface public void localPhotoClosed(){runOnUiThread(()->{localPhotoGeneration++;idlePhotos=false;localPhotosOpen=false;pauseMomo(false);resetIdle();});}

    @JavascriptInterface public void configureQuiet(boolean enabled){prefs.edit().putBoolean("quiet",enabled).apply();runOnUiThread(()->resetIdle());}
    @JavascriptInterface public void privacyPause(){phone.stop();runOnUiThread(()->{quietOpen=true;idleGeneration++;handler.removeCallbacks(idleTask);pauseMomo(true);});}
    @JavascriptInterface public void ambientClosed(){runOnUiThread(()->{quietOpen=false;pauseMomo(false);resetIdle();});}
    @JavascriptInterface public void configure(String album,int seconds){if(!album.isEmpty()&&!validAlbum(album))return;int delay=(seconds==0||seconds==60||seconds==120||seconds==300||seconds==600)?seconds:120;prefs.edit().putString("album",album).putInt("idle",delay).apply();runOnUiThread(()->resetIdle());}
    @JavascriptInterface public void openPhotos(String album,boolean idle){if(validAlbum(album))runOnUiThread(()->openRemote(album,true,idle));}
    @JavascriptInterface public void openHome(String url){if(validHome(url))runOnUiThread(()->openRemote(url,false,false));}
    @JavascriptInterface public void openYouTube(String layout){runOnUiThread(()->openRemote("desktop".equals(layout)?"https://www.youtube.com/":"https://m.youtube.com/",false,false));}
    @JavascriptInterface public void openYouTubeLink(String url){if(validYouTube(url)&&YouTubeLink.valid(url))runOnUiThread(()->openRemote(url,false,false));}
    @JavascriptInterface public void openCalendar(String url){if(validCalendar(url))runOnUiThread(()->openRemote(url,false,false));}
    @JavascriptInterface public void openWifiSettings(){runOnUiThread(()->{try{startActivity(new Intent(android.provider.Settings.ACTION_WIFI_SETTINGS));}catch(android.content.ActivityNotFoundException e){Toast.makeText(MainActivity.this,"Wi-Fi settings are unavailable on this device.",Toast.LENGTH_LONG).show();}});}
    @JavascriptInterface public void openDeveloperSettings(){runOnUiThread(()->{try{startActivity(new Intent(android.provider.Settings.ACTION_APPLICATION_DEVELOPMENT_SETTINGS));}catch(android.content.ActivityNotFoundException e){Toast.makeText(MainActivity.this,"Developer settings are unavailable on this device.",Toast.LENGTH_LONG).show();}});}
    @JavascriptInterface public void openAndroidApps(){runOnUiThread(()->{
      java.util.List<android.content.pm.ResolveInfo> apps=getPackageManager().queryIntentActivities(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER),0);
      java.util.Collections.sort(apps,(a,b)->a.loadLabel(getPackageManager()).toString().compareToIgnoreCase(b.loadLabel(getPackageManager()).toString()));
      java.util.List<String> labels=new java.util.ArrayList<>();java.util.List<Intent> launches=new java.util.ArrayList<>();java.util.Set<String> packages=new java.util.HashSet<>();
      labels.add("Android Settings");launches.add(new Intent(android.provider.Settings.ACTION_SETTINGS));packages.add("com.android.settings");packages.add(getPackageName());
      for(android.content.pm.ResolveInfo app:apps){String name=app.activityInfo.packageName;if(!app.activityInfo.exported||!packages.add(name))continue;Intent launch=getPackageManager().getLaunchIntentForPackage(name);if(launch!=null){labels.add(app.loadLabel(getPackageManager()).toString());launches.add(launch);}}
      new android.app.AlertDialog.Builder(MainActivity.this).setTitle("Android apps").setItems(labels.toArray(new String[0]),(dialog,which)->{try{startActivity(launches.get(which));}catch(android.content.ActivityNotFoundException|SecurityException e){Toast.makeText(MainActivity.this,"This Android app is unavailable.",Toast.LENGTH_LONG).show();}}).setNegativeButton("Cancel",null).show();
    });}
    @JavascriptInterface public boolean photoKeepMany(String ids,boolean keep){boolean saved=photos.keeperMany(ids,keep);if(saved){photos.prune(photoMail.days(),photoMail.maximum());notifyLibrary();}return saved;}
    @JavascriptInterface public boolean photoExcludeMany(String ids,boolean hide){boolean saved=photos.excludeMany(ids,hide);if(saved){photos.prune(photoMail.days(),photoMail.maximum());notifyLibrary();}return saved;}
    @JavascriptInterface public boolean photoReviewMany(String ids,boolean approve){boolean saved=photos.reviewMany(ids,approve);if(saved){photos.prune(photoMail.days(),photoMail.maximum());notifyLibrary();}return saved;}
    @JavascriptInterface public boolean photoImportOptions(boolean review,boolean dates){boolean saved=photos.importOptions(review,dates);if(saved)notifyLibrary();return saved;}
    @JavascriptInterface public void mediaImport(String kind){if(!kind.equals("image")&&!kind.equals("video")&&!kind.equals("music"))return;runOnUiThread(()->openMediaPicker(kind));}
    @JavascriptInterface public boolean mediaHasMusic(){return media.hasMusic();}
    @JavascriptInterface public void mediaEraseMusic(){media.eraseMusic();notifyLibrary();}
    @JavascriptInterface public String mediaExportBegin(){return media.beginExport();}
    @JavascriptInterface public boolean mediaExportAppend(String id,String chunk){return media.appendExport(id,chunk);}
    @JavascriptInterface public String mediaExportFinish(String id){try{return media.finishExport(id);}catch(Exception ignored){return "";}}
    @JavascriptInterface public void mediaExportCancel(){media.cancelExport();}
    @JavascriptInterface public void slideshowBrightness(float value){if(value!=-1&&(value<.05f||value>1||Float.isNaN(value)))return;runOnUiThread(()->{WindowManager.LayoutParams attributes=getWindow().getAttributes();if(attributes.screenBrightness!=value){attributes.screenBrightness=value;getWindow().setAttributes(attributes);}});}
    @JavascriptInterface public boolean photoManagementStart(){return phone.start();}
    @JavascriptInterface public String photoManagementStatus(){return phone.status();}
    @JavascriptInterface public boolean photoManagementDecide(String request,boolean allow){return phone.decide(request,allow);}
    @JavascriptInterface public void photoManagementStop(){phone.stop();}
    @JavascriptInterface public boolean photoManagementCurrent(long version){return phone.active(version);}
    @JavascriptInterface public void openStock(){runOnUiThread(()->openStockApp());}
  }
  private void notifyLibrary(){runOnUiThread(()->{if(dashboard!=null)dashboard.evaluateJavascript("window.SkylitPhotos&&SkylitPhotos.refresh();window.dispatchEvent(new Event('skylit-library-native'))",null);});}
  private void openMediaPicker(String kind){pickerKind="image".equals(kind)?1:"video".equals(kind)?2:3;Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(pickerKind==1?"image/*":pickerKind==2?"video/mp4":"audio/*");intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,pickerKind==1);intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);try{startActivityForResult(intent,7310+pickerKind);}catch(android.content.ActivityNotFoundException e){Toast.makeText(this,"This device has no file picker. Phone curation can import JPEG pictures.",Toast.LENGTH_LONG).show();}}
  @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(result!=RESULT_OK||data==null||request<7311||request>7313)return;final int kind=request-7310;final long generation=importGeneration;java.util.List<Uri> uris=new java.util.ArrayList<>();if(data.getClipData()!=null){for(int i=0;i<Math.min(100,data.getClipData().getItemCount());i++)uris.add(data.getClipData().getItemAt(i).getUri());}else if(data.getData()!=null)uris.add(data.getData());imports.execute(()->{int done=0;String message="Nothing imported.";for(Uri uri:uris){if(generation!=importGeneration)break;if(!"content".equals(uri.getScheme())){message="Choose a picture from Android’s file picker.";continue;}try{media.guard(()->generation==importGeneration);message=kind==1?media.image(uri):kind==2?media.clip(uri):"Soundtrack saved on this frame.";if(kind==3)media.soundtrack(uri);done++;photos.prune(photoMail.days(),photoMail.maximum());}catch(Exception ignored){message="Some media could not be imported. Check format, size and capacity.";}}if(generation!=importGeneration)return;final String feedback=done>1?done+" files imported. "+message:message;runOnUiThread(()->{if(dashboard!=null)dashboard.evaluateJavascript("window.SkylitLibrary&&SkylitLibrary.mediaResult("+JSONObject.quote(feedback)+")",null);});});}
  private void resetIdle(){idleGeneration++;handler.removeCallbacks(idleTask);if(!foreground||remote!=null||localPhotosOpen||quietOpen)return;boolean hasSource="email".equals(prefs.getString("photo_source","album"))?photos.list().length()>0:validAlbum(prefs.getString("album",""));if(!hasSource&&!prefs.getBoolean("quiet",false))return;int seconds=prefs.getInt("idle",120);if(seconds==0&&prefs.getBoolean("quiet",false))seconds=120;if(seconds>0)handler.postDelayed(idleTask,seconds*1000L);}
  private void openLocalPhotos(boolean idle){openLocalPhotos(idle,0,true);}
  private void openLocalPhotos(boolean idle,int index,boolean autoplay){int count=photos.list().length();if(dashboard==null||count==0)return;int safeIndex=Math.max(0,Math.min(count-1,index));handler.removeCallbacks(idleTask);localPhotosOpen=true;idlePhotos=idle;final int generation=++localPhotoGeneration;pauseMomo(true);dashboard.evaluateJavascript("window.SkylitPhotos&&window.SkylitPhotos.open("+idle+","+safeIndex+","+autoplay+")",value->{if("false".equals(value)&&generation==localPhotoGeneration){localPhotosOpen=false;idlePhotos=false;pauseMomo(false);resetIdle();}});}
  private void openRemote(String url,boolean photos,boolean idle){
    final boolean youtube=validYouTube(url);
    if(photos&&!validAlbum(url)||!photos&&!validHome(url)&&!validCalendar(url)&&!youtube)return;
    if(remote!=null)closeRemote();handler.removeCallbacks(idleTask);idlePhotos=idle;remotePhotos=photos;slideshowScheduled=false;slideshowStarted=false;final int generation=++remoteGeneration;
    pauseMomo(true);remote=new WebView(this);settings(remote);remote.setBackgroundColor(Color.WHITE);
    // No JavaScript bridge or account credentials are injected into remote pages.
    CookieManager.getInstance().setAcceptCookie(true);
    remote.setWebViewClient(new WebViewClient(){
      @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest req){Uri destination=req.getUrl();boolean blocked=!RemoteNavigation.allows(destination.getScheme(),destination.getHost(),youtube);if(blocked&&req.isForMainFrame()){Log.w(TAG,"Blocked remote destination: "+destination.getHost());Toast.makeText(MainActivity.this,"This page tried to open an unsupported destination. Use Skylit to return and try again.",Toast.LENGTH_LONG).show();}return blocked;}
      @Override public void onPageFinished(WebView view,String url){
        Log.i(TAG,"Remote page loaded: "+Uri.parse(url).getHost());
        if(photos&&!slideshowScheduled&&"photos.google.com".equals(Uri.parse(url).getHost())){slideshowScheduled=true;handler.postDelayed(()->startSlideshow(generation,0),6000);}
      }
      @Override public void onReceivedError(WebView view,WebResourceRequest req,WebResourceError err){if(req.isForMainFrame()){Log.w(TAG,"Remote load failed");Toast.makeText(MainActivity.this,"Could not load this page. Check Wi-Fi and try again.",Toast.LENGTH_LONG).show();}}
      @Override public boolean onRenderProcessGone(WebView view,RenderProcessGoneDetail detail){Log.e(TAG,"Remote renderer stopped");handler.post(()->{closeRemote();Toast.makeText(MainActivity.this,"Page closed. Tap to try again.",Toast.LENGTH_LONG).show();});return true;}
    });
    remote.setWebChromeClient(new WebChromeClient(){
      @Override public void onShowCustomView(View view,CustomViewCallback callback){
        if(fullScreen!=null){callback.onCustomViewHidden();return;}fullScreen=view;fullScreenCallback=callback;root.addView(view,new FrameLayout.LayoutParams(-1,-1));addReturnControl();hideBars();
      }
      @Override public void onHideCustomView(){hideCustomView();}
    });
    root.addView(remote,new FrameLayout.LayoutParams(-1,-1));addReturnControl();String entry=validCalendar(url)&&!"/calendar/embed".equals(Uri.parse(url).getPath())?"https://accounts.google.com/ServiceLogin?service=cl&continue="+Uri.encode(url):url;remote.loadUrl(entry);Log.i(TAG,photos?(idle?"Idle photo mode opened":"Photo mode opened"):youtube?"YouTube opened":validCalendar(url)?"Calendar opened":"Home controls opened");
  }
  private void addReturnControl(){
    if(returnButton!=null)root.removeView(returnButton);if(photoHint!=null)root.removeView(photoHint);
    if(idlePhotos){photoHint=new TextView(this);photoHint.setText("Touch to return to Skylit");photoHint.setTextColor(Color.WHITE);photoHint.setTextSize(12);photoHint.setPadding(18,10,18,10);photoHint.setBackgroundColor(0x55000000);FrameLayout.LayoutParams lp=new FrameLayout.LayoutParams(-2,-2,Gravity.BOTTOM|Gravity.END);lp.setMargins(0,0,15,15);root.addView(photoHint,lp);}
    else {returnButton=new Button(this);returnButton.setText("‹  Skylit");returnButton.setTextColor(Color.rgb(53,46,40));returnButton.setBackgroundTintList(android.content.res.ColorStateList.valueOf(Color.rgb(246,239,225)));returnButton.setOnClickListener(v->closeRemote());FrameLayout.LayoutParams lp=new FrameLayout.LayoutParams(dp(110),dp(52),Gravity.BOTTOM|Gravity.START);lp.setMargins(12,0,0,12);root.addView(returnButton,lp);}
  }
  private void startSlideshow(int generation,int attempt){
    if(remote==null||generation!=remoteGeneration||!remotePhotos)return;
    // Google Photos is a third-party UI. Exact visible labels are deliberately used;
    // if they change, the album remains usable manually instead of clicking guesses.
    if(slideshowStarted)return;
    String js="(function(){var visible=function(e){var r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'};var els=Array.from(document.querySelectorAll('[role=menuitem],button,[role=button]'));var slide=els.find(function(e){return visible(e)&&((e.innerText||'').trim()==='Slideshow'||e.getAttribute('aria-label')==='Slideshow')});var menu=els.find(function(e){return visible(e)&&/^(More options|More Options|More)$/.test(e.getAttribute('aria-label')||'')});var el=slide||menu;if(!el)return JSON.stringify({action:'waiting'});var r=el.getBoundingClientRect();return JSON.stringify({action:slide?'slideshow':'menu',x:(r.left+r.width/2)/innerWidth,y:(r.top+r.height/2)/innerHeight})})()";
    remote.evaluateJavascript(js,result->{
      if(remote==null||generation!=remoteGeneration)return;
      try{
        String decoded=(String)new org.json.JSONTokener(result).nextValue();JSONObject action=new JSONObject(decoded);
        String name=action.optString("action");Log.i(TAG,"Slideshow control: "+action.toString());
        if(name.equals("slideshow")||name.equals("menu")){
          float x=(float)action.getDouble("x")*remote.getWidth(),y=(float)action.getDouble("y")*remote.getHeight();
          long now=android.os.SystemClock.uptimeMillis();
          MotionEvent down=MotionEvent.obtain(now,now,MotionEvent.ACTION_DOWN,x,y,0),up=MotionEvent.obtain(now,now+80,MotionEvent.ACTION_UP,x,y,0);
          remote.dispatchTouchEvent(down);down.recycle();handler.postDelayed(()->{if(remote!=null&&generation==remoteGeneration)remote.dispatchTouchEvent(up);up.recycle();},80);
          if(name.equals("slideshow")){slideshowStarted=true;Log.i(TAG,"Google Photos slideshow touched");return;}
        }
      }catch(Exception e){Log.w(TAG,"Could not locate slideshow control");}
      if(attempt<12)handler.postDelayed(()->startSlideshow(generation,attempt+1),900);
      else{Log.w(TAG,"Slideshow auto-start unavailable; album kept open");if(!idlePhotos)Toast.makeText(this,"Use the album menu and choose Slideshow if needed.",Toast.LENGTH_LONG).show();}
    });
  }

  private void hideCustomView(){if(fullScreen!=null){root.removeView(fullScreen);fullScreen=null;if(fullScreenCallback!=null){fullScreenCallback.onCustomViewHidden();fullScreenCallback=null;}}}
  private void closeRemote(){++remoteGeneration;hideCustomView();if(returnButton!=null){root.removeView(returnButton);returnButton=null;}if(photoHint!=null){root.removeView(photoHint);photoHint=null;}if(remote!=null){WebView old=remote;remote=null;root.removeView(old);old.destroy();}idlePhotos=false;remotePhotos=false;if(dashboard!=null)dashboard.evaluateJavascript("window.SkylitApp&&window.SkylitApp.photoReturned()",null);resetIdle();hideBars();}
  private void openStockApp(){handler.removeCallbacks(idleTask);Intent stock=getPackageManager().getLaunchIntentForPackage("com.skylight");if(stock!=null)startActivity(stock);}
  private void showFailure(String message){TextView text=new TextView(this);text.setText(message);text.setTextSize(25);text.setTextColor(Color.DKGRAY);text.setGravity(Gravity.CENTER);root.addView(text,new FrameLayout.LayoutParams(-1,-1));}
  @Override public boolean dispatchTouchEvent(MotionEvent e){
    if(updates!=null&&e.getActionMasked()==MotionEvent.ACTION_DOWN)updates.touched();
    if(swallowIdleTouch){if(e.getActionMasked()==MotionEvent.ACTION_UP||e.getActionMasked()==MotionEvent.ACTION_CANCEL)swallowIdleTouch=false;return true;}
    if(quietOpen&&remote==null){if(e.getActionMasked()==MotionEvent.ACTION_DOWN){swallowIdleTouch=true;if(dashboard!=null)dashboard.evaluateJavascript("window.SkylitWorkspace&&window.SkylitWorkspace.restore()",null);}return true;}
    if(idlePhotos&&remote==null){if(e.getActionMasked()==MotionEvent.ACTION_DOWN){swallowIdleTouch=true;if(dashboard!=null)dashboard.evaluateJavascript("window.SkylitPhotos&&window.SkylitPhotos.close()",null);}return true;}
    if(idlePhotos&&remote!=null){if(e.getActionMasked()==MotionEvent.ACTION_DOWN)closeRemote();return true;}
    if(e.getActionMasked()==MotionEvent.ACTION_DOWN)resetIdle();
    if(e.getActionMasked()==MotionEvent.ACTION_POINTER_DOWN&&e.getPointerCount()==2&&remote==null&&!localPhotosOpen){exitArmed=true;exitX=e.getX();exitY=e.getY();handler.postDelayed(exitTask,1500);}
    if(exitArmed&&(e.getActionMasked()==MotionEvent.ACTION_UP||e.getActionMasked()==MotionEvent.ACTION_POINTER_UP||e.getActionMasked()==MotionEvent.ACTION_CANCEL||Math.hypot(e.getX()-exitX,e.getY()-exitY)>60)){handler.removeCallbacks(exitTask);exitArmed=false;}
    return super.dispatchTouchEvent(e);
  }
  private void pauseMomo(boolean paused){if(dashboard!=null)dashboard.evaluateJavascript("window.Momo&&window.Momo.setPaused("+paused+")",null);}
  @Override protected void onResume(){super.onResume();foreground=true;if(updates!=null)updates.touched();pauseMomo(remote!=null||localPhotosOpen||quietOpen);if(photoMail!=null)photoMail.maybeSync();resetIdle();hideBars();}
  @Override protected void onPause(){foreground=false;pauseMomo(true);handler.removeCallbacks(idleTask);handler.removeCallbacks(exitTask);if(updates!=null)updates.activity(false);super.onPause();}
  @Override protected void onNewIntent(Intent intent){super.onNewIntent(intent);WebView.setWebContentsDebuggingEnabled(intent.getBooleanExtra("debug",false));if(remote!=null)closeRemote();if(localPhotosOpen&&dashboard!=null)dashboard.evaluateJavascript("window.SkylitPhotos&&window.SkylitPhotos.close()",null);}
  @Override public void onBackPressed(){if(quietOpen&&dashboard!=null){dashboard.evaluateJavascript("window.SkylitWorkspace&&window.SkylitWorkspace.restore()",null);return;}if(remote!=null)closeRemote();else if(localPhotosOpen&&dashboard!=null)dashboard.evaluateJavascript("window.SkylitPhotos&&window.SkylitPhotos.close()",null);else if(dashboard!=null)dashboard.evaluateJavascript("window.SkylitApp&&window.SkylitApp.back()",null);}
  @Override public void onWindowFocusChanged(boolean hasFocus){super.onWindowFocusChanged(hasFocus);if(hasFocus)hideBars();}
  private int dp(int value){return Math.round(value*getResources().getDisplayMetrics().density);}
  private void hideBars(){getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|View.SYSTEM_UI_FLAG_LAYOUT_STABLE);}
  @Override protected void onDestroy(){importGeneration++;imports.shutdownNow();if(phone!=null)phone.close();if(media!=null)media.cancelExport();calendars.close();photoMail.close();handler.removeCallbacksAndMessages(null);if(remote!=null)remote.destroy();if(dashboard!=null)dashboard.destroy();super.onDestroy();}
}
