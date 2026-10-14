package com.wesbos.homehq;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** One in-flight chunk, a bounded queue, and generation-specific completion. */
final class AsyncExport {
  interface Target {
    String begin(); boolean append(String id,String chunk); String finish(String id) throws Exception; void cancel();
  }
  private final Target target;
  private final ExecutorService worker=Executors.newSingleThreadExecutor();
  private String id="",state="failed";
  AsyncExport(Target target){this.target=target;}
  synchronized String begin(){target.cancel();id=target.begin();state=id.isEmpty()?"failed":"ready";return id;}
  synchronized String status(String job){return id.equals(job)?state:"failed";}
  synchronized boolean submit(String job,String chunk,boolean finish){
    if(!id.equals(job)||!"ready".equals(state)||(!finish&&(chunk==null||chunk.length()>65536)))return false;
    state="pending";
    worker.execute(()->{boolean ok=false;try{ok=finish?!target.finish(job).isEmpty():target.append(job,chunk);}catch(Exception ignored){}synchronized(AsyncExport.this){if(id.equals(job))state=ok?(finish?"done":"ready"):"failed";}});
    return true;
  }
  synchronized void cancel(){id="";state="failed";target.cancel();}
  void close(){cancel();worker.shutdownNow();}
}
