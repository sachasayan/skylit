"""Build the local React assets before staging an app or synthetic preview."""
from pathlib import Path
import subprocess


def build_frontend(root):
    root = Path(root)
    if not (root / 'node_modules/esbuild/package.json').is_file():
        raise SystemExit('Frontend dependencies missing. Run npm ci --ignore-scripts first.')
    subprocess.run(['node', 'scripts/build_frontend.mjs'], cwd=root, check=True)
