// SPDX-License-Identifier: GPL-3.0-or-later
export const HOME_COLUMNS = 4;
export const HOME_PAGES = 2;
export const ICON_SIZE = 56;

const entries = [
  { name: "Today", color: "#537bf4", background: "#f7f8fc", subtitle: "THURSDAY, SEPTEMBER 17", height: 620, page: -1, slot: 0 },
  { name: "Music", color: "#f28268", background: "#fcf2ed", subtitle: "MADE FOR THIS MOMENT", height: 500, page: -1, slot: 1 },
  { name: "Places", color: "#65b4a3", background: "#f5f6ee", subtitle: "A SMALL ADVENTURE", height: 500, page: -1, slot: 2 },
  { name: "Weather", color: "#69a7d7", background: "#edf5fc", subtitle: "SAN FRANCISCO", height: 520, page: 0, slot: 0 },
  { name: "Notes", color: "#d4a444", background: "#fffbef", subtitle: "A FEW THINGS TO KEEP", height: 580, page: 0, slot: 1 },
  { name: "Photos", color: "#ac85c2", background: "#faf3fa", subtitle: "MOMENTS IN BETWEEN", height: 580, page: 0, slot: 2 },
  { name: "Mail", color: "#548fce", background: "#f4f8fc", subtitle: "A GOOD DAY TO CATCH UP", height: 620, page: 0, slot: 3 },
  { name: "Calendar", color: "#de796b", background: "#fff8f4", subtitle: "SEPTEMBER 2026", height: 600, page: 0, slot: 4 },
  { name: "Clock", color: "#555c76", background: "#f4f3f8", subtitle: "TAKE YOUR TIME", height: 550, page: 0, slot: 5 },
  { name: "Safari", color: "#609dbb", background: "#f1f7f7", subtitle: "A WINDOW TO WANDER", height: 620, page: -1, slot: 3 },
  { name: "Files", color: "#829ec8", background: "#f5f7fc", subtitle: "EVERYTHING IN ITS PLACE", height: 580, page: 0, slot: 6 },
  { name: "Settings", color: "#8a91a2", background: "#f3f4f8", subtitle: "MAKE IT YOURS", height: 650, page: 0, slot: 7 },
  { name: "Camera", color: "#859892", background: "#edf3ef", subtitle: "NOTICE THE LITTLE THINGS", height: 500, page: 1, slot: 0 },
  { name: "Health", color: "#d87e98", background: "#fff4f7", subtitle: "A LITTLE BETTER TODAY", height: 600, page: 1, slot: 1 },
  { name: "Books", color: "#c9975e", background: "#fcf5e9", subtitle: "ONE MORE CHAPTER", height: 580, page: 1, slot: 2 },
  { name: "Calculator", color: "#a38fbc", background: "#f5f1fa", subtitle: "ROOM TO WORK IT OUT", height: 450, page: 1, slot: 3 },
] as const;

export const APPS = entries.map(app => ({ ...app,
  x: 20 + app.slot % HOME_COLUMNS * 74,
  y: app.page < 0 ? 366 : 146 + Math.floor(app.slot / HOME_COLUMNS) * 92,
}));
