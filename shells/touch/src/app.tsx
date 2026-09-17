// SPDX-License-Identifier: GPL-3.0-or-later
import { createSignal, onMount } from "solid-js";
import { View, Text, Image, type NodeMirror } from "@pocketjs/framework/components";
import { createJumpBatch, jump, type JumpBatch } from "@pocketjs/framework/animation";
import { createGesture, type GestureContact } from "@pocketjs/framework/gesture";
import { createScroller } from "@pocketjs/framework/kinetics";
import { onFrame } from "@pocketjs/framework/lifecycle";
import { simulationHz } from "@pocketjs/framework/clock";
import { reportAppAction } from "@pocketjs/framework/host";
import { Navigation, ICON_X, ICON_Y, smooth } from "./navigation.ts";
import { APPS } from "./catalog.ts";

const NAMES = APPS.map(app => app.name);
const COLORS = APPS.map(app => app.color);
const CHROME_LAYER = APPS.length * 2 + 8;

function Icon(props: { index: number }) {
  return <View class="absolute w-[56] h-[56] rounded-[16]" style={{ bgColor: COLORS[props.index] }}>
    {props.index === 0 ? <>
      <View class="absolute left-[14] top-[15] w-[28] h-[4] rounded bg-white" />
      <View class="absolute left-[14] top-[25] w-[21] h-[4] rounded bg-white" />
      <View class="absolute left-[14] top-[35] w-[25] h-[4] rounded bg-white" />
    </> : props.index === 1 ? <>
      <View class="absolute left-[27] top-[12] w-[4] h-[29] rounded bg-white" />
      <View class="absolute left-[27] top-[12] w-[14] h-[5] rounded bg-white" style={{ rotate: -14 }} />
      <View class="absolute left-[15] top-[32] w-[16] h-[12] rounded-full bg-white" />
    </> : props.index === 2 ? <>
      <View class="absolute left-[13] top-[13] w-[30] h-[30] rounded-full border-[3] border-white" />
      <View class="absolute left-[24] top-[20] w-[8] h-[16] rounded bg-white" style={{ rotate: 32 }} />
    </> : props.index === 3 ? <>
      <View class="absolute left-[11] top-[10] w-[23] h-[23] rounded-full bg-[#ffe0a0]" />
      <View class="absolute left-[13] top-[27] w-[34] h-[16] rounded-full bg-white" />
      <View class="absolute left-[25] top-[20] w-[18] h-[20] rounded-full bg-white" />
    </> : props.index === 4 ? <>
      <View class="absolute left-[13] top-[11] w-[31] h-[35] rounded bg-[#fff9df]" />
      {[21, 28, 35].map(y => <View class="absolute left-[19] w-[19] h-[2] bg-[#d4a444]" style={{ insetT: y }} />)}
    </> : <>
      <View class="absolute left-[11] top-[13] w-[34] h-[30] rounded bg-[#ffe9ef]" />
      <View class="absolute left-[30] top-[18] w-[8] h-[8] rounded-full bg-[#edba77]" />
      <View class="absolute left-[17] top-[28] w-[21] h-[12] rounded bg-[#ac85c2]" />
    </>}
  </View>;
}

function Today() {
  return <>
    <View class="absolute left-[22] top-[10] w-[276] h-[148] rounded-[16] bg-[#e5ecff]">
      <Text class="absolute left-[18] top-[15] text-xs font-bold text-[#5273cc] tracking-wide">A LITTLE SPACE</Text>
      <Text class="absolute left-[18] top-[43] text-2xl font-bold text-[#243d79]">Make time</Text>
      <Text class="absolute left-[18] top-[73] text-2xl font-bold text-[#243d79]">for a slow day.</Text>
      <Text class="absolute left-[18] top-[117] text-xs text-[#5273cc]">Open your afternoon  →</Text>
      <View class="absolute right-[17] top-[18] w-[24] h-[24] rounded-full bg-[#a7bdfb]" />
    </View>
    <Text class="absolute left-[24] top-[180] text-xs font-bold text-[#7b8496] tracking-wide">YOUR AFTERNOON</Text>
    {["Walk by the water", "Find a new record", "Coffee with a friend", "Take the long way home", "Write a little", "Watch the evening light"].map((label, i) =>
      <View class="absolute left-[22] w-[276] h-[64] " style={{ insetT: 202 + i * 66 }}>
        <View class="absolute left-[2] top-[17] w-[24] h-[24] rounded-full border border-[#bdc8df]" />
        <Text class="absolute left-[38] top-[19] text-base text-[#303b53]">{label}</Text>
      </View>)}
  </>;
}

