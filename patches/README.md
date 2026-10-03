# PocketJS 3DS Patches

This directory contains standalone, modular patches developed for the Nintendo 3DS host of [PocketJS](https://github.com/pocket-stack/pocketjs) (`vendor/pocketjs`).

These patches are isolated into atomic features so they can be individually applied to any PocketJS project or submitted as clean Pull Requests upstream.

---

## Patch Index

### `0001-3ds-stereoscopic-3d.patch`
**Autostereoscopic 3D & Hardware Depth Slider API**
- **Mechanism**:
  - Dynamically activates the physical parallax barrier via `gfxSet3D(slider > 0.0f)`.
  - Creates dual PICA200 render targets for the top screen: left eye (`primary_target`) and right eye (`primary_target_right`).
  - Implements `gfx_draw_surface_stereo(surface, eye_offset)` in `gfx.c` which modulates horizontal projection boundaries in `Mtx_OrthoTilt`.
  - Exposes the hardware depth slider reading to JavaScript as `ui.slider3D()`, returning `[0.0, 1.0]`.
- **Zero-Regression Performance**:
  - When the 3D slider is off (`slider == 0.0f`), the right-eye rendering pass is completely skipped and the barrier stays off. This preserves 100% of GPU and battery performance on 2D mode and Nintendo 2DS consoles.

### `0002-3ds-sd-screenshot.patch`
**Native SD Card Screenshot Dumper (24-bit BGR888 BMP)**
- **Mechanism**:
  - Exports linear framebuffers to `sdmc:/screenshots/screenshot_YYYYMMDD_HHMMSS_*.bmp`.
  - Un-rotates 3DS hardware vertical column-major framebuffers (240×400) to standard visual landscape (400×240) in bottom-up row order.
  - Zero CPU overhead: uses raw uncompressed 24-bit BMP directly matching native BGR byte ordering, avoiding PNG/JPEG compression lag on Old 3DS (ARM11 @ 268 MHz).
  - Captures top left eye, top right eye (if 3D slider is engaged), and bottom touchscreen.
  - Triggered via hardware button chords (`START + SELECT` or `L + R + Y`) or programmatically via `Native.takeScreenshot()` / `ui.takeScreenshot()`.

### `naked_eyes_3ds.patch`
A convenience unified patch containing both `0001` and `0002`.

---

## How to Apply in Any Project

### Automatic Application
If using this repository's setup script:
```bash
bun scripts/setup.ts
```
The setup script automatically detects and applies all numbered patches sequentially.

### Manual Application to a Vanilla PocketJS Submodule
Navigate to your `vendor/pocketjs` directory and apply:
```bash
# Check compatibility
git -C vendor/pocketjs apply --check ../../patches/0001-3ds-stereoscopic-3d.patch
git -C vendor/pocketjs apply --check ../../patches/0002-3ds-sd-screenshot.patch

# Apply
git -C vendor/pocketjs apply ../../patches/0001-3ds-stereoscopic-3d.patch
git -C vendor/pocketjs apply ../../patches/0002-3ds-sd-screenshot.patch
```

---

## How to Submit Upstream PRs (`pocket-stack/pocketjs`)

To contribute these features to the official `pocket-stack/pocketjs` repository:

1. **Fork `pocket-stack/pocketjs`** on GitHub.
2. **PR 1: Stereoscopic 3D**:
   ```bash
   git checkout -b feat/3ds-stereo-3d main
   git apply patches/0001-3ds-stereoscopic-3d.patch
   git commit -am "feat(hosts/3ds): add stereoscopic 3D support and slider API"
   git push origin feat/3ds-stereo-3d
   ```
   Open a PR to `pocket-stack/pocketjs:main` explaining the zero-overhead fallback when `slider == 0.0f`.

3. **PR 2: SD Screenshot Dumper**:
   ```bash
   git checkout -b feat/3ds-sd-screenshot main
   git apply patches/0002-3ds-sd-screenshot.patch
   git commit -am "feat(hosts/3ds): add uncompressed BMP screenshot export to SD"
   git push origin feat/3ds-sd-screenshot
   ```
   Open a PR to `pocket-stack/pocketjs:main` highlighting the coordinate un-rotation formula and uncompressed BGR888 BMP speed.
