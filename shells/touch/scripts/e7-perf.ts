// SPDX-License-Identifier: GPL-3.0-or-later
// Reproducible native-input workload and frame-time summary. Device traces
// measure CPU submission/presentation, not GPU execution or panel scanout.
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { shellLayout } from '../src/layout.ts';
import { APPS } from '../src/catalog.ts';

export type Scenario = "navigation" | "deck-dismiss" | "all-apps";
const scenarios: readonly string[] = ["navigation", "deck-dismiss", "all-apps"];

export function e7Workload(width: number, height: number, scenario: Scenario) {
  if (![[360, 640], [640, 360]].some(([w, h]) => w === width && h === height)) throw new Error('Expected an E7 viewport');
  const appTimes = APPS.map((app, i) => 4000 + i * 1400 + (app.page === 1 ? 1000 : 0));
  const l = shellLayout(width, height), points: [number, number][] = [];
  const pack = (x: number, y: number) => (0x80000000 | (Math.round(y) << 10) | Math.round(x)) >>> 0;
  const swipe = (at: number, x0: number, y0: number, x1: number, y1: number, duration = 360, hold = 0) => {
    for (let ms = 0; ms <= duration; ms += 15) points.push([at + ms, pack(x0 + (x1 - x0) * ms / duration, y0 + (y1 - y0) * ms / duration)]);
    points.push([at + duration + hold + 15, 0]);
  };
  const tap = (at: number, app: number) => {
    const icon = l.icon(app);
    points.push([at, pack(icon.x + 28, icon.y + 28)], [at + 150, 0]);
  };
  const bar = height - 14, cx = width / 2;
  tap(500, 0); // Cold launch is Home; enter Today before the app gestures.
  swipe(2000, cx, bar, cx, bar - 100);
  if (scenario === 'all-apps') {
    APPS.forEach((app, i) => {
      if (app.page === 1 && APPS[i - 1]?.page !== 1) swipe(appTimes[i] - 1000, width - 40, height / 2, 40, height / 2);
      tap(appTimes[i], i);
      swipe(appTimes[i] + 650, cx, bar, cx, bar - 100, 180);
    });
  } else if (scenario === 'deck-dismiss') {
    const y = Math.min(300, height / 2);
    swipe(4000, cx, bar, cx, bar - 100);
    for (const at of [6500, 8000, 9500, 11000]) swipe(at, 100, y, width - 60, y);
    swipe(12500, width - 80, y, 100, y);
    points.push([14000, pack(width - 20, height - 60)], [14150, 0]);
    swipe(17500, cx, bar, cx, bar - 100);
    swipe(19500, 100, y, width - 60, y);
    points.push([21000, pack(width - 20, height - 60)], [21150, 0]);
  } else {
    for (let at = 4000; at < 14000; at += 2000) {
      const left = (at / 2000) % 2 === 0;
      swipe(at, left ? width - 40 : 40, height / 2, left ? 40 : width - 40, height / 2);
    }
    for (let at = 14000; at < 24000; at += 2000) {
      tap(at, 0); swipe(at + 800, cx, bar, cx, bar - 100);
    }
    swipe(25000, cx, bar, cx, bar - 100);
    swipe(26800, cx, height / 2, cx + 100, height / 2);
    swipe(28200, cx, height / 2, cx - 100, height / 2);
  }
  points.push([30000, 0]);
  const phases: readonly (readonly [string, number, number])[] = scenario === 'all-apps' ?
    APPS.flatMap((app, i) => [[`${app.name}-open`, appTimes[i] + 150, appTimes[i] + 650],
      [`${app.name}-home`, appTimes[i] + 650, appTimes[i] + 1300]] as const) : scenario === 'deck-dismiss' ?
    [['deep-paging', 6500, 13400], ['browsed-deck', 13000, 14000], ['dismiss-start', 14150, 14350], ['dismiss', 14150, 14650],
      ['dismiss-again', 21150, 21650]] as const :
    [['idle-app', 1100, 1950], ['first-app-home', 2000, 3650], ['home-pages', 4000, 13500],
      ['app-home', 14000, 23900], ['switcher', 25000, 29800]] as const;
  return { points, phases };
}

