// SPDX-License-Identifier: GPL-3.0-or-later
// src/inventory/card-view.tsx — 3D Perspective Objekt Carousel for 3DS.

import { Show } from "solid-js";
import { Image, Text, View } from "@pocketjs/framework/components";
import type { ObjektCard } from "./types.ts";

/** Side card in carousel (dimmed, clean transparent rounded corners). */
function SideCard(props: { card: ObjektCard; side: "left" | "right" }) {
  const isLeft = props.side === "left";
  return (
    <View
      debugName={`SideCard_${props.side}`}
      class={
        isLeft
          ? "absolute left-[20] top-[64] w-[72] h-[110] items-center"
          : "absolute left-[308] top-[64] w-[72] h-[110] items-center"
      }
    >
      <Image
        src={props.card.imageFront}
        class="w-[72] h-[110] opacity-45"
      />
    </View>
  );
}

/** Focal Center Card (largest, sharp, clean transparent rounded corners). */
export function CenterCard(props: { card: ObjektCard; flipped: boolean }) {
  return (
    <View
      debugName="CenterCard"
      class="absolute left-[142] top-[30] w-[116] h-[178] items-center"
    >
      <Image
        src={props.flipped ? props.card.imageBack : props.card.imageFront}
        class="w-[116] h-[178]"
      />
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
