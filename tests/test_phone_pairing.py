import json, shutil, subprocess, tempfile, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class PhonePairingTest(unittest.TestCase):
    def test_approval_and_expiry_boundaries(self):
        config=ROOT/'.local/build.json'
        home=Path(json.loads(config.read_text())['java']) if config.exists() else None
        javac=str(home/'bin/javac') if home else shutil.which('javac')
        java=str(home/'bin/java') if home else shutil.which('java')
        if not javac or not java:self.skipTest('JDK required')
        with tempfile.TemporaryDirectory() as tmp:
            harness=Path(tmp)/'PairingChecks.java'
            harness.write_text('''package com.wesbos.homehq;
public class PairingChecks {
 static void check(boolean v){if(!v)throw new AssertionError("Pairing boundary failed");}
 public static void main(String[] args){
  PhonePairing p=new PhonePairing();long t=1000000L;p.start(t);String ticket=p.invitation(t);
  check(ticket.matches("[a-f0-9]{64}"));check(!p.claim("wrong",t));check(p.claim(ticket,t));
  String cookie=p.pendingCookie(),id=p.request(t);check(p.number(t).matches("[0-9]{6}"));
  check(!p.authorized(cookie,t));check(p.state(cookie,t).equals("pending"));check(p.state("wrong",t).equals("unavailable"));
  check(!p.claim(ticket,t));check(!p.decide("stale",true,t));check(p.decide(id,false,t));
  check(!p.authorized(cookie,t));check(p.state(cookie,t).equals("unavailable"));check(!p.invitation(t).equals(ticket));
  check(!p.decide(id,true,t));check(p.claim(p.invitation(t),t));String approved=p.pendingCookie(),fresh=p.request(t);
  check(p.decide(fresh,true,t));check(p.authorized(approved,t));check(p.state(approved,t).equals("paired"));
  check(p.number(t).isEmpty());check(p.invitation(t).isEmpty());check(!p.authorized(cookie,t));
  check(!p.authorized(approved,t+15*60000L));p.start(t);check(!p.authorized(approved,t));
  check(p.claim(p.invitation(t),t));String timeout=p.request(t);check(!p.decide(timeout,true,t+2*60000L));
  check(p.state(p.pendingCookie(),t+2*60000L).equals("unavailable"));check(!p.invitation(t+2*60000L).isEmpty());
  check(p.invitation(t+5*60000L).isEmpty());check(!p.claim(ticket,t+5*60000L));
  p.start(t);for(int i=0;i<10;i++)check(!p.claim("wrong",t));check(p.exhausted());p.clear();check(p.invitation(t).isEmpty());
 }
}''')
            subprocess.run([javac,'-d',tmp,str(ROOT/'android/src/com/wesbos/homehq/PhonePairing.java'),str(harness)],check=True,capture_output=True,text=True)
            subprocess.run([java,'-cp',tmp,'com.wesbos.homehq.PairingChecks'],check=True,capture_output=True,text=True)
