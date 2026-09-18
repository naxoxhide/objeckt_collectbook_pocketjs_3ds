// SPDX-License-Identifier: GPL-3.0-or-later
// Area-average opaque Blender renders, then apply one circular-corner mask.
import { createCanvas, loadImage } from '../../../vendor/pocketjs/node_modules/@napi-rs/canvas';
import { decodePng } from '../../../vendor/pocketjs/framework/compiler/pak';
import { encodePNG } from '../../../vendor/pocketjs/tests/png';
import { resolve } from 'node:path';
const names = ['today', 'music', 'places', 'weather', 'notes', 'photos', 'mail', 'calendar', 'clock', 'safari', 'files', 'settings', 'camera', 'health', 'books', 'calculator'];
const directory = resolve(process.argv[2] ?? '.pocket-build/touch-art');
const sheet = createCanvas(800, 880), s = sheet.getContext('2d');
s.fillStyle = '#e3e8f0'; s.fillRect(0, 0, 800, 880);
for (const [index, name] of names.entries()) {
  const image = decodePng(new Uint8Array(await Bun.file(resolve(directory, name + '.png')).arrayBuffer()));
  if (image.width !== 512 || image.height !== 512) throw new Error(`Expected a 512px Blender render: ${name}`);
  const rgba = new Uint8Array(128 * 128 * 4), radius = 128 * 16 / 56;
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const target = (y * 128 + x) * 4, sum = [0, 0, 0];
    for (let yy = 0; yy < 4; yy++) for (let xx = 0; xx < 4; xx++) {
      const source = ((y * 4 + yy) * 512 + x * 4 + xx) * 4;
      if (image.rgba[source + 3] !== 255) throw new Error(`Tile color must cover the entire render: ${name}`);
      for (let channel = 0; channel < 3; channel++) sum[channel] += image.rgba[source + channel];
    }
    for (let channel = 0; channel < 3; channel++) rgba[target + channel] = Math.round(sum[channel] / 16);
    let coverage = 0;
    for (let yy = 0; yy < 16; yy++) for (let xx = 0; xx < 16; xx++) {
      const px = x + (xx + .5) / 16, py = y + (yy + .5) / 16;
      const dx = Math.max(radius - px, px - (128 - radius), 0);
      const dy = Math.max(radius - py, py - (128 - radius), 0);
      if (dx * dx + dy * dy <= radius * radius) coverage++;
    }
    rgba[target + 3] = Math.round(coverage * 255 / 256);
  }
  // Canvas re-encoding discards RGB where alpha is zero. Preserve the full
  // overscan color: GLES interpolates straight RGB and alpha independently,
  // so transparent black would become a dark fringe beside opaque pixels.
  const png = encodePNG(rgba, 128, 128);
  await Bun.write(resolve(import.meta.dir, '../src/art/' + name + '.png'), png);
  const canvas = createCanvas(128, 128), c = canvas.getContext('2d');
  c.drawImage(await loadImage(png), 0, 0);
  const x = index % 4 * 200, y = Math.floor(index / 4) * 220;
  s.drawImage(canvas, x + 36, y + 12, 128, 128);
  s.drawImage(canvas, x + 72, y + 147, 56, 56);
  s.fillStyle = '#25334d'; s.font = '13px sans-serif'; s.textAlign = 'center';
  s.fillText(name, x + 100, y + 217);
}
await Bun.write(resolve(directory, 'contact-sheet.png'), sheet.toBuffer('image/png'));
