// SPDX-License-Identifier: GPL-3.0-or-later
import { describe, expect, test } from "bun:test";
import { APPS, HOME_COLUMNS, HOME_PAGES } from "../src/catalog.ts";
import { Navigation, WIDTH, type Contact } from "../src/navigation.ts";

const touch = (x: number, y = 190, vx = 0, id = 0): Contact => ({ id, x, y, vx, vy: 0 });
const settle = (n: Navigation) => { for (let i = 0; i < 120; i++) n.step(1 / 60); };
function home() {
  const n = new Navigation();
  expect(n.destination).toBe("home");
  return n;
}
function page(n: Navigation, x0: number, x1: number, vx = 0) {
  n.down(touch(x0)); n.move(touch(x1), 1 / 60); n.up(touch(x1, 190, vx));
}

describe("SpringBoard home pages", () => {
  test("cold launch starts settled on the first Home page at every viewport", () => {
    for (const [width, height] of [[320, 480], [360, 640], [640, 360]]) {
      const n = new Navigation(width, height);
      expect(n.destination).toBe("home"); expect(n.homePage.value).toBe(0);
      expect(n.scene.value).toBe(n.scene.target);
      expect(n.cards.every(c => c.visibility.value === 0 && c.visibility.target === 0)).toBe(true);
      expect(n.actions).toBe(0); expect(n.lastAction).toBe("ready");
      const before = n.cards.map(c => [c.x.value, c.y.value, c.scale.value]);
      settle(n);
      expect(n.cards.map(c => [c.x.value, c.y.value, c.scale.value])).toEqual(before);
      const icon = n.layout.icon(1);
      n.down(touch(icon.x + 28, icon.y + 28)); n.up(touch(icon.x + 28, icon.y + 28)); settle(n);
      expect(n.destination).toBe("app"); expect(n.selected).toBe(1);
    }
  });

  test("four-column rows and a four-icon dock have disjoint hit targets on both pages", () => {
    expect(HOME_COLUMNS).toBe(4); expect(HOME_PAGES).toBe(2);
    expect(APPS.filter(app => app.page < 0)).toHaveLength(4);
    for (let p = 0; p < HOME_PAGES; p++) {
      const n = home(); n.homePage.value = n.homePage.target = p;
      const icons = APPS.filter(app => app.page === p);
      expect(icons.length).toBeGreaterThanOrEqual(4);
      for (const y of new Set(icons.map(app => app.y))) expect(icons.filter(app => app.y === y)).toHaveLength(4);
      APPS.forEach((app, i) => {
        if (app.page < 0 || app.page === p) expect(n.hitHomeIcon(app.x + 28, app.y + 28)).toBe(i);
      });
      for (const x of [83, 157, 231]) expect(n.hitHomeIcon(x, 170)).toBe(-1);
    }
  });

  test("the page follows horizontal input while the dock, windows and vertical coordinate stay fixed", () => {
    const n = home(), dock = APPS.map((app, i) => app.page < 0 ? n.iconX(i) : null);
    const cards = n.cards.map(c => [c.x.value, c.y.value, c.scale.value]);
    n.down(touch(280));
    for (const x of [270, 220, 160, 80, 130]) {
      n.move(touch(x, 190), 1 / 60); n.step(1 / 60);
      expect(n.homePage.value * WIDTH).toBeCloseTo(280 - x - 6, 8);
      expect(APPS.map((app, i) => app.page < 0 ? n.iconX(i) : null)).toEqual(dock);
      expect(n.cards.map(c => [c.x.value, c.y.value, c.scale.value])).toEqual(cards);
    }
    const held = n.homePage.value;
    n.move(touch(130, 80), 1 / 60); n.step(1 / 60);
    expect(n.homePage.value).toBe(held);
    const before = n.homePage.value;
    n.up(touch(130, 80, -600));
    expect(n.homePage.value).toBe(before);
    settle(n); expect(n.homePage.value).toBe(1); expect(n.destination).toBe("home");
  });

  test("travel and release velocity select a page without moving it at release", () => {
    for (const [distance, vx, target] of [[70, 0, 0], [190, 0, 1], [50, -900, 1]]) {
      const n = home(); page(n, 280, 280 - distance, vx);
      const released = n.homePage.value;
      expect(released).toBeCloseTo((distance - 6) / WIDTH, 8);
      expect(n.homePage.target).toBe(target);
      settle(n); expect(n.homePage.value).toBe(target);
      expect(n.destination).toBe("home");
    }
  });

  test("reversal, cancellation and a second finger cannot launch an icon or change the retained page", () => {
    for (const cancel of [false, true]) {
      const n = home(), recent = [...n.opened];
      n.down(touch(270, 170)); n.move(touch(50, 170), 1 / 60);
      expect(n.down(touch(30, 170, 0, 1))).toBeNull();
      n.move(touch(20, 170, 0, 1), 1 / 60); n.up(touch(20, 170, 0, 1));
      if (!cancel) n.move(touch(267, 170), 1 / 60);
      const pose = n.homePage.value;
      n.up(touch(cancel ? 50 : 267, 170), cancel);
      expect(n.homePage.value).toBe(pose);
      settle(n); expect(n.homePage.value).toBe(0);
      expect(n.destination).toBe("home"); expect(n.opened).toEqual(recent);
    }
  });

  test("edge resistance is bounded and an overshooting spring can be caught without a jump", () => {
    const n = home(); n.down(touch(80));
    n.move(touch(300), 1 / 60);
    expect(n.homePage.value).toBeLessThan(0);
    expect(n.homePage.value).toBeGreaterThan(-90 / WIDTH);
    n.up(touch(300, 190, 700)); n.step(1 / 60);
    const caught = n.homePage.value;
    n.down(touch(210)); n.move(touch(210), 1 / 60); n.step(1 / 60);
    expect(n.homePage.value).toBe(caught);
    n.move(touch(204), 1 / 60); n.step(1 / 60);
    expect(n.homePage.value).toBeCloseTo(caught, 8);
    n.up(touch(204), true); settle(n); expect(n.homePage.value).toBe(0);
    page(n, 280, 40); settle(n);
    n.down(touch(280)); n.move(touch(40), 1 / 60);
    expect(n.homePage.value).toBeGreaterThan(1);
    expect(n.homePage.value).toBeLessThan(1 + 90 / WIDTH);
    n.up(touch(40)); settle(n); expect(n.homePage.value).toBe(1);
  });

  test("catching a fast outward fling at either edge keeps the displayed pose", () => {
    for (const start of [0, 1]) for (const speed of [2000, 3000, 6000]) {
      const n = home(), direction = start === 0 ? 1 : -1;
      n.homePage.value = n.homePage.target = start;
      n.down(touch(160)); n.move(touch(160 + direction * 140), 1 / 60);
      n.up(touch(160 + direction * 140, 190, direction * speed));
      for (let i = 0; i < 3; i++) n.step(1 / 60);
      const caught = n.homePage.value;
      n.down(touch(160)); n.move(touch(160 + direction * 6.001), 1 / 60);
      expect(Math.abs(n.homePage.value - caught) * WIDTH).toBeLessThan(0.002);
      n.move(touch(160 - direction * 7), 1 / 60);
      expect(Math.abs(n.homePage.value - caught) * WIDTH).toBeLessThan(1);
      expect(Math.sign(n.homePage.value - caught)).toBe(direction);
      n.up(touch(160 - direction * 7), true); settle(n);
      expect(n.homePage.value).toBe(start);
    }
  });

  test("a settling page can be caught, tapped at its displayed position, and return to the icon's page", () => {
    const n = home(); page(n, 280, 40); n.step(1 / 60);
    const held = n.homePage.value, index = 12;
    const x = n.iconX(index) + 28, y = APPS[index].y + 28;
    expect(x).toBeGreaterThan(0); expect(x).toBeLessThan(320);
    n.down(touch(x, y)); n.step(1 / 60);
    expect(n.homePage.value).toBe(held);
    n.up(touch(x, y));
    expect(n.selected).toBe(index);
    expect(n.cards[index].x.value).toBeCloseTo(x - 28, 8);
    settle(n); expect(n.homePage.value).toBe(1);
    n.down(touch(160, 466)); n.move(touch(160, 425), 1 / 60); n.up(touch(160, 425)); settle(n);
    expect(n.homePage.value).toBe(1);
    expect(n.cards[index].x.value).toBe(APPS[index].x);
  });

  test("vertical Home drags do not page, and the bottom bar keeps its switcher gesture on page two", () => {
    const n = home(); n.down(touch(200, 180)); n.move(touch(200, 100), 1 / 60); n.move(touch(70, 100), 1 / 60); n.up(touch(70, 100)); settle(n);
    expect(n.homePage.value).toBe(0); expect(n.destination).toBe("home");
    page(n, 280, 40); settle(n);
    expect(n.down(touch(160, 466))).toBe("reveal");
    n.move(touch(160, 360), 1 / 60); n.up(touch(160, 360)); settle(n);
    expect(n.destination).toBe("switcher"); expect(n.homePage.value).toBe(1);
  });

  test("spring timing and page choice agree across refresh rates", () => {
    const samples = [30, 60, 120].map(hz => {
      const n = home(); n.down(touch(280));
      for (let f = 1; f <= hz / 2; f++) n.move(touch(280 - 240 * f / (hz / 2)), 1 / hz);
      const release = n.homePage.value; n.up(touch(40, 190, -480));
      expect(n.homePage.value).toBe(release);
      for (let f = 0; f < hz / 2; f++) n.step(1 / hz);
      return n.homePage.value;
    });
    expect(samples[0]).toBeCloseTo(samples[1], 6); expect(samples[1]).toBeCloseTo(samples[2], 6);
  });

  test("Home reveal returns to the most recent app after browsing without opening another card", () => {
    for (const recent of [0, 1, 12, 14]) {
      const n = home(); n.open(recent); settle(n);
      n.down(touch(160, 466)); n.move(touch(160, 425), 1 / 60); n.up(touch(160, 425)); settle(n);
      n.down(touch(160, 466)); n.move(touch(160, 365), 1 / 60); n.up(touch(160, 365)); settle(n);
      const order = [...n.opened];
      n.down(touch(160, 220)); n.move(touch(300, 220), 1 / 60); n.up(touch(300, 220)); settle(n);
      expect(n.selected).not.toBe(recent);
      expect(n.opened).toEqual(order);
      n.down(touch(310, 425)); n.up(touch(310, 425)); settle(n);
      expect(n.destination).toBe("home");
      n.down(touch(160, 466)); n.move(touch(160, 365), 1 / 60);
      expect(n.selected).toBe(recent);
      const release = n.cards.map(c => [c.x.value, c.y.value, c.scale.value]);
      n.up(touch(160, 365));
      expect(n.cards.map(c => [c.x.value, c.y.value, c.scale.value])).toEqual(release);
      settle(n);
      expect(n.opened).toEqual(order);
      expect(n.opened.at(-1)).toBe(recent);
      expect(n.deck.value).toBe(n.opened.length - 1);
      expect(n.cards[recent].x.value).toBeCloseTo((320 - 320 * 0.64) / 2, 8);
      for (const i of n.opened.slice(0, -1)) expect(n.cards[i].x.value).toBeLessThan(n.cards[recent].x.value);
    }
  });

  test("a switcher app from another Home page minimizes inside the retained page", () => {
    for (const [homePage, index] of [[0, 12], [0, 14], [1, 3], [1, 7]]) {
      const n = home(); n.homePage.value = n.homePage.target = homePage;
      n.down(touch(160, 466)); n.move(touch(160, 365), 1 / 60); n.up(touch(160, 365)); settle(n);
      n.open(index); settle(n);
      expect(n.homePage.value).toBe(homePage);
      n.down(touch(160, 466)); n.move(touch(160, 425), 1 / 60);
      const release = [n.cards[index].x.value, n.cards[index].y.value, n.cards[index].scale.value];
      n.up(touch(160, 425));
      expect([n.cards[index].x.value, n.cards[index].y.value, n.cards[index].scale.value]).toEqual(release);
      expect(n.cards[index].x.target + 28).toBe(160);
      expect(n.cards[index].y.target + 42).toBeGreaterThan(100);
      expect(n.cards[index].y.target + 42).toBeLessThan(240);
      settle(n);
      expect(n.homePage.value).toBe(homePage);
      expect(n.cards[index].visibility.value).toBe(0);
      expect(n.cards[index].x.value).toBe(132);
      expect(n.cards[index].scale.value).toBe(56 / 320);
    }
  });
});
