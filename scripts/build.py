#!/usr/bin/env python3
"""Build the Android viewer using a local, checksum-verified Android/JDK toolchain."""
from pathlib import Path
import argparse, hashlib, json, os, shutil, subprocess, zipfile
from assets import stage_assets
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument("--personal",action="store_true",help="Embed ignored local configuration; NEVER distribute this APK")
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
mail_jars=(root/'vendor/mail/android-mail-1.6.7.jar',root/'vendor/mail/android-activation-1.6.7.jar')
mail_hashes=('12c4240aa3a4ccda37c49b4e6b880a797a21e03a4f8c7421a1b51e0db552b79c','285713b2b549f382f26a57919ecddc4c83d9755737969fb7c006c905322bb253')
for artifact,expected in zip(mail_jars,mail_hashes):
    if hashlib.sha256(artifact.read_bytes()).hexdigest()!=expected: raise SystemExit(f'Vendored mail artifact failed verification: {artifact.name}')
for name,expected in (('clock-display.ttf','822a6621ccbe8d97d20ac88c1c41f5615c9c2c202eaa75f272cd452aac6475a7'),('clock-serif.ttf','b20b7d9626dd956b2c5e558692ad328b1f19e3275e2782db4fa07670d83f35e0'),('clock-sans.ttf','6343b70971000b04c5d401c96ae08ce371086135e999d5e1e1413039c0213076')):
    if hashlib.sha256((root/'web'/name).read_bytes()).hexdigest()!=expected: raise SystemExit(f'Vendored font failed verification: {name}')
config=json.loads((root/'.local/build.json').read_text())
java=Path(config['java']); bt=Path(config['build_tools']); jar=Path(config['android_jar']); key=Path(config['signing_key'])
build=root/'build'; output=root/'dist'; app=root/'android'
if build.exists(): shutil.rmtree(build)
for path in [build/'gen',build/'classes',build/'dex',build/'assets',output]: path.mkdir(parents=True,exist_ok=True)
stage_assets(root/"web",build/"assets",personal=args.personal)
for artifact in mail_jars:
    with zipfile.ZipFile(artifact) as archive:
        for notice in ('LICENSE.md','NOTICE.md'):
            target=build/'assets'/f'{artifact.stem}-{notice}'
            target.write_bytes(archive.read('META-INF/'+notice))
env=dict(os.environ,JAVA_HOME=str(java),PATH=str(java/'bin')+':'+os.environ['PATH'])
def run(*args):subprocess.run([str(a) for a in args],cwd=root,env=env,check=True)
run(bt/'aapt2','compile','--dir',app/'res','-o',build/'res.zip')
run(bt/'aapt2','link','-o',build/'base.apk','-I',jar,'--manifest',app/'AndroidManifest.xml','-A',build/'assets',build/'res.zip','--java',build/'gen','--min-sdk-version','23','--target-sdk-version','32','--version-code','34','--version-name','2.15.6')
sources=list((app/'src').rglob('*.java'))+list((build/'gen').rglob('*.java'))
run(java/'bin/javac','-source','8','-target','8','-classpath',os.pathsep.join(map(str,(jar,*mail_jars))),'-d',build/'classes',*sources)
run(bt/'d8','--min-api','23','--lib',jar,'--output',build/'dex',*list((build/'classes').rglob('*.class')),*mail_jars)
run('/usr/bin/zip','-qj',build/'base.apk',build/'dex/classes.dex')
run(bt/'zipalign','-f','4',build/'base.apk',build/'aligned.apk')
# This development signing key retains upgrade compatibility with the first install.
env['SKYLIT_KEY_PASS']=os.environ.get('SKYLIT_KEY_PASS') or config.get('key_password','android')
run(bt/'apksigner','sign','--ks',key,'--ks-pass','env:SKYLIT_KEY_PASS','--key-pass','env:SKYLIT_KEY_PASS','--out',output/('skylit-personal.apk' if args.personal else 'skylit.apk'),build/'aligned.apk')
run(bt/'apksigner','verify','--verbose',output/('skylit-personal.apk' if args.personal else 'skylit.apk'))
print('Built:',output/('skylit-personal.apk' if args.personal else 'skylit.apk'))
