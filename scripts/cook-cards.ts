// scripts/cook-cards.ts
// Converts webp cards from img/cards/ into power-of-two PNG textures (128x256)
// for Citro3D / PICA200 GPU and registers them in shells/3ds/src/images.json.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

interface CardJsonEntry {
  id: string;
  artist: string;
  member: string;
  season: string;
  class: string;
  type: string;
  number: string;
  information: string;
  image_front: string;
  image_back: string;
}

const ROOT = process.cwd();
const CARDS_JSON_PATH = join(ROOT, "cards.json");
const OUTPUT_DIR = join(ROOT, "shells/3ds/src/cards");
const IMAGES_JSON_PATH = join(ROOT, "shells/3ds/src/images.json");

if (!existsSync(CARDS_JSON_PATH)) {
  console.error("cards.json not found!");
  process.exit(1);
}

if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

const cardsData: CardJsonEntry[] = JSON.parse(readFileSync(CARDS_JSON_PATH, "utf-8"));
console.log(`Loaded ${cardsData.length} cards from cards.json`);

// Find all unique images referenced
const uniqueImages = new Set<string>();
for (const card of cardsData) {
  uniqueImages.add(card.image_front);
  uniqueImages.add(card.image_back);
}

console.log(`Found ${uniqueImages.size} unique image references`);

// Helper to find actual file path (handling potential Z suffix or path variations)
function resolveSrcFile(refPath: string): string | null {
  const directPath = join(ROOT, refPath);
  if (existsSync(directPath)) return directPath;

  // Try appending 'Z' before .webp if not present
  if (refPath.endsWith(".webp") && !refPath.endsWith("Z.webp") && !refPath.includes("Back")) {
    const withZ = refPath.replace(/\.webp$/, "Z.webp");
    const p = join(ROOT, withZ);
    if (existsSync(p)) return p;
  }

  // Try stripping 'Z' if present
  if (refPath.endsWith("Z.webp")) {
    const withoutZ = refPath.replace(/Z\.webp$/, ".webp");
    const p = join(ROOT, withoutZ);
    if (existsSync(p)) return p;
  }

  return null;
}

// Helper to determine clean output png filename
export function toPngFilename(refPath: string): string {
  const base = refPath.split("/").pop()!.replace(/\.webp$/, "");
  // Normalize: lower case and clean up
  return base.toLowerCase().replace(/[^a-z0-9_]/g, "_") + ".png";
}

const imagesJson: Record<string, { psm?: number; linear?: boolean }> = existsSync(IMAGES_JSON_PATH)
  ? JSON.parse(readFileSync(IMAGES_JSON_PATH, "utf-8"))
  : {};

let processed = 0;
for (const ref of uniqueImages) {
  const srcFile = resolveSrcFile(ref);
  if (!srcFile) {
    console.warn(`WARNING: Source image not found on disk for '${ref}'`);
    continue;
  }

  const pngName = toPngFilename(ref);
  const outPngPath = join(OUTPUT_DIR, pngName);
  const relativeAssetKey = `cards/${pngName}`;

  // Register in images.json for linear bilinear filtering (Citro3D)
  imagesJson[relativeAssetKey] = { linear: true };

  // Convert webp to temporary png using dwebp, then resize to 128x256 using sips
  const tempPng = `/tmp/cook_temp_${pngName}`;
  try {
    execSync(`dwebp "${srcFile}" -o "${tempPng}" > /dev/null 2>&1`);
    // Resize to power-of-two 128x256 (PICA200 / Citro3D compatible)
    execSync(`sips -z 256 128 "${tempPng}" -o "${outPngPath}" > /dev/null 2>&1`);
    processed++;
    console.log(`[${processed}/${uniqueImages.size}] Cooked ${relativeAssetKey} <- ${srcFile}`);
  } catch (err) {
    console.error(`Error processing ${srcFile}:`, err);
  } finally {
    try {
      execSync(`rm -f "${tempPng}"`);
    } catch {}
  }
}

// Write updated images.json
writeFileSync(IMAGES_JSON_PATH, JSON.stringify(imagesJson, null, 2) + "\n");
console.log(`Updated ${IMAGES_JSON_PATH} with ${processed} card textures.`);
