"""Exercise production async export and startup scheduling with blocking I/O doubles."""
import json, re, shutil, subprocess, tempfile, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class NativePerformanceTest(unittest.TestCase):
    def run_java(self, source, extra=()):
        config=ROOT/'.local/build.json'
        home=Path(json.loads(config.read_text())['java']) if config.exists() else None
        javac=str(home/'bin/javac') if home else shutil.which('javac')
        java=str(home/'bin/java') if home else shutil.which('java')
        if not javac or not java:self.skipTest('JDK required')
        with tempfile.TemporaryDirectory() as d:
            harness=Path(d)/'PerformanceTest.java';harness.write_text(source)
            result=subprocess.run([javac,'-d',d,*map(str,extra),str(harness)],capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr)
            result=subprocess.run([java,'-cp',d,'com.wesbos.homehq.PerformanceTest'],capture_output=True,text=True,timeout=15)
            self.assertEqual(result.returncode,0,result.stderr)
    def test_export_backpressure_cancellation_and_stale_completion(self):
        self.run_java('''package com.wesbos.homehq;
import java.util.concurrent.*;
public class PerformanceTest {
 static void yes(boolean b){if(!b)throw new AssertionError();}
 public static void main(String[] args)throws Exception{
 CountDownLatch entered=new CountDownLatch(1),release=new CountDownLatch(1);
 AsyncExport e=new AsyncExport(new AsyncExport.Target(){int count;public String begin(){return "job"+(++count);}public boolean append(String id,String chunk){entered.countDown();try{release.await();}catch(InterruptedException x){}return true;}public String finish(String id){return "saved";}public void cancel(){}});
 try{String first=e.begin();yes(e.submit(first,"synthetic",false));yes(entered.await(2,TimeUnit.SECONDS));yes(e.status(first).equals("pending"));yes(!e.submit(first,"another",false));yes(!e.submit(first,null,true));e.cancel();String next=e.begin();yes(!e.submit(first,"stale",false));release.countDown();yes(e.submit(next,null,true));long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(2);while(e.status(next).equals("pending")&&System.nanoTime()<deadline)Thread.sleep(1);yes(e.status(next).equals("done"));yes(e.status(first).equals("failed"));}finally{release.countDown();e.close();}
 }}''',[ROOT/'android/src/com/wesbos/homehq/AsyncExport.java'])
    def test_production_constructor_returns_before_restore_io(self):
        # Execute the production constructor verbatim. Android storage/restore are
        # doubles so the restore can be deliberately blocked without private APKs.
        source=(ROOT/'android/src/com/wesbos/homehq/AppUpdates.java').read_text()
        constructor=re.search(r'  private AppUpdates\(Context c\).*\n',source).group()
        self.run_java('''package com.wesbos.homehq;
import java.io.*;import java.util.concurrent.*;import java.util.concurrent.atomic.*;
class Build {static class VERSION {static int SDK_INT=34;}}
class Context {static int MODE_PRIVATE=0;Object getSharedPreferences(String name,int mode){return null;}File getFilesDir(){return new File(System.getProperty("java.io.tmpdir"));}}
class AppUpdates {
 Context context;Object prefs;File apk;volatile String stage;volatile boolean restoring;AtomicBoolean busy=new AtomicBoolean();ExecutorService worker=Executors.newSingleThreadExecutor();
 static CountDownLatch entered=new CountDownLatch(1),release=new CountDownLatch(1);static Thread restoreThread;
 void restore(){restoreThread=Thread.currentThread();entered.countDown();try{release.await();}catch(InterruptedException e){throw new RuntimeException(e);}}void schedule(){}
'''+constructor+'''
 static AppUpdates create(){return new AppUpdates(new Context());}
}
public class PerformanceTest {
 public static void main(String[] args)throws Exception{Thread caller=Thread.currentThread();ExecutorService calls=Executors.newSingleThreadExecutor();AppUpdates app=null;try{Future<AppUpdates> f=calls.submit(AppUpdates::create);app=f.get(2,TimeUnit.SECONDS);if(!AppUpdates.entered.await(2,TimeUnit.SECONDS)||!app.busy.get()||!app.restoring||AppUpdates.restoreThread==caller)throw new AssertionError();AppUpdates.release.countDown();app.worker.shutdown();if(!app.worker.awaitTermination(2,TimeUnit.SECONDS)||app.busy.get()||app.restoring)throw new AssertionError();}finally{AppUpdates.release.countDown();calls.shutdownNow();if(app!=null)app.worker.shutdownNow();}}
}''')

    def test_update_broadcast_lease_lasts_until_async_result_finishes(self):
        app=(ROOT/'android/src/com/wesbos/homehq/AppUpdates.java').read_text()
        result=re.search(r'  void result\(Intent intent,Runnable done\).*\n',app).group()
        receiver=(ROOT/'android/src/com/wesbos/homehq/UpdateReceiver.java').read_text().replace('package com.wesbos.homehq;','').replace('import android.content.*;','').replace('public class UpdateReceiver','class UpdateReceiver')
        self.run_java("""package com.wesbos.homehq;
import java.util.concurrent.Executor;
class Context {} class Intent {}
class BroadcastReceiver {static class PendingResult {boolean finished;void finish(){finished=true;}}PendingResult pending;PendingResult goAsync(){return pending=new PendingResult();}public void onReceive(Context c,Intent i){}}
class AppUpdates {static AppUpdates instance=new AppUpdates();static AppUpdates get(Context c){return instance;}Runnable task;boolean fail;Executor worker=r->task=r;void receiveResult(Intent i){if(fail)throw new IllegalStateException();}
"""+result+"""}
"""+receiver+"""
public class PerformanceTest {public static void main(String[] args){for(boolean fail:new boolean[]{false,true}){AppUpdates.instance.fail=fail;UpdateReceiver receiver=new UpdateReceiver();receiver.onReceive(new Context(),new Intent());if(receiver.pending==null||receiver.pending.finished)throw new AssertionError();try{AppUpdates.instance.task.run();}catch(IllegalStateException expected){if(!fail)throw expected;}if(!receiver.pending.finished)throw new AssertionError();}}}
""")
