package com.wesbos.homehq;

import android.app.job.*;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;

/** Persistent disk-pressure checks. Changing the slideshow count never deletes files. */
public final class PhotoMaintenance extends JobService {
  private volatile boolean stopped;
  static void schedule(Context context){
    JobScheduler scheduler=(JobScheduler)context.getSystemService(Context.JOB_SCHEDULER_SERVICE);
    // Retire unpublished import experiments without touching their already-saved pictures.
    scheduler.cancel(271805);scheduler.cancel(271806);
    SharedPreferences retired=context.getSharedPreferences("skylit-photo-maintenance",Context.MODE_PRIVATE);
    if(!retired.getBoolean("retiredSource",false)){
      context.getSharedPreferences("skylit-skylight-import",Context.MODE_PRIVATE).edit().clear().commit();
      context.getSharedPreferences("skylit-local-adb",Context.MODE_PRIVATE).edit().clear().commit();
      context.getSharedPreferences("skylit-photo-index",Context.MODE_PRIVATE).edit().remove("includeSkylight").commit();
      try{java.security.KeyStore keys=java.security.KeyStore.getInstance("AndroidKeyStore");keys.load(null);if(keys.containsAlias("skylit-local-adb-identity"))keys.deleteEntry("skylit-local-adb-identity");}catch(Exception ignored){}
      retired.edit().putBoolean("retiredSource",true).commit();
    }
    boolean scheduled=false;for(JobInfo job:scheduler.getAllPendingJobs())if(job.getId()==271804)scheduled=true;
    if(!scheduled)scheduler.schedule(new JobInfo.Builder(271804,new ComponentName(context,PhotoMaintenance.class)).setPeriodic(PhotoPolicy.CLEANUP_INTERVAL).setPersisted(true).build());
  }
  @Override public boolean onStartJob(JobParameters params){
    if(params.getJobId()!=271804)return false;
    stopped=false;new Thread(()->{try{PhotoStore.get(this).cleanup(System.currentTimeMillis());}finally{if(!stopped)jobFinished(params,false);}},"Skylit photo maintenance").start();return true;
  }
  @Override public boolean onStopJob(JobParameters params){stopped=true;return true;}
}
