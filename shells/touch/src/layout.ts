// SPDX-License-Identifier: GPL-3.0-or-later
import { APPS } from './catalog.ts';

/** Logical coordinates shared by drawing, hit testing and window springs. */
export function shellLayout(width = 320, height = 480) {
  const landscape = width > height;
  const homeLeft = landscape ? width - 320 : (width - 320) / 2;
  const firstRow = landscape ? 48 : 146 + Math.max(0, height - 480) / 4;
  const rowPitch = landscape ? 84 : 92;
  const dockY = height - 114;
  const contentTop = landscape ? 32 : 126;
  const contentHeight = height - contentTop - 48;
  const wallpaperScale = Math.max(width / 320, height / 480);
  return {
    width, height, landscape, homeLeft, firstRow, dockY,
    wallpaper: { width: 320 * wallpaperScale, height: 480 * wallpaperScale,
      insetL: (width - 320 * wallpaperScale) / 2, insetT: (height - 480 * wallpaperScale) / 2 },
    headerY: landscape ? 58 : 53 + Math.max(0, height - 480) * 0.15,
    subtitleY: landscape ? 103 : 98 + Math.max(0, height - 480) * 0.15,
    widgetY: firstRow + (landscape ? 88 : 100),
    dotsY: height - 143,
    contentLeft: landscape ? width - 320 : (width - 320) / 2,
    contentTop, contentHeight,
    overviewY: Math.min(64, 64 + (height - 480) * 0.12),
    icon(index: number) {
      const app = APPS[index];
      return { x: (app.page < 0 ? (width - 320) / 2 : homeLeft) + app.x,
        y: app.page < 0 ? dockY : firstRow + Math.floor(app.slot / 4) * rowPitch };
    },
  };
}
export type ShellLayout = ReturnType<typeof shellLayout>;
