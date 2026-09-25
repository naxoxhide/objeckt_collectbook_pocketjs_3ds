import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { encodePNG } from "../../../../vendor/pocketjs/tests/png.ts";

const W = 512;
const H = 256;
const rgba = new Uint8Array(W * H * 4);

// Background studio gray: #d8dce2
const bgR = 216;
const bgG = 220;
const bgB = 226;

// Subtle white dots: #ffffff with high contrast against the gray
const dotR = 255;
const dotG = 255;
const dotB = 255;

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const idx = (y * W + x) * 4;
    // Dot pattern spaced every 10px in grid
    const isDot = (x % 10 === 0 && y % 10 === 0);
    if (isDot) {
      rgba[idx] = dotR;
      rgba[idx + 1] = dotG;
      rgba[idx + 2] = dotB;
      rgba[idx + 3] = 255;
    } else {
      rgba[idx] = bgR;
      rgba[idx + 1] = bgG;
      rgba[idx + 2] = bgB;
      rgba[idx + 3] = 255;
    }
  }
}

const outPath = resolve(import.meta.dir, "dots.png");
writeFileSync(outPath, encodePNG(rgba, W, H));
console.log("Generated:", outPath);
