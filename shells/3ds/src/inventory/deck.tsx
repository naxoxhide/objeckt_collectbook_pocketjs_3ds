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
      class="relative w-[320] h-[240] overflow-hidden bg-[#dde1e7] px-2 py-1 flex-col justify-between"
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
        class="flex-1 my-0.5 rounded-lg bg-white border-2 border-black px-2 py-1.5 flex-col justify-start gap-1 shadow-md z-10 overflow-hidden relative"
      >
        {/* Top Group: Header & Metadata Grid */}
        <View class="flex-col gap-0.5">
          {/* Section Header */}
          <View class="px-1 flex-row items-center justify-between">
            <Text class="text-xs font-bold text-black">{store.t().specTitle}</Text>
            <View class="px-1.5 py-0.5 rounded bg-black items-center justify-center">
              <Text
                class="text-xs font-mono font-bold"
                style={{ textColor: store.activeMember().color }}
              >
                {card().number}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View class="w-full h-[1] bg-gray-200 my-0.5" />

          {/* Metadata Grid */}
          <View class="flex-col gap-0.5 px-1">
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

            {/* Row 3: Type */}
            <View class="flex-row items-center justify-between">
              <View class="flex-row items-center gap-1">
                <Text class="text-xs font-bold text-gray-500">{store.t().type}:</Text>
                <Text class="text-xs font-bold text-black">{store.t().typeObjekt(card().type)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Group: Information Section (Dedicated Flex Box) */}
        <View class="flex-col gap-0.5">
          {/* Divider */}
          <View class="w-full h-[1] bg-gray-200 my-0.5" />

          {/* Information Section with Indicator and Wrapped Lines */}
          <View class="flex-col px-1 gap-0.5">
            <View class="flex-row items-center gap-1.5">
              <View
                class="w-[6] h-[6] rounded-full"
                style={{ bgColor: store.activeMember().color }}
              />
              <Text class="text-xs font-bold text-gray-600">{store.t().information}:</Text>
            </View>
            <View class="px-2 py-1 rounded bg-gray-50 border border-gray-200 flex-col gap-0.5">
              <For each={wrapText(store.localizedInfo(card().information), 27)}>
                {(line) => (
                  <Text class="text-xs text-gray-800">{line}</Text>
                )}
              </For>
            </View>
          </View>
        </View>
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