export function analyzeE7Trace(source: string, width: number, height: number, scenario: Scenario) {
  const workload = e7Workload(width, height, scenario);
  const lines = source.trim().split(/\r?\n/);
  const metadata = Object.fromEntries(lines.filter(l => l.startsWith('# ')).map(l => { const [k, ...v] = l.slice(2).split('\t'); return [k, v.join(' ')]; }));
  if (metadata.viewport !== `${width} ${height}`) throw new Error('Trace viewport differs from the replay dimensions; pass the same width and height to make and analyze');
  if (metadata.inactive_frames !== '0') throw new Error('Invalid foreground measurement: unlock the E7 and keep Pocket Shell visible throughout replay');
  if (Number(metadata.replay_points) !== workload.points.length) throw new Error('Trace does not contain the complete requested replay');
  const frameRate = Number(metadata.frame_rate);
  if (!Number.isInteger(frameRate) || frameRate <= 0 || 60 % frameRate !== 0) throw new Error('Invalid native replay frame rate');
  const header = lines.find(l => l.startsWith('frame\t'));
  if (!header) throw new Error('Incomplete trace: missing frame rows');
  const keys = header.split('\t');
  const required = ['frame', 'elapsed_ms', 'delta_ms', 'js_ms', 'tick_ms', 'draw_ms', 'present_ms', 'touches', 'replay_ms'];
  if (new Set(keys).size !== keys.length || required.some(key => !keys.includes(key))) throw new Error('Incomplete trace: missing or duplicate timing columns');
  const rows = lines.filter(l => l && !l.startsWith('# ') && l !== header).map(line => {
    const values = line.split('\t').map(v => v.trim() ? Number(v) : NaN);
    if (values.length !== keys.length || values.some(v => !Number.isFinite(v) || v < 0)) throw new Error('Invalid numeric frame row');
    return Object.fromEntries(values.map((v, i) => [keys[i], v]));
  });
  const at = (r: Record<string, number>) => r.replay_ms;
  if (!rows.length || rows[0].elapsed_ms !== 0 || at(rows.at(-1)!) < 30000) throw new Error('Incomplete 30 second workload');
  // The exact generated points also define expected contact state. There is
  // no second list of timing constants to drift when a gesture changes.
  let point = 0, touch = 0;
  for (const [index, row] of rows.entries()) {
    if (row.frame !== index || at(row) !== Math.floor(index * 1000 / frameRate) || (index > 0 &&
        (row.elapsed_ms <= rows[index - 1].elapsed_ms || at(row) <= at(rows[index - 1]) || row.delta_ms <= 0)))
      throw new Error('Trace has missing, duplicate or out-of-order frames');
    while (point < workload.points.length && workload.points[point][0] <= at(row)) touch = workload.points[point++][1];
    if (row.touches !== Number(touch !== 0)) throw new Error(`Replay touch mismatch at ${at(row)} ms; leave the screen untouched during measurement`);
  }
  const phases = workload.phases;
  const metrics = phases.map(([name, from, to]) => {
    const part = rows.filter(r => at(r) >= from && at(r) < to &&
      (name !== 'deep-paging' || (at(r) - from) % 1500 < 900) &&
      (name !== 'home-pages' || (at(r) - from) % 2000 < 900) &&
      (name !== 'app-home' || ((at(r) - from) % 2000 >= 800 && (at(r) - from) % 2000 < 1650)));
    if (!part.length) throw new Error(`Missing samples for ${name}`);
    const stats = (key: string) => {
      const a = part.map(r => r[key]).sort((a, b) => a - b);
      return { mean: a.reduce((a, b) => a + b, 0) / a.length, p50: a[Math.floor((a.length - 1) * .5)], p95: a[Math.ceil((a.length - 1) * .95)], max: a.at(-1) };
    };
    const render = Object.fromEntries(['scene_ms', 'resources_ms', 'geometry_ms', 'upload_ms', 'submit_ms', 'error_ms', 'hit_ms', 'batches', 'vertices']
      .filter(key => keys.includes(key)).map(key => [key, stats(key)]));
    return { name, frames: part.length, fps: 1000 / stats('delta_ms').mean, delta: stats('delta_ms'), js: stats('js_ms'), tick: stats('tick_ms'), draw: stats('draw_ms'), present: stats('present_ms'), render };
  });
  return { metadata, scenario, frames: rows.length, phases: metrics };
}

if (import.meta.main) {
  const [command, file, widthArg = '360', heightArg = '640', scenario = 'navigation'] = process.argv.slice(2);
  if (!file || !['make', 'analyze'].includes(command) || !scenarios.includes(scenario))
    throw new Error('e7-perf.ts make <input.tsv> | analyze <trace.tsv> [width height [navigation|deck-dismiss|all-apps]]');
  const width = Number(widthArg), height = Number(heightArg);
  if (command === 'make') {
    const { points } = e7Workload(width, height, scenario as Scenario);
    mkdirSync(dirname(resolve(file)), { recursive: true });
    await Bun.write(file, points.map(p => p.join('\t')).join('\n') + '\n');
    console.log(JSON.stringify({ input: resolve(file), scenario, width, height, points: points.length }));
  } else {
    console.log(JSON.stringify(analyzeE7Trace(await Bun.file(file).text(), width, height, scenario as Scenario), null, 2));
  }
}
