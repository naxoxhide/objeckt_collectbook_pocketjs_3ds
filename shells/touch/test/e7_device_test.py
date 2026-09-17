# SPDX-License-Identifier: GPL-3.0-or-later
import base64
import importlib.util
from pathlib import Path
import struct
import unittest
from unittest.mock import Mock

spec = importlib.util.spec_from_file_location('e7_device', Path(__file__).parents[1] / 'scripts/e7-device.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def packet(payload):
    return b'\x01\x92' + struct.pack('>H', len(payload)) + payload


class CodaProtocolTest(unittest.TestCase):
    def client(self, chunks):
        c = module.Coda()
        c.buffer = bytearray()
        c.message = bytearray()
        c.remaining = None
        c.token = 0
        c.services = ['FileSystem', 'SymbianInstall']
        c.input = Mock()
        c.input.read.side_effect = chunks
        c.output = Mock()
        c.output.write.side_effect = lambda data, **_: len(data)
        return c

    def test_fragmented_reply_ignores_events_and_another_token(self):
        data = packet(b'E\0Logging\0write\0"hello"\0') + packet(b'R\x0099\0"other"\0') + packet(b'R\x001\0null\0"handle"\0')
        c = self.client([data[:3], data[3:21], data[21:-2], data[-2:]])
        self.assertEqual(c.call('FileSystem', 'open', 'E:\\Installs\\app.sis', 1, {}), [None, 'handle'])

    def test_rejected_or_failed_command_cannot_report_success(self):
        for response in [b'N\x001\0', b'R\x001\0null\0{"Time":1,"Code":1,"Format":"denied"}\0']:
            c = self.client([packet(response)])
            with self.assertRaises(RuntimeError):
                c.call('SymbianInstall', 'install', 'E:\\Installs\\app.sis', 'E')

    def test_oversized_request_is_not_sent(self):
        c = self.client([])
        with self.assertRaises(ValueError):
            c.send(b'x' * 65536)
        c.output.write.assert_not_called()

    def test_long_serial_message_roundtrips_with_bounded_router_frames(self):
        payload = b'R\x001\0"' + b'a' * 5000 + b'"\0'
        c = self.client([])
        c.send(payload)
        frames = [call.args[0] for call in c.output.write.call_args_list]
        self.assertTrue(all(len(frame) <= 1028 for frame in frames))
        reader = self.client(frames)
        self.assertEqual(reader.receive(lambda _: True, 1), payload)

    def test_missing_serial_chunk_is_rejected(self):
        c = self.client([packet(b'\xfe\x02abc') + packet(b'\0\0def')])
        with self.assertRaisesRegex(RuntimeError, 'Out-of-order'):
            c.receive(lambda _: True, 1)

    def test_nested_package_error_is_not_an_installed_package(self):
        c = self.client([])
        c.call = Mock(return_value=[None, [{'uid': 'ea360236', 'error': -1}]])
        with self.assertRaises(RuntimeError):
            c.packages('ea360236')

    def test_readback_limit_closes_remote_handle(self):
        c = self.client([])
        c.call = Mock(side_effect=[[None, 'handle'], [base64.b64encode(b'bad').decode(), None, False], [None]])
        with self.assertRaises(RuntimeError):
            c.read_file('E:\\Installs\\app.sis', limit=2)
        self.assertEqual(c.call.call_args.args, ('FileSystem', 'close', 'handle'))


if __name__ == '__main__':
    unittest.main()
