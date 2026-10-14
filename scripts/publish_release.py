#!/usr/bin/env python3
"""Prepare a verified signed GitHub release from main; defaults to a draft."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def run(*command, **kwargs):
    return subprocess.run(command, cwd=ROOT, check=True, **kwargs)


def validate_metadata(data, apk):
    version = data.get('versionName', '')
    if not isinstance(version, str) or not re.fullmatch(r'\d{1,4}\.\d{1,4}\.\d{1,4}', version):
        raise ValueError('Invalid release version.')
    if (data.get('package') != 'com.wesbos.homehq'
            or data.get('asset') != f'skylit-{version}.apk'
            or type(data.get('versionCode')) is not int
            or not 0 < data['versionCode'] <= 2147483647
            or type(data.get('minSdk')) is not int
            or not 23 <= data['minSdk'] <= 34
            or hashlib.sha256(apk.read_bytes()).hexdigest() != data.get('sha256')):
        raise ValueError('APK and update metadata do not match. Build the normal APK again.')
    return version


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--publish', action='store_true',
                        help='Make the signed release available to frame updaters')
    args = parser.parse_args()
    if run('git', 'status', '--porcelain', capture_output=True, text=True).stdout.strip():
        raise SystemExit('Commit the intended source before preparing a release.')
    branch = run('git', 'branch', '--show-current', capture_output=True, text=True).stdout.strip()
    commit = run('git', 'rev-parse', 'HEAD', capture_output=True, text=True).stdout.strip()
    run('git', 'fetch', 'origin', 'main')
    remote = run('git', 'rev-parse', 'origin/main', capture_output=True, text=True).stdout.strip()
    if branch != 'main' or commit != remote:
        raise SystemExit('Prepare releases from the committed and pushed main branch.')
    apk, metadata = ROOT / 'dist/skylit.apk', ROOT / 'dist/update.json'
    data = json.loads(metadata.read_text())
    version = validate_metadata(data, apk)
    if data.get('sourceCommit') != commit or data.get('sourceDirty') is not False:
        raise SystemExit('Build the release APK again from this clean source commit.')
    # Read tool locations privately; never print the signing configuration.
    config = json.loads((ROOT / '.local/build.json').read_text())
    tools = Path(config['build_tools'])
    environment = dict(os.environ, JAVA_HOME=config['java'],
                       PATH=str(Path(config['java']) / 'bin') + ':' + os.environ.get('PATH', ''))
    run(str(tools / 'apksigner'), 'verify', '--verbose', str(apk), env=environment)
    badging = run(str(tools / 'aapt2'), 'dump', 'badging', str(apk),
                  capture_output=True, text=True).stdout
    package = re.search(r"package: name='([^']+)' versionCode='(\d+)' versionName='([^']+)'", badging)
    sdk = re.search(r"sdkVersion:'(\d+)'", badging)
    if not package or not sdk or (package[1], int(package[2]), package[3], int(sdk[1])) != (
            data['package'], data['versionCode'], version, data['minSdk']):
        raise SystemExit('APK package/version differs from the release metadata.')
    run('python3', 'scripts/check_public.py', '--history', '--apk', str(apk))
    scanner = shutil.which('gitleaks') or str(ROOT / '.local/gitleaks/gitleaks')
    run(scanner, 'git', '.', '--redact=100', '--log-opts=--all')
    with tempfile.TemporaryDirectory() as temp:
        export = Path(temp) / 'source'
        export.mkdir()
        for raw in run('git', 'ls-files', '-z', capture_output=True).stdout.split(b'\0'):
            if not raw:
                continue
            rel = Path(os.fsdecode(raw))
            target = export / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / rel, target)
        run(scanner, 'dir', str(export), '--redact=100')
        asset = Path(temp) / data['asset']
        shutil.copyfile(apk, asset)
        notes = Path(temp) / 'notes.md'
        notes.write_text(f'Signed normal Skylit {version} APK. Settings and private media remain '
                         f'on the frame during upgrades.\n\nSHA-256: {data["sha256"]}\n\nSource: '
                         f'{commit}\n\nSee docs/verification.md for tested scope and device limitations.\n')
        command = ['gh', 'release', 'create', 'v' + version, str(asset), str(metadata),
                   '--repo', 'sachasayan/skylit', '--target', commit,
                   '--title', 'Skylit ' + version, '--notes-file', str(notes)]
        if not args.publish:
            command.append('--draft')
        run(*command)


if __name__ == '__main__':
    main()
