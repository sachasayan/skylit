#!/usr/bin/env python3
"""Build/run/remove this task's isolated synthetic APK on the verified TLS frame."""
import argparse,json,subprocess,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PACKAGE='com.wesbos.homehq.slideshowtests'
ADDRESS=None

def frame(*args):
    result=subprocess.run(['python3',str(ROOT/'scripts/frame.py'),*(['--address',ADDRESS] if ADDRESS else []),*args],capture_output=True,text=True,timeout=120)
    if result.returncode:raise RuntimeError('Paired-frame action failed; private output withheld')
    return result.stdout

def main():
    global ADDRESS
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--address',help='Current paired TLS IP:port');ADDRESS=parser.parse_args().address
    folder=ROOT/'.local/slideshow-acceptance';folder.mkdir(exist_ok=True);marker=folder/'harness-owned'
    if 'package:'+PACKAGE in frame('shell','pm','list','packages',PACKAGE):
        if not marker.exists():raise RuntimeError('Existing unowned test app; not modified')
        frame('uninstall',PACKAGE);marker.unlink()
    subprocess.run(['python3',str(ROOT/'scripts/build_slideshow_tests.py')],check=True)
    installed=False;forwarded=False
    try:
        assert 'Success' in frame('install','--no-incremental','-r',str(ROOT/'.local/slideshow-tests/slideshow-tests.apk'))
        installed=True;marker.write_text('Synthetic slideshow test package created by this runner.\n')
        frame('shell','am','start','-n',PACKAGE+'/com.wesbos.homehq.SlideshowTestActivity','--ez','debug','true');time.sleep(2)
        pid=frame('shell','pidof',PACKAGE).split()[0];frame('forward','tcp:9227','localabstract:webview_devtools_remote_'+pid);forwarded=True
        for mode in ('probe','native','ui','phone-start'):
            subprocess.run(['node',str(ROOT/'scripts/check_slideshow_device.cjs'),mode],check=True)
        subprocess.run(['node',str(ROOT/'scripts/check_photo_phone.cjs')],check=True)
        subprocess.run(['node',str(ROOT/'scripts/check_phone_pairing_device.cjs')],check=True)
        subprocess.run(['node',str(ROOT/'scripts/check_slideshow_device.cjs'),'phone-stop'],check=True)
        subprocess.run(['node',str(ROOT/'scripts/check_photo_phone.cjs'),'--revoked'],check=True)
    finally:
        if installed:
            try:
                if forwarded:
                    subprocess.run(['node',str(ROOT/'scripts/check_slideshow_device.cjs'),'cleanup'],check=False)
                    frame('forward','--remove','tcp:9227')
            finally:
                try:frame('uninstall',PACKAGE);marker.unlink(missing_ok=True)
                finally:frame('shell','am','start','-n','com.wesbos.homehq/.MainActivity')

if __name__=='__main__':main()