function Music() {
  return <>
    <View class="absolute left-[42] top-[8] w-[236] h-[214] rounded-[16] bg-gradient-to-b from-[#edb798] to-[#a85558] overflow-hidden">
      <View class="absolute left-[70] top-[32] w-[98] h-[98] rounded-full bg-[#f9d6a4]" />
      <View class="absolute left-[-45] top-[118] w-[330] h-[200] rounded-full bg-[#ac6761]" style={{ rotate: -18 }} />
      <View class="absolute left-[30] top-[153] w-[300] h-[150] rounded-full bg-[#74474e]" />
      <Text class="absolute left-[20] top-[174] text-sm text-[#ffe6d4] tracking-wide">S L O W   W A V E S</Text>
    </View>
    <Text class="absolute left-[42] top-[242] text-xl font-bold text-[#553943]">Golden hour</Text>
    <Text class="absolute left-[42] top-[272] text-sm text-[#96767e]">Slow Waves · afternoon mix</Text>
    <View class="absolute left-[42] top-[312] w-[236] h-[3] rounded bg-[#e9d4d2]">
      <View class="w-[88] h-[3] rounded bg-[#bb786e]" />
    </View>
    <Text class="absolute left-[42] top-[325] text-xs text-[#96767e]">1:24</Text>
    <Text class="absolute right-[42] top-[325] text-xs text-[#96767e]">3:46</Text>
    <View class="absolute left-[138] top-[369] w-[7] h-[26] rounded bg-[#84565d]" />
    <View class="absolute left-[155] top-[369] w-[7] h-[26] rounded bg-[#84565d]" />
    <Text class="absolute left-[80] top-[369] text-xl text-[#84565d]">‹‹</Text>
    <Text class="absolute left-[214] top-[369] text-xl text-[#84565d]">››</Text>
    <Text class="absolute left-[42] top-[447] text-xs text-[#96767e]">A quiet soundtrack for the day.</Text>
  </>;
}

function Places() {
  return <>
    <View class="absolute left-[22] top-[8] w-[276] h-[228] rounded-[16] bg-[#d7e7d4] overflow-hidden">
      <View class="absolute left-[125] top-[-40] w-[66] h-[330] bg-[#a4cddd]" style={{ rotate: 24 }} />
      {[35, 98, 164].map(y => <View class="absolute left-[-20] w-[330] h-[11] bg-[#f8f4df]" style={{ insetT: y, rotate: -12 }} />)}
      {[45, 223].map(x => <View class="absolute top-[-20] w-[9] h-[280] bg-[#f8f4df]" style={{ insetL: x, rotate: 14 }} />)}
      <View class="absolute left-[82] top-[107] w-[40] h-[40] rounded-full bg-[#83b9ac]">
        <View class="absolute left-[10] top-[10] w-[20] h-[20] rounded-full bg-[#348b82] border-[3] border-white" />
      </View>
      <View class="absolute left-[174] top-[53] w-[12] h-[12] rounded-full bg-[#f29a7a] border-[2] border-white" />
    </View>
    <Text class="absolute left-[24] top-[260] text-xl font-bold text-[#315e59]">Along the river</Text>
    <Text class="absolute left-[24] top-[291] text-sm text-[#78908a]">A familiar path. A different pace.</Text>
    <View class="absolute left-[22] top-[331] w-[276] h-[72] rounded-xl bg-[#e8eeE7]">
      <Text class="absolute left-[16] top-[12] text-base font-bold text-[#416e65]">Riverside walk</Text>
      <Text class="absolute left-[16] top-[39] text-sm text-[#78908a]">18 min    ·    1.2 km</Text>
    </View>
    <Text class="absolute left-[24] top-[444] text-sm text-[#78908a]">No rush to get there.</Text>
  </>;
}

