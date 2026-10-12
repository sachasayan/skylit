#!/usr/bin/env python3
"""Run isolated photo-store checks on the identity-verified frame; never touch household cache."""
import argparse,json,os,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--usb',action='store_true');args=parser.parse_args()
    config=json.loads((ROOT/'.local/build.json').read_text());build=ROOT/'.local/photo-test';build.mkdir(exist_ok=True);classes=build/'classes';classes.mkdir(exist_ok=True)
    java=Path(config['java']);env=dict(os.environ,JAVA_HOME=str(java),PATH=str(java/'bin')+':'+os.environ['PATH'])
    sources=[ROOT/'android/src/com/wesbos/homehq'/name for name in ['PhotoStore.java','PhotoPolicy.java','PhotoMail.java','MailCheck.java','MailParts.java','MailImportPolicy.java','MailSecret.java']]+[ROOT/'tests/android/PhotoStoreTest.java']
    subprocess.run([str(java/'bin/javac'),'-source','8','-target','8','-classpath',os.pathsep.join([config['android_jar'],str(ROOT/'vendor/mail/android-mail-1.6.7.jar'),str(ROOT/'vendor/mail/android-activation-1.6.7.jar')]),'-d',str(classes),*map(str,sources)],env=env,check=True,capture_output=True)
    subprocess.run([str(Path(config['build_tools'])/'d8'),'--min-api','23','--lib',config['android_jar'],'--output',str(build),*map(str,classes.rglob('*.class')),str(ROOT/'vendor/mail/android-mail-1.6.7.jar'),str(ROOT/'vendor/mail/android-activation-1.6.7.jar')],env=env,check=True,capture_output=True)
    if args.usb:
        device=json.loads((ROOT/'.local/device.json').read_text());adb=device['adb'];transport=None
        for line in subprocess.check_output([adb,'devices','-l'],text=True).splitlines():
            fields=line.split()
            if len(fields)>2 and fields[1]=='device' and any(x.startswith('usb:') for x in fields) and subprocess.check_output([adb,'-s',fields[0],'shell','getprop','ro.serialno'],text=True).strip()==device['serial']:
                transport=fields[0];break
        if not transport:raise SystemExit('Configured USB frame is unavailable')
        frame=[adb,'-s',transport]
        print('Identity-verified USB frame; isolated synthetic image checks only.')
    else:frame=['python3',str(ROOT/'scripts/frame.py')]
    remote='/data/local/tmp/skylit-photo-test.dex';scratch='/data/local/tmp/skylit-photo-test-'+str(os.getpid())
    try:
        subprocess.run(frame+['push',str(build/'classes.dex'),remote],check=True,capture_output=True)
        subprocess.run(frame+['shell','env','CLASSPATH='+remote,'app_process','/','com.wesbos.homehq.PhotoStoreTest',scratch],check=True)
    finally:
        subprocess.run(frame+['shell','rm','-f',remote],check=True,capture_output=True)
        subprocess.run(frame+['shell','rm','-rf',scratch],check=True,capture_output=True)
if __name__=='__main__':main()
