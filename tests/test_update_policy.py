"""Test the production updater's release URL, downgrade and idle/window boundaries."""
import json, shutil, subprocess, tempfile, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class UpdatePolicyTest(unittest.TestCase):
    def test_trust_and_schedule(self):
        config=ROOT/'.local/build.json'
        home=Path(json.loads(config.read_text())['java']) if config.exists() else None
        javac=str(home/'bin/javac') if home else shutil.which('javac')
        java=str(home/'bin/java') if home else shutil.which('java')
        if not javac or not java:self.skipTest('JDK required')
        source='''package com.wesbos.homehq;
public class UpdatePolicyTest {
 static void yes(boolean b){if(!b)throw new AssertionError();}
 public static void main(String[] args){
 String root="https://github.com/sachasayan/skylit/releases/download/v2.16.0/";
 yes(UpdatePolicy.asset(root+"skylit-2.16.0.apk","2.16.0","skylit-2.16.0.apk"));
 yes(UpdatePolicy.asset(root+"update.json","2.16.0","update.json"));
 for(String bad:new String[]{root.replace("https:","http:"),root.replace("github.com","github.com.evil.test"),root.replace("github.com","github.com:444"),root.replace("github.com","evil.test@github.com"),root.replace("/skylit/","/other/"),root.replace("/v2.16.0/","/v2.16.0/../v2.16.0/"),root+"../"})yes(!UpdatePolicy.asset(bad+"update.json","2.16.0","update.json"));
 yes(!UpdatePolicy.asset(root+"update.json?x=1","2.16.0","update.json"));
 yes(!UpdatePolicy.asset(root+"update.json#fragment","2.16.0","update.json"));
 yes(UpdatePolicy.downloadHost("https://release-assets.githubusercontent.com/a?token=synthetic"));
 yes(!UpdatePolicy.downloadHost("https://release-assets.githubusercontent.com.evil.test/a"));
 yes(!UpdatePolicy.downloadHost("https://user@github.com/a"));
 yes(!UpdatePolicy.newer(35,35));yes(!UpdatePolicy.newer(35,34));yes(UpdatePolicy.newer(35,36));yes(!UpdatePolicy.newer(35,Long.MAX_VALUE));
 yes(UpdatePolicy.hash("a".repeat(64)));yes(!UpdatePolicy.hash("a".repeat(63)));
 yes(UpdatePolicy.window(2,2,4));yes(!UpdatePolicy.window(4,2,4));yes(UpdatePolicy.window(23,22,3));yes(UpdatePolicy.window(1,22,3));yes(!UpdatePolicy.window(12,22,3));yes(!UpdatePolicy.window(2,2,2));
 long now=1000000;yes(UpdatePolicy.idle(now,now-300000,now-30000,true));yes(!UpdatePolicy.idle(now,now-299999,now,true));yes(!UpdatePolicy.idle(now,now-300000,now-90000,true));yes(!UpdatePolicy.idle(now,now-300000,now,false));yes(!UpdatePolicy.idle(now,now+1,now,true));yes(!UpdatePolicy.idle(now,0,now+1,true));
 }}'''
        with tempfile.TemporaryDirectory() as d:
            harness=Path(d)/'UpdatePolicyTest.java';harness.write_text(source)
            subprocess.run([javac,'-d',d,str(ROOT/'android/src/com/wesbos/homehq/UpdatePolicy.java'),str(harness)],check=True,capture_output=True,text=True)
            result=subprocess.run([java,'-cp',d,'com.wesbos.homehq.UpdatePolicyTest'],capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr)
