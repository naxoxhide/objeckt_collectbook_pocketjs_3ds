// SPDX-License-Identifier: GPL-3.0-or-later
import { expect, test } from 'bun:test';
import { analyzeE7Trace, e7Workload, type Scenario } from '../scripts/e7-perf.ts';

// A synthetic native trace with independent wall time (50 fps) and the host's
// fixed virtual clock (60 Hz). It never stands in for device performance.
function trace(scenario: Scenario = 'navigation', width = 360, height = 640) {
  const { points } = e7Workload(width, height, scenario);
  const lines = [`# viewport\t${width}\t${height}`, `# replay_points\t${points.length}`, '# inactive_frames\t0', '# frame_rate\t60',
    'frame\telapsed_ms\tdelta_ms\tjs_ms\ttick_ms\tdraw_ms\tpresent_ms\ttouches\treplay_ms'];
  let point = 0, touch = 0;
  for (let frame = 0; frame <= 1800; frame++) {
    const at = Math.floor(frame * 1000 / 60);
    while (point < points.length && points[point][0] <= at) touch = points[point++][1];
    lines.push([frame, frame * 20, frame ? 20 : 0, 4, 1, 7, 8, Number(touch !== 0), at].join('\t'));
  }
  return lines.join('\n');
}

for (const scenario of ['navigation', 'deck-dismiss', 'all-apps'] as const) {
  for (const [width, height] of [[360, 640], [640, 360]]) {
    test(`${scenario} ${width}x${height}: analyze the generated contacts with wall-clock frame intervals`, () => {
      const { points } = e7Workload(width, height, scenario);
      expect(points.every(([at], i) => !i || at > points[i - 1][0])).toBe(true);
      expect(points.at(-1)).toEqual([30000, 0]);
      const report = analyzeE7Trace(trace(scenario, width, height), width, height, scenario);
      expect(report.frames).toBe(1801);
      expect(report.phases.every(p => p.frames > 0 && p.fps === 50)).toBe(true);
      if (scenario === 'all-apps') expect(report.phases).toHaveLength(32);
    });
  }
}

test('reject idle, mismatched, interrupted and malformed traces before reporting FPS', () => {
  const valid = trace();
  const reject = (source: string) => expect(() => analyzeE7Trace(source, 360, 640, 'navigation')).toThrow();
  reject(valid.replace(/# replay_points\t\d+/, '# replay_points\t0'));
  reject(valid.replace('# inactive_frames\t0', '# inactive_frames\t1'));
  reject(valid.replace('# frame_rate\t60', '# frame_rate\t0'));
  reject(valid.replace('# viewport\t360\t640', '# viewport\t640\t360'));
  reject(trace('deck-dismiss'));
  reject(valid.replace('js_ms', 'missing_js'));
  reject(valid.replace('js_ms', 'draw_ms'));
  for (const value of ['NaN', 'Infinity', '-1', '']) {
    reject(valid.replace('1\t20\t20\t4', `1\t20\t20\t${value}`));
  }
  const rows = valid.split('\n');
  reject(rows.filter(row => !row.startsWith('100\t')).join('\n'));
  reject(rows.slice(0, -500).join('\n'));
  reject(rows.slice(0, -1).join('\n'));
  reject(valid.replace('1\t20\t20\t4\t1\t7\t8\t0\t16', '1\t20\t20\t4\t1\t7\t8\t0\t15'));
  // Real contact during the idle tail after the last named deck phase is
  // still interference; it cannot be ignored because metrics ended earlier.
  const deck = trace('deck-dismiss').split('\n');
  const at = deck.findIndex(row => row.startsWith('1500\t'));
  const fields = deck[at].split('\t'); fields[7] = '1'; deck[at] = fields.join('\t');
  expect(() => analyzeE7Trace(deck.join('\n'), 360, 640, 'deck-dismiss')).toThrow('Replay touch mismatch');
});
