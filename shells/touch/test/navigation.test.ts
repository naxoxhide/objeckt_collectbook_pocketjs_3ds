// SPDX-License-Identifier: GPL-3.0-or-later
import { describe, expect, test } from "bun:test";
import { Navigation, stepSpring, OVERVIEW_SCALE, ICON_X, ICON_Y, COUNT, type Contact } from "../src/navigation.ts";

const contact = (x: number, y: number, vx = 0, vy = 0, id = 0): Contact => ({ id, x, y, vx, vy });
const pose = (n: Navigation) => n.cards.map(c => [c.x.value, c.y.value, c.scale.value]);
const settle = (n: Navigation, hz = 60) => { for (let i = 0; i < hz * 2; i++) n.step(1 / hz); };
// Gesture fixtures that begin inside Today enter it through the public API.
function appNavigation(width = 320, height = 480) {
  const n = new Navigation(width, height);
  n.open(0); settle(n);
  return n;
}
function lift(n: Navigation, pause = 0) {
  n.down(contact(160, 466));
  for (let i = 1; i <= 18; i++) n.move(contact(160, 466 - i * 8, 0, -480), 1 / 60);
  for (let i = 0; i < pause; i++) n.move(contact(160, 322), 1 / 60);
  n.up(contact(160, 322, 0, pause ? 0 : -800));
}

// Three-window fixtures exercise the same model with a subset of the catalog.
function navigation() {
  const n = appNavigation();
  n.opened.splice(0, n.opened.length, 0, 1, 2);
  return n;
}
function middleDeck() {
  const n = navigation();
  n.open(1); settle(n); n.open(2); settle(n); lift(n, 16); settle(n);
  n.down(contact(160, 250)); n.move(contact(250, 250), 1 / 60);
  n.up(contact(250, 250)); settle(n);
  expect(n.selected).toBe(1);
  return n;
}

