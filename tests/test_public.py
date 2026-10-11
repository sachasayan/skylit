import importlib.util
from pathlib import Path
import sys
import unittest
from unittest import mock
import io
from contextlib import redirect_stdout

sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'scripts'))
import check_public

class PublicChecksTest(unittest.TestCase):
    def test_household_links_and_credentials_are_reported_without_values(self):
        cases = [
            (b'https://calendar.google.com/calendar/ical/test%40example.org/private-' + b'x'*32 + b'/basic.ics', 'private calendar feed'),
            (b'https://photos.app.goo.gl/' + b'privateSentinel123', 'shared photo link'),
            (b'https://home.google.com/u/0/home/' + b'privateSentinel123', 'household identifier'),
            (b'private-sentinel' + b'@gmail.com', 'personal email'),
            (b'-----BEGIN ' + b'PRIVATE KEY-----', 'private key'),
            (b'ghp_' + b'x'*40, 'GitHub token'),
        ]
        for data, label in cases:
            with self.subTest(label=label):
                self.assertIn(label, check_public.findings(data))
                self.assertNotIn(data.decode(), str(check_public.findings(data)))

    def test_generic_configuration_and_docs_links_are_allowed(self):
        self.assertEqual(check_public.findings(b'https://calendar.google.com/calendar/u/0/r https://home.google.com/u/0/'), [])
        self.assertEqual(check_public.findings('https://photos.app.goo.gl/…'.encode()), [])
        self.assertTrue(check_public.FORBIDDEN.search('web/local-config.js'))
        self.assertFalse(check_public.FORBIDDEN.search('web/local-config.example.js'))
        self.assertTrue(check_public.FORBIDDEN.search('.local/device.json'))
        self.assertTrue(check_public.FORBIDDEN.search('private.keystore'))

    def test_personal_commit_metadata_fails_history_check_without_printing_address(self):
        sentinel=b'metadata-sentinel'+b'@gmail.com'
        def git(*args):
            if args[0]=='log':return sentinel+b'\n'
            return b''
        output=io.StringIO()
        with mock.patch.object(check_public,'git',side_effect=git),mock.patch.object(sys,'argv',['check_public.py','--history']),redirect_stdout(output):
            self.assertTrue(check_public.main())
        self.assertIn('FAIL Git metadata',output.getvalue())
        self.assertNotIn(sentinel.decode(),output.getvalue())
        with mock.patch.object(check_public,'git',return_value=b''),mock.patch.object(sys,'argv',['check_public.py','--history']),redirect_stdout(io.StringIO()):
            self.assertFalse(check_public.main())
