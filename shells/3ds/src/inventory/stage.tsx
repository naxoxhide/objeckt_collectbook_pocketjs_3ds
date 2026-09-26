// SPDX-License-Identifier: GPL-3.0-or-later
// src/inventory/stage.tsx — Top Screen (400x240) of the Objekt Inventory.

import { For, Show } from "solid-js";
import { Image, Text, View } from "@pocketjs/framework/components";
import { CardCarousel } from "./card-view.tsx";
import { MEMBERS } from "./data.ts";
import type { InventoryStore } from "./store.ts";

/** Calculate visual character weight: Hangul/CJK glyphs are ~1.85x wider than Latin glyphs. */
function charVisualWeight(ch: string): number {
  const code = ch.charCodeAt(0);
  if (
    (code >= 0xac00 && code <= 0xd7a3) || // Hangul Syllables
    (code >= 0x1100 && code <= 0x11ff) || // Hangul Jamo
    (code >= 0x3130 && code <= 0x318f) || // Hangul Compatibility Jamo
    (code >= 0x4e00 && code <= 0x9fff)    // CJK Unified Ideographs
  ) {
    return 1.85;
  }
  return 1.0;
}

function strVisualWidth(str: string): number {
  let w = 0;
  for (let i = 0; i < str.length; i++) {
    w += charVisualWeight(str[i]);
  }
  return w;
}

/** Utility to wrap text lines based on visual font width without cutting words. */
export function wrapText(text: string, maxVisual = 27): string[] {
  if (!text) return [];
  const paragraphs = text.split("\n");
  const lines: string[] = [];
  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/);
    let current = "";
    let currentWidth = 0;
    for (const w of words) {
      if (!w) continue;
      const wWidth = strVisualWidth(w);
      if (!current) {
        current = w;
        currentWidth = wWidth;
      } else if (currentWidth + 1 + wWidth <= maxVisual) {
        current += " " + w;
        currentWidth += 1 + wWidth;
      } else {
        lines.push(current);
        current = w;
        currentWidth = wWidth;
      }
    }
    if (current) lines.push(current);
  }
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

