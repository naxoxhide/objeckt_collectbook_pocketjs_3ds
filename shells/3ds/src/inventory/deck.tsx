// SPDX-License-Identifier: GPL-3.0-or-later
// src/inventory/deck.tsx — Bottom Screen (320x240) of the Objekt Inventory.

import { For } from "solid-js";
import { Image, Text, View } from "@pocketjs/framework/components";
import { createGesture } from "@pocketjs/framework/gesture";
import { MEMBERS } from "./data.ts";
import { wrapText } from "./stage.tsx";
import type { InventoryStore } from "./store.ts";

export function DeckInventory(props: { store: InventoryStore }) {
  const store = props.store;
  const card = () => store.activeCard();

  // Register touch gesture handler for the 3DS bottom touchscreen
  createGesture({
    surface: "auxiliary",
    onTap: (c) => {
      // 1. Top member tabs (y: 0..36)
      if (c.y <= 36) {
        const idx = Math.floor(c.x / (320 / MEMBERS.length));
        if (idx >= 0 && idx < MEMBERS.length) {
          store.setMemberIdx(idx);
        }
        return;
      }
      // 2. Bottom buttons (y: 195..240)
      if (c.y >= 195) {
        if (c.x < 160) {
          store.prevCard();
        } else {
          store.nextCard();
        }
        return;
      }
      // 3. Middle dossier taps: tap left third for prev, right third for next
      if (c.x < 100) {
        store.prevCard();
      } else if (c.x > 220) {
        store.nextCard();
      }
    },
  });

  return (
    <View
      debugName="BottomScreenDeck"
      class="relative w-[320] h-[240] overflow-hidden bg-[#dde1e7] p-2 flex-col justify-between"
    >
      {/* 1. Subtle Dot Matrix Background */}
      <Image
        debugName="BgDotsDeck"
        class="absolute left-0 top-0 w-[512] h-[256]"
        src="wall/dots.png"
      />

      {/* 2. Top Stylus Member Selector Bar (Centered) */}
      <View
        debugName="DeckMemberTabs"
        class="h-[24] w-full px-1 rounded-[12] bg-[#f3f4f6] border border-[#9ca3af] flex-row items-center justify-center gap-1 shadow z-10"
      >
        <For each={MEMBERS}>
          {(m, idx) => {
            const active = () => store.memberIdx() === idx();
            return (
              <View
                class={
                  active()
                    ? "px-2 py-0.5 rounded-[9] bg-black items-center justify-center"
                    : "px-1.5 py-0.5 rounded-[9] items-center justify-center"
                }
              >
                <Text
                  class={
                    active()
                      ? "text-xs font-bold text-white"
                      : "text-xs font-bold text-gray-500"
                  }
                >
                  {store.lang() === "ko" ? m.koreanName : m.name}
                </Text>
              </View>
            );
          }}
        </For>
      </View>

      {/* 3. Main Objekt Specification Card (Studio Dossier) */}
      <View
        debugName="CardSpecSheet"
        class="flex-1 my-1 rounded-lg bg-white border-2 border-black p-2 flex-col justify-between shadow-md z-10 overflow-hidden relative"
      >
        {/* Section Header */}
        <View class="border-b border-gray-200 pb-1 px-1">
          <Text class="text-xs font-bold text-black tracking-tight">{store.t().specTitle}</Text>
        </View>

        {/* Metadata Grid */}
        <View class="flex-col gap-1 py-1 px-1">
          {/* Row 1: Artist & Member */}
          <View class="flex-row items-center justify-between">
            <View class="flex-row items-center gap-1">
              <Text class="text-xs font-bold text-gray-500">{store.t().artist}:</Text>
              <Text class="text-xs font-bold text-black">{card().artist}</Text>
            </View>
            <View class="flex-row items-center gap-1">
              <Text class="text-xs font-bold text-gray-500">{store.t().memberLabel}:</Text>
              <Text class="text-xs font-bold text-black">
                {store.lang() === "ko"
                  ? (MEMBERS.find((m) => m.name === card().member)?.koreanName ?? card().member)
                  : card().member}
              </Text>
            </View>
          </View>

          {/* Row 2: Season & Class */}
          <View class="flex-row items-center justify-between">
            <View class="flex-row items-center gap-1">
              <Text class="text-xs font-bold text-gray-500">{store.t().season}:</Text>
              <Text class="text-xs font-bold text-black">{card().season}</Text>
            </View>
            <View class="flex-row items-center gap-1">
              <Text class="text-xs font-bold text-gray-500">Class:</Text>
              <Text class="text-xs font-bold text-black">{store.t().classLabel(card().class)}</Text>
            </View>
          </View>

          {/* Row 3: Type & Number */}
          <View class="flex-row items-center justify-between">
            <View class="flex-row items-center gap-1">
              <Text class="text-xs font-bold text-gray-500">{store.t().type}:</Text>
              <Text class="text-xs font-bold text-black">{store.t().typeObjekt(card().type)}</Text>
            </View>
            <View class="flex-row items-center gap-1">
              <Text class="text-xs font-bold text-gray-500">{store.t().noLabel}:</Text>
              <Text class="text-xs font-mono font-bold text-[#10b981]">
                {card().number}
              </Text>
            </View>
          </View>

          {/* Row 4: Information (Complete, multi-line) */}
          <View class="flex-col pt-1 border-t border-gray-200">
            <Text class="text-xs font-bold text-gray-500 mb-0.5">{store.t().information}:</Text>
            <For each={wrapText(store.localizedInfo(card().information), 38)}>
              {(line) => <Text class="text-xs text-black leading-4">{line}</Text>}
            </For>
          </View>
        </View>

        {/* Bottom padding spacer */}
        <View class="h-[2]" />
      </View>

      {/* 4. Touch Navigation Buttons for Stylus (Only Anterior & Siguiente) */}
      <View
        debugName="StylusActionBar"
        class="h-[24] w-full flex-row items-center justify-between gap-2 z-10"
      >
        {/* Prev Objekt */}
        <View class="flex-1 h-[24] rounded-[12] bg-black items-center justify-center shadow">
          <Text class="text-xs font-bold text-white">{store.t().prev}</Text>
        </View>

        {/* Next Objekt */}
        <View class="flex-1 h-[24] rounded-[12] bg-black items-center justify-center shadow">
          <Text class="text-xs font-bold text-white">{store.t().next}</Text>
        </View>
      </View>
    </View>
  );
}
