"""Compile and exercise the exact policy used by the remote WebView callback."""
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]

class RemoteNavigationTest(unittest.TestCase):
    def test_google_signin_redirect_and_host_boundaries(self):
        config = ROOT/'.local/build.json'
        java_home = Path(json.loads(config.read_text())['java']) if config.exists() else None
        javac = str(java_home/'bin/javac') if java_home else shutil.which('javac')
        java = str(java_home/'bin/java') if java_home else shutil.which('java')
        if not javac or not java:
            self.skipTest('JDK needed for native navigation test')
        source = '''package com.wesbos.homehq;
public class NavigationTest {
  static void expect(boolean actual, boolean expected, String label) {
    if(actual != expected) throw new AssertionError(label);
  }
  public static void main(String[] args) {
    expect(RemoteNavigation.allows("https", "gds.google.com", false), true,
      "Calendar password-submit redirect is blocked");
    expect(RemoteNavigation.allows("https", "gds.google.com", true), true,
      "YouTube Google sign-in redirect is blocked");
    for(boolean youtube : new boolean[]{false,true}) {
      expect(RemoteNavigation.allows("http", "gds.google.com", youtube), false, "HTTP");
      expect(RemoteNavigation.allows("https", "gds.google.com.example.org", youtube), false, "suffix spoof");
      expect(RemoteNavigation.allows("https", "example.org", youtube), false, "unrelated host");
      expect(RemoteNavigation.allows("https", null, youtube), false, "missing host");
      expect(RemoteNavigation.allows("https", "accounts.google.com", youtube), true, "login");
    }
    expect(RemoteNavigation.allows("https", "accounts.youtube.com", true), true, "YouTube sign-in completion");
    expect(RemoteNavigation.allows("https", "accounts.youtube.com", false), false, "YouTube account isolation");
    expect(RemoteNavigation.allows("http", "accounts.youtube.com", true), false, "YouTube account HTTPS");
    expect(RemoteNavigation.allows("https", "accounts.youtube.com.example.org", true), false, "YouTube account suffix spoof");
    expect(RemoteNavigation.allows("https", "calendar.google.com", false), true, "calendar");
    expect(RemoteNavigation.allows("https", "photos.google.com", false), true, "photos");
    expect(RemoteNavigation.allows("https", "m.youtube.com", true), true, "youtube");
    expect(RemoteNavigation.allows("https", "m.youtube.com", false), false, "service separation");
  }
}'''
        with tempfile.TemporaryDirectory() as directory:
            harness=Path(directory)/'NavigationTest.java'
            harness.write_text(source)
            subprocess.run([javac,'-d',directory,str(ROOT/'android/src/com/wesbos/homehq/RemoteNavigation.java'),str(harness)],check=True,capture_output=True,text=True)
            result=subprocess.run([java,'-cp',directory,'com.wesbos.homehq.NavigationTest'],capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr)
