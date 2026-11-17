#!/usr/bin/env python3
"""Build isolated legacy/current APKs for real Android data-preserving upgrade checks.

Never installs, clears, or packages household data. Test APKs deliberately omit HOME.
"""
from pathlib import Path
import json, os, shutil, subprocess, sys, zipfile
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from assets import stage_assets

def main():
    config=json.loads((ROOT/'.local/build.json').read_text())
    java=Path(config['java']);bt=Path(config['build_tools']);jar=Path(config['android_jar'])
    env=dict(os.environ,JAVA_HOME=str(java),PATH=str(java/'bin')+':'+os.environ['PATH'])
    env['SKYLIT_KEY_PASS']=os.environ.get('SKYLIT_KEY_PASS') or config.get('key_password','android')
    folder=ROOT/'.local/photo-upgrade';folder.mkdir(exist_ok=True)
    def run(*args):subprocess.run(list(map(str,args)),env=env,check=True,capture_output=True)
    def historical(path):return subprocess.check_output(['git','show','v2.17.2:'+path],cwd=ROOT)
    mail=[ROOT/'vendor/mail/android-mail-1.6.7.jar',ROOT/'vendor/mail/android-activation-1.6.7.jar']
    for mode,code in [('legacy',39),('current',41)]:
        build=folder/mode
        if build.exists():shutil.rmtree(build)
        for name in ['assets','src','res','gen','classes','dex']:(build/name).mkdir(parents=True)
        if mode=='legacy':
            paths=subprocess.check_output(['git','ls-tree','-r','--name-only','v2.17.2','android/src','android/res'],cwd=ROOT,text=True).splitlines()
            for path in paths:
                target=build/path.removeprefix('android/');target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(historical(path))
            old_assets={};exec(historical('scripts/assets.py'),old_assets)
            for name in old_assets['PUBLIC_ASSETS']:(build/'assets'/name).write_bytes(historical('web/'+name))
            (build/'assets/local-config.js').write_text('window.SKYLIT_LOCAL = {};\n')
            manifest=ET.fromstring(historical('android/AndroidManifest.xml'))
        else:
            shutil.copytree(ROOT/'android/src',build/'src',dirs_exist_ok=True);shutil.copytree(ROOT/'android/res',build/'res',dirs_exist_ok=True)
            stage_assets(ROOT/'web',build/'assets');manifest=ET.fromstring((ROOT/'android/AndroidManifest.xml').read_bytes())
        # Java package stays unchanged; only the application ID / private storage differs.
        android='{http://schemas.android.com/apk/res/android}'
        manifest.set('package','com.wesbos.homehq.persistencetests')
        manifest.find('application').set(android+'label','Skylit migration checks')
        for element in manifest.iter():
            name=element.get(android+'name','')
            if name.startswith('.'):element.set(android+'name','com.wesbos.homehq'+name)
            for child in list(element):
                if child.tag=='category' and child.get(android+'name')=='android.intent.category.HOME':element.remove(child)
        ET.register_namespace('android','http://schemas.android.com/apk/res/android')
        ET.ElementTree(manifest).write(build/'AndroidManifest.xml',encoding='utf-8',xml_declaration=True)
        source=build/'src/com/wesbos/homehq/MainActivity.java'
        original=source.read_text();needle='super.onCreate(state);';assert original.count(needle)==1
        source.write_text(original.replace(needle,needle+'\n    PhotoUpgradeFixture.seed(this,getIntent().getStringExtra("seed"));'))
        shutil.copyfile(ROOT/'tests/android/PhotoUpgradeFixture.java',source.parent/'PhotoUpgradeFixture.java')
        for artifact in mail:
            with zipfile.ZipFile(artifact) as archive:
                for name in ['LICENSE.md','NOTICE.md']:(build/'assets'/f'{artifact.stem}-{name}').write_bytes(archive.read('META-INF/'+name))
        run(bt/'aapt2','compile','--dir',build/'res','-o',build/'res.zip')
        run(bt/'aapt2','link','-o',build/'base.apk','-I',jar,'--manifest',build/'AndroidManifest.xml','-A',build/'assets',build/'res.zip','--java',build/'gen','--min-sdk-version','23','--target-sdk-version','32','--version-code',code,'--version-name','migration-'+mode)
        run(java/'bin/javac','-source','8','-target','8','-classpath',os.pathsep.join(map(str,[jar,*mail])),'-d',build/'classes',*list((build/'src').rglob('*.java')),*list((build/'gen').rglob('*.java')))
        run(bt/'d8','--min-api','23','--lib',jar,'--output',build/'dex',*list((build/'classes').rglob('*.class')),*mail)
        run('/usr/bin/zip','-qj',build/'base.apk',build/'dex/classes.dex');run(bt/'zipalign','-f','4',build/'base.apk',build/'aligned.apk')
        apk=folder/(mode+'.apk');run(bt/'apksigner','sign','--ks',config['signing_key'],'--ks-pass','env:SKYLIT_KEY_PASS','--key-pass','env:SKYLIT_KEY_PASS','--out',apk,build/'aligned.apk');run(bt/'apksigner','verify',apk)
        print('Built isolated '+mode+' migration APK; signature verified.')

if __name__=='__main__':main()
