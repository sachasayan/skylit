package com.wesbos.homehq;
import android.app.job.*;
public class UpdateJob extends JobService {
  private volatile int generation;
  @Override public boolean onStartJob(JobParameters params){final int current=++generation;AppUpdates.get(this).check(false,()->{if(current==generation)jobFinished(params,false);});return true;}
  @Override public boolean onStopJob(JobParameters params){generation++;return true;}
}