function Weather() {
  return <>
    <View class="absolute left-[22] top-[8] w-[276] h-[190] rounded-[16] bg-[#dcecf9]">
      <Text class="absolute left-[20] top-[16] text-sm text-[#4b7caa]">Thursday afternoon</Text>
      <Text class="absolute left-[17] top-[53] text-4xl font-bold text-[#2c5b88]">21°</Text>
      <View class="absolute right-[29] top-[50] w-[67] h-[67] rounded-full bg-[#f6ce78]" />
      <Text class="absolute left-[20] top-[113] text-xl text-[#386c97]">A little sunshine</Text>
      <Text class="absolute left-[20] top-[151] text-sm text-[#648aab]">High 23°   ·   Low 16°</Text>
    </View>
    <Text class="absolute left-[24] top-[221] text-xs font-bold text-[#6d91ac]">THE REST OF THE DAY</Text>
    {["Now", "16:00", "18:00", "20:00"].map((time, i) => <View class="absolute top-[252] w-[60] h-[100] rounded-xl bg-white" style={{ insetL: 22 + i * 72 }}>
      <Text class="absolute top-[12] w-full text-center text-xs text-[#6d91ac]">{time}</Text>
      <View class="absolute left-[21] top-[36] w-[18] h-[18] rounded-full bg-[#f6ce78]" />
      <Text class="absolute top-[68] w-full text-center text-base text-[#386c97]">{[21, 22, 20, 18][i]}°</Text>
    </View>)}
    <View class="absolute left-[22] top-[375] w-[276] h-[96] rounded-xl bg-[#dfebf5]">
      <Text class="absolute left-[17] top-[14] text-sm font-bold text-[#386c97]">A good day to head outside</Text>
      <Text class="absolute left-[17] top-[46] text-sm text-[#648aab]">Sunset 19:12</Text>
      <Text class="absolute left-[17] top-[69] text-xs text-[#648aab]">Light breeze from the west.</Text>
    </View>
  </>;
}

function Notes() {
  const notes = [
    ["Small things", "Coffee before the city wakes.", "The long way by the river."],
    ["Weekend ideas", "A bookshop with no plan.", "Bring the camera this time."],
    ["Keep listening", "That record from last Sunday.", "Ask about the last track."],
    ["For later", "Leave room for a new idea.", "A little space on the page."],
  ];
  return <>
    <Text class="absolute left-[24] top-[11] text-sm text-[#a18c59]">4 notes   ·   All on this device</Text>
    {notes.map(([title, line1, line2], i) => <View class="absolute left-[22] w-[276] h-[114] rounded-xl bg-[#fff3cd]" style={{ insetT: 48 + i * 128 }}>
      <View class="absolute left-0 top-[14] bottom-[14] w-[3] rounded bg-[#d8b66b]" />
      <Text class="absolute left-[18] top-[16] text-xl font-bold text-[#6c5831]">{title}</Text>
      <Text class="absolute left-[18] top-[53] text-sm text-[#9b875c]">{line1}</Text>
      <Text class="absolute left-[18] top-[78] text-sm text-[#9b875c]">{line2}</Text>
    </View>)}
  </>;
}

function Photos() {
  return <>
    <View class="absolute left-[22] top-[8] w-[276] h-[185] rounded-[16] bg-[#e4b7b2] overflow-hidden">
      <View class="absolute right-[32] top-[26] w-[58] h-[58] rounded-full bg-[#ffe2b6]" />
      <View class="absolute left-[-40] top-[99] w-[300] h-[160] rounded-full bg-[#9b819b]" style={{ rotate: -12 }} />
      <View class="absolute right-[-45] top-[132] w-[270] h-[130] rounded-full bg-[#655e7d]" />
      <Text class="absolute left-[17] top-[150] text-sm font-bold text-white">An afternoon away</Text>
    </View>
    <Text class="absolute left-[24] top-[217] text-xs font-bold text-[#a18aa9]">RECENT MOMENTS</Text>
    {["#c9d9c8", "#c1d9e4", "#e8cfb4", "#d7c8e6"].map((color, i) => <View class="absolute w-[131] h-[125] rounded-xl overflow-hidden" style={{ insetL: 22 + i % 2 * 145, insetT: 249 + Math.floor(i / 2) * 139, bgColor: color }}>
      <View class="absolute right-[17] top-[17] w-[28] h-[28] rounded-full bg-[#fff1d1]" />
      <View class="absolute left-[-25] top-[65] w-[180] h-[105] rounded-full" style={{ bgColor: ["#7da599", "#82aaba", "#b99683", "#a98dab"][i], rotate: -15 }} />
      <Text class="absolute left-[12] bottom-[11] text-xs font-bold text-white">{["Riverside", "Open sky", "Warm light", "After hours"][i]}</Text>
    </View>)}
  </>;
}

