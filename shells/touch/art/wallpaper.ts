// SPDX-License-Identifier: GPL-3.0-or-later
// Original dusk wallpaper: continuous gradient and supersampled curves.
import { createCanvas } from '../../../vendor/pocketjs/node_modules/@napi-rs/canvas';
import { resolve } from 'node:path';
const canvas = createCanvas(1536, 1536), c = canvas.getContext('2d');
c.scale(1536 / 320, 1536 / 480);
const sky = c.createLinearGradient(0, 0, 0, 480);
sky.addColorStop(0, '#303b68'); sky.addColorStop(1, '#bf8086');
c.fillStyle = sky; c.fillRect(0, 0, 320, 480);
c.fillStyle = '#d6a18f'; c.beginPath(); c.arc(262, 192, 106, 0, Math.PI * 2); c.fill();
c.fillStyle = '#835d7a'; c.beginPath(); c.moveTo(0, 340);
c.bezierCurveTo(65, 290, 86, 252, 132, 263); c.bezierCurveTo(193, 274, 237, 330, 320, 300);
c.lineTo(320, 480); c.lineTo(0, 480); c.closePath(); c.fill();
c.fillStyle = '#44496e'; c.beginPath(); c.moveTo(0, 423);
c.bezierCurveTo(97, 378, 116, 328, 181, 336); c.bezierCurveTo(250, 345, 268, 387, 320, 369);
c.lineTo(320, 480); c.lineTo(0, 480); c.closePath(); c.fill();
const baked = createCanvas(512, 512), out = baked.getContext('2d');
out.imageSmoothingEnabled = true; out.imageSmoothingQuality = 'high';
out.drawImage(canvas, 0, 0, 512, 512);
await Bun.write(resolve(import.meta.dir, '../src/art/wallpaper.png'), baked.toBuffer('image/png'));
