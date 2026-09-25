# ARTMS Objekt Collect Book for Nintendo 3DS

An interactive digital photocard collect book application tailored for the **Nintendo 3DS** family of systems (3DS, 3DS XL, 2DS, New 3DS), natively built upon [PocketJS](https://github.com/pocket-stack/pocketjs) using SolidJS and Citro3D GPU hardware acceleration.

Browse, inspect, and organize official **ARTMS (Atom01)** digital photocards ("Objekts") across both screens with full 3D visual depth, responsive stylus touch controls, and multi-language support (English, Spanish, and Korean).

---

## Highlights & Features

### Dual-Screen Interface

- **Top Screen (400×240)**:
  - **3D Perspective Carousel**: Smooth 3D depth showing adjacent Objekts angled in perspective on the left and right, with the active Objekt highlighted at center.
  - **Live RTC Clock & Battery Status**: Real-time console hardware clock and battery percentage readout.
  - **Quick Member Navigation**: Compact member indicator with L/R trigger hints.
  - **Card Flip Mode (`Ⓑ`)**: Dynamically flip any card between its front portrait and official back serial pattern.
  - **Detailed Inspect Overlay (`Ⓧ`)**: High-resolution view of the selected Objekt alongside a studio spec sheet backed by the member's signature theme color.
  - **System Settings Modal (`Ⓨ`)**: Configure system preferences, view Citro3D engine status (60 FPS, bilinear filtering), and switch languages on the fly.

- **Bottom Screen (320×240 Touchscreen)**:
  - **Stylus Member Selector**: Quick-tap tabs to jump directly between ARTMS members:
    - 🐰 **HeeJin** (`#ec4899`)
    - 🕊️ **HaSeul** (`#10b981`)
    - 🦉 **Kim Lip** (`#ef4444`)
    - 🐟 **JinSoul** (`#3b82f6`)
    - 🦇 **Choerry** (`#8b5cf6`)
  - **Studio Specification Dossier**: Complete metadata sheet detailing Artist, Member, Season, Class (First Class / Special Class), Objekt Type, Serial Number, and wrapped acquisition history.
  - **Touch Navigation Bar**: Large stylus-friendly buttons to page through cards effortlessly.

---

### Multi-Language Localization (i18n)

The entire user interface dynamically adapts in real time across three supported languages:

| Language | Default on Boot | Character Rendering |
| :--- | :---: | :--- |
| **Español** | **Yes** | Accented characters (`á`, `é`, `í`, `ó`, `ú`, `ñ`, `¿`, `¡`) rasterized in Citro3D atlas |
| **English** | No | Full ASCII glyph set |
| **한국어** | No | Authentic CJK Hangul subsetting (`AppleGothic.ttf` fallback) with member names in Korean (`희진`, `하슬`, `김립`, `진솔`, `최리`) |

*Language can be toggled at any moment inside the **Ajustes / Settings** modal (`Ⓨ`) via D-Pad Left/Right, L/R triggers, the `Ⓐ` button, or touch screen pills.*

---

## Controls

| Input | In Carousel / Normal Mode | Inside Modals (Inspect / Settings) |
| :--- | :--- | :--- |
| **D-Pad ◄ / ►** | Navigate previous / next Objekt | Change Language (in Settings) |
| **L / R Triggers** | Switch ARTMS member | Cycle Language (in Settings) |
| **Ⓨ Button** | Open System Settings | Close Settings modal |
| **Ⓑ Button** | Flip Card (Front / Back) | Close active modal |
| **Ⓧ Button** | Inspect Objekt in full detail | — |
| **Ⓐ Button** | — | Cycle Language (in Settings) |
| **Stylus (Touch)** | Tap member tabs, swipe/tap dossier, or tap navigation buttons | Select language pills directly |
| **L + R + START** | Exit to Homebrew Launcher | Exit to Homebrew Launcher |

---

## Architecture & Asset Pipeline

PocketJS targets Nintendo 3DS homebrew using native Citro3D commands on the PICA200 GPU. Because the 3DS GPU requires power-of-two (POT) textures, high-resolution source photocard images cannot simply be loaded raw:

1. **Asset Cooking (`scripts/cook-cards.ts`)**:
   - Ingests source card images (`img/cards/*.webp`) and metadata (`cards.json`).
   - Crops and normalizes photocard aspect ratios into **128×256 RGBA PNG** textures with bilinear sampling hints (`images.json`).
   - Generates typed catalogues (`shells/3ds/src/inventory/data.ts`) with member metadata and asset routes.
2. **Font Atlas Generation (`shells/3ds/src/fonts.json`)**:
   - Subsets Latin and Korean Hangul glyphs into the Citro3D font texture atlas, ensuring zero missing characters without bloating VRAM.
3. **Reactive State (`shells/3ds/src/inventory/store.ts`)**:
   - Built on SolidJS primitives (`createSignal`, `createMemo`, `createEffect`) for 60 FPS performance on bare metal ARM11.

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

### Method A: Hot-Push over Wi-Fi (Recommended for Testing)

With Pocket Shell running on your 3DS connected to the same local network:

```bash
bun run push --host <CONSOLE-IP>
```

### Method B: Manual SD Card Installation

1. Power off your console and insert the SD card into your PC.
2. Copy the compiled bundle `dist/3ds/pocketshell-main.pocket` to your PocketJS app slot:
   ```text
   SD:/pocketjs/runtime/apps/552d35dd1578b13f/app.pocket
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
│       │   ├── cards/            # Baked 128x256 POT card textures
│       │   ├── wall/             # Background textures and generators
│       │   └── inventory/
│       │       ├── types.ts      # TypeScript interfaces for Objekts and Members
│       │       ├── data.ts       # Generated catalog of ARTMS members and Objekts
│       │       ├── i18n.ts       # Localization dictionary (ES, EN, KO)
│       │       ├── store.ts      # SolidJS reactive state, clock, battery, & inputs
│       │       ├── card-view.tsx # 3D perspective carousel component
│       │       ├── stage.tsx     # Top screen view (400x240) & modal overlays
│       │       └── deck.tsx      # Bottom screen view (320x240) & stylus controls
└── vendor/
    └── pocketjs/                 # PocketJS runtime submodule
```

---

## License

This project is distributed under the **GNU General Public License v3 (GPL-3.0-or-later)**.
- PocketJS runtime components remain under the **MIT License**.
- Photocard artwork, imagery, and member trademarks are the property of **MODHAUS** and **ARTMS**. This software is a non-commercial, fan-made homebrew utility.