export default function TouchShell() {
  const nav = new Navigation();
  const [stack, setStack] = createSignal("");
  const layer = (index: number) => { stack(); return nav.layer(index); };
  const windows: NodeMirror[] = [], contents: NodeMirror[] = [], labels: NodeMirror[] = [];
  let wallpaper!: NodeMirror, home!: NodeMirror, overview!: NodeMirror, empty!: NodeMirror;
  let detail!: NodeMirror, detailUnder!: NodeMirror, pill!: NodeMirror;
  let batch: JumpBatch | undefined;
  let actionCount = 0;
  const scrollers = APPS.map(({ height }) => createScroller({ max: () => height - 300, extent: () => 300, overscroll: 65 }));

  function finish(c: GestureContact, cancelled = false) {
    if (nav.drag?.id !== c.id) return;
    if (nav.drag.kind === "content") scrollers[nav.selected].endDrag(cancelled ? 0 : -c.vy);
    nav.up(c, cancelled);
  }
  createGesture({
    panSlop: 0,
    onDown(c) {
      const kind = nav.down(c);
      if (kind === "content") scrollers[nav.selected].beginDrag();
    },
    onPanMove(c) {
      if (nav.drag?.id !== c.id) return;
      if (nav.drag.kind === "content") scrollers[nav.selected].drag(-c.fdy / nav.cards[nav.selected].scale.value);
      nav.move(c, 1 / simulationHz());
    },
    onUp: c => finish(c),
    onCancel: c => finish(c, true),
  });

  onMount(() => {
    batch = createJumpBatch(windows.flatMap(node => [
      [node, "translateX"], [node, "translateY"], [node, "scaleX"], [node, "scaleY"], [node, "radius"], [node, "opacity"],
    ] as const));
    paint();
  });

  function paint() {
    if (!batch) return;
    setStack(`${nav.foreground}/${nav.opened.join(",")}`);
    const active = nav.cards[nav.selected];
    const scene = nav.scene.value;
    const expansion = smooth(0.175, 1, scene);
    jump(home, "opacity", 1 - smooth(0.2, 0.52, scene));
    // Occluded wallpaper and detail-underlay subtrees contribute no draw work.
    jump(wallpaper, "opacity", 1 - smooth(0.96, 1, scene) *
      (1 - smooth(0, 16, Math.abs(active.x.value) + Math.abs(active.y.value))));
    jump(wallpaper, "scaleX", 1.06 - expansion * 0.06);
    jump(wallpaper, "scaleY", 1.06 - expansion * 0.06);
    const overviewOpacity = Math.max(0, Math.min(1, nav.overview.value));
    jump(overview, "opacity", nav.opened.length ? overviewOpacity : 0);
    jump(empty, "opacity", nav.opened.length ? 0 : overviewOpacity);
    const ink = smooth(0.75, 1, scene);
    jump(pill, "bgColor", (0xff000000 | (Math.round(255 - 184 * ink) << 16) |
      (Math.round(255 - 206 * ink) << 8) | Math.round(255 - 217 * ink)) >>> 0);
    jump(pill, "scaleX", 1 - (nav.drag?.kind === "navigation" ? 0.12 * (1 - expansion) : 0));
    for (let i = 0; i < windows.length; i++) {
      const c = nav.cards[i], b = i * 6;
      batch.set(b, c.x.value); batch.set(b + 1, c.y.value);
      batch.set(b + 2, c.scale.value); batch.set(b + 3, c.scale.value);
      batch.set(b + 4, 28 * (1 - smooth(0.72, 1, c.scale.value)));
      batch.set(b + 5, nav.paintVisibility(i));
      jump(contents[i], "translateY", -scrollers[i].offset());
      jump(labels[i], "translateX", c.x.value);
      jump(labels[i], "translateY", c.y.value - 29);
      jump(labels[i], "opacity", Math.max(0, Math.min(1, c.visibility.value)) * (1 - smooth(0.72, 0.96, c.scale.value)));
    }
    batch.commit();
    jump(detail, "translateX", 320 * (1 - nav.detail.value));
    jump(detail, "opacity", smooth(0, 0.01, nav.detail.value));
    jump(detailUnder, "translateX", -78 * nav.detail.value);
    jump(detailUnder, "opacity", 1 - smooth(0.95, 1, nav.detail.value));
  }

  onFrame(() => {
    nav.step(1 / simulationHz());
    scrollers.forEach(s => s.step());
    paint();
    if (nav.actions !== actionCount) {
      actionCount = nav.actions;
      reportAppAction("shell_touch_gesture", actionCount);
    }
  });

  return <View debugName="TouchShell" class="relative w-[320] h-[480] overflow-hidden">
    <Image nodeRef={n => wallpaper = n!} class="absolute left-0 top-0 w-[320] h-[480]" src="wallpaper.svg" />
    <View nodeRef={n => home = n!} class="absolute inset-0">
      <Text class="absolute left-[27] top-[91] text-4xl font-bold text-[#ffffff]">Pocket Shell</Text>
      <Text class="absolute left-[29] top-[139] text-base text-[#e8ced1]">A little room to move.</Text>
      <Text class="absolute left-[29] top-[187] text-xs text-[#eee0df]">Open an app. Follow your thumb.</Text>
      <View class="absolute left-[14] top-[334] w-[292] h-[104] rounded-[24] bg-[#ffffff] opacity-10" />
      {NAMES.map((name, i) => <View class="absolute w-[56] h-[82]" style={{ insetL: ICON_X[i], insetT: ICON_Y[i] }}>
        <Icon index={i} />
        <Text class="absolute top-[64] left-[-8] w-[72] text-center text-xs text-white">{name}</Text>
      </View>)}
    </View>
    <View nodeRef={n => overview = n!} class="absolute left-0 right-0 bottom-[42] h-[21]">
      <Text class="w-full text-center text-xs text-[#f8e7e8]">Slide between your spaces</Text>
    </View>
    <View nodeRef={n => empty = n!} class="absolute left-0 right-0 top-[200] h-[75]">
      <Text class="w-full text-center text-xl font-bold text-white">All clear.</Text>
      <Text class="absolute top-[37] w-full text-center text-xs text-[#f8e7e8]">Tap to return home and open an app.</Text>
    </View>
    {NAMES.map((name, i) => <>
      <Text nodeRef={n => labels[i] = n!} class="absolute left-0 top-0 text-sm font-bold text-white" style={{ zIndex: layer(i) + 1 }}>{name}</Text>
      <View nodeRef={n => windows[i] = n!} debugName={`TouchWindow${i}`} class="absolute left-0 top-0 w-[320] h-[480] overflow-hidden"
        style={{ originX: -0.5, originY: -0.5, zIndex: layer(i), bgColor: APPS[i].background }}>
        <View nodeRef={n => { if (i === 0) detailUnder = n!; }} class="absolute inset-0">
          <Text class="absolute left-[24] top-[47] text-xs font-bold tracking-wide" style={{ textColor: COLORS[i] }}>{APPS[i].subtitle}</Text>
          <Text class="absolute left-[22] top-[73] text-4xl font-bold text-[#27334b]">{name}</Text>
          <View class="absolute left-0 top-[126] w-[320] h-[306] overflow-hidden">
            <View nodeRef={n => contents[i] = n!} class="absolute left-0 top-0 w-[320] h-[620]">
              {i === 0 ? <Today /> : i === 1 ? <Music /> : i === 2 ? <Places /> : i === 3 ? <Weather /> : i === 4 ? <Notes /> : <Photos />}
            </View>
          </View>
          <Text class="absolute left-0 right-0 bottom-[26] text-center text-xs text-[#8b90a3]">Swipe for home · hold for apps</Text>
        </View>
        {i === 0 ? <View nodeRef={n => detail = n!} class="absolute inset-0 bg-[#f7f8fc]" style={{ translateX: 320 }}>
          <Text class="absolute left-[23] top-[48] text-sm font-bold text-[#537bf4]">‹  Today</Text>
          <Text class="absolute left-[23] top-[99] text-4xl font-bold text-[#27334b]">Slow afternoon</Text>
          <Text class="absolute left-[25] top-[148] text-sm text-[#7b8496]">Leave a little space in your day.</Text>
          <View class="absolute left-[23] top-[194] w-[274] h-[156] rounded-[16] bg-[#e5ecff]">
            <Text class="absolute left-[21] top-[24] text-xl font-bold text-[#38559b]">Take the scenic route.</Text>
            <Text class="absolute left-[21] top-[66] text-base text-[#5c75aa]">A walk. A record. A good coffee.</Text>
            <Text class="absolute left-[21] top-[110] text-sm text-[#5c75aa]">The rest can wait.</Text>
          </View>
          <Text class="absolute left-[25] top-[382] text-sm text-[#7b8496]">Drag from the left edge to go back.</Text>
        </View> : null}
      </View>
    </>)}
    <Text class="absolute left-[23] top-[13] text-xs font-bold text-[#80879a]" style={{ zIndex: CHROME_LAYER }}>9:41</Text>
    <View class="absolute right-[25] top-[14] w-[21] h-[9] rounded border border-[#80879a]" style={{ zIndex: CHROME_LAYER }}>
      <View class="absolute left-[2] top-[2] w-[15] h-[3] rounded bg-[#80879a]" />
    </View>
    <View nodeRef={n => pill = n!} class="absolute left-[112] bottom-[9] w-[96] h-[4] rounded-full bg-[#263147]" style={{ zIndex: CHROME_LAYER }} />
  </View>;
}
