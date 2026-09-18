// SPDX-License-Identifier: GPL-3.0-or-later
// Downsample Blender's 384px renders to the shipped 128px texture inputs.
import { createCanvas, loadImage } from '../../../vendor/pocketjs/node_modules/@napi-rs/canvas';
import { resolve } from 'node:path';
const names = ['today', 'music', 'places', 'weather', 'notes', 'photos', 'mail', 'calendar', 'clock', 'safari', 'files', 'settings', 'camera', 'health', 'books', 'calculator'];
const directory = resolve(process.argv[2] ?? '.pocket-build/touch-art');
const sheet = createCanvas(800, 880), s = sheet.getContext('2d');
s.fillStyle = '#e3e8f0'; s.fillRect(0, 0, 800, 880);
for (const [index, name] of names.entries()) {
  const image = await loadImage(resolve(directory, name + '.png'));
  const canvas = createCanvas(128, 128), c = canvas.getContext('2d');
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(image, 0, 0, 128, 128);
  await Bun.write(resolve(import.meta.dir, '../src/art/' + name + '.png'), canvas.toBuffer('image/png'));
  const x = index % 4 * 200, y = Math.floor(index / 4) * 220;
  s.drawImage(canvas, x + 36, y + 12, 128, 128);
  s.drawImage(canvas, x + 72, y + 147, 56, 56);
  s.fillStyle = '#25334d'; s.font = '13px sans-serif'; s.textAlign = 'center';
  s.fillText(name, x + 100, y + 217);
}
await Bun.write(resolve(directory, 'contact-sheet.png'), sheet.toBuffer('image/png'));
