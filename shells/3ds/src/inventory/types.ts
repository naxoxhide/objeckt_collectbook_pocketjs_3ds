// SPDX-License-Identifier: GPL-3.0-or-later
// src/inventory/types.ts — Data types for the 3DS Objekt Inventory.

export type MemberId = "heejin" | "haseul" | "kimlip" | "jinsoul" | "choerry";

export interface MemberInfo {
  id: MemberId;
  name: string;
  koreanName: string;
  color: string;       // Hex accent color
  badgeBg: string;     // Color for member pill
  symbol: string;      // Symbol/emoji
  role: string;        // e.g. "LEADER • VOCAL"
}

export interface ObjektCard {
  id: string;
  artist: string;      // e.g. "ARTMS"
  member: string;      // e.g. "HaSeul"
  memberId: MemberId;
  season: string;      // e.g. "Atom01"
  class: string;       // e.g. "First"
  type: string;        // e.g. "Digital"
  number: string;      // e.g. "#117Z"
  information: string; // Detailed lore / description
  imageFront: string;  // e.g. "cards/haseul_atom01_117.png"
  imageBack: string;   // e.g. "cards/haseul_atom01_back.png"
  tag: string;         // e.g. "LEADER • VOCAL"
}
