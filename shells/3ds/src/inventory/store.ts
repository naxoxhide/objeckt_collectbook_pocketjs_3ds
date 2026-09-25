// SPDX-License-Identifier: GPL-3.0-or-later
// src/inventory/store.ts — State and Input Loop for the 3DS Objekt Inventory.

import { createMemo, createSignal } from "solid-js";
import { BTN } from "@pocketjs/framework/input";
import { analogX, onFrame } from "@pocketjs/framework/lifecycle";
import { civilFromEpoch, detectOffsetMinutes } from "../shell.ts";
import { MEMBERS, OBJEKTS } from "./data.ts";
import { TRANSLATIONS, getLocalizedInformation, type Language, type Translations } from "./i18n.ts";
import type { MemberInfo, ObjektCard } from "./types.ts";

export interface InventoryStore {
  // Localization
  lang: () => Language;
  setLang: (lang: Language) => void;
  cycleLang: (dir: number) => void;
  t: () => Translations;
  localizedInfo: (info: string) => string;

  // Navigation signals
  memberIdx: () => number;
  setMemberIdx: (idx: number) => void;
  nextMember: () => void;
  prevMember: () => void;

  cardIdx: () => number;
  setCardIdx: (idx: number) => void;
  nextCard: () => void;
  prevCard: () => void;

  // Active items
  activeMember: () => MemberInfo;
  memberCards: () => ObjektCard[];
  activeCard: () => ObjektCard;
  leftCard: () => ObjektCard;
  rightCard: () => ObjektCard;

  // Overlays / Views
  inspectOpen: () => boolean;
  setInspectOpen: (open: boolean) => void;
  toggleInspect: () => void;

  settingsOpen: () => boolean;
  setSettingsOpen: (open: boolean) => void;
  toggleSettings: () => void;

  cardFlipped: () => boolean;
  toggleFlip: () => void;

  // Console hardware indicators
  timeStr: () => string;
  batteryStr: () => string;
  wifiStatus: () => string;

  // Touch feedback
  lastAction: () => string;
}

