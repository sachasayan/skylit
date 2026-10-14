#!/usr/bin/env python3
"""Check public source, optional Git history and APK for household data. Never print matches."""
import argparse
import hashlib
from pathlib import Path
import re
import subprocess
import sys
import zipfile
from assets import EMPTY_CONFIG, PUBLIC_ASSETS, MAIL_NOTICES

ROOT = Path(__file__).resolve().parents[1]
RULES = {
    'private calendar feed': rb'/calendar/ical/[^\s\x22\x27]+/private-[A-Za-z0-9]{16,}/',
    'shared photo link': rb'https://photos\.app\.goo\.gl/[A-Za-z0-9_-]{8,}',
    'private photo path': rb'https://photos\.google\.com/(?:share|album)/[A-Za-z0-9_-]{8,}',
    'household identifier': rb'https://home\.google\.com/[^\s\x22\x27]*home/[A-Za-z0-9_-]{12,}',
    'personal email': rb'[A-Za-z0-9._%+-]+@(?:gmail|googlemail)\.com',
    'private key': rb'-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----',
    'GitHub token': rb'(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})',
    'Google token/key': rb'(?:ya29\.[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{30,})',
    'machine path': rb'/Users/[A-Za-z0-9._-]+/',
}
FORBIDDEN = re.compile(r'(^|/)(?:\.local|\.env(?:\..*)?|local-config\.js|build|dist)(/|$)|\.(?:keystore|jks|apk|p12|pfx|pem|key|hprof|sqlite|db)$')


# Exact upstream MIT copyright lines, only inside the generated dependency notice.
# Hashes avoid turning a whole file, author address or email domain into an exception.
PUBLIC_NOTICE_PATHS = {'web/frontend-LICENSES.txt', 'assets/frontend-LICENSES.txt'}
PUBLIC_NOTICE_LINES = {'e5284b0f51898ba224929ce2cc66e6575809e5e39e669afeb483cad02a682b10', '384d17b1d79699b14c3b5573bf11ff5f4b2cf41ca7f0bd52bf8238e7edcc517d'}

def findings(data, name=None):
    if name in PUBLIC_NOTICE_PATHS:
        data = b'\n'.join(line for line in data.splitlines()
                          if hashlib.sha256(line).hexdigest() not in PUBLIC_NOTICE_LINES)
    return [label for label, pattern in RULES.items() if re.search(pattern, data)]


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--history', action='store_true', help='Inspect every blob reachable from all Git refs')
    parser.add_argument('--apk', type=Path, help='Check a distributable APK has blank personal config')
    args = parser.parse_args()
    issues = []
    paths = git('ls-files', '--cached', '--others', '--exclude-standard', '-z').decode().split('\0')
    for name in sorted(set(filter(None, paths))):
        path = ROOT / name
        if FORBIDDEN.search(name): issues.append((name, 'private/generated path'))
        if path.is_file():
            issues.extend((name, rule) for rule in findings(path.read_bytes(), name))
    blob_count = 0
    metadata_review = False
    if args.history:
        emails = git('log', '--all', '--format=%ae%n%ce')
        metadata_review = bool(re.search(RULES['personal email'], emails))
        # Inspect complete blob contents, not just changed lines. Avoid printing any secrets.
        for line in git('rev-list', '--objects', '--all').decode().splitlines():
            oid, _, name = line.partition(' ')
            if git('cat-file', '-t', oid).strip() != b'blob': continue
            blob_count += 1
            if FORBIDDEN.search(name): issues.append((oid[:10]+':'+name, 'private/generated path in history'))
            issues.extend((oid[:10]+':'+name, rule) for rule in findings(git('cat-file', 'blob', oid), name))
    if args.apk:
        with zipfile.ZipFile(args.apk) as apk:
            if apk.read('assets/local-config.js').decode() != EMPTY_CONFIG:
                issues.append(('APK', 'personal configuration embedded'))
            expected = {'assets/'+name for name in PUBLIC_ASSETS} | {'assets/local-config.js'} | set(MAIL_NOTICES)
            if {n for n in apk.namelist() if n.startswith('assets/')} != expected:
                issues.append(('APK', 'unexpected asset'))
            for name in apk.namelist():
                issues.extend(('APK:'+name, rule) for rule in findings(apk.read(name), name))
    if metadata_review: issues.append(('Git metadata', 'personal email in author/committer metadata'))
    for name, rule in issues: print(f'FAIL {name}: {rule}')
    print(f'Public-data check: {len(issues)} findings; {len(set(filter(None, paths)))} source files; {blob_count} history blobs.')
    return bool(issues)


if __name__ == '__main__': sys.exit(main())
