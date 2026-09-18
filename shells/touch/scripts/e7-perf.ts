// SPDX-License-Identifier: GPL-3.0-or-later
// Reproducible native-input workload and frame-time summary. Device traces
// measure CPU submission/presentation, not GPU execution or panel scanout.
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { shellLayout } from '../src/layout.ts';

const [command, file, widthArg = '360', heightArg = '640', scenario = 'navigation'] = process.argv.slice(2);
if (!file || !['make', 'analyze'].includes(command) || !['navigation', 'deck-dismiss'].includes(scenario)) {
  throw new Error('e7-perf.ts make <input.tsv> | analyze <trace.tsv> [width height [navigation|deck-dismiss]]');
}
if (command === 'make') {
  const width = Number(widthArg), height = Number(heightArg);
  if (![[360, 640], [640, 360]].some(([w, h]) => w === width && h === height)) throw new Error('Expected an E7 viewport');
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
  swipe(2000, cx, bar, cx, bar - 100);
  if (scenario === 'deck-dismiss') {
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
  mkdirSync(dirname(resolve(file)), { recursive: true });
  await Bun.write(file, points.map(p => p.join('\t')).join('\n') + '\n');
  console.log(JSON.stringify({ input: resolve(file), scenario, width, height, points: points.length }));
} else {
  const lines = (await Bun.file(file).text()).trim().split(/\r?\n/);
  const metadata = Object.fromEntries(lines.filter(l => l.startsWith('# ')).map(l => { const [k, ...v] = l.slice(2).split('\t'); return [k, v.join(' ')]; }));
  if (metadata.viewport !== `${Number(widthArg)} ${Number(heightArg)}`) throw new Error('Trace viewport differs from the replay dimensions; pass the same width and height to make and analyze');
  if (Number(metadata.inactive_frames ?? 0) > 0) throw new Error('Invalid foreground measurement: unlock the E7 and keep Pocket Shell visible throughout replay');
  const header = lines.find(l => l.startsWith('frame\t'));
  if (!header) throw new Error('Incomplete trace: missing frame rows');
  const keys = header.split('\t');
  const rows = lines.filter(l => /^\d+\t/.test(l)).map(l => Object.fromEntries(l.split('\t').map((v, i) => [keys[i], Number(v)])));
  const at = (r: Record<string, number>) => r.replay_ms ?? r.elapsed_ms;
  if (!rows.length || at(rows.at(-1)!) < 29900) throw new Error('Incomplete 30 second workload');
  const phases = scenario === 'deck-dismiss' ?
    [['browsed-deck', 13000, 14000], ['dismiss-start', 14150, 14350], ['dismiss', 14150, 14650],
      ['dismiss-again', 21150, 21650], ['idle-home', 25000, 29000]] as const :
    [['idle-app', 500, 1950], ['home-pages', 4000, 13500], ['app-home', 14000, 23900], ['switcher', 25000, 29800]] as const;
  const metrics = phases.map(([name, from, to]) => {
    const part = rows.filter(r => at(r) >= from && at(r) < to &&
      // Exclude the first texture-upload interval if it crosses into idle.
      (name !== 'idle-app' || r.replay_ms !== undefined || r.elapsed_ms - r.delta_ms >= from) &&
      (name !== 'home-pages' || (at(r) - from) % 2000 < 900) &&
      (name !== 'app-home' || ((at(r) - from) % 2000 >= 800 && (at(r) - from) % 2000 < 1650)));
    if (!part.length) throw new Error(`Missing samples for ${name}`);
    const stats = (key: string) => {
      const a = part.map(r => r[key]).sort((a, b) => a - b);
      return { mean: a.reduce((a, b) => a + b, 0) / a.length, p50: a[Math.floor((a.length - 1) * .5)], p95: a[Math.ceil((a.length - 1) * .95)], max: a.at(-1) };
    };
    const render = Object.fromEntries(['scene_ms', 'resources_ms', 'geometry_ms', 'upload_ms', 'submit_ms', 'batches', 'vertices']
      .filter(key => keys.includes(key)).map(key => [key, stats(key)]));
    return { name, frames: part.length, fps: 1000 / stats('delta_ms').mean, delta: stats('delta_ms'), js: stats('js_ms'), tick: stats('tick_ms'), draw: stats('draw_ms'), present: stats('present_ms'), render };
  });
  console.log(JSON.stringify({ metadata, scenario, frames: rows.length, phases: metrics }, null, 2));
}
