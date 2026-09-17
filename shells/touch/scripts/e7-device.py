# SPDX-License-Identifier: GPL-3.0-or-later
"""Touch shell installation/status over the E7's CODA USB interface.

TCF fields follow Qt Creator 2.5.2 src/shared/symbianutils/codadevice.cpp.
USB framing follows the pinned PocketJS tools/symbian/coda-usb-probe.c.
"""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import re
import struct
import time


class Coda:
    def __enter__(self):
        import usb.core
        import usb.util
        self.usb = usb
        devices = list(usb.core.find(find_all=True, idVendor=0x0421, idProduct=0x0335))
        if len(devices) != 1:
            raise RuntimeError(f'Expected one Nokia E7 in Suite mode, found {len(devices)}')
        self.device = devices[0]
        self.claimed = []
        self.detached = []
        self.buffer = bytearray()
        self.message = bytearray()
        self.remaining = None
        self.token = 0
        try:
            for interface in (3, 4):
                try:
                    if self.device.is_kernel_driver_active(interface):
                        self.device.detach_kernel_driver(interface)
                        self.detached.append(interface)
                except NotImplementedError:
                    pass
                except usb.core.USBError as error:
                    if error.backend_error_code != -12:
                        raise
                usb.util.claim_interface(self.device, interface)
                self.claimed.append(interface)
            interface = self.device.get_active_configuration()[(4, 0)]
            endpoints = [e for e in interface if usb.util.endpoint_type(e.bmAttributes) == 2]
            self.input = next(e for e in endpoints if e.bEndpointAddress & 0x80)
            self.output = next(e for e in endpoints if not e.bEndpointAddress & 0x80)
            for request, value, payload in ((0x20, 0, bytes([0, 0xc2, 1, 0, 0, 0, 8])), (0x22, 3, b'')):
                try:
                    self.device.ctrl_transfer(0x21, request, value, 3, payload, timeout=3000)
                except usb.core.USBError as error:
                    if error.backend_error_code != -9:
                        raise
            self.send(b'\xfc\x1f')
            self.receive(lambda p: p.startswith(b'\xfc\xf1'), 3)
            self.send(b'E\0Locator\0Hello\0["Locator"]\0')
            hello = self.receive(lambda p: p.startswith(b'E\0Locator\0Hello\0'), 3)
            self.services = json.loads(hello.split(b'\0')[3])
            return self
        except BaseException:
            self.__exit__(None, None, None)
            raise

    def __exit__(self, *_):
        for interface in reversed(self.claimed):
            self.usb.util.release_interface(self.device, interface)
        for interface in self.detached:
            self.device.attach_kernel_driver(interface)
        self.usb.util.dispose_resources(self.device)

    def send(self, payload):
        if len(payload) > 65535:
            raise ValueError('CODA payload exceeds its 16-bit frame length')
        # The Nokia USB router accepts at most 1 KiB per serial frame.
        chunks = [payload] if len(payload) < 1022 else [
            bytes([0xfe if offset == 0 else 0, (len(payload) - offset - 1) // 1022]) + payload[offset:offset + 1022]
            for offset in range(0, len(payload), 1022)]
        for chunk in chunks:
            packet = b'\x01\x92' + struct.pack('>H', len(chunk)) + chunk
            if self.output.write(packet, timeout=3000) != len(packet):
                raise RuntimeError('Incomplete CODA write')

    def receive(self, match, timeout):
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            while len(self.buffer) >= 4:
                if self.buffer[:2] != b'\x01\x92':
                    del self.buffer[0]
                    continue
                length = struct.unpack('>H', self.buffer[2:4])[0]
                if len(self.buffer) < length + 4:
                    break
                payload = bytes(self.buffer[4:length + 4])
                del self.buffer[:length + 4]
                if len(payload) > 2 and payload[0] in (0xfe, 0):
                    count = payload[1]
                    if payload[0] == 0xfe:
                        self.message.clear()
                    elif self.remaining is None or count != self.remaining - 1:
                        raise RuntimeError('Out-of-order CODA serial chunk')
                    self.message.extend(payload[2:])
                    if len(self.message) > 65535:
                        raise RuntimeError('CODA reply exceeds message limit')
                    self.remaining = count
                    if count:
                        continue
                    payload = bytes(self.message)
                    self.message.clear()
                    self.remaining = None
                if match(payload):
                    return payload
            try:
                self.buffer.extend(self.input.read(65536, timeout=250))
            except self.usb.core.USBTimeoutError:
                pass
        raise TimeoutError('CODA reply timed out')

    def call(self, service, command, *arguments, timeout=10):
        if service not in self.services:
            raise RuntimeError(f'CODA service unavailable: {service}')
        self.token += 1
        token = str(self.token).encode()
        fields = [b'C', token, service.encode(), command.encode()]
        fields += [json.dumps(a, separators=(',', ':')).encode() for a in arguments]
        self.send(b'\0'.join(fields) + b'\0')
        reply = self.receive(lambda p: p[:2] in (b'R\0', b'N\0') and p.split(b'\0')[1] == token, timeout)
        if reply[:1] != b'R':
            raise RuntimeError(f'CODA rejected {service}.{command}')
        values = [json.loads(v) if v else None for v in reply.split(b'\0')[2:-1]]
        for value in values:
            if isinstance(value, dict) and 'Code' in value and ('Time' in value or 'Format' in value):
                raise RuntimeError(f'{service}.{command}: {value}')
        return values

    def packages(self, uid):
        values = self.call('SymbianInstall', 'getPackageInfo', [uid])
        packages = next((v for v in values if isinstance(v, list)), [])
        if len(packages) != 1 or packages[0].get('uid', '').lower() != uid.lower() or packages[0].get('error'):
            raise RuntimeError(f'Package not installed: {packages}')
        return packages[0]

    def file_handle(self, path, flags):
        values = self.call('FileSystem', 'open', path, flags, {})
        handle = next((v for v in values if isinstance(v, str)), None)
        if not handle:
            raise RuntimeError('CODA returned no file handle')
        return handle

    def read_file(self, path, limit=16 * 1024 * 1024):
        handle = self.file_handle(path, 1)
        contents = bytearray()
        try:
            while True:
                # Keep base64 file messages below the router's 1 KiB limit.
                # Large writes can wedge older CODA agents before they reply.
                values = self.call('FileSystem', 'read', handle, len(contents), 512)
                encoded = next((v for v in values if isinstance(v, str)), '')
                part = base64.b64decode(encoded, validate=True)
                contents.extend(part)
                if len(contents) > limit:
                    raise RuntimeError('CODA read exceeds expected file size')
                if not part or any(v is True for v in values):
                    return bytes(contents)
        finally:
            self.call('FileSystem', 'close', handle)

    def write_file(self, path, contents):
        # TCF WRITE | CREATE | TRUNCATE; only the shell's staging path is used.
        handle = self.file_handle(path, 2 | 8 | 16)
        try:
            for offset in range(0, len(contents), 512):
                data = base64.b64encode(contents[offset:offset + 512]).decode()
                self.call('FileSystem', 'write', handle, offset, data)
        finally:
            self.call('FileSystem', 'close', handle)
        if self.read_file(path, len(contents)) != contents:
            raise RuntimeError('CODA SIS readback differs from the local build')

    def processes(self, executable, uid):
        values = self.call('SymbianOSData', 'findRunningProcesses', executable, uid)
        return next((v for v in values if isinstance(v, list)), [])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['deploy', 'install', 'status', 'profile'])
    parser.add_argument('--uid', required=True)
    parser.add_argument('--executable', required=True)
    parser.add_argument('--sis')
    parser.add_argument('--input', help='Packed touch replay TSV for a --perf-trace build')
    parser.add_argument('--trace', help='Local destination for the bounded native frame trace')
    parser.add_argument('--shot', help='Optional post-measurement native screenshot destination')
    args = parser.parse_args()
    uid = args.uid.lower().removeprefix('0x')
    if not re.fullmatch(r'[0-9a-f]{8}', uid) or not re.fullmatch(r'[A-Za-z0-9_-]+\.exe', args.executable):
        parser.error('Invalid package identity')
    if args.action == 'install' and (not args.sis or not re.fullmatch(r'[A-Za-z0-9_-]+\.sis', args.sis)):
        parser.error('Install requires a SIS basename')
    if args.action == 'deploy' and (not args.sis or not Path(args.sis).is_file()):
        parser.error('Deploy requires a local SIS file')
    if args.action == 'profile' and (not args.input or not args.trace or not Path(args.input).is_file()):
        parser.error('Profile requires --input and --trace')
    with Coda() as device:
        remote = f'E:\\Installs\\{args.sis}'
        if args.action == 'deploy':
            contents = Path(args.sis).read_bytes()
            digest = hashlib.sha256(contents).hexdigest()
            remote = f'E:\\Installs\\pocket-shell-{uid}-{digest[:16]}.sis'
            device.write_file(remote, contents)
            print(f'CODA transfer/readback SHA-256: {digest}', flush=True)
        if args.action == 'profile':
            contents = Path(args.input).read_bytes()
            if len(contents) > 131072:
                raise ValueError('Replay exceeds the native 128 KiB limit')
            device.write_file('E:\\Installs\\pocketjs-perf-input.tsv', contents)
            try:
                for process in device.processes(args.executable, uid):
                    device.call('Processes', 'terminate', process)
                device.call('Processes', 'start', '', args.executable, [], [], False)
                print('Native replay started; collecting 30 seconds after guest startup.', flush=True)
                time.sleep(40)
                trace = device.read_file('E:\\Installs\\pocketjs-perf.tsv', 1024 * 1024)
                Path(args.trace).parent.mkdir(parents=True, exist_ok=True)
                Path(args.trace).write_bytes(trace)
                print(f'Frame trace: {args.trace} ({len(trace)} bytes)', flush=True)
                if args.shot:
                    Path(args.shot).parent.mkdir(parents=True, exist_ok=True)
                    Path(args.shot).write_bytes(device.read_file('E:\\Installs\\pocketjs-perf.png', 4 * 1024 * 1024))
            finally:
                device.write_file('E:\\Installs\\pocketjs-perf-input.tsv', b'')
        if args.action in ('install', 'deploy'):
            # Only stop this manifest's process before replacing its executable.
            for process in device.processes(args.executable, uid):
                if not re.fullmatch(r'p[0-9]+', process):
                    raise RuntimeError(f'Unexpected process ID: {process}')
                device.call('Processes', 'terminate', process)
            device.call('SymbianInstall', 'install', remote, 'E', timeout=60)
        print(json.dumps({'package': device.packages(uid), 'processes': device.processes(args.executable, uid)}, indent=2))


if __name__ == '__main__':
    main()
