// SPDX-License-Identifier: GPL-3.0-or-later
// src/app.tsx — Pocket Shell: a tiling window shell for the
// Nintendo 3DS, entirely on the console. The top screen is the stage —
// Omarchy's tokyo-night wallpaper under dwindle- or scrolling-tiled windows —
// and the touch screen is the deck, where the shoulders' chord map, the
// workspace strip, a live minimap and the dock live. See README.md for the
// interaction design and store.ts for how input becomes actions.

import { AuxiliarySurface } from "@pocketjs/framework/components";
import { Deck } from "./deck.tsx";
import { Stage } from "./stage.tsx";
import { createShellStore } from "./store.ts";

import CardInventory from "./inventory/index.tsx";

export default function PocketShell() {
  return <CardInventory />;
}
