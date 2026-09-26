// SPDX-License-Identifier: GPL-3.0-or-later
// src/inventory/i18n.ts — Internationalization support (Spanish, English, Korean).

export type Language = "es" | "en" | "ko";

export interface Translations {
  // Navigation & Bottom Bar (Top Screen)
  settings: string;
  flip: string;
  front: string;
  inspect: string;

  // Settings Modal
  settingsTitle: string;
  settingsSub: string;
  language: string;
  clock: string;
  fps: string;
  filter: string;
  fpsVal: string;
  filterVal: string;
  exitPrompt: string;
  langHint: string;

  // Inspect Modal
  artist: string;
  season: string;
  type: string;
  information: string;
  closePrompt: string;
  classLabel: (cls: string) => string;
  tiltHint: string;
  specialFoil: string;
  inspectHelpTitle: string;
  inspectHelpDpad: string;
  inspectHelpFlip: string;
  inspectHelpClose: string;
  continuePrompt: string;

  // Bottom Screen Dossier
  specTitle: string;
  memberLabel: string;
  typeObjekt: (type: string) => string;
  noLabel: string;
  prev: string;
  next: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  es: {
    settings: "Ajustes",
    flip: "Girar",
    front: "Frente",
    inspect: "Inspeccionar",

    settingsTitle: "AJUSTES DEL SISTEMA",
    settingsSub: "3DS HARDWARE",
    language: "Idioma",
    clock: "Reloj RTC Consola",
    fps: "Refresco Pantalla",
    filter: "Filtro Texturas",
    fpsVal: "60 FPS (Citro3D)",
    filterVal: "Bilineal Activo",
    exitPrompt: "Presiona Ⓑ para salir",
    langHint: "◄ ► Cambiar Idioma",

    artist: "Artista",
    season: "Temporada",
    type: "Tipo",
    information: "Información",
    closePrompt: "Presiona Ⓑ para cerrar",
    classLabel: (cls: string) => `${cls} Class`,
    tiltHint: "D-Pad / Stick: 3D",
    specialFoil: "★ SPECIAL FOIL",
    inspectHelpTitle: "INSPECCIÓN DE OBJEKT",
    inspectHelpDpad: "Mover e inclinar en 3D",
    inspectHelpFlip: "Girar carta (Frente / Reverso)",
    inspectHelpClose: "Cerrar este modal",
    continuePrompt: "Continuar",

    specTitle: "ESPECIFICACIÓN DE OBJEKT",
    memberLabel: "Miembro",
    typeObjekt: (type: string) => `${type} Objekt`,
    noLabel: "No",
    prev: "◀ Anterior",
    next: "Siguiente ▶",
  },
  en: {
    settings: "Settings",
    flip: "Flip",
    front: "Front",
    inspect: "Inspect",

    settingsTitle: "SYSTEM SETTINGS",
    settingsSub: "3DS HARDWARE",
    language: "Language",
    clock: "Console RTC Clock",
    fps: "Screen Refresh",
    filter: "Texture Filter",
    fpsVal: "60 FPS (Citro3D)",
    filterVal: "Bilinear Active",
    exitPrompt: "Press Ⓑ to exit",
    langHint: "◄ ► Change Language",

    artist: "Artist",
    season: "Season",
    type: "Type",
    information: "Information",
    closePrompt: "Press Ⓑ to close",
    classLabel: (cls: string) => `${cls} Class`,
    tiltHint: "D-Pad / Stick: 3D",
    specialFoil: "★ SPECIAL FOIL",
    inspectHelpTitle: "OBJEKT INSPECTION",
    inspectHelpDpad: "Move & tilt in 3D",
    inspectHelpFlip: "Flip card (Front / Back)",
    inspectHelpClose: "Close this modal",
    continuePrompt: "Continue",

    specTitle: "OBJEKT SPECIFICATION",
    memberLabel: "Member",
    typeObjekt: (type: string) => `${type} Objekt`,
    noLabel: "No",
    prev: "◀ Previous",
    next: "Next ▶",
  },
  ko: {
    settings: "설정",
    flip: "회전",
    front: "앞면",
    inspect: "상세보기",

    settingsTitle: "시스템 설정",
    settingsSub: "3DS HARDWARE",
    language: "언어",
    clock: "콘솔 시계",
    fps: "화면 주사율",
    filter: "텍스처 필터",
    fpsVal: "60 FPS (Citro3D)",
    filterVal: "바이리니어 활성",
    exitPrompt: "Ⓑ 버튼을 눌러 나가기",
    langHint: "◄ ► 언어 변경",

    artist: "아티스트",
    season: "시즌",
    type: "타입",
    information: "정보",
    closePrompt: "Ⓑ 버튼을 눌러 닫기",
    classLabel: (cls: string) => cls === "Special" ? "스페셜 클래스" : "퍼스트 클래스",
    tiltHint: "D-Pad / 스틱: 3D",
    specialFoil: "★ 스페셜 포일",
    inspectHelpTitle: "3D 검사 조작 안내",
    inspectHelpDpad: "3D 기울이기 / 이동",
    inspectHelpFlip: "카드 회전 (앞면 / 뒷면)",
    inspectHelpClose: "이 창 닫기",
    continuePrompt: "계속하기",

    specTitle: "오브젝트 사양",
    memberLabel: "멤버",
    typeObjekt: (type: string) => `${type} 오브젝트`,
    noLabel: "번호",
    prev: "◀ 이전",
    next: "다음 ▶",
  },
};

/** Localized card information text by language. */
export function getLocalizedInformation(info: string, lang: Language): string {
  if (lang === "en") return info;

  // Text 1: Standard First Class info
  if (info.includes("Sold on the COSMO app shop")) {
    if (lang === "es") {
      return "Vendido en la tienda COSMO. Obsequiado en varios eventos de Discord.";
    }
    if (lang === "ko") {
      return "COSMO 앱 상점에서 판매. 디스코드 이벤트를 통해 지급됨.";
    }
  }

  // Text 2: Special Class grid completion info
  if (info.includes("completing a grid")) {
    if (lang === "es") {
      return "Obsequio por completar una cuadrícula 117-120 First Class en COSMO.";
    }
    if (lang === "ko") {
      return "COSMO에서 117-120 퍼스트 클래스 그리드 완성 시 지급.";
    }
  }

  return info;
}