describe("Touch shell continuous navigation", () => {
  test("dismissing a browsed deck preserves occlusion without sweeping in offscreen windows", () => {
    for (const [width, height] of [[320, 480], [360, 640], [640, 360]]) for (const hz of [30, 60]) {
      const n = appNavigation(width, height), order = [...n.opened];
      n.down(contact(width / 2, height - 14));
      n.move(contact(width / 2, height - 114), 1 / hz);
      n.up(contact(width / 2, height - 114)); settle(n, hz);
      n.down(contact(width / 2, height - 14));
      n.move(contact(width / 2, height - 114), 1 / hz);
      n.up(contact(width / 2, height - 114)); settle(n, hz);
      for (let i = 0; i < 4; i++) {
        n.down(contact(width / 2, height / 2));
        n.move(contact(width / 2 + 90, height / 2), 1 / hz);
        n.up(contact(width / 2 + 90, height / 2)); settle(n, hz);
      }
      expect(n.selected).not.toBe(order.at(-1)!);
      const before = pose(n);
      n.down(contact(width - 10, height - 58)); n.up(contact(width - 10, height - 58));
      expect(n.destination).toBe("home");
      expect(pose(n)).toEqual(before);
      let previousCover = 0;
      for (let frame = 0; frame < hz * 2; frame++) {
        n.step(1 / hz);
        n.cards.forEach((c, i) => {
          expect(c.y.value).toBe(before[i][1]);
          expect(c.scale.value).toBe(before[i][2]);
          if (before[i][0] >= width) expect(c.x.value).toBe(before[i][0]);
          else expect(c.x.value).toBeLessThanOrEqual(before[i][0]);
        });
        if (n.coveringHome) {
          expect(n.homeCover.value).toBeGreaterThanOrEqual(previousCover);
          previousCover = n.homeCover.value;
          expect(n.cards.every(c => c.visibility.value === 1)).toBe(true);
        } else expect(n.cards.every(c => c.visibility.value === 0)).toBe(true);
      }
      expect(n.coveringHome).toBe(false);
      expect(n.opened).toEqual(order);
    }
  });

  test("a Home cover can be caught, reversed or cancelled without rebasing visible cards", () => {
    for (const cancel of [false, true]) {
      const n = middleDeck(), order = [...n.opened];
      n.down(contact(310, 425)); n.up(contact(310, 425));
      for (let i = 0; i < 6; i++) n.step(1 / 60);
      const before = pose(n), cover = n.homeCover.value;
      expect(cover).toBeGreaterThan(0);
      n.down(contact(160, 466)); n.move(contact(160, 466), 1 / 60); n.step(1 / 60);
      expect(pose(n)).toEqual(before);
      expect(n.homeCover.value).toBe(cover);
      n.move(contact(160, 366), 1 / 60);
      expect(n.homeCover.value).toBeLessThan(cover);
      const caught = pose(n), caughtCover = n.homeCover.value;
      n.up(contact(160, 366), cancel);
      expect(pose(n)).toEqual(caught);
      expect(n.homeCover.value).toBe(caughtCover);
      settle(n);
      expect(n.coveringHome).toBe(false);
      expect(n.homeCover.value).toBe(0);
      expect(n.opened).toEqual(order);
      expect(n.destination).toBe(cancel ? "home" : "switcher");
      if (cancel) expect(n.cards.every(c => c.visibility.value === 0)).toBe(true);
      else {
        expect(n.selected).toBe(order.at(-1)!);
        expect(n.cards[n.selected].x.value).toBeCloseTo(57.6, 5);
      }
    }
  });

  test("opaque stacked cards skip fully covered windows but never a visible strip or a translucent cover", () => {
    const n = appNavigation(); lift(n, 16); settle(n);
    expect(n.opened.map(i => n.cards[i].visibility.value)).toEqual(Array(COUNT).fill(1));
    expect(n.cards.slice(0, 6).map((_, i) => n.paintBounds(i).opacity)).toEqual([1, 1, 0, 0, 0, 0]);
    expect(n.paintBounds(1).right).toBeLessThan(100);
    n.cards[0].visibility.value = 0.5;
    expect(n.paintBounds(1).right).toBe(320); // A translucent card cannot hide content.
    n.cards[0].visibility.value = 1;
    n.cards[0].y.value += 100;
    expect(n.paintBounds(1).right).toBe(320); // Dismissal exposes the top of its neighbor.
    n.cards[0].y.value -= 100;
    n.cards[1].visibility.value = 0.5;
    expect(n.paintBounds(2).opacity).toBe(1);
    n.cards[1].visibility.value = 1;
    n.down(contact(160, 250)); n.move(contact(250, 250), 1 / 60);
    expect(n.paintBounds(2).opacity).toBe(1); // Paging exposes the next older strip.
  });
  test("desktop icons open distinct retained windows and move the chosen app to the newest end", () => {
    const n = appNavigation();
    expect(n.cards.length).toBe(COUNT);
    expect(COUNT).toBe(16);
    for (const i of [3, 4, 5, 0, 2, 1, 0]) {
      lift(n); settle(n);
      n.down(contact(ICON_X[i] + 28, ICON_Y[i] + 28));
      n.up(contact(ICON_X[i] + 28, ICON_Y[i] + 28)); settle(n);
      expect(n.selected).toBe(i);
      expect(n.opened.at(-1)).toBe(i);
      expect(new Set(n.opened).size).toBe(COUNT);
      expect(n.cards[i].scale.value).toBe(1);
    }
  });

  test("Music remains to the right of Today after Home and a desktop reveal", () => {
    const n = navigation();
    n.opened.splice(0, n.opened.length, 1, 0);
    n.open(1); settle(n);
    expect(n.opened).toEqual([0, 1]);
    lift(n); settle(n);
    n.down(contact(160, 466)); n.move(contact(160, 66), 1 / 60); n.up(contact(160, 66)); settle(n);
    expect(n.cards[1].x.value).toBeGreaterThan(n.cards[0].x.value);
    const order = [...n.opened];
    n.down(contact(160, 250)); n.move(contact(250, 250), 1 / 60); n.up(contact(250, 250)); settle(n);
    expect(n.selected).toBe(0);
    expect(n.opened).toEqual(order); // Browsing is not activation.
    n.down(contact(160, 220)); n.up(contact(160, 220)); settle(n);
    expect(n.opened).toEqual([1, 0]);
  });

  test("bottom quick switching exposes an equal-size neighbor before release and only translates while settling", () => {
    const n = appNavigation();
    n.down(contact(40, 466));
    for (let x = 55; x <= 220; x += 15) {
      n.move(contact(x, 466), 1 / 60); n.step(1 / 60);
      const a = n.cards[0], b = n.cards[1];
      expect(a.x.value).toBe(x - 40);
      expect(a.x.value - b.x.value - 320 * b.scale.value).toBeCloseTo(12, 6);
      expect(b.y.value).toBe(a.y.value);
      expect(b.scale.value).toBe(a.scale.value);
      expect(b.visibility.value).toBe(1);
    }
    expect(n.cards[1].x.value + 320).toBeGreaterThan(100);
    const before = pose(n), velocity = n.cards[1].x.velocity;
    n.up(contact(220, 466));
    expect(pose(n)).toEqual(before);
    expect(n.cards[1].x.velocity).toBe(velocity);
    for (let frame = 0; frame < 35; frame++) {
      n.step(1 / 60);
      expect(n.cards[0].scale.value).toBe(1);
      expect(n.cards[1].scale.value).toBe(1);
      expect(n.cards[0].y.value).toBe(0);
      expect(n.cards[1].y.value).toBe(0);
      expect(n.cards[0].x.value - n.cards[1].x.value).toBeCloseTo(332, 6);
    }
    settle(n);
    expect(n.selected).toBe(1);
    expect(n.opened.at(-1)).toBe(1);
    expect(n.cards[1].x.value).toBe(0);
    // Reversing the next quick switch returns to Today despite recency promotion.
    n.down(contact(280, 466)); n.move(contact(80, 466), 1 / 60); n.up(contact(80, 466)); settle(n);
    expect(n.selected).toBe(0);
    expect(n.opened.at(-1)).toBe(0);
  });

  test("a quick switch reverses or cancels without changing recency, and its spring can be caught", () => {
    for (const cancel of [false, true]) {
      const n = appNavigation(), order = [...n.opened];
      n.down(contact(40, 466)); n.move(contact(210, 466), 1 / 60);
      if (!cancel) n.move(contact(48, 466), 1 / 60);
      n.up(contact(cancel ? 210 : 48, 466), cancel); settle(n);
      expect(n.selected).toBe(0);
      expect(n.opened).toEqual(order);
      expect(n.cards[0].x.value).toBe(0);
    }
    const n = appNavigation();
    n.down(contact(40, 466)); n.move(contact(220, 466), 1 / 60); n.up(contact(220, 466));
    n.step(1 / 60);
    const caught = pose(n);
    n.down(contact(220, 466)); n.move(contact(220, 466), 1 / 60); n.step(1 / 60);
    pose(n).forEach((p, i) => p.forEach((v, j) => expect(v).toBeCloseTo(caught[i][j], 6)));
    n.move(contact(40, 466), 1 / 60); n.up(contact(40, 466)); settle(n);
    expect(n.selected).toBe(0);
  });
  test("the same content point stays under the finger along a curved, reversing path", () => {
    for (const startX of [20, 160, 295]) {
      const n = navigation();
      n.down(contact(startX, 465));
      for (const [dx, dy] of [[0, -1], [4, -30], [45, -150], [-35, -220], [80, -90], [0, 0]]) {
        n.move(contact(startX + dx, 465 + dy), 1 / 60);
        const c = n.cards[0];
        expect(c.x.value + startX * c.scale.value).toBeCloseTo(startX + dx, 8);
        expect(c.y.value + 465 * c.scale.value).toBeCloseTo(465 + dy, 8);
      }
      expect(pose(n)[0]).toEqual([0, 0, 1]);
      n.up(contact(startX, 465));
      expect(n.destination).toBe("app");
    }
  });

  test("release changes only destinations, preserves pose and velocity", () => {
    const n = navigation();
    n.down(contact(160, 465));
    n.move(contact(165, 345, 30, -720), 1 / 60);
    const before = pose(n), velocity = n.cards[0].y.velocity;
    n.up(contact(165, 345, 30, -720));
    expect(n.destination).toBe("home");
    expect(pose(n)).toEqual(before);
    expect(n.cards[0].y.velocity).toBe(velocity);
  });

  test("pause lands in overview; a continuous flick lands at the icon", () => {
    const overview = navigation(), home = navigation();
    lift(overview, 16); lift(home);
    expect(overview.destination).toBe("switcher");
    expect(home.destination).toBe("home");
    settle(overview); settle(home);
    expect(overview.cards[0].scale.value).toBe(OVERVIEW_SCALE);
    expect(home.cards[0].scale.value).toBe(0.175);
  });

  test("catching an unfinished close freezes every displayed card without a jump", () => {
    const n = navigation();
    lift(n);
    for (let i = 0; i < 4; i++) n.step(1 / 60);
    const before = pose(n);
    n.down(contact(175, 280));
    n.move(contact(175, 280), 1 / 60);
    n.step(1 / 60);
    pose(n).forEach((p, i) => p.forEach((v, j) => expect(v).toBeCloseTo(before[i][j], 8)));
    n.move(contact(165, 250), 1 / 60);
    expect(n.cards[0].scale.value).toBeLessThan(before[0][2]);
  });

  test("a second finger and its cancellation cannot steal the first", () => {
    const n = navigation();
    n.down(contact(160, 465));
    n.move(contact(160, 350), 1 / 60);
    const before = pose(n);
    expect(n.down(contact(10, 20, 0, 0, 1))).toBeNull();
    n.move(contact(200, 50, 0, 0, 1), 1 / 60);
    n.up(contact(200, 50, 0, 0, 1), true);
    expect(pose(n)).toEqual(before);
    expect(n.drag?.id).toBe(0);
    n.up(contact(160, 350), true);
    settle(n);
    expect(n.destination).toBe("app");
    expect(pose(n)[0]).toEqual([0, 0, 1]);
  });

  test("a closing window can be caught, enlarged and returned to the app", () => {
    const n = navigation();
    lift(n);
    for (let i = 0; i < 5; i++) n.step(1 / 60);
    const scale = n.cards[0].scale.value;
    n.down(contact(160, 280));
    n.move(contact(160, 355, 0, 450), 1 / 60);
    expect(n.cards[0].scale.value).toBeGreaterThan(scale);
    n.up(contact(160, 355, 0, 450));
    expect(n.destination).toBe("app");
    settle(n);
    expect(pose(n)[0]).toEqual([0, 0, 1]);
  });

  test("bottom swipes switch neighbors; paging never escapes the deck", () => {
    const n = navigation();
    n.down(contact(285, 466));
    n.move(contact(80, 450, -500, -20), 1 / 60);
    n.up(contact(80, 450, -500, -20));
    expect(n.selected).toBe(1);
    settle(n);
    lift(n, 16); settle(n);
    n.down(contact(160, 200));
    n.move(contact(5, 202, -2000, 0), 1 / 60);
    n.up(contact(5, 202, -2000, 0));
    expect(n.selected).toBe(1);
    expect(n.destination).toBe("switcher");
    settle(n);
    n.down(contact(160, 200));
    n.move(contact(0, 200, -2000, 0), 1 / 60);
    expect(n.cards[1].x.value).toBeGreaterThan(-60);
    n.up(contact(0, 200, -2000, 0));
    expect(n.selected).toBe(1);
  });

  test("short and slow upward swipes go home; release velocity is not a gate", () => {
    for (const distance of [18, 24, 41, 55, 80, 144]) {
      for (const frames of [8, 30, 60]) {
        const n = navigation();
        n.down(contact(160, 466));
        for (let i = 1; i <= frames; i++) { n.move(contact(160, 466 - distance * i / frames), 1 / 60); n.step(1 / 60); }
        const before = pose(n);
        n.up(contact(160, 466 - distance));
        expect(n.destination).toBe("home");
        expect(pose(n)).toEqual(before);
      }
    }
  });

  test("overview requires a deliberate hold, tolerates tremor, and yields to renewed motion", () => {
    for (const hz of [30, 60, 120]) {
      const n = navigation();
      n.down(contact(160, 466));
      n.move(contact(160, 425), 1 / hz);
      for (let i = 0; i < Math.ceil(hz * 0.28); i++) {
        n.move(contact(160 + (i % 2), 425 + (i % 2)), 1 / hz); n.step(1 / hz);
      }
      expect(n.cards[1].visibility.value).toBeGreaterThan(0);
      n.up(contact(160, 425));
      expect(n.destination).toBe("switcher");
    }
    const resumed = navigation();
    resumed.down(contact(160, 466)); resumed.move(contact(160, 370), 1 / 60);
    for (let i = 0; i < 20; i++) { resumed.move(contact(160, 370), 1 / 60); resumed.step(1 / 60); }
    resumed.move(contact(160, 335), 1 / 60); resumed.up(contact(160, 335));
    expect(resumed.destination).toBe("home");
  });

  test("only the active app moves and minimizes during an ordinary Home swipe", () => {
    for (const selected of [0, 1, 2]) {
      const n = navigation(); n.open(selected); settle(n);
      const before = pose(n);
      n.down(contact(160, 466));
      for (let frame = 1; frame <= 36; frame++) {
        n.move(contact(160, 466 - frame * 4), 1 / 60); n.step(1 / 60);
        for (const i of [0, 1, 2].filter(i => i !== selected)) {
          expect(pose(n)[i]).toEqual(before[i]);
          expect(n.cards[i].visibility.value).toBe(0);
        }
        expect(n.overview.value).toBe(0);
      }
      n.up(contact(160, 322));
      for (let frame = 0; frame < 120; frame++) {
        n.step(1 / 60);
        for (const i of [0, 1, 2].filter(i => i !== selected)) {
          expect(pose(n)[i]).toEqual(before[i]);
          expect(n.cards[i].visibility.value).toBe(0);
        }
      }
      expect(n.destination).toBe("home");
      expect(n.cards[selected].scale.value).toBe(0.175);
    }
  });

  test("a brief pause before release never previews background cards on the Home path", () => {
    const n = navigation();
    n.down(contact(160, 466)); n.move(contact(160, 410), 1 / 60);
    for (let frame = 0; frame < 11; frame++) {
      n.move(contact(160, 410), 1 / 60); n.step(1 / 60);
      expect(n.cards[1].visibility.value).toBe(0);
      expect(n.cards[2].visibility.value).toBe(0);
      expect(n.overview.value).toBe(0);
    }
    n.up(contact(160, 410));
    expect(n.destination).toBe("home");
  });

  test("the desktop deck enters from the left at card size and full opacity, and reverses", () => {
    const n = navigation();
    n.open(0); settle(n); // Keep the active app at the newest end of this fixture.
    lift(n); settle(n);
    expect(n.destination).toBe("home");
    expect(n.down(contact(160, 466))).toBe("reveal");
    const parked = pose(n);
    expect(n.opened.every(i => n.cards[i].x.value + 320 * n.cards[i].scale.value <= 0)).toBe(true);
    for (const distance of [24, 48, 72, 144, 288, 440]) {
      n.move(contact(160, 466 - distance), 1 / 60); n.step(1 / 60);
      n.cards.slice(0, 3).forEach((c, i) => {
        expect(c.x.value).toBeGreaterThan(parked[i][0]);
        expect(c.y.value).toBe(parked[i][1]);
        expect(c.scale.value).toBe(parked[i][2]);
        expect(c.visibility.value).toBe(1);
      });
      expect(Math.max(...n.opened.map(i => n.cards[i].x.value + 320 * n.cards[i].scale.value))).toBeLessThan(48);
    }
    n.move(contact(160, 466), 1 / 60);
    expect(pose(n)).toEqual(parked);
    n.move(contact(160, 425), 1 / 60);
    const release = pose(n);
    const velocity = n.cards.map(c => [c.x.velocity, c.y.velocity, c.scale.velocity]);
    n.up(contact(160, 425));
    expect(pose(n)).toEqual(release);
    expect(n.cards.map(c => [c.x.velocity, c.y.velocity, c.scale.velocity])).toEqual(velocity);
    settle(n);
    expect(n.destination).toBe("switcher");
    expect(n.opened.every(i => n.cards[i].visibility.value === 1)).toBe(true);
    expect(n.cards[0].x.value).toBeCloseTo(57.6, 6);
  });

  test("desktop peek stays small for every selected app and open-window count", () => {
    for (const opened of [[0, 1, 2], [0, 2], [1]]) for (const selected of opened) {
      const n = navigation();
      n.opened.splice(0, n.opened.length, ...opened);
      n.open(selected); settle(n); lift(n); settle(n);
      n.down(contact(160, 466));
      const edge = () => Math.max(...opened.map(i => n.cards[i].x.value + 320 * n.cards[i].scale.value));
      const edges: number[] = [];
      for (const distance of [60, 120, 240, 440]) {
        n.move(contact(160, 466 - distance), 1 / 60); n.step(1 / 60);
        edges.push(edge());
        expect(edge()).toBeGreaterThan(0);
        expect(edge()).toBeLessThan(48);
      }
      expect(edges[3] - edges[2]).toBeLessThan(edges[1] - edges[0]);
      const before = pose(n);
      n.up(contact(160, 26));
      expect(pose(n)).toEqual(before);
      settle(n);
      expect(n.destination).toBe("switcher");
      expect(n.opened).toEqual([...opened.filter(i => i !== selected), selected]);
      expect(n.cards[selected].x.value).toBeCloseTo(57.6, 6);
    }
  });

  test("a fresh Home reveal enters from the left even while the last app is minimizing", () => {
    for (const [width, height] of [[320, 480], [360, 640], [640, 360]]) {
      for (const hz of [30, 60]) for (const index of [1, 5, 12]) for (const delay of [0, 0.1, 0.3, 0.5, 2]) {
        const n = appNavigation(width, height), cx = width / 2, bar = height - 14;
        n.open(index); settle(n, hz);
        n.down(contact(cx, bar));
        for (let frame = 1; frame <= hz / 2; frame++) {
          n.move(contact(cx, bar - 90 * frame / (hz / 2)), 1 / hz); n.step(1 / hz);
        }
        n.up(contact(cx, bar - 90));
        for (let frame = 0; frame < delay * hz; frame++) n.step(1 / hz);
        expect(n.destination).toBe("home");
        expect(n.down(contact(cx, bar))).toBe("reveal");
        const card = n.cards[index], parked = [card.y.value, card.scale.value];
        expect(card.x.value + width * card.scale.value).toBeLessThanOrEqual(0);
        expect(card.scale.value).toBe(OVERVIEW_SCALE);
        for (const lift of [24, 64, 180]) {
          n.move(contact(cx, bar - lift), 1 / hz); n.step(1 / hz);
          expect([card.y.value, card.scale.value]).toEqual(parked);
          expect(card.x.value + width * card.scale.value).toBeLessThan(48);
        }
        const release = pose(n);
        n.up(contact(cx, bar - 180));
        expect(pose(n)).toEqual(release);
        settle(n, hz);
        expect(n.destination).toBe("switcher");
        expect(n.selected).toBe(index);
        expect(n.opened.at(-1)).toBe(index);
        expect(card.scale.value).toBe(OVERVIEW_SCALE);
      }
    }
  });

  test("a cancelled desktop peek can be caught without resetting visible cards", () => {
    const n = navigation();
    lift(n); settle(n);
    n.down(contact(160, 466)); n.move(contact(160, 100), 1 / 60);
    const release = pose(n);
    n.up(contact(160, 100), true);
    expect(pose(n)).toEqual(release);
    n.step(1 / 240);
    const visible = n.opened.filter(i => n.cards[i].x.value + 320 * n.cards[i].scale.value > 0);
    expect(visible.length).toBeGreaterThan(0);
    const caught = pose(n);
    n.down(contact(160, 466)); n.move(contact(160, 466), 1 / 60); n.step(1 / 60);
    for (const i of visible) expect(pose(n)[i]).toEqual(caught[i]);
    n.move(contact(160, 300), 1 / 60);
    n.move(contact(160, 466), 1 / 60);
    for (const i of visible) expect(pose(n)[i]).toEqual(caught[i]);
    n.up(contact(160, 466)); settle(n);
    expect(n.destination).toBe("home");
    expect(n.cards.every(c => c.visibility.value === 0)).toBe(true);
  });

  test("opening from the desktop or switcher expands only the selected app", () => {
    for (const source of ["home", "switcher"]) {
      const n = navigation();
      lift(n, source === "home" ? 0 : 16); settle(n);
      n.open(1);
      for (let i = 0; i < 120; i++) {
        n.step(1 / 60);
        for (const index of [0, 2]) {
          expect(n.cards[index].scale.value).toBeLessThanOrEqual(OVERVIEW_SCALE + 0.0001);
          expect(n.cards[index].scale.target).toBeLessThanOrEqual(OVERVIEW_SCALE);
        }
      }
      expect(n.cards[1].scale.value).toBe(1);
      expect(n.cards[0].visibility.value).toBe(0);
      expect(n.cards[2].visibility.value).toBe(0);
    }
  });

  test("dismissal follows the finger, can reverse or cancel, and removes only its hit card", () => {
    const n = navigation();
    lift(n, 16); settle(n);
    n.down(contact(160, 250));
    n.move(contact(166, 180), 1 / 60);
    expect(n.cards[0].y.value).toBe(0);
    expect(n.cards[1].y.value).toBeGreaterThan(64);
    n.move(contact(160, 250), 1 / 60);
    n.up(contact(160, 250)); settle(n);
    expect(n.opened).toEqual([0, 1, 2]);
    n.down(contact(160, 250)); n.move(contact(160, 100), 1 / 60);
    n.up(contact(160, 100), true); settle(n);
    expect(n.opened).toEqual([0, 1, 2]);
    expect(n.cards[0].y.value).toBe(64);
    // Dismiss the partial next card, without dismissing the selected card.
    n.down(contact(305, 250)); n.move(contact(305, 100, 0, -600), 1 / 60);
    const before = pose(n);
    n.up(contact(305, 100, 0, -600));
    expect(pose(n)).toEqual(before);
    expect(n.opened).toEqual([0, 2]);
    expect(n.selected).toBe(0);
    settle(n);
    expect(n.cards[1].visibility.value).toBe(0);
    n.open(0); settle(n);
    n.down(contact(40, 466)); n.move(contact(245, 450), 1 / 60); n.up(contact(245, 450));
    expect(n.selected).toBe(2); // Quick switch skips the dismissed app.
  });

  test("closing the last card leaves an empty deck; icons reopen one window without duplicates", () => {
    const n = navigation();
    lift(n, 16); settle(n);
    for (let i = 0; i < 3; i++) {
      n.down(contact(160, 250)); n.move(contact(160, 100), 1 / 60); n.up(contact(160, 100)); settle(n);
      expect(n.opened.length).toBe(2 - i);
    }
    expect(n.destination).toBe("switcher");
    expect(n.hitCard(160, 220)).toBe(-1);
    expect(n.cards.every(c => c.visibility.value === 0)).toBe(true);
    n.down(contact(160, 220)); n.up(contact(160, 220)); settle(n);
    expect(n.destination).toBe("home");
    n.down(contact(160, 466)); n.move(contact(160, 425), 1 / 60); n.up(contact(160, 425)); settle(n);
    expect(n.destination).toBe("switcher");
    expect(n.opened).toEqual([]);
    n.down(contact(160, 220)); n.up(contact(160, 220)); settle(n);
    n.down(contact(ICON_X[1] + 28, ICON_Y[1] + 28)); n.up(contact(ICON_X[1] + 28, ICON_Y[1] + 28)); settle(n);
    expect(n.opened).toEqual([1]);
    expect(n.selected).toBe(1);
    expect(n.cards[1].scale.value).toBe(1);
    n.open(1); settle(n);
    expect(n.opened).toEqual([1]);
    lift(n, 16); settle(n);
    expect(n.hitCard(160, 220)).toBe(1);
    expect(n.cards[0].visibility.value).toBe(0);
    expect(n.cards[2].visibility.value).toBe(0);
  });

  test("edge back can reverse, cancel, and complete without replacing the detail", () => {
    const n = navigation();
    n.down(contact(100, 220)); n.up(contact(100, 220)); settle(n);
    expect(n.detail.value).toBe(1);
    n.down(contact(4, 220));
    n.move(contact(180, 220), 1 / 60);
    expect(n.detail.value).toBeCloseTo(0.45, 6);
    n.move(contact(24, 220), 1 / 60);
    n.up(contact(24, 220), true); settle(n);
    expect(n.detail.value).toBe(1);
    n.down(contact(4, 220)); n.move(contact(210, 220), 1 / 60);
    n.up(contact(210, 220)); settle(n);
    expect(n.detail.value).toBe(0);
    expect(n.lastAction).toBe("back");
  });

  test("ordinary continuous upward swipes go home despite a slow final sample; pausing stays in apps", () => {
    for (const [distance, frames] of [[70, 17], [144, 30], [170, 42]]) {
      for (const pause of [0, 18]) {
        const n = navigation();
        n.down(contact(160, 466));
        for (let i = 1; i <= frames; i++) n.move(contact(160, 466 - distance * i / frames, 0, -distance * 60 / frames), 1 / 60);
        for (let i = 0; i < pause; i++) n.move(contact(160, 466 - distance), 1 / 60);
        n.up(contact(160, 466 - distance));
        expect(n.destination).toBe(pause ? "switcher" : "home");
      }
    }
  });

  test("the overlapping deck keeps B under the finger, A slower and C faster, then snaps A to center", () => {
    const n = middleDeck();
    const before = pose(n);
    expect(n.cards[0].x.value + 320 * n.cards[0].scale.value).toBeGreaterThan(n.cards[1].x.value);
    expect(n.cards[1].x.value + 320 * n.cards[1].scale.value).toBeGreaterThan(n.cards[2].x.value);
    expect(n.hitCard(240, 220)).toBe(2); // Hit order matches the painted stack.
    const anchor = (160 - n.cards[1].x.value) / n.cards[1].scale.value;
    n.down(contact(160, 250));
    n.move(contact(196, 250, 300, 0), 1 / 60);
    const movement = n.cards.map((c, i) => c.x.value - before[i][0]);
    expect(movement[0]).toBeLessThan(movement[1]);
    expect(movement[2]).toBeGreaterThan(movement[1] * 1.4);
    expect(n.cards[1].x.value + anchor * n.cards[1].scale.value).toBeCloseTo(190, 6);
    // A later diagonal excursion stays horizontal, even when y dominates.
    n.move(contact(256, 100, 300, -900), 1 / 60);
    expect(n.drag?.direction).toBe("horizontal");
    expect(n.cards[2].x.value).toBeGreaterThan(320);
    expect(n.cards.every(c => c.y.value >= 64)).toBe(true);
    const release = pose(n);
    n.up(contact(256, 100, 300, -900));
    expect(n.opened).toEqual([0, 1, 2]);
    expect(pose(n)).toEqual(release);
    settle(n);
    expect(n.selected).toBe(0);
    expect(n.cards[0].x.value).toBeCloseTo(57.6, 6);
    expect(n.cards[0].scale.value).toBe(OVERVIEW_SCALE);
  });

  test("vertical dismissal locks out sideways paging, and cancellation restores the caught deck", () => {
    const n = middleDeck();
    const before = pose(n);
    n.down(contact(160, 250));
    n.move(contact(162, 225), 1 / 60);
    n.move(contact(280, 110), 1 / 60);
    expect(n.drag?.direction).toBe("vertical");
    n.cards.forEach((c, i) => expect(c.x.value).toBe(before[i][0]));
    expect(n.cards[1].y.value).toBe(64 - 134);
    n.up(contact(280, 110), true); settle(n);
    expect(pose(n)).toEqual(before);
    expect(n.opened).toEqual([0, 1, 2]);
  });

  test("a settling stack can be caught and reversed without jumping any card", () => {
    const n = middleDeck();
    n.down(contact(160, 250)); n.move(contact(215, 250, 350, 0), 1 / 60); n.up(contact(215, 250, 350, 0));
    for (let i = 0; i < 4; i++) n.step(1 / 60);
    const before = pose(n);
    n.down(contact(160, 250)); n.move(contact(160, 250), 1 / 60); n.step(1 / 60);
    expect(pose(n)).toEqual(before);
    n.move(contact(115, 250, -300, 0), 1 / 60); n.up(contact(115, 250, -300, 0)); settle(n);
    expect(n.cards[n.selected].x.value).toBeCloseTo(57.6, 6);
    expect(n.cards.every(c => [c.x.value, c.y.value, c.scale.value].every(Number.isFinite))).toBe(true);
  });

  test("spring trajectories agree at 30, 60, and 120 Hz with release momentum", () => {
    const results = [30, 60, 120].map(hz => {
      const a = { value: 80, velocity: -730, target: 0 };
      for (let i = 0; i < hz / 5; i++) stepSpring(a, 1 / hz);
      return a;
    });
    results.forEach(a => {
      expect(a.value).toBeCloseTo(results[0].value, 8);
      expect(a.velocity).toBeCloseTo(results[0].velocity, 8);
    });
  });
});
