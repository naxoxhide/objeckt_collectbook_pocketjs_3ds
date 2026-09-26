// SPDX-License-Identifier: GPL-3.0-or-later
// src/inventory/store.ts — State and Input Loop for the 3DS Objekt Inventory.

import { createMemo, createSignal } from "solid-js";
import { BTN } from "@pocketjs/framework/input";
import { analogX, analogY, onFrame } from "@pocketjs/framework/lifecycle";
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
  inspectHelpOpen: () => boolean;
  setInspectHelpOpen: (open: boolean) => void;
  dismissInspectHelp: () => void;

  settingsOpen: () => boolean;
  setSettingsOpen: (open: boolean) => void;
  toggleSettings: () => void;

  cardFlipped: () => boolean;
  toggleFlip: () => void;

  // 3D Circle Pad tilt and foil shimmer
  tiltX: () => number;
  tiltY: () => number;
  shimmerTick: () => number;

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
  const [inspectHelpOpen, setInspectHelpOpen] = createSignal(false);
  const [settingsOpen, setSettingsOpen] = createSignal(false);
  const [cardFlipped, setCardFlipped] = createSignal(false);
  const [lastAction, setLastAction] = createSignal("Ready");

  // 3D Circle Pad / D-Pad tilt and foil shimmer (Spring-damper physics inspired by hover-tilt)
  const [tiltX, setTiltX] = createSignal(0);
  const [tiltY, setTiltY] = createSignal(0);
  const [shimmerTick, setShimmerTick] = createSignal(0);
  let velTiltX = 0;
  let velTiltY = 0;

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

  const dismissInspectHelp = () => setInspectHelpOpen(false);

  const toggleInspect = () => {
    if (settingsOpen()) setSettingsOpen(false);
    const next = !inspectOpen();
    setInspectOpen(next);
    setInspectHelpOpen(next);
    setLastAction(next ? "Inspect Mode" : "Objekt Carousel");
  };

  const setInspectOpenSafe = (open: boolean) => {
    if (settingsOpen()) setSettingsOpen(false);
    setInspectOpen(open);
    setInspectHelpOpen(open);
    setLastAction(open ? "Inspect Mode" : "Objekt Carousel");
  };

  const toggleSettings = () => {
    if (inspectOpen()) {
      setInspectOpen(false);
      setInspectHelpOpen(false);
    }
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

    // 3. Circle Pad analog + D-Pad handling (Spring-damper physics inspired by hover-tilt)
    if (inspectOpen()) {
      let ax = analogX(); // -1..1 (left/right)
      let ay = analogY(); // -1..1 (up/down; down positive)

      // D-Pad vector normalization for smooth diagonals (hover-tilt normalized coordinates)
      let dpadX = 0;
      let dpadY = 0;
      if (buttons & BTN.LEFT) dpadX -= 1;
      if (buttons & BTN.RIGHT) dpadX += 1;
      if (buttons & BTN.UP) dpadY -= 1;
      if (buttons & BTN.DOWN) dpadY += 1;

      if (dpadX !== 0 || dpadY !== 0) {
        const len = Math.hypot(dpadX, dpadY);
        ax = dpadX / len;
        ay = dpadY / len;
      }

      // Max tilt angle (degrees)
      const MAX_TILT = 20;
      const targetTiltX = -ay * MAX_TILT;
      const targetTiltY = ax * MAX_TILT;

      // Spring-damper physics model (Hooke's law with damping factor)
      // Produces subtle elastic overshoot on release and organic responsiveness
      const stiffness = 0.20;
      const damping = 0.72;

      const forceX = (targetTiltX - tiltX()) * stiffness;
      velTiltX = (velTiltX + forceX) * damping;
      const nextX = tiltX() + velTiltX;
      setTiltX(Math.abs(nextX) < 0.02 && Math.abs(velTiltX) < 0.02 ? 0 : nextX);

      const forceY = (targetTiltY - tiltY()) * stiffness;
      velTiltY = (velTiltY + forceY) * damping;
      const nextY = tiltY() + velTiltY;
      setTiltY(Math.abs(nextY) < 0.02 && Math.abs(velTiltY) < 0.02 ? 0 : nextY);

      setShimmerTick((prev) => (prev + 1) % 360);
    } else {
      // Re-center spring physics when outside inspect mode
      if (tiltX() !== 0 || tiltY() !== 0 || velTiltX !== 0 || velTiltY !== 0) {
        velTiltX = (velTiltX - tiltX() * 0.20) * 0.72;
        velTiltY = (velTiltY - tiltY() * 0.20) * 0.72;
        const nextX = tiltX() + velTiltX;
        const nextY = tiltY() + velTiltY;
        setTiltX(Math.abs(nextX) < 0.02 && Math.abs(velTiltX) < 0.02 ? 0 : nextX);
        setTiltY(Math.abs(nextY) < 0.02 && Math.abs(velTiltY) < 0.02 ? 0 : nextY);
      }
      // Circle Pad analog left/right with dead-zone and cooldown for carousel
      const stickX = analogX();
      if (analogCooldown > 0) {
        analogCooldown--;
      } else if (Math.abs(stickX) > 0.55) {
        if (stickX > 0) nextCard();
        else prevCard();
        analogCooldown = 15; // wait 15 frames (~250ms) before repeating
      }
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
      // If initial instructions modal is visible:
      if (inspectHelpOpen()) {
        // Pressing B (BTN.CROSS) or A (BTN.CIRCLE) closes the initial instructions modal
        if (pressed & (BTN.CROSS | BTN.CIRCLE)) {
          dismissInspectHelp();
          return;
        }
        // Pressing X (BTN.TRIANGLE) closes inspect completely
        if (pressed & BTN.TRIANGLE) {
          setInspectOpenSafe(false);
          return;
        }
        return;
      }

      // Initial modal dismissed -> large Objekt 3D inspect view:
      // Y button (BTN.SQUARE) flips card
      if (pressed & BTN.SQUARE) {
        toggleFlip();
        return;
      }
      // B button (BTN.CROSS) or X button (BTN.TRIANGLE) closes Inspect mode
      if (pressed & (BTN.CROSS | BTN.TRIANGLE)) {
        setInspectOpenSafe(false);
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
    setInspectOpen: setInspectOpenSafe,
    toggleInspect,
    inspectHelpOpen,
    setInspectHelpOpen,
    dismissInspectHelp,
    settingsOpen,
    setSettingsOpen,
    toggleSettings,
    cardFlipped,
    toggleFlip,
    tiltX,
    tiltY,
    shimmerTick,
    timeStr,
    batteryStr: () => "100%",
    wifiStatus: () => "connected",
    lastAction,
  };
}