export function createInventoryStore(): InventoryStore {
  // Always start in Spanish ("es")
  const [lang, setLang] = createSignal<Language>("es");
  const LANGS: Language[] = ["es", "en", "ko"];

  function cycleLang(dir: number) {
    const cur = LANGS.indexOf(lang());
    const next = (cur + dir + LANGS.length) % LANGS.length;
    setLang(LANGS[next]);
  }

  const t = createMemo(() => TRANSLATIONS[lang()]);
  const localizedInfo = (info: string) => getLocalizedInformation(info, lang());

  // Default to HaSeul (index 1: HeeJin=0, HaSeul=1, Kim Lip=2, JinSoul=3, Choerry=4)
  const [memberIdx, setMemberIdxRaw] = createSignal(1);
  const [cardIdx, setCardIdx] = createSignal(0);
  const [inspectOpen, setInspectOpen] = createSignal(false);
  const [settingsOpen, setSettingsOpen] = createSignal(false);
  const [cardFlipped, setCardFlipped] = createSignal(false);
  const [lastAction, setLastAction] = createSignal("Ready");

  // Filter cards by active member
  const activeMember = createMemo(() => MEMBERS[memberIdx()] ?? MEMBERS[0]);
  const memberCards = createMemo(() => {
    const mId = activeMember().id;
    const filtered = OBJEKTS.filter((c) => c.memberId === mId);
    return filtered.length > 0 ? filtered : [OBJEKTS[0]];
  });

  const activeCard = createMemo(() => {
    const list = memberCards();
    return list[cardIdx() % list.length] ?? list[0];
  });

  // Left card (previous in carousel)
  const leftCard = createMemo(() => {
    const list = memberCards();
    const len = list.length;
    const idx = (cardIdx() - 1 + len) % len;
    return list[idx];
  });

  // Right card (next in carousel)
  const rightCard = createMemo(() => {
    const list = memberCards();
    const len = list.length;
    const idx = (cardIdx() + 1) % len;
    return list[idx];
  });

  const setMemberIdx = (idx: number) => {
    const total = MEMBERS.length;
    const clamped = ((idx % total) + total) % total;
    setMemberIdxRaw(clamped);
    setCardIdx(0); // reset card index on member change
    setCardFlipped(false);
    setLastAction(`Member: ${MEMBERS[clamped].name}`);
  };

  const nextMember = () => setMemberIdx(memberIdx() + 1);
  const prevMember = () => setMemberIdx(memberIdx() - 1);

  const setCardIdxSafe = (idx: number) => {
    const len = memberCards().length;
    if (len === 0) return;
    const wrapped = ((idx % len) + len) % len;
    setCardIdx(wrapped);
    setCardFlipped(false);
    setLastAction(`Objekt: ${memberCards()[wrapped]?.number}`);
  };

  const nextCard = () => setCardIdxSafe(cardIdx() + 1);
  const prevCard = () => setCardIdxSafe(cardIdx() - 1);

  const toggleInspect = () => {
    if (settingsOpen()) setSettingsOpen(false);
    setInspectOpen(!inspectOpen());
    setLastAction(inspectOpen() ? "Inspect Mode" : "Objekt Carousel");
  };

  const toggleSettings = () => {
    if (inspectOpen()) setInspectOpen(false);
    setSettingsOpen(!settingsOpen());
    setLastAction(settingsOpen() ? "Settings" : "Objekt Carousel");
  };

  const toggleFlip = () => {
    setCardFlipped(!cardFlipped());
    setLastAction(cardFlipped() ? "Back Art" : "Front Art");
  };

  // 3DS RTC Clock reading
  const offsetMinutes = detectOffsetMinutes(Date.now(), new Date());
  const [timeStr, setTimeStr] = createSignal("19:36");

  // Input polling state
  let lastButtons = 0;
  let analogCooldown = 0;
  let frameCount = 0;

  onFrame((buttons: number) => {
    frameCount++;

    // 1. Edge-triggered button detection
    const pressed = buttons & ~lastButtons;
    lastButtons = buttons;

    // 2. Clock update every ~60 frames
    if (frameCount % 60 === 0) {
      const civil = civilFromEpoch(Date.now(), offsetMinutes);
      const h = String(civil.hour).padStart(2, "0");
      const m = String(civil.minute).padStart(2, "0");
      setTimeStr(`${h}:${m}`);
    }

    // 3. Circle Pad analog left/right with dead-zone and cooldown
    const stickX = analogX();
    if (analogCooldown > 0) {
      analogCooldown--;
    } else if (Math.abs(stickX) > 0.55) {
      if (stickX > 0) nextCard();
      else prevCard();
      analogCooldown = 15; // wait 15 frames (~250ms) before repeating
    }

    // Modal-specific input handling:
    if (settingsOpen()) {
      if (pressed & (BTN.LEFT | BTN.LTRIGGER)) {
        cycleLang(-1);
        return;
      }
      if (pressed & (BTN.RIGHT | BTN.RTRIGGER | BTN.CIRCLE)) {
        cycleLang(1);
        return;
      }
      if (pressed & (BTN.CROSS | BTN.SQUARE)) {
        setSettingsOpen(false);
        return;
      }
      return;
    }

    if (inspectOpen()) {
      if (pressed & (BTN.CROSS | BTN.TRIANGLE)) {
        setInspectOpen(false);
        return;
      }
      return;
    }

    // 4. L and R Shoulder Buttons -> Switch Member
    if (pressed & BTN.LTRIGGER) {
      prevMember();
      return;
    }
    if (pressed & BTN.RTRIGGER) {
      nextMember();
      return;
    }

    // 5. D-Pad Left / Right -> Immediately browse Objekts (updates bottom screen)
    if (pressed & BTN.LEFT) {
      prevCard();
      return;
    }
    if (pressed & BTN.RIGHT) {
      nextCard();
      return;
    }

    // 6. X Button (BTN.TRIANGLE on 3DS host) -> Inspect Objekt
    if (pressed & BTN.TRIANGLE) {
      toggleInspect();
      return;
    }

    // 7. Y Button (BTN.SQUARE on 3DS host) -> Settings
    if (pressed & BTN.SQUARE) {
      toggleSettings();
      return;
    }

    // 8. B Button (BTN.CROSS on 3DS host) -> Flip Objekt / Close modal
    if (pressed & BTN.CROSS) {
      toggleFlip();
      return;
    }

    // 9. A Button (BTN.CIRCLE on 3DS host) -> Optional Inspect toggle
    if (pressed & BTN.CIRCLE) {
      toggleInspect();
      return;
    }
  });

  return {
    lang,
    setLang,
    cycleLang,
    t,
    localizedInfo,
    memberIdx,
    setMemberIdx,
    nextMember,
    prevMember,
    cardIdx,
    setCardIdx: setCardIdxSafe,
    nextCard,
    prevCard,
    activeMember,
    memberCards,
    activeCard,
    leftCard,
    rightCard,
    inspectOpen,
    setInspectOpen,
    toggleInspect,
    settingsOpen,
    setSettingsOpen,
    toggleSettings,
    cardFlipped,
    toggleFlip,
    timeStr,
    batteryStr: () => "100%",
    wifiStatus: () => "connected",
    lastAction,
  };
}
