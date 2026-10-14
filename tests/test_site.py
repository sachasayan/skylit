"""The website stages only its own files plus an explicit allowlist of shared app files."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
_spec = importlib.util.spec_from_file_location('skylit_website', ROOT / 'scripts' / 'website.py')
skylit_site = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(skylit_site)


class SiteStagingTest(unittest.TestCase):
    def test_stage_copies_allowlisted_app_files_only(self):
        with tempfile.TemporaryDirectory() as temp:
            out = skylit_site.stage(Path(temp) / 'out')
            self.assertEqual(sorted(p.name for p in (out / 'app').iterdir()), sorted(skylit_site.SHARED))
            self.assertTrue((out / 'index.html').exists())
            self.assertFalse((out / 'README.md').exists())
            names = {p.name for p in out.rglob('*')}
            for private in ('local-config.js', 'local-config.example.js', 'demo.js', 'demo-photos.js'):
                self.assertNotIn(private, names)

    def test_live_server_maps_app_paths_to_the_allowlist(self):
        handler = skylit_site.Handler.__new__(skylit_site.Handler)
        handler.directory = str(skylit_site.SITE)
        self.assertEqual(Path(handler.translate_path('/app/momo.js')), ROOT / 'web' / 'momo.js')
        for blocked in ('/app/local-config.js', '/app/../web/local-config.js', '/README.md'):
            self.assertFalse(Path(handler.translate_path(blocked)).exists(), blocked)


if __name__ == '__main__':
    unittest.main()
