// SPDX-License-Identifier: GPL-3.0-or-later
import { createJumpBatch } from "@pocketjs/framework/animation";
import type { NodeMirror } from "@pocketjs/framework/components";
import { clamp, smooth, type Card, type PaintBounds } from "./navigation.ts";
import { WINDOW_RADIUS } from "./layout.ts";

interface WindowNodes {
  window: NodeMirror; clip: NodeMirror; label: NodeMirror; content: NodeMirror;
  contentClip: NodeMirror; contentPlane: NodeMirror;
}

/** Owns the window properties submitted together at the end of a frame. */
export function createWindowPainter(nodes: readonly WindowNodes[]) {
  type Binding = Parameters<typeof createJumpBatch>[0][number];
  const bindings: Binding[] = [];
  const bind = (node: NodeMirror, prop: Binding[1]) => bindings.push([node, prop]) - 1;
  const windows = nodes.map(n => ({
    slots: {
      x: bind(n.window, "translateX"), y: bind(n.window, "translateY"),
      scaleX: bind(n.window, "scaleX"), scaleY: bind(n.window, "scaleY"),
      radius: bind(n.window, "radius"), opacity: bind(n.window, "opacity"),
      clipX: bind(n.clip, "translateX"), labelX: bind(n.label, "translateX"),
      labelY: bind(n.label, "translateY"), labelOpacity: bind(n.label, "opacity"),
      contentY: bind(n.content, "translateY"), contentClipX: bind(n.contentClip, "translateX"),
      contentPlaneX: bind(n.contentPlane, "translateX"),
    },
    previous: { x: NaN, y: NaN, scale: NaN, opacity: NaN, visibility: NaN,
      offset: NaN, clipX: NaN, contentClipX: NaN },
  }));
  const batch = createJumpBatch(bindings);
  let changed = false;
  return {
    paint(index: number, card: Card, bounds: PaintBounds, width: number, offset: number) {
      const { slots: s, previous: p } = windows[index];
      const x = card.x.value, y = card.y.value, scale = card.scale.value;
      const opacity = bounds.opacity, visibility = card.visibility.value;
      // Translate fixed-size scissors and counter-translate their children.
      // Moving an occluding edge then leaves layout and visible ink unchanged.
      const clipX = bounds.right - width;
      const contentClipX = scale > 0 ? clamp((bounds.contentRight - x) / scale, 0, width) - width : 0;
      if (p.x === x && p.y === y && p.scale === scale && p.opacity === opacity &&
          p.visibility === visibility && p.offset === offset && p.clipX === clipX &&
          p.contentClipX === contentClipX) return;
      changed = true;
      if (p.x !== x || p.clipX !== clipX) batch.set(s.x, x - clipX);
      if (p.y !== y) { batch.set(s.y, y); batch.set(s.labelY, y - 29); }
      // Below this scale, both the radius and label fade have reached their
      // constant values. Retain the pending entries without re-encoding them.
      const shapeChanged = p.scale !== scale && !(p.scale <= 0.72 && scale <= 0.72);
      if (p.scale !== scale) { batch.set(s.scaleX, scale); batch.set(s.scaleY, scale); }
      if (shapeChanged) batch.set(s.radius, WINDOW_RADIUS * (1 - smooth(0.72, 1, scale)));
      if (p.opacity !== opacity) batch.set(s.opacity, opacity);
      if (p.clipX !== clipX) batch.set(s.clipX, clipX);
      if (p.x !== x) batch.set(s.labelX, x);
      if (p.visibility !== visibility || shapeChanged)
        batch.set(s.labelOpacity, clamp(visibility) * (1 - smooth(0.72, 0.96, scale)));
      if (p.offset !== offset) batch.set(s.contentY, -offset);
      if (p.contentClipX !== contentClipX) {
        batch.set(s.contentClipX, contentClipX); batch.set(s.contentPlaneX, -contentClipX);
      }
      p.x = x; p.y = y; p.scale = scale; p.opacity = opacity;
      p.visibility = visibility; p.offset = offset; p.clipX = clipX; p.contentClipX = contentClipX;
    },
    commit() { if (changed) { batch.commit(); changed = false; } },
  };
}
