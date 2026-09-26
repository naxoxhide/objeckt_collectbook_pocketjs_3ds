# ARTMS Objekt Collect Book for Nintendo 3DS

An interactive digital photocard collect book application tailored for the **Nintendo 3DS** family of systems (3DS, 3DS XL, 2DS, New 3DS), natively built upon [PocketJS](https://github.com/pocket-stack/pocketjs) using SolidJS and Citro3D GPU hardware acceleration.

Browse, inspect, and organize official **ARTMS (Atom01)** digital photocards ("Objekts") across both screens with full 3D visual depth, hardware-accelerated holographic foil effects, responsive stylus touch controls, and multi-language support (English, Spanish, and Korean).

---

## Highlights & Features

### Dual-Screen Interface

- **Top Screen (400×240)**:
  - **3D Perspective Carousel**: Smooth 3D depth showing adjacent Objekts angled in perspective on the left and right, with the active Objekt highlighted at center.
  - **Special Class 3D Holographic Foil**: Native GPU additive blending (`BLEND_ADD`) rendering authentic prismatic shimmer and stardust sparkle layers on rare Special Class cards, dynamically catching light as the card tilts in 3D space.
  - **Full-Screen 3D Inspect Mode (`Ⓧ`)**: Isolates the photocard in an immersive 3D space. Tilt and rotate freely in real time using the **Circle Pad analog stick** or **D-Pad**. Flip the card between its front portrait and official back serial pattern with `Ⓨ`.
  - **Inspect Help Dialog**: Compact in-app overlay showing clear controller keybindings and touch instructions.
  - **Live RTC Clock & Battery Status**: Real-time console hardware clock and battery percentage readout.
  - **Quick Member Navigation**: Compact member indicator with L/R trigger hints.
  - **System Settings Modal (`Ⓨ` in Carousel)**: Configure system preferences, view Citro3D engine status (60 FPS, bilinear filtering), and switch languages on the fly.

- **Bottom Screen (320×240 Touchscreen)**:
  - **Stylus Member Selector**: Quick-tap tabs to jump directly between ARTMS members:
    - 🐰 **HeeJin** (`#ec4899`)
    - 🕊️ **HaSeul** (`#10b981`)
    - 🦉 **Kim Lip** (`#ef4444`)
    - 🐟 **JinSoul** (`#3b82f6`)
    - 🦇 **Choerry** (`#8b5cf6`)
  - **Studio Specification Dossier**: Modern dossier card detailing Artist, Member, Season, Class (First Class / Special Class), Objekt Type, and Serial Number.
  - **Adaptive Flex Information Section**: Structured flex box layout with visual weight character wrapping (`charVisualWeight`), ensuring descriptions never clip horizontally or vertically across all three supported languages.
  - **Touch Navigation Bar**: Large stylus-friendly buttons to page through cards effortlessly.

---

### Multi-Language Localization (i18n)

The entire user interface dynamically adapts in real time across three supported languages:

| Language | Default on Boot | Character Rendering & Typography |
| :--- | :---: | :--- |
| **Español** | **Yes** | Accented characters (`á`, `é`, `í`, `ó`, `ú`, `ñ`, `¿`, `¡`) rasterized in Citro3D atlas |
| **English** | No | Full ASCII glyph set |
| **한국어** | No | Authentic CJK Hangul subsetting (`AppleGothic.ttf` fallback) with member names in Korean (`희진`, `하슬`, `김립`, `진솔`, `최리`) and proportional visual width formatting |

*Language can be toggled at any moment inside the **Ajustes / Settings** modal (`Ⓨ`) via D-Pad Left/Right, L/R triggers, the `Ⓐ` button, or touch screen pills.*

---

## Controls

| Input | In Carousel / Normal Mode | In 3D Inspect Mode (`Ⓧ`) | Inside Settings Modal (`Ⓨ`) |
| :--- | :--- | :--- | :--- |
| **Circle Pad / Analog** | Page through Objekts (with deadzone) | **Tilt & move card in 3D** | — |
| **D-Pad ◄ / ► / ▲ / ▼** | Navigate previous / next Objekt | **Tilt & move card in 3D** | Change Language |
| **L / R Triggers** | Switch ARTMS member | Switch ARTMS member | Cycle Language |
| **Ⓨ Button** | Open System Settings | **Flip Card (Front / Back)** | Close Settings modal |
| **Ⓑ Button** | Flip Card (Front / Back) | **Close Inspect Mode / Modal** | Close Settings modal |
| **Ⓧ Button** | **Inspect Objekt in 3D** | — | — |
| **Ⓐ Button** | — | — | Cycle Language |
| **Stylus (Touch)** | Tap member tabs, dossier, or buttons | Tap screen or button to dismiss/close | Select language pills directly |
| **L + R + START** | Exit to Homebrew Launcher | Exit to Homebrew Launcher | Exit to Homebrew Launcher |

---

## Architecture & Asset Pipeline

PocketJS targets Nintendo 3DS homebrew using native Citro3D commands on the PICA200 GPU. Because the 3DS GPU requires power-of-two (POT) textures, high-resolution source photocard images and procedural foils are processed through a dedicated pipeline:

1. **Asset Cooking (`scripts/cook-cards.ts`)**:
   - Ingests source card images (`img/cards/*.webp`) and metadata (`cards.json`).
   - Crops and normalizes photocard aspect ratios into **128×256 RGBA PNG** textures with bilinear sampling hints (`images.json`).
   - Generates typed catalogues (`shells/3ds/src/inventory/data.ts`) with member metadata and asset routes.
2. **Procedural Holographic Foils (`shells/3ds/src/cards/gen-foil.py`)**:
   - Generates 128×256 POT chromatic aberration sheen and sparkle textures (`foil_holo_a.png`, `foil_holo_b.png`) blended via native Citro3D texture combiners.
3. **Font Atlas Generation (`shells/3ds/src/fonts.json`)**:
   - Subsets Latin and Korean Hangul glyphs into the Citro3D font texture atlas, ensuring zero missing characters without bloating VRAM.
4. **Visual Width Typography (`wrapText`)**:
   - Computes proportional font visual weights (1.85× weight for Hangul full-width characters vs 1.0× for Latin) to prevent text overflow on 3DS screens.
5. **Reactive State (`shells/3ds/src/inventory/store.ts`)**:
   - Built on SolidJS primitives (`createSignal`, `createMemo`, `createEffect`) delivering smooth 60 FPS performance on bare metal ARM11.

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.1 or later)
- Git with submodule support
- A Nintendo 3DS running Luma3DS custom firmware with [Homebrew Launcher](https://github.com/devkitPro/3ds-hbmenu)

### 1. Clone the Repository

Clone recursively to fetch the `vendor/pocketjs` runtime submodule:

```bash
git clone --recurse-submodules https://github.com/naxoxhide/objeckt_collectbook_pocketjs_3ds.git
cd objeckt_collectbook_pocketjs_3ds
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Build the 3DS Guest Bundle

To compile the guest `.pocket` bundle for the 3DS runtime:

```bash
bun run 3ds --pocket-only
```

The output bundle is generated at:
```text
dist/3ds/pocketshell-main.pocket
```

---

## Deployment to Nintendo 3DS

### Method A: Over-the-Air via FTP (Recommended)

1. Launch **FTPD** on your 3DS (connected to the same local Wi-Fi). Note the console's IP address.
2. From your terminal, upload the compiled `.pocket` bundle directly to your console's app slot:
   ```bash
   curl --ftp-create-dirs -T dist/3ds/pocketshell-main.pocket ftp://<CONSOLE-IP>:5000/pocketjs/runtime/apps/552d35dd1578b13f/pending.pocket
   ```
3. Exit FTPD and launch **Pocket Shell** from the Homebrew Launcher. The runtime will automatically stage and activate the new package upon boot.

### Method B: Hot-Push Wire (Pair & Push)

1. **Pair once** while FTPD is open:
   ```bash
   bun run pair --host <CONSOLE-IP>
   ```
2. Launch Pocket Shell on the console and push live updates:
   ```bash
   bun run push --host <CONSOLE-IP>
   ```

### Method C: Manual SD Card Transfer

1. Power off your console and insert the SD card into your PC.
2. Copy `dist/3ds/pocketshell-main.pocket` to:
   ```text
   SD:/pocketjs/runtime/apps/552d35dd1578b13f/pending.pocket
   ```
3. Reinsert the SD card into your 3DS and launch Pocket Shell from the Homebrew Launcher.

---

## Project Structure

```text
├── cards.json                    # Full Atom01 Objekt database (classes, numbers, descriptions)
├── scripts/
│   └── cook-cards.ts             # Asset pipeline: converts webp cards to 128x256 POT textures
├── shells/
│   └── 3ds/
│       ├── src/
│       │   ├── app.tsx           # 3DS application root entrypoint
│       │   ├── fonts.json        # Font atlas configuration (AppleGothic fallback & CJK glyphs)
│       │   ├── images.json       # Citro3D texture sampling configuration
│       │   ├── cards/            # Baked 128x256 POT card & foil textures
│       │   │   ├── gen-foil.py   # Procedural holographic foil texture generator
│       │   │   ├── foil_holo_a.png
│       │   │   └── foil_holo_b.png
│       │   ├── wall/             # Background textures and generators
│       │   └── inventory/
│       │       ├── types.ts      # TypeScript interfaces for Objekts and Members
│       │       ├── data.ts       # Generated catalog of ARTMS members and Objekts
│       │       ├── i18n.ts       # Localization dictionary (ES, EN, KO)
│       │       ├── store.ts      # SolidJS reactive state, clock, battery, & inputs
│       │       ├── card-view.tsx # 3D perspective carousel component
│       │       ├── stage.tsx     # Top screen view (400x240), 3D inspect, & modals
│       │       └── deck.tsx      # Bottom screen view (320x240), dossier, & stylus controls
└── vendor/
    └── pocketjs/                 # PocketJS runtime submodule
```

---

## License

This project is distributed under the **GNU General Public License v3 (GPL-3.0-or-later)**.
- PocketJS runtime components remain under the **MIT License**.
- Photocard artwork, imagery, and member trademarks are the property of **MODHAUS** and **ARTMS**. This software is a non-commercial, fan-made homebrew utility.
