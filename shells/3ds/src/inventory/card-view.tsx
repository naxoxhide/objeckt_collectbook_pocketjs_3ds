// SPDX-License-Identifier: GPL-3.0-or-later
// src/inventory/card-view.tsx — 3D Perspective Objekt Carousel for 3DS.

import { Show } from "solid-js";
import { Image, Text, View } from "@pocketjs/framework/components";
import type { ObjektCard } from "./types.ts";

/** Side perspective card (left or right, tilted 3/4 toward center). */
function SideCard(props: { card: ObjektCard; side: "left" | "right" }) {
  const isLeft = props.side === "left";
  return (
    <View
      debugName={`SideCard_${props.side}`}
      class={
        isLeft
          ? "absolute left-[18] top-[64] w-[72] h-[110] items-center"
          : "absolute left-[310] top-[64] w-[72] h-[110] items-center"
      }
    >
      {/* 3D Angled Card Frame */}
      <View class="w-[70] h-[108] rounded-md overflow-hidden border border-[#2d313b] shadow-md relative bg-[#181a1f]">
        <Image src={props.card.imageFront} class="w-full h-full" />

        {/* Shading overlay to give focal depth to center card */}
        <View class="absolute inset-0 bg-black opacity-35" />

        {/* Subtle Edge light */}
        <View
          class={
            isLeft
              ? "absolute right-0 top-0 bottom-0 w-[2] bg-white opacity-25"
              : "absolute left-0 top-0 bottom-0 w-[2] bg-white opacity-25"
          }
        />
      </View>
    </View>
  );
}

/** Focal 3D Center Card (largest, sharp, showing front or back art). */
export function CenterCard(props: { card: ObjektCard; flipped: boolean }) {
  return (
    <View debugName="CenterCard" class="absolute left-[142] top-[30] w-[116] h-[178] items-center">
      {/* Main Card Chassis */}
      <View class="w-[116] h-[176] rounded-lg overflow-hidden border-2 border-black shadow-lg relative bg-[#181a1f]">
        {/* Real Objekt Image (front art or authentic back art) */}
        <Image
          src={props.flipped ? props.card.imageBack : props.card.imageFront}
          class="w-full h-full"
        />

        {/* Top gloss sheen */}
        <View class="absolute left-0 right-0 top-0 h-[2] bg-white opacity-30" />
      </View>
    </View>
  );
}

/** Complete Carousel view with Left, Center and Right cards. */
export function CardCarousel(props: {
  left: ObjektCard;
  center: ObjektCard;
  right: ObjektCard;
  flipped: boolean;
}) {
  return (
    <View debugName="CardCarousel" class="absolute left-0 right-0 top-0 bottom-0">
      <SideCard card={props.left} side="left" />
      <CenterCard card={props.center} flipped={props.flipped} />
      <SideCard card={props.right} side="right" />
    </View>
  );
}