/** Modal Overlay: Full Inspect View showing ONLY the Objekt in large format with 3D Circle Pad tilt & Foil effect. */
function InspectModal(props: { store: InventoryStore }) {
  const card = () => props.store.activeCard();
  const member = () => props.store.activeMember();
  const isSpecial = () => card().class === "Special";
  const t = props.store.t;

  // Holographic Foil Dynamic Lighting & Polar Tilt (Adapted from simeydotme/hover-tilt)
  // 1. Normalized delta coordinates (-1 to 1) from 3D tilt
  const normX = () => props.store.tiltY() / 20; // right positive
  const normY = () => -props.store.tiltX() / 20; // up positive

  // 2. Distance from center (0 to 1)
  const tiltDistance = () => Math.min(1, Math.hypot(normX(), normY()));

  // 3. Incident light angle in degrees (0 to 360, 0deg = top/up, clockwise)
  const lightAngle = () => {
    const x = normX();
    const y = normY();
    if (Math.abs(x) < 0.01 && Math.abs(y) < 0.01) return 180;
    let deg = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (deg < 0) deg += 360;
    return deg;
  };

  // 4. Dynamic elevation on tilt (translateZ from 15px resting up to 24px on tilt)
  const dynamicZ = () => 15 + tiltDistance() * 9;

  // 5. Polar sweep for Special Class foil textures:
  // Layer A reflects when tilted left/up; Layer B reflects when tilted right/down
  const foilOpacityA = () => {
    const dist = tiltDistance();
    const rad = (lightAngle() * Math.PI) / 180;
    const projection = Math.sin(rad); // +1 when light is pointing to right, -1 to left
    const factor = Math.max(0.08, 0.5 - projection * 0.5); // high when tilted left
    return 0.28 + dist * 0.58 * factor;
  };

  const foilOpacityB = () => {
    const dist = tiltDistance();
    const rad = (lightAngle() * Math.PI) / 180;
    const projection = Math.sin(rad);
    const factor = Math.max(0.08, 0.5 + projection * 0.5); // high when tilted right
    return 0.28 + dist * 0.58 * factor;
  };

  // 6. Specular Glare Hotspot (Adapted from pokemon-cards-css .card__glare)
  // Glare position moves smoothly across the card face with tilt
  const glareX = () => normX() * 14;
  const glareY = () => normY() * 20;
  // Fresnel reflectance curve: subtle at rest (~0.10), flaring up to ~0.55 at maximum tilt
  const glareOpacity = () => 0.10 + tiltDistance() * 0.45;

  const closeLabel = () => {
    const lang = props.store.lang();
    if (lang === "es") return "Cerrar";
    if (lang === "ko") return "닫기";
    return "Close";
  };

  return (
    <View
      debugName="InspectModalBackdrop"
      class="absolute left-0 top-0 w-[400] h-[240] bg-[#000000ea] z-50 overflow-hidden"
    >
      {/* 1. Header Information Pill (Top Left: Member & Card Number) */}
      <View class="absolute left-3 top-2.5 h-[20] px-2.5 rounded-[10] bg-black border border-white flex-row items-center gap-1.5 shadow z-20">
        <View
          class="w-[8] h-[8] rounded-full"
          style={{ bgColor: member().color }}
        />
        <Text class="text-xs font-bold text-white">
          {props.store.lang() === "ko" ? member().koreanName : card().member} {card().number}
        </Text>
      </View>

      {/* 2. Header Badge (Top Right: Special Class / Class) */}
      <View class="absolute right-3 top-2.5 h-[20] px-2.5 rounded-[10] border border-white items-center justify-center shadow z-20 overflow-hidden">
        <Show
          when={isSpecial()}
          fallback={<View class="absolute inset-0 bg-black" />}
        >
          {/* Holographic Prismatic Background */}
          <Image
            src="cards/badge_holo.png"
            class="absolute inset-0 w-full h-full"
          />
        </Show>
        {/* Class Title with High Legibility */}
        <Text
          class={
            isSpecial()
              ? "text-xs font-bold text-black z-10"
              : "text-xs font-bold text-white z-10"
          }
        >
          {t().classLabel(card().class)}
        </Text>
      </View>

      {/* 3. Centered Large Objekt (3D Tilt Perspective Context) */}
      <View
        debugName="Card3DViewport"
        class="absolute left-[141] top-[29] w-[118] h-[182] items-center justify-center"
        style={{ perspective: 520 }}
      >
        <View
          class="w-full h-full items-center justify-center"
          style={{
            rotateX: props.store.tiltX(),
            rotateY: props.store.tiltY(),
            translateZ: dynamicZ(),
          }}
        >
          {/* Card Container with clean transparent rounded corners */}
          <View class="w-[118] h-[182] relative">
            {/* Real Objekt Image (front or back art) */}
            <Image
              src={props.store.cardFlipped() ? card().imageBack : card().imageFront}
              class="w-full h-full"
            />

            {/* Special Class Holographic Foil Texture Layers (Native GPU Additive Blending) */}
            <Show when={isSpecial()}>
              {/* Foil Layer A: Left-biased Prismatic Rainbow Sheen & Cosmos 4-Point Starbursts */}
              <Image
                src="cards/foil_holo_a.png"
                class="w-full h-full absolute inset-0"
                style={{
                  opacity: foilOpacityA(),
                }}
              />

              {/* Foil Layer B: Right-biased Prismatic Rainbow Sheen & Cosmos 4-Point Starbursts */}
              <Image
                src="cards/foil_holo_b.png"
                class="w-full h-full absolute inset-0"
                style={{
                  opacity: foilOpacityB(),
                }}
              />

              {/* Specular Glare: Dynamic Moving Light Hotspot (.card__glare from pokemon-cards-css) */}
              <Image
                src="cards/foil_glare.png"
                class="w-full h-full absolute inset-0"
                style={{
                  translateX: glareX(),
                  translateY: glareY(),
                  opacity: glareOpacity(),
                }}
              />
            </Show>
          </View>
        </View>
      </View>

      {/* 4. Bottom Close Button (Centered 2D Overlay, perfectly legible B badge) */}
      <View class="absolute left-0 right-0 bottom-2.5 items-center justify-center z-20">
        <View
          class="h-[20] px-3 rounded-[10] bg-white border border-gray-400 flex-row items-center gap-1.5 shadow"
          onPress={() => props.store.setInspectOpen(false)}
        >
          <View class="w-[12] h-[12] rounded-full bg-black items-center justify-center">
            <Text class="text-xs font-bold text-white">B</Text>
          </View>
          <Text class="text-xs font-bold text-black">
            {closeLabel()}
          </Text>
        </View>
      </View>

      {/* 5. Initial Instructions Modal Dialog (Compact 264px centered overlay) */}
      <Show when={props.store.inspectHelpOpen()}>
        <View
          debugName="InspectHelpOverlay"
          class="absolute left-0 top-0 w-[400] h-[240] bg-[#000000bd] flex-col items-center justify-center z-50"
          onPress={() => props.store.dismissInspectHelp()}
        >
          {/* Centered Dialog Box */}
          <View
            class="w-[264] rounded-lg bg-[#181a20] border-2 border-[#10b981] p-3 flex-col gap-2 shadow-lg"
          >
            {/* Header */}
            <View class="flex-row items-center justify-between pb-1">
              <View class="flex-row items-center gap-1.5">
                <View class="w-[8] h-[8] rounded-full bg-[#10b981]" />
                <Text class="text-xs font-bold text-white tracking-wide">
                  {t().inspectHelpTitle}
                </Text>
              </View>
              <View class="px-1.5 py-0.5 rounded bg-[#10b981] items-center justify-center">
                <Text class="text-xs font-mono font-bold text-black">3DS</Text>
              </View>
            </View>

            {/* Divider Line */}
            <View class="w-full h-[1] bg-gray-700" />

            {/* Indicación 1: D-Pad / Stick */}
            <View class="flex-row items-center gap-2 py-0.5">
              <View class="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-600 items-center justify-center">
                <Text class="text-xs font-mono font-bold text-[#10b981]">D-Pad / Stick</Text>
              </View>
              <Text class="text-xs text-gray-200">
                {t().inspectHelpDpad}
              </Text>
            </View>

            {/* Indicación 2: Botón Y */}
            <View class="flex-row items-center gap-2 py-0.5">
              <View class="w-[14] h-[14] rounded-full bg-white items-center justify-center">
                <Text class="text-xs font-bold text-black">Y</Text>
              </View>
              <Text class="text-xs text-gray-200">
                {t().inspectHelpFlip}
              </Text>
            </View>

            {/* Indicación 3: Botón B */}
            <View class="flex-row items-center gap-2 py-0.5">
              <View class="w-[14] h-[14] rounded-full bg-white items-center justify-center">
                <Text class="text-xs font-bold text-black">B</Text>
              </View>
              <Text class="text-xs text-gray-200">
                {t().inspectHelpClose}
              </Text>
            </View>

            {/* Botón de acción: Continuar (Ⓑ) */}
            <View
              class="mt-1 h-[22] rounded bg-[#10b981] items-center justify-center flex-row gap-1.5 shadow"
              onPress={() => props.store.dismissInspectHelp()}
            >
              <View class="w-[12] h-[12] rounded-full bg-black items-center justify-center">
                <Text class="text-xs font-bold text-white">B</Text>
              </View>
              <Text class="text-xs font-bold text-black">
                {t().continuePrompt}
              </Text>
            </View>
          </View>
        </View>
      </Show>
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
          <View class="flex-row items-center justify-between pb-1">
            <Text class="text-sm font-bold text-white">{t().settingsTitle}</Text>
            <Text class="text-xs font-mono font-bold text-[#10b981]">{t().settingsSub}</Text>
          </View>
          <View class="w-full h-[1] bg-gray-700" />

          {/* Language Selector Row */}
          <View class="flex-row items-center justify-between py-1">
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
          <View class="w-full h-[1] bg-gray-800" />

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
        <View class="flex-col gap-1.5">
          <View class="w-full h-[1] bg-gray-700" />
          <View class="flex-row items-center justify-between">
            <Text class="text-xs text-gray-400">{t().langHint}</Text>
            <Text class="text-xs font-bold text-white">{t().exitPrompt}</Text>
          </View>
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
