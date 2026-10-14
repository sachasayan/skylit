#!/usr/bin/env python3
"""Stage or serve the public website (site/) with the shared app files it reuses from web/.

  python3 scripts/website.py serve [--port 8780]   # loopback preview
  python3 scripts/website.py stage OUTPUT_DIR      # static files for GitHub Pages

Only the files listed in SHARED are copied from web/. Household configuration, demo fixtures
and photo caches are never staged; the website's sample pictures live in site/img.
"""
import argparse
import shutil
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'site'
# Momo, palette data and typography come straight from the app so the site cannot drift from it.
SHARED = (
    'momo.js', 'momo-routine.js', 'appearance.js',
    'clock-display.ttf', 'clock-display-OFL.txt', 'clock-sans.ttf', 'clock-sans-OFL.txt',
)


def stage(target: Path) -> Path:
    target = Path(target)
    if target.exists():
        shutil.rmtree(target)
    shutil.copytree(SITE, target, ignore=shutil.ignore_patterns('README.md', '.DS_Store'))
    app = target / 'app'
    app.mkdir()
    for name in SHARED:
        shutil.copy2(ROOT / 'web' / name, app / name)
    return target


class Server(ThreadingHTTPServer):
    # Browsers request many images at once; the default backlog of 5 resets connections.
    request_queue_size = 64


class Handler(SimpleHTTPRequestHandler):
    """Serves site/ live; /app/<name> maps only to the allow-listed shared web/ files."""
    def translate_path(self, path):
        clean = path.split('?', 1)[0].split('#', 1)[0]
        if clean.startswith('/app/'):
            name = clean[len('/app/'):]
            return str(ROOT / 'web' / name) if name in SHARED else str(SITE / '__missing__')
        if Path(clean).name == 'README.md':
            return str(SITE / '__missing__')
        return super().translate_path(path)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest='command', required=True)
    serve = sub.add_parser('serve', help='serve site/ live on 127.0.0.1')
    serve.add_argument('--port', type=int, default=8780)
    out = sub.add_parser('stage', help='write the static site to a folder')
    out.add_argument('output', type=Path)
    args = parser.parse_args()
    if args.command == 'stage':
        print(stage(args.output))
        return
    print(f'Skylit website: http://127.0.0.1:{args.port}/', flush=True)
    try:
        Server(('127.0.0.1', args.port), partial(Handler, directory=str(SITE))).serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
