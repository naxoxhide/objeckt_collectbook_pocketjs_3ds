// SPDX-License-Identifier: GPL-3.0-or-later
// Destinations choose spring targets. They never replace a scene or reset its
// presentation. A down edge catches the displayed pose, including mid-spring.
import { APPS } from "./catalog.ts";

export const WIDTH = 320;
export const HEIGHT = 480;
export const COUNT = APPS.length;
export const OVERVIEW_SCALE = 0.64;
export const OVERVIEW_Y = 64;
const PAN_SLOP = 6;
const STACK_PITCH = 112;
const OVERVIEW_HOLD = 0.22;
const HOME_ENTRY_GAP = 24;
const HOME_PEEK = 48;
const QUICK_GAP = 12;
export const ICON_X = APPS.map(app => app.x);
export const ICON_Y = APPS.map(app => app.y);
export type Destination = "app" | "home" | "switcher";
export type DragKind = "navigation" | "reveal" | "pager" | "content" | "detail" | "back" | "home";
export interface Contact { id: number; x: number; y: number; vx: number; vy: number }
export interface Axis { value: number; velocity: number; target: number }
export interface Card { x: Axis; y: Axis; scale: Axis; visibility: Axis }
const axis = (value: number): Axis => ({ value, velocity: 0, target: value });
export const clamp = (v: number, lo = 0, hi = 1): number => Math.max(lo, Math.min(hi, v));
export function smooth(a: number, b: number, v: number): number {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/** Exact critically damped spring; release keeps velocity in px/s. */
export function stepSpring(a: Axis, dt: number, frequency = 18): void {
  const d = a.value - a.target;
  const b = a.velocity + frequency * d;
  const e = Math.exp(-frequency * dt);
  a.value = a.target + (d + b * dt) * e;
  a.velocity = (a.velocity - frequency * b * dt) * e;
  if (Math.abs(a.value - a.target) < 0.0001 && Math.abs(a.velocity) < 0.001) {
    a.value = a.target;
    a.velocity = 0;
  }
}

// One continuous coordinate drives the deck, including its release spring.
// The left side compresses; the right side spreads out and leaves sooner.
function stackPose(relative: number) {
  const bend = 0.7;
  const offset = relative < 0 ? -STACK_PITCH / bend * Math.log(1 - bend * relative) :
    STACK_PITCH * (relative + bend * relative * relative / 2);
  const slope = relative < 0 ? STACK_PITCH / (1 - bend * relative) : STACK_PITCH * (1 + bend * relative);
  const falloff = Math.exp(-0.8 * relative * relative);
  const scale = OVERVIEW_SCALE - 0.055 * (1 - falloff);
  const ds = -0.088 * relative * falloff;
  return { x: (WIDTH - WIDTH * scale) / 2 + offset, y: OVERVIEW_Y + HEIGHT * (OVERVIEW_SCALE - scale) / 2,
    scale, dx: slope - WIDTH * ds / 2, dy: -HEIGHT * ds / 2, ds };
}
function removeSlop(value: number): number { return Math.sign(value) * Math.max(0, Math.abs(value) - PAN_SLOP); }

interface Drag {
  id: number; kind: DragKind; startX: number; startY: number;
  x: number; y: number; scale: number; anchorX: number; anchorY: number;
  dx: number; dy: number; moved: boolean; hit: number; scene: number;
  direction: "pending" | "horizontal" | "vertical"; deck: number; pivot: number;
  quiet: number; holdX: number; holdY: number; overview: number;
  order: number[]; quick: number; caughtQuick: boolean;
  destination: Destination; selected: number; detail: number;
  cards: { x: number; y: number; scale: number; visibility: number }[];
}

export class Navigation {
  destination: Destination = "app";
  selected = 0;
  // Stable app IDs; membership and order are independent of mounted content.
  readonly opened: number[] = APPS.map((_, i) => COUNT - i - 1);
  readonly cards: Card[] = Array.from({ length: COUNT }, (_, i) => ({
    x: axis(i === 0 ? 0 : stackPose(-i).x), y: axis(i === 0 ? 0 : stackPose(-i).y),
    scale: axis(i === 0 ? 1 : stackPose(-i).scale), visibility: axis(i === 0 ? 1 : 0),
  }));
  readonly deck = axis(0);
  private stackDriven = false;
  // A quick-switch chain keeps its spatial order even as recency changes.
  private quickOrder: number[] = [];
  private quickSettling = false;
  private readonly offsets = Array.from({ length: COUNT }, () => ({ x: axis(0), y: axis(0), scale: axis(0) }));
  foreground = 0;
  readonly scene = axis(1);
  readonly overview = axis(0);
  readonly detail = axis(0);
  drag: Drag | null = null;
  actions = 0;
  lastAction = "ready";

  layer(index: number): number {
    return index === this.foreground ? COUNT * 2 + 4 : Math.max(0, this.opened.indexOf(index)) * 2 + 2;
  }

  paintVisibility(index: number): number {
    const card = this.cards[index], opacity = clamp(card.visibility.value);
    if (!opacity) return 0;
    const left = Math.max(0, card.x.value), top = Math.max(0, card.y.value);
    const right = Math.min(WIDTH, card.x.value + WIDTH * card.scale.value);
    const bottom = Math.min(HEIGHT, card.y.value + HEIGHT * card.scale.value);
    if (right <= left || bottom <= top) return opacity;
    for (const i of this.opened) {
      const other = this.cards[i];
      if (this.layer(i) <= this.layer(index) || other.visibility.value < 1) continue;
      const x = other.x.value, y = other.y.value;
      const r = x + WIDTH * other.scale.value, b = y + HEIGHT * other.scale.value;
      // Two rectangles inside the rounded card, inset one point for raster
      // edges. Only fully covered windows skip painting; content stays mounted.
      const inset = 28 * other.scale.value + 1;
      if (left >= x + 1 && right <= r - 1 && top >= y + 1 && bottom <= b - 1 &&
          ((left >= x + inset && right <= r - inset) || (top >= y + inset && bottom <= b - inset))) return 0;
    }
    return opacity;
  }

  private targets(destination: Destination, keepDeck = false): void {
    const source = this.destination;
    this.quickSettling = false;
    this.quickOrder = [];
    this.destination = destination;
    this.overview.target = destination === "switcher" ? 1 : 0;
    if (destination === "app") this.foreground = this.selected;
    this.stackDriven = destination === "switcher";
    this.scene.target = destination === "app" ? 1 : destination === "switcher" ? OVERVIEW_SCALE : 0.175;
    const rank = Math.max(0, this.opened.indexOf(this.selected));
    if (!keepDeck) Object.assign(this.deck, axis(rank));
    this.deck.target = rank;
    this.cards.forEach((card, i) => {
      if (!this.opened.includes(i)) return;
      const pose = stackPose(this.opened.indexOf(i) - rank);
      const foreground = destination === "app" && i === this.selected;
      const minimize = destination === "home" && source === "app" && i === this.selected;
      // Only the foreground app returns to its icon. Background windows keep
      // their compact pose; leaving the switcher sends the deck to the left.
      card.scale.target = foreground ? 1 : minimize ? 0.175 : destination === "home" ? card.scale.value : pose.scale;
      card.x.target = foreground ? 0 : minimize ? ICON_X[i] : destination === "home" ?
        card.x.value - (source === "app" ? 0 : WIDTH * 2 + 32) : pose.x;
      card.y.target = foreground ? 0 : minimize ? ICON_Y[i] - 14 : destination === "home" ? card.y.value : pose.y;
      card.visibility.target = foreground || destination === "switcher" ? 1 : 0;
      if (this.stackDriven) {
        const actual = stackPose(this.opened.indexOf(i) - this.deck.value), offset = this.offsets[i];
        // Residual springs absorb a caught app transition or dismissed neighbor.
        // Position and velocity at release remain unchanged.
        for (const key of ["x", "y", "scale"] as const) {
          const derivative = key === "x" ? actual.dx : key === "y" ? actual.dy : actual.ds;
          Object.assign(offset[key], { value: card[key].value - actual[key], target: 0,
            velocity: card[key].velocity + derivative * this.deck.velocity });
        }
      }
    });
  }

  private paintStack(dt: number, settleOffsets: boolean): void {
    this.opened.forEach(i => {
      const card = this.cards[i], pose = stackPose(this.opened.indexOf(i) - this.deck.value), offset = this.offsets[i];
      for (const key of ["x", "y", "scale"] as const) {
        if (settleOffsets) stepSpring(offset[key], dt);
        const derivative = key === "x" ? pose.dx : key === "y" ? pose.dy : pose.ds;
        card[key].value = pose[key] + offset[key].value;
        card[key].velocity = -derivative * this.deck.velocity + (settleOffsets ? offset[key].velocity : 0);
      }
    });
  }

  private record(name: string): void { this.lastAction = name; this.actions++; }

  private markRecent(index: number): void {
    const rank = this.opened.indexOf(index);
    if (rank >= 0) this.opened.splice(rank, 1);
    this.opened.push(index);
  }

  private settleQuick(order: number[]): void {
    this.destination = "app";
    this.foreground = this.selected;
    this.stackDriven = false;
    this.quickSettling = true;
    this.quickOrder = order;
    this.scene.target = 1;
    this.overview.target = 0;
    const rank = order.indexOf(this.selected);
    order.forEach((i, at) => {
      const card = this.cards[i];
      card.x.target = (at - rank) * (WIDTH + QUICK_GAP);
      card.y.target = 0;
      card.scale.target = 1;
      card.visibility.target = 1;
    });
  }

  open(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= COUNT) return;
    const reopening = !this.opened.includes(index);
    this.markRecent(index);
    const card = this.cards[index];
    const visible = card.visibility.value > 0.001 && card.x.value < WIDTH && card.y.value < HEIGHT &&
      card.x.value + WIDTH * card.scale.value > 0 && card.y.value + HEIGHT * card.scale.value > 0;
    if ((reopening || this.destination === "home") && !visible) {
      Object.assign(card.x, axis(ICON_X[index]));
      Object.assign(card.y, axis(ICON_Y[index] - 14));
      Object.assign(card.scale, axis(0.175));
      Object.assign(card.visibility, axis(0));
    }
    this.selected = index;
    this.foreground = index;
    this.targets("app");
    this.record("open");
  }

  private close(index: number): void {
    const rank = this.opened.indexOf(index);
    if (rank < 0) return;
    this.opened.splice(rank, 1);
    const card = this.cards[index];
    card.y.target = -HEIGHT * card.scale.value - 40;
    card.visibility.target = 0;
    if (this.selected === index) this.selected = this.opened[Math.min(rank, this.opened.length - 1)] ?? index;
    this.targets("switcher");
    this.record("close");
  }

  hitCard(x: number, y: number): number {
    for (const i of [...this.opened].sort((a, b) => this.layer(b) - this.layer(a))) {
      if (!this.opened.includes(i)) continue;
      const c = this.cards[i];
      if (c.visibility.value > 0.01 && x >= c.x.value && x <= c.x.value + WIDTH * c.scale.value &&
          y >= c.y.value && y <= c.y.value + HEIGHT * c.scale.value) return i;
    }
    return -1;
  }

  private prepareLeftEntry(): void {
    const rank = Math.max(0, this.opened.indexOf(this.selected));
    const poses = this.opened.map((_, i) => stackPose(i - rank));
    const shift = Math.max(0, ...poses.map(p => p.x + WIDTH * p.scale)) + HOME_ENTRY_GAP;
    this.opened.forEach((i, rank) => {
      const card = this.cards[i], pose = poses[rank];
      if (card.visibility.value > 0.001 && card.x.value < WIDTH && card.x.value + WIDTH * card.scale.value > 0) return;
      Object.assign(card.x, axis(pose.x - shift));
      Object.assign(card.y, axis(pose.y));
      Object.assign(card.scale, axis(pose.scale));
      // Opacity stays one throughout entry. The screen edge reveals the card.
      Object.assign(card.visibility, axis(1));
    });
  }

  down(c: Contact): DragKind | null {
    if (this.drag) return null; // A second contact cannot steal the anchor.
    const active = this.cards[this.selected];
    const inFlight = this.opened.includes(this.selected) && Math.abs(active.scale.value - active.scale.target) > 0.015;
    const kind: DragKind = this.destination === "home" && c.y >= 432 ? "reveal" :
      this.destination === "home" && !inFlight ? "home" :
      this.destination === "switcher" ? "pager" :
      (c.y >= 432 || inFlight || this.quickSettling) ? "navigation" :
      (c.x < 30 && this.selected === 0 && this.detail.value > 0.01) ? "back" :
      (this.selected === 0 && this.detail.value > 0.01) ? "detail" : "content";
    if (kind === "navigation" || kind === "reveal" || kind === "pager") this.foreground = -1;
    if (kind === "reveal") this.prepareLeftEntry();
    const caughtQuick = this.quickSettling;
    if (kind !== "navigation") this.quickOrder = [];
    else if (!this.quickOrder.length) this.quickOrder = [...this.opened];
    this.quickSettling = false;
    const hit = this.hitCard(c.x, c.y);
    const pivot = kind === "pager" && hit >= 0 ? hit : this.selected;
    const anchored = this.cards[pivot];
    this.drag = {
      id: c.id, kind, startX: c.x, startY: c.y,
      x: active.x.value, y: active.y.value, scale: active.scale.value,
      anchorX: (c.x - anchored.x.value) / anchored.scale.value,
      anchorY: (c.y - active.y.value) / active.scale.value,
      dx: 0, dy: 0, moved: false, hit, scene: this.scene.value,
      direction: "pending", deck: this.deck.value, pivot, quiet: 0, holdX: c.x, holdY: c.y, overview: this.overview.value,
      destination: this.destination, selected: this.selected, detail: this.detail.value,
      order: [...this.quickOrder], quick: caughtQuick ? 1 : 0, caughtQuick,
      cards: this.cards.map(card => ({ x: card.x.value, y: card.y.value, scale: card.scale.value, visibility: card.visibility.value })),
    };
    return kind;
  }

  move(c: Contact, dt: number): void {
    const d = this.drag;
    if (!d || d.id !== c.id) return;
    const dx = c.x - d.startX, dy = c.y - d.startY;
    // A small position window tolerates finger tremor but does not count
    // sustained travel as a pause. Release speed never gates the Home action.
    if (-dy >= 32 && Math.hypot(c.x - d.holdX, c.y - d.holdY) <= 5) d.quiet += dt;
    else { d.quiet = 0; d.holdX = c.x; d.holdY = c.y; }
    d.dx = dx; d.dy = dy;
    d.moved ||= Math.abs(dx) > 7 || Math.abs(dy) > 7;
    const card = this.cards[this.selected];
    if (d.kind === "navigation") {
      // Both dimensions remain available throughout the contact. There is no
      // axis-lock threshold that swaps the window's geometry mid-gesture.
      const lift = Math.max(0, -dy);
      const scale = d.scale / (1 + lift / 205);
      const s = dy <= 0 ? 0.16 + (d.scale - 0.16) * (scale / d.scale) :
        d.scale + (1 - d.scale) * dy / (100 + dy);
      this.follow(card.scale, s, dt);
      this.follow(card.x, c.x - d.anchorX * s, dt);
      this.follow(card.y, c.y - d.anchorY * s, dt);
      this.follow(this.scene, clamp(d.scene + s - d.scale, 0.175, 1), dt);
      d.quick = smooth(0, QUICK_GAP, Math.abs(dx)) * (1 - smooth(0.6, 1.1, Math.abs(dy) / Math.max(1, Math.abs(dx))));
      if (d.caughtQuick && Math.abs(dy) < 18) d.quick = 1;
      this.overview.target = d.quick < 0.01 && -dy >= 32 && d.quiet >= OVERVIEW_HOLD ? 1 : 0;
      this.cards.forEach((other, i) => {
        if (i === this.selected || !this.opened.includes(i)) return;
        if (d.quick > 0) {
          // Quick switching is a row of equally sized live windows. The same
          // translation and scale drive both windows before and after release.
          const relative = d.order.indexOf(i) - d.order.indexOf(d.selected);
          // Hidden cards may be rebased onto this row. Their release velocity
          // comes from the row, not from that offscreen repositioning.
          other.x.value = card.x.value + relative * (WIDTH * s + QUICK_GAP);
          other.x.velocity = card.x.velocity + relative * WIDTH * card.scale.velocity;
          other.y.value = card.y.value; other.y.velocity = card.y.velocity;
          other.scale.value = s; other.scale.velocity = card.scale.velocity;
          this.follow(other.visibility, d.quick, dt);
          other.visibility.target = d.quick;
        } else {
          if (other.visibility.value < 0.001) {
            const pose = stackPose(this.opened.indexOf(i) - this.opened.indexOf(this.selected));
            if (other.scale.value > OVERVIEW_SCALE) for (const key of ["x", "y", "scale"] as const) Object.assign(other[key], axis(pose[key]));
          }
          other.visibility.target = this.overview.target;
        }
      });
    } else if (d.kind === "reveal") {
      const lift = Math.max(0, -dy);
      const poses = this.opened.map((_, rank) => stackPose(rank - this.opened.indexOf(this.selected)));
      const distance = Math.max(1, ...this.opened.map((i, rank) => poses[rank].x - d.cards[i].x));
      // A held contact only peeks past the left edge, regardless of deck width.
      // Resistance has no hard stop; release springs the remaining distance.
      const t = Math.min(1, (HOME_ENTRY_GAP + HOME_PEEK) / distance) * lift / (lift + HOME_PEEK);
      this.follow(this.overview, d.overview + (1 - d.overview) * t, dt);
      this.follow(this.scene, d.scene + (OVERVIEW_SCALE - d.scene) * t, dt);
      this.opened.forEach((i, rank) => {
        const other = this.cards[i], from = d.cards[i];
        const pose = poses[rank];
        this.follow(other.x, from.x + (pose.x - from.x) * t, dt);
        this.follow(other.y, from.y + (pose.y - from.y) * t, dt);
        this.follow(other.scale, from.scale + (pose.scale - from.scale) * t, dt);
        this.follow(other.visibility, from.visibility + (1 - from.visibility) * t, dt);
      });
    } else if (d.kind === "pager") {
      if (d.direction === "pending" && Math.max(Math.abs(dx), Math.abs(dy)) > PAN_SLOP) {
        if (Math.abs(dx) > Math.abs(dy) * 1.15) d.direction = "horizontal";
        else if (d.hit >= 0 && Math.abs(dy) > Math.abs(dx) * 1.15) d.direction = "vertical";
        else if (Math.max(Math.abs(dx), Math.abs(dy)) > 12) d.direction = Math.abs(dx) >= Math.abs(dy) || d.hit < 0 ? "horizontal" : "vertical";
      }
      if (d.direction === "horizontal" && this.opened.length) {
        const rank = this.opened.indexOf(d.pivot), relative = rank - d.deck;
        const point = (r: number) => { const p = stackPose(r); return p.x + d.anchorX * p.scale; };
        const initial = point(relative);
        const low = Math.min(0, point(rank - this.opened.length + 1) - initial);
        const high = Math.max(0, point(rank) - initial);
        let travel = removeSlop(dx);
        const edge = clamp(travel, low, high), excess = travel - edge;
        travel = edge + excess / (1 + Math.abs(excess) / 90);
        // Solve for the deck coordinate that keeps the grabbed content point
        // beneath the finger, even as that card changes depth and scale.
        let r = relative + travel / STACK_PITCH;
        for (let i = 0; i < 6; i++) {
          const p = stackPose(r);
          r -= (p.x + d.anchorX * p.scale - initial - travel) / (p.dx + d.anchorX * p.ds);
        }
        this.follow(this.deck, rank - r, dt);
        this.paintStack(dt, false);
      } else if (d.direction === "vertical" && d.hit >= 0) {
        this.follow(this.cards[d.hit].y, d.cards[d.hit].y + Math.min(0, removeSlop(dy)), dt);
      }
    } else if (d.kind === "back") {
      this.follow(this.detail, clamp(d.detail - dx / WIDTH), dt);
    }
  }

  private follow(a: Axis, value: number, dt: number): void {
    a.velocity = (value - a.value) / dt;
    a.value = value;
  }

  up(c: Contact, cancelled = false): DragKind | null {
    const d = this.drag;
    if (!d || d.id !== c.id) return null;
    this.drag = null;
    if (cancelled) {
      this.selected = d.selected;
      if (d.kind === "navigation" && d.quick > 0) { this.settleQuick(d.order); return d.kind; }
      this.targets(d.destination, d.kind === "pager");
      if (d.kind === "back") this.detail.target = d.detail > 0.5 ? 1 : 0;
      return d.kind;
    }
    if (d.kind === "navigation") {
      const horizontal = d.quick > 0 && (Math.abs(d.dx) > Math.abs(d.dy) * 1.25 || (d.caughtQuick && Math.abs(d.dy) < 18));
      if (horizontal) {
        const rank = d.order.indexOf(d.selected);
        this.selected = d.order[clamp(rank + (Math.abs(d.dx) > 54 ? (d.dx < 0 ? 1 : -1) : 0), 0, d.order.length - 1)];
        if (this.selected !== d.selected) { this.markRecent(this.selected); this.record("quick-switch"); }
        this.settleQuick(d.order);
      } else if (d.dy > 24 && d.scale < 0.95) {
        this.targets("app");
        this.record("resume");
      } else if (-d.dy >= 32 && d.quiet >= OVERVIEW_HOLD) {
        this.targets("switcher");
        this.record("overview");
      } else if (-d.dy >= 18) {
        this.targets("home");
        this.record("home");
      } else this.targets(d.destination);
    } else if (d.kind === "reveal") {
      this.targets(-d.dy >= 32 ? "switcher" : d.destination);
      if (this.destination === "switcher") this.record("overview");
    } else if (d.kind === "pager") {
      if (!d.moved) {
        const hit = this.hitCard(c.x, c.y);
        if (hit >= 0) this.open(hit);
        else { this.targets("home"); this.record("home"); }
      } else if (d.direction === "vertical" && d.hit >= 0 &&
          (-d.dy >= 72 || (-d.dy >= 24 && c.vy < -650))) {
        this.close(d.hit);
      } else {
        if (this.opened.length && d.direction === "horizontal") {
          const pose = stackPose(this.opened.indexOf(d.pivot) - this.deck.value);
          this.deck.velocity = -c.vx / (pose.dx + d.anchorX * pose.ds);
          const rank = clamp(Math.round(this.deck.value + this.deck.velocity * 0.16), 0, this.opened.length - 1);
          this.selected = this.opened[rank];
        }
        this.targets("switcher", true);
        this.record("browse");
      }
    } else if (d.kind === "home" && !d.moved) {
      const index = ICON_X.findIndex((x, i) => c.x >= x - 12 && c.x <= x + 68 && c.y >= ICON_Y[i] - 12 && c.y < ICON_Y[i] + 90);
      if (index >= 0) this.open(index);
    } else if (d.kind === "back") {
      this.detail.target = d.dx + c.vx * 0.12 > WIDTH * 0.35 ? 0 : 1;
      if (this.detail.target === 0) this.record("back");
    } else if (d.kind === "detail" && !d.moved && c.x < 100 && c.y < 90) {
      this.detail.target = 0;
      this.record("back");
    } else if (d.kind === "content") {
      if (!d.moved && this.selected === 0 && c.y > 155 && c.y < 430) {
        this.detail.target = 1;
        this.record("detail");
      } else if (d.moved) this.record("scroll");
    }
    return d.kind;
  }

  step(dt: number): void {
    const kind = this.drag?.kind;
    if (this.stackDriven && kind !== "pager") {
      stepSpring(this.deck, dt);
      this.paintStack(dt, true);
    }
    this.cards.forEach((card, i) => {
      const opened = this.opened.includes(i);
      if (kind === "navigation" && opened && i !== this.selected && !this.drag?.quick) stepSpring(card.visibility, dt, 24);
      if ((kind === "navigation" || kind === "reveal" || kind === "pager") && opened) return;
      if (!this.stackDriven || !opened) {
        stepSpring(card.x, dt);
        stepSpring(card.y, dt);
        stepSpring(card.scale, dt);
      }
      stepSpring(card.visibility, dt);
    });
    if (kind !== "navigation" && kind !== "reveal") stepSpring(this.scene, dt);
    if (kind !== "reveal") stepSpring(this.overview, dt, 24);
    if (kind !== "back") stepSpring(this.detail, dt);
    if (this.quickSettling && !this.drag) {
      const active = this.cards[this.selected];
      if (active.x.value === 0 && active.y.value === 0 && active.scale.value === 1) {
        this.quickSettling = false;
        this.opened.forEach((i, rank) => {
          if (i === this.selected) return;
          const card = this.cards[i], pose = stackPose(rank - this.opened.indexOf(this.selected));
          Object.assign(card.visibility, axis(0));
          for (const key of ["x", "y", "scale"] as const) Object.assign(card[key], axis(pose[key]));
        });
      }
    }
  }
}
