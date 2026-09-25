// SPDX-License-Identifier: GPL-3.0-or-later
// src/inventory/stage.tsx — Top Screen (400x240) of the Objekt Inventory.

import { For, Show } from "solid-js";
import { Image, Text, View } from "@pocketjs/framework/components";
import { CardCarousel } from "./card-view.tsx";
import { MEMBERS } from "./data.ts";
import type { InventoryStore } from "./store.ts";

/** Utility to wrap text lines at character boundaries without cutting words. */
export function wrapText(text: string, maxLen = 30): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    if (!current) {
      current = w;
    } else if (current.length + 1 + w.length <= maxLen) {
      current += " " + w;
    } else {
      lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Top Menu Bar: RTC Clock, Compact 3-Member Selector (Image 3 reference), Battery indicator. */
function TopBar(props: { store: InventoryStore }) {
  const store = props.store;

  const prevMember = () => {
    const idx = (store.memberIdx() - 1 + MEMBERS.length) % MEMBERS.length;
    return MEMBERS[idx];
  };
  const activeMember = () => MEMBERS[store.memberIdx()];
  const nextMember = () => {
    const idx = (store.memberIdx() + 1) % MEMBERS.length;
    return MEMBERS[idx];
  };

  return (
    <View
      debugName="TopMenuBar"
      class="absolute left-0 right-0 top-[6] h-[24] px-3 flex-row items-center justify-between"
    >
      {/* LEFT: RTC Clock */}
      <View class="h-[20] px-2.5 rounded-[10] bg-[#e5e7eb] border border-[#9ca3af] items-center justify-center">
        <Text class="text-xs font-mono font-bold text-black">
          {store.timeStr()}
        </Text>
      </View>

      {/* CENTER: Compact 3-Member Selector (matching Image 3 reference) */}
      <View class="h-[22] px-1 rounded-[11] bg-[#f3f4f6] border border-[#9ca3af] flex-row items-center justify-center gap-1">
        {/* L Trigger */}
        <View
          class="w-[16] h-[16] rounded-full bg-black items-center justify-center"
          onPress={() => store.prevMember()}
        >
          <Text class="text-xs font-bold text-white">L</Text>
        </View>

        {/* Previous Member */}
        <View
          class="px-1.5 py-0.5 rounded-[9] items-center justify-center"
          onPress={() => store.prevMember()}
        >
          <Text class="text-xs font-bold text-gray-500">
            {store.lang() === "ko" ? prevMember().koreanName : prevMember().name}
          </Text>
        </View>

        {/* Active Member */}
        <View class="px-2 py-0.5 rounded-[9] bg-black items-center justify-center">
          <Text class="text-xs font-bold text-white">
            {store.lang() === "ko" ? activeMember().koreanName : activeMember().name}
          </Text>
        </View>

        {/* Next Member */}
        <View
          class="px-1.5 py-0.5 rounded-[9] items-center justify-center"
          onPress={() => store.nextMember()}
        >
          <Text class="text-xs font-bold text-gray-500">
            {store.lang() === "ko" ? nextMember().koreanName : nextMember().name}
          </Text>
        </View>

        {/* R Trigger */}
        <View
          class="w-[16] h-[16] rounded-full bg-black items-center justify-center"
          onPress={() => store.nextMember()}
        >
          <Text class="text-xs font-bold text-white">R</Text>
        </View>
      </View>

      {/* RIGHT: Battery Status */}
      <View class="h-[20] px-2.5 rounded-[10] bg-[#e5e7eb] border border-[#9ca3af] flex-row items-center gap-1">
        <Text class="text-xs font-mono font-bold text-black">
          {store.batteryStr()}
        </Text>
      </View>
    </View>
  );
}

/** Bottom Action Bar (Top Screen): Ⓨ Ajustes, Ⓑ Girar, Ⓧ Inspeccionar. */
function BottomBar(props: { store: InventoryStore }) {
  const t = props.store.t;

  return (
    <View
      debugName="BottomActionBar"
      class="absolute left-0 right-0 bottom-[6] h-[22] px-6 flex-row items-center justify-between"
    >
      {/* Ⓨ Ajustes / Settings / 설정 */}
      <View
        class="h-[20] px-3 rounded-[10] bg-white border border-gray-400 flex-row items-center gap-1.5"
        onPress={() => props.store.toggleSettings()}
      >
        <View class="w-[12] h-[12] rounded-full bg-black items-center justify-center">
          <Text class="text-xs font-bold text-white">Y</Text>
        </View>
        <Text class="text-xs font-bold text-black">{t().settings}</Text>
      </View>

      {/* Ⓑ Girar / Flip / 회전 */}
      <View
        class="h-[20] px-3 rounded-[10] bg-white border border-gray-400 flex-row items-center gap-1.5"
        onPress={() => props.store.toggleFlip()}
      >
        <View class="w-[12] h-[12] rounded-full bg-black items-center justify-center">
          <Text class="text-xs font-bold text-white">B</Text>
        </View>
        <Text class="text-xs font-bold text-black">
          {props.store.cardFlipped() ? t().front : t().flip}
        </Text>
      </View>

      {/* Ⓧ Inspeccionar / Inspect / 상세보기 */}
      <View
        class="h-[20] px-3 rounded-[10] bg-white border border-gray-400 flex-row items-center gap-1.5"
        onPress={() => props.store.toggleInspect()}
      >
        <View class="w-[12] h-[12] rounded-full bg-black items-center justify-center">
          <Text class="text-xs font-bold text-white">X</Text>
        </View>
        <Text class="text-xs font-bold text-black">{t().inspect}</Text>
      </View>
    </View>
  );
}

/** Modal Overlay: Full Inspect View showing the Objekt in large format with Member color background. */
function InspectModal(props: { store: InventoryStore }) {
  const card = () => props.store.activeCard();
  const member = () => props.store.activeMember();
  const isSpecial = () => card().class === "Special";
  const t = props.store.t;
  const infoText = () => props.store.localizedInfo(card().information);

  return (
    <View
      debugName="InspectModalBackdrop"
      class="absolute left-0 top-0 w-[400] h-[240] bg-[#000000dd] flex-row items-center justify-center gap-2 z-50"
    >
      {/* 1. Large Objekt Card Preview */}
      <View class="w-[124] h-[190] rounded-lg overflow-hidden border-2 border-white shadow-lg bg-[#181a1f] shrink-0">
        <Image
          src={props.store.cardFlipped() ? card().imageBack : card().imageFront}
          class="w-full h-full"
        />
      </View>

      {/* 2. Detailed Spec Sheet with Member-Colored Background */}
      <View
        class="w-[242] h-[190] rounded-lg border-2 border-white p-2.5 flex-col justify-between shadow-lg shrink-0"
        style={{ bgColor: member().color }}
      >
        {/* Header: Member Name, Number, and Adaptive Class Badge */}
        <View class="flex-row items-center justify-between pb-1">
          <Text class="text-sm font-bold text-white tracking-wide">
            {props.store.lang() === "ko" ? member().koreanName : card().member} {card().number}
          </Text>
          <View
            class={
              isSpecial()
                ? "px-2 py-0.5 rounded bg-[#f59e0b] border border-white items-center justify-center"
                : "px-2 py-0.5 rounded bg-black border border-white items-center justify-center"
            }
          >
            <Text
              class={
                isSpecial()
                  ? "text-xs font-bold text-black"
                  : "text-xs font-bold text-white"
              }
            >
              {t().classLabel(card().class)}
            </Text>
          </View>
        </View>

        {/* Metadata in Active Language: Artist, Season, Type */}
        <View class="flex-col gap-1">
          {/* Row 1: Artist & Season */}
          <View class="flex-row items-center justify-between gap-1">
            <View class="flex-1 h-[22] px-2 rounded bg-black flex-row items-center gap-1.5">
              <Text class="text-xs font-bold text-gray-400">{t().artist}:</Text>
              <Text class="text-xs font-bold text-white">{card().artist}</Text>
            </View>
            <View class="flex-1 h-[22] px-2 rounded bg-black flex-row items-center gap-1.5">
              <Text class="text-xs font-bold text-gray-400">{t().season}:</Text>
              <Text class="text-xs font-bold text-white">{card().season}</Text>
            </View>
          </View>

          {/* Row 2: Type */}
          <View class="w-full h-[22] px-2 rounded bg-black flex-row items-center gap-1.5">
            <Text class="text-xs font-bold text-gray-400">{t().type}:</Text>
            <Text class="text-xs font-bold text-white">{t().typeObjekt(card().type)}</Text>
          </View>
        </View>

        {/* Full Information Box with clean multi-line wrapping */}
        <View class="p-2 rounded bg-black flex-col gap-0.5 min-h-[58]">
          <Text class="text-xs font-bold text-gray-400 mb-0.5">{t().information}</Text>
          <For each={wrapText(infoText(), 30)}>
            {(line) => (
              <Text class="text-xs text-white leading-4">
                {line}
              </Text>
            )}
          </For>
        </View>

        {/* Footer */}
        <View class="h-[20] px-2 rounded bg-black border border-white flex-row items-center justify-center">
          <Text class="text-xs font-bold text-white">
            {t().closePrompt}
          </Text>
        </View>
      </View>
    </View>
  );
}

/** Modal Overlay: Settings View with Language Selector. */
function SettingsModal(props: { store: InventoryStore }) {
  const t = props.store.t;
  const lang = props.store.lang;

  return (
    <View class="absolute left-0 top-0 w-[400] h-[240] bg-[#000000cc] flex-row items-center justify-center z-50">
      <View class="w-[328] h-[196] rounded-lg bg-[#181a1f] border-2 border-white p-3 flex-col justify-between shadow-lg">
        <View class="flex-col gap-1.5">
          {/* Header */}
          <View class="flex-row items-center justify-between border-b border-gray-700 pb-1.5">
            <Text class="text-sm font-bold text-white">{t().settingsTitle}</Text>
            <Text class="text-xs font-mono font-bold text-[#10b981]">{t().settingsSub}</Text>
          </View>

          {/* Language Selector Row */}
          <View class="flex-row items-center justify-between py-1 border-b border-gray-800">
            <Text class="text-xs font-bold text-gray-300">{t().language}</Text>
            <View class="flex-row items-center gap-1">
              <View
                class={
                  lang() === "es"
                    ? "px-2 py-0.5 rounded bg-[#10b981] items-center justify-center"
                    : "px-2 py-0.5 rounded bg-black border border-gray-600 items-center justify-center"
                }
                onPress={() => props.store.setLang("es")}
              >
                <Text class="text-xs font-bold text-white">Español</Text>
              </View>
              <View
                class={
                  lang() === "en"
                    ? "px-2 py-0.5 rounded bg-[#10b981] items-center justify-center"
                    : "px-2 py-0.5 rounded bg-black border border-gray-600 items-center justify-center"
                }
                onPress={() => props.store.setLang("en")}
              >
                <Text class="text-xs font-bold text-white">English</Text>
              </View>
              <View
                class={
                  lang() === "ko"
                    ? "px-2 py-0.5 rounded bg-[#10b981] items-center justify-center"
                    : "px-2 py-0.5 rounded bg-black border border-gray-600 items-center justify-center"
                }
                onPress={() => props.store.setLang("ko")}
              >
                <Text class="text-xs font-bold text-white">한국어</Text>
              </View>
            </View>
          </View>

          {/* Clock */}
          <View class="flex-row items-center justify-between py-0.5">
            <Text class="text-xs text-gray-300">{t().clock}</Text>
            <Text class="text-xs font-mono font-bold text-[#10b981]">{props.store.timeStr()}</Text>
          </View>

          {/* FPS */}
          <View class="flex-row items-center justify-between py-0.5">
            <Text class="text-xs text-gray-300">{t().fps}</Text>
            <Text class="text-xs font-mono font-bold text-white">{t().fpsVal}</Text>
          </View>

          {/* Filter */}
          <View class="flex-row items-center justify-between py-0.5">
            <Text class="text-xs text-gray-300">{t().filter}</Text>
            <Text class="text-xs font-mono font-bold text-white">{t().filterVal}</Text>
          </View>
        </View>

        {/* Footer */}
        <View class="flex-row items-center justify-between pt-1.5 border-t border-gray-700">
          <Text class="text-xs text-gray-400">{t().langHint}</Text>
          <Text class="text-xs font-bold text-white">{t().exitPrompt}</Text>
        </View>
      </View>
    </View>
  );
}

/** Complete Top Screen Stage Component (400x240). */
export function StageInventory(props: { store: InventoryStore }) {
  const store = props.store;

  return (
    <View debugName="TopScreenStage" class="relative w-[400] h-[240] overflow-hidden bg-[#dde1e7]">
      {/* 1. Subtle Dot Matrix Background */}
      <Image
        debugName="BgDots"
        class="absolute left-0 top-0 w-[512] h-[256]"
        src="wall/dots.png"
      />

      {/* 2. Top Menu Bar */}
      <TopBar store={store} />

      {/* 3. Central 3D Perspective Objekt Carousel */}
      <CardCarousel
        left={store.leftCard()}
        center={store.activeCard()}
        right={store.rightCard()}
        flipped={store.cardFlipped()}
      />

      {/* 4. Bottom Action Buttons */}
      <BottomBar store={store} />

      {/* 5. Overlays */}
      <Show when={store.inspectOpen()}>
        <InspectModal store={store} />
      </Show>
      <Show when={store.settingsOpen()}>
        <SettingsModal store={store} />
      </Show>
    </View>
  );
}
