import importlib.util
from pathlib import Path
import tempfile
import unittest
import hashlib

spec = importlib.util.spec_from_file_location('publish_release', Path(__file__).resolve().parents[1] / 'scripts/publish_release.py')
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)

class ReleaseMetadataTest(unittest.TestCase):
    def test_metadata_is_bound_to_exact_version_asset_and_apk_bytes(self):
        with tempfile.TemporaryDirectory() as directory:
            apk = Path(directory) / 'fixture.apk'
            apk.write_bytes(b'synthetic APK bytes')
            data = dict(package='com.wesbos.homehq', versionName='2.16.0', versionCode=35,
                        minSdk=23, asset='skylit-2.16.0.apk', sha256=hashlib.sha256(apk.read_bytes()).hexdigest())
            self.assertEqual(release.validate_metadata(data, apk), '2.16.0')
            for key, value in [('asset','../update.apk'), ('asset','skylit-2.17.0.apk'),
                               ('versionName','../latest'), ('versionCode',True),
                               ('versionCode',0), ('package','another.app'), ('sha256','0'*64)]:
                with self.subTest(key=key, value=value), self.assertRaises(ValueError):
                    release.validate_metadata(dict(data, **{key:value}), apk)
            apk.write_bytes(b'changed APK')
            with self.assertRaises(ValueError):
                release.validate_metadata(data, apk)
