// SPDX-License-Identifier: GPL-3.0-or-later
// src/inventory/index.tsx — Card Inventory Root Component for Nintendo 3DS.

import { AuxiliarySurface } from "@pocketjs/framework/components";
import { DeckInventory } from "./deck.tsx";
import { StageInventory } from "./stage.tsx";
import { createInventoryStore } from "./store.ts";

export default function CardInventory() {
  const store = createInventoryStore();

  return (
    <>
      {/* Primary Viewport: Top Screen (400x240) */}
      <StageInventory store={store} />

      {/* Auxiliary Surface: Bottom Touch Screen (320x240) */}
      <AuxiliarySurface>
        <DeckInventory store={store} />
      </AuxiliarySurface>
    </>
  );
}
