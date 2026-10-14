#!/usr/bin/env python3
"""Loopback-only, isolated public demo. Never reads household configuration."""
import argparse
import shutil
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from tempfile import TemporaryDirectory
from assets import stage_assets
from frontend import build_frontend


class PreviewServer(ThreadingHTTPServer):
    # Chromium requests the script bundle concurrently; avoid dropping startup assets.
    request_queue_size = 64


class PreviewHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        if "If-Modified-Since" in self.headers:
            del self.headers["If-Modified-Since"]
        super().do_GET()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8767)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    build_frontend(root)
    with TemporaryDirectory(prefix='skylit-demo-') as temp:
        stage_assets(root / 'web', temp)
        target = Path(temp)
        (target / 'demo.js').write_text((root / 'tests/fixtures/demo.js').read_text())
        (target / 'demo-photos.js').write_text((root / 'tests/fixtures/demo-photos.js').read_text())
        shutil.copytree(root / 'tests/fixtures/demo-photos', target / 'demo-photos')
        page = target / 'index.html'
        page.write_text(page.read_text().replace('<script src="local-config.js">', '<script src="demo.js"></script><script src="local-config.js">').replace('<script src="photos.js">', '<script src="demo-photos.js"></script><script src="photos.js">'))
        print(f'Synthetic demo only: http://127.0.0.1:{args.port}', flush=True)
        try:
            PreviewServer(('127.0.0.1', args.port), partial(PreviewHandler, directory=temp)).serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()
