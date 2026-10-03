// SPDX-License-Identifier: GPL-3.0-or-later
// shells/3ds/src/native.d.ts — Native 3DS host extensions and bindings for PocketJS.

declare global {
  /**
   * Native host bindings exported directly to globalThis on Nintendo 3DS.
   */
  namespace Native {
    /**
     * Captures all active framebuffers (Top Left, Top Right if 3D active, Bottom screen)
     * and saves them as 24-bit uncompressed BGR888 BMP files under `sdmc:/screenshots/`.
     *
     * @returns `true` if the screenshot was scheduled.
     */
    function takeScreenshot(): boolean;
  }

  /**
   * Host-provided runtime interface injected by QuickJS into the guest environment.
   */
  interface HostUI {
    /**
     * Reads current hardware 3D depth slider position [0.0 = 2D off, 1.0 = max depth].
     */
    slider3D(): number;

    /**
     * Captures full-screen bitmaps to SD card.
     */
    takeScreenshot(): boolean;
  }

  /** Global host UI object. */
  var ui: HostUI | undefined;
}

export {};
