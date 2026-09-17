// SPDX-License-Identifier: GPL-3.0-or-later
import { createSignal, onMount } from "solid-js";
import { View, Text, Image, type NodeMirror } from "@pocketjs/framework/components";
import { createJumpBatch, jump, type JumpBatch } from "@pocketjs/framework/animation";
import { createGesture, type GestureContact } from "@pocketjs/framework/gesture";
import { createScroller } from "@pocketjs/framework/kinetics";
import { onFrame } from "@pocketjs/framework/lifecycle";
import { simulationHz } from "@pocketjs/framework/clock";
import { reportAppAction } from "@pocketjs/framework/host";
import { Navigation, smooth } from "./navigation.ts";
import { APPS, HOME_PAGES } from "./catalog.ts";
import { Icon, AppMockup } from "./mockups.tsx";

const NAMES = APPS.map(app => app.name);
const COLORS = APPS.map(app => app.color);
const CHROME_LAYER = APPS.length * 2 + 8;

export default function TouchShell() {
  const nav = new Navigation();
  const [stack, setStack] = createSignal("");
  const layer = (index: number) => { stack(); return nav.layer(index); };
  const windows: NodeMirror[] = [], contents: NodeMirror[] = [], labels: NodeMirror[] = [];
  const pages: NodeMirror[] = [], dots: NodeMirror[] = [];
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
    for (let i = 0; i < HOME_PAGES; i++) {
      const x = (i - nav.homePage.value) * 320;
      jump(pages[i], "translateX", x);
      jump(pages[i], "opacity", x <= -320 || x >= 320 ? 0 : 1);
      jump(dots[i], "opacity", 0.28 + 0.72 * Math.max(0, 1 - Math.abs(i - nav.homePage.value)));
    }
    jump(wallpaper, "translateX", -8 * nav.homePage.value * (1 - expansion));
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
      {Array.from({ length: HOME_PAGES }, (_, page) => <View nodeRef={n => pages[page] = n!} debugName={`TouchHomePage${page}`} class="absolute inset-0">
        <Text class="absolute left-[22] top-[53] text-2xl font-bold text-white">{page === 0 ? 'Pocket Shell' : 'A little more.'}</Text>
        <Text class="absolute left-[24] top-[98] text-xs text-[#eee0df]">{page === 0 ? 'A little room to move.' : 'Everyday things, a swipe away.'}</Text>
        {APPS.map((app, i) => app.page === page ? <View debugName={`TouchHomeIcon${i}`} class="absolute w-[56] h-[82]" style={{ insetL: app.x, insetT: app.y }}>
          <Icon index={i} />
          <Text class="absolute top-[64] left-[-9] w-[74] text-center text-xs text-white">{app.name}</Text>
        </View> : null)}
        {page === 1 ? <>
          <View class="absolute left-[20] top-[246] w-[132] h-[71] rounded-[18] bg-[#d7c6d5]">
            <Text class="absolute left-[14] top-[12] text-xs font-bold text-[#79627d]">A LITTLE PAUSE</Text>
            <Text class="absolute left-[14] top-[36] text-base font-bold text-[#65536c]">Take a breath.</Text>
          </View>
          <View class="absolute left-[168] top-[246] w-[130] h-[71] rounded-[18] bg-[#d4e2dc]">
            <Text class="absolute left-[14] top-[12] text-xs font-bold text-[#6f9082]">OUTSIDE</Text>
            <Text class="absolute left-[14] top-[36] text-lg font-bold text-[#567b69]">21° · Sunny</Text>
          </View>
        </> : null}
      </View>)}
      {Array.from({ length: HOME_PAGES }, (_, page) => <View nodeRef={n => dots[page] = n!} debugName={`TouchHomeDot${page}`} class="absolute top-[337] w-[6] h-[6] rounded-full bg-white" style={{ insetL: 149 + page * 16 }} />)}
      <View debugName="TouchHomeDock" class="absolute left-[10] top-[354] w-[300] h-[94] rounded-[24] bg-white opacity-10" />
      {APPS.map((app, i) => app.page < 0 ? <View debugName={`TouchHomeIcon${i}`} class="absolute w-[56] h-[82]" style={{ insetL: app.x, insetT: app.y }}>
        <Icon index={i} />
        <Text class="absolute top-[64] left-[-9] w-[74] text-center text-xs text-white">{app.name}</Text>
      </View> : null)}
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
              <AppMockup index={i} />
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
