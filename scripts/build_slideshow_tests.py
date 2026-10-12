#!/usr/bin/env python3
"""Private synthetic test APK with a separate package/UID. Never distributed."""
from pathlib import Path
import os,json,shutil,subprocess,zipfile
from assets import stage_assets
root=Path(__file__).resolve().parents[1];cfg=json.loads((root/'.local/build.json').read_text());java=Path(cfg['java']);bt=Path(cfg['build_tools']);jar=Path(cfg['android_jar']);folder=root/'.local/slideshow-tests';build=folder/'build';folder.mkdir(exist_ok=True)
if build.exists():shutil.rmtree(build)
for name in ['assets','gen','classes','dex']: (build/name).mkdir(parents=True)
stage_assets(root/'web',build/'assets');synthetic=build/'assets/synthetic';synthetic.mkdir()
for name in ['marigolds.png','dog.png','cat.png','lake.png','orchard.png','sample-clip.mp4','sample-animation.gif','sample-soundtrack.m4a']:shutil.copyfile(root/'tests/fixtures/demo-photos'/name,synthetic/name)
mail=[root/'vendor/mail/android-mail-1.6.7.jar',root/'vendor/mail/android-activation-1.6.7.jar']
for artifact in mail:
 with zipfile.ZipFile(artifact) as z:
  for name in ['LICENSE.md','NOTICE.md']:(build/'assets'/f'{artifact.stem}-{name}').write_bytes(z.read('META-INF/'+name))
manifest=build/'AndroidManifest.xml';manifest.write_text('''<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.wesbos.homehq.slideshowtests"><uses-permission android:name="android.permission.INTERNET"/><application android:label="Skylit synthetic checks" android:allowBackup="false" android:hardwareAccelerated="true" android:usesCleartextTraffic="false" android:theme="@android:style/Theme.NoTitleBar.Fullscreen"><activity android:name="com.wesbos.homehq.SlideshowTestActivity" android:exported="true" android:screenOrientation="sensorLandscape" android:configChanges="orientation|screenSize|keyboardHidden|keyboard"><intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/></intent-filter></activity></application></manifest>''')
env=dict(os.environ,JAVA_HOME=str(java),PATH=str(java/'bin')+':'+os.environ['PATH']);env['SKYLIT_KEY_PASS']=os.environ.get('SKYLIT_KEY_PASS') or cfg.get('key_password','android')
def run(*args):subprocess.run(list(map(str,args)),env=env,check=True,capture_output=True)
run(bt/'aapt2','link','-o',build/'base.apk','-I',jar,'--manifest',manifest,'-A',build/'assets','--java',build/'gen','--min-sdk-version','29','--target-sdk-version','32','--version-code','1','--version-name','synthetic-checks')
sources=list((root/'android/src').rglob('*.java'))+[root/'tests/android/SlideshowTestActivity.java']
run(java/'bin/javac','-source','8','-target','8','-classpath',os.pathsep.join(map(str,[jar,*mail])),'-d',build/'classes',*sources)
run(bt/'d8','--min-api','29','--lib',jar,'--output',build/'dex',*list((build/'classes').rglob('*.class')),*mail)
run('/usr/bin/zip','-qj',build/'base.apk',build/'dex/classes.dex');run(bt/'zipalign','-f','4',build/'base.apk',build/'aligned.apk');run(bt/'apksigner','sign','--ks',cfg['signing_key'],'--ks-pass','env:SKYLIT_KEY_PASS','--key-pass','env:SKYLIT_KEY_PASS','--out',folder/'slideshow-tests.apk',build/'aligned.apk');run(bt/'apksigner','verify',folder/'slideshow-tests.apk');print('Private isolated slideshow test APK built and signature verified.')
