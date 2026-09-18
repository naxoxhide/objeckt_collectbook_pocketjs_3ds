# Touch shell artwork

`icons.py` authors sixteen Blender scenes from meshes, curves, text, materials,
an orthographic camera and area lights. Each scene retains editable geometry.
The tile uses the original 56-pixel footprint and 16-pixel circular corners.
Blender renders an opaque plane beyond the tile boundary. The baker applies
the corner mask and preserves the color under transparent pixels. This keeps
GLES bilinear sampling from mixing transparent black into the visible edge.
Symbols sit above the plane with beveled edges and cast shadows. Books uses
curved paper meshes; Calendar, Calculator and Settings use fewer, larger parts.
All artwork is GPL-3.0-or-later.

**The app uses the committed 128×128 PNGs in `src/art/`.** Blender and a GPU are
not required to build or run Pocket Shell. The two Home pages and dock use the
same textures on E7 and iPod touch. The app renders each icon as one image node.

Regenerate with Blender 5.1.2 after the repository setup:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
  --python shells/touch/art/icons.py -- --out .pocket-build/touch-art
bun shells/touch/art/bake-icons.ts .pocket-build/touch-art
bun shells/touch/art/wallpaper.ts
```

The Blender command writes a `.blend` with one scene per icon and 512×512 PNG
renders. The baker averages each 4×4 pixel area into one 128×128 texel, applies
a 16×16-sample circular-corner mask, and writes the RGBA bytes without a Canvas
re-encode, which would discard color under zero alpha. It writes a contact sheet with
both texture-size and 56-pixel previews. The scene, renders and contact sheet
stay in ignored `.pocket-build/`; the shipped PNGs are product inputs consumed
by `src/icons.tsx` and declared in `src/images.json`.

**The wallpaper is a 512×512 RGBA texture with linear sampling.** Its recipe
uses a continuous gradient and supersampled curves. It replaces the old
256×256 SVG bake with its stepped gradient and fixed curve subdivisions.
The wallpaper keeps the same 320:480 composition when displayed.
The E7 host requests RGB888 output; the Qt default RGB565 surface adds a
dither grid even when the source texture uses RGBA8888. The 16 icons
and wallpaper occupy 2 MiB of RGBA texels before host upload overhead.
