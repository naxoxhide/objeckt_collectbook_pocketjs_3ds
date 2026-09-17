// SPDX-License-Identifier: GPL-3.0-or-later
import { View, Text } from "@pocketjs/framework/components";
import { APPS } from "./catalog.ts";
const COLORS = APPS.map(app => app.color);

export function Icon(props: { index: number }) {
  if (props.index >= 6) return <ExtraIcon index={props.index} />;
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

function ExtraIcon(props: { index: number }) {
  const i = props.index;
  return <View class="absolute w-[56] h-[56] rounded-[16]" style={{ bgColor: COLORS[i] }}>
    {i === 6 ? <>
      <View class="absolute left-[10] top-[17] w-[36] h-[25] rounded bg-white" />
      <View class="absolute left-[12] top-[22] w-[18] h-[2] bg-[#548fce]" style={{ rotate: 34 }} />
      <View class="absolute left-[26] top-[22] w-[18] h-[2] bg-[#548fce]" style={{ rotate: -34 }} />
    </> : i === 7 ? <>
      <View class="absolute left-[10] top-[10] w-[36] h-[37] rounded bg-[#fff8f4]" />
      <View class="absolute left-[10] top-[10] w-[36] h-[9] rounded bg-[#b85751]" />
      <Text class="absolute left-[13] top-[21] w-[30] text-center text-xl font-bold text-[#af5149]">17</Text>
    </> : i === 8 ? <>
      <View class="absolute left-[9] top-[9] w-[38] h-[38] rounded-full bg-[#f4f3f8]" />
      <View class="absolute left-[26] top-[16] w-[3] h-[15] rounded bg-[#555c76]" />
      <View class="absolute left-[26] top-[27] w-[13] h-[3] rounded bg-[#555c76]" />
      <View class="absolute left-[26] top-[25] w-[3] h-[13] rounded bg-[#de796b]" style={{ rotate: 28 }} />
    </> : i === 9 ? <>
      <View class="absolute left-[9] top-[9] w-[38] h-[38] rounded-full border-[2] border-white" />
      <View class="absolute left-[25] top-[14] w-[6] h-[28] rounded bg-white" style={{ rotate: 35 }} />
      <View class="absolute left-[27] top-[15] w-[6] h-[13] rounded bg-[#ed8b76]" style={{ rotate: 35 }} />
    </> : i === 10 ? <>
      <View class="absolute left-[10] top-[13] w-[18] h-[12] rounded bg-[#e0eaff]" />
      <View class="absolute left-[10] top-[20] w-[36] h-[24] rounded bg-white" />
    </> : i === 11 ? <>
      {[0, 45, 90, 135].map(rotate => <View class="absolute left-[25] top-[9] w-[6] h-[38] rounded bg-[#f3f4f8]" style={{ rotate }} />)}
      <View class="absolute left-[15] top-[15] w-[26] h-[26] rounded-full bg-[#f3f4f8]" />
      <View class="absolute left-[21] top-[21] w-[14] h-[14] rounded-full" style={{ bgColor: COLORS[i] }} />
    </> : i === 12 ? <>
      <View class="absolute left-[10] top-[18] w-[36] h-[25] rounded bg-[#e4ece6]" />
      <View class="absolute left-[16] top-[13] w-[14] h-[9] rounded bg-[#e4ece6]" />
      <View class="absolute left-[20] top-[22] w-[17] h-[17] rounded-full bg-[#586e67]" />
      <View class="absolute left-[24] top-[26] w-[9] h-[9] rounded-full bg-[#a2bdb1]" />
    </> : i === 13 ? <>
      <View class="absolute left-[12] top-[15] w-[19] h-[19] rounded-full bg-white" />
      <View class="absolute left-[25] top-[15] w-[19] h-[19] rounded-full bg-white" />
      <View class="absolute left-[17] top-[23] w-[22] h-[22] bg-white" style={{ rotate: 45 }} />
    </> : i === 14 ? <>
      <View class="absolute left-[10] top-[14] w-[17] h-[29] rounded bg-[#fff3d9]" style={{ rotate: -6 }} />
      <View class="absolute left-[29] top-[14] w-[17] h-[29] rounded bg-white" style={{ rotate: 6 }} />
    </> : <>
      <View class="absolute left-[12] top-[10] w-[32] h-[11] rounded bg-[#f3ebfd]" />
      {[0, 1, 2, 3, 4, 5].map(n => <View class="absolute w-[8] h-[8] rounded bg-white" style={{ insetL: 12 + n % 3 * 12, insetT: 27 + Math.floor(n / 3) * 12 }} />)}
    </>}
  </View>;
}

function Mail() {
  return <>
    <View class="absolute left-[22] top-[8] w-[276] h-[38] rounded-xl bg-[#e6edf7]">
      <Text class="absolute left-[15] top-[11] text-sm text-[#8091aa]">Search your inbox</Text>
    </View>
    <Text class="absolute left-[24] top-[66] text-xs font-bold text-[#548fce]">INBOX</Text>
    <Text class="absolute right-[24] top-[66] text-xs font-bold text-[#548fce]">3 UNREAD</Text>
    {[['Maya Chen', 'Saturday by the sea', 'Shall we take the early train?', '9:24'], ['Field Notes', 'A slower kind of weekend', 'A few places worth getting lost in.', '8:10'], ['Alex Rivera', 'The photos are ready', 'That golden light was worth the wait.', 'Yesterday'], ['Studio North', 'A little something for you', 'Your September reading list is here.', 'Tuesday'], ['Jordan Lee', 'Coffee next week?', 'I found a place you will love.', 'Monday']].map((mail, i) =>
      <View class="absolute left-[22] w-[276] h-[88]" style={{ insetT: 95 + i * 94 }}>
        <View class="absolute left-0 bottom-0 w-[276] h-[1] bg-[#e1e8f1]" />
        <View class="absolute left-0 top-[8] w-[7] h-[7] rounded-full" style={{ bgColor: i < 3 ? '#548fce' : '#d6dfeb' }} />
        <Text class="absolute left-[17] top-0 text-base font-bold text-[#34445e]">{mail[0]}</Text>
        <Text class="absolute right-0 top-[3] text-xs text-[#8996aa]">{mail[3]}</Text>
        <Text class="absolute left-[17] top-[28] text-sm text-[#4c5f7d]">{mail[1]}</Text>
        <Text class="absolute left-[17] top-[52] text-xs text-[#8996aa]">{mail[2]}</Text>
      </View>)}
  </>;
}

function Calendar() {
  return <>
    <View class="absolute left-[22] top-[8] w-[276] h-[248] rounded-[16] bg-white">
      <Text class="absolute left-[16] top-[16] text-base font-bold text-[#aa6259]">September</Text>
      <Text class="absolute right-[16] top-[16] text-base font-bold text-[#aa6259]">2026</Text>
      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <Text class="absolute top-[52] w-[32] text-center text-xs text-[#b39b96]" style={{ insetL: 12 + i * 36 }}>{d}</Text>)}
      {Array.from({ length: 30 }, (_, i) => <View class="absolute w-[30] h-[30] rounded-full" style={{ insetL: 13 + (i + 1) % 7 * 36, insetT: 76 + Math.floor((i + 1) / 7) * 32, bgColor: i === 16 ? '#de796b' : '#ffffff' }}>
        <Text class="absolute top-[7] w-[30] text-center text-sm" style={{ textColor: i === 16 ? '#ffffff' : '#695b62' }}>{i + 1}</Text>
      </View>)}
    </View>
    <Text class="absolute left-[24] top-[280] text-xs font-bold text-[#ad766b]">THURSDAY, 17 SEPTEMBER</Text>
    {[['10:00', 'A little studio time', '#de796b'], ['14:30', 'Walk with Maya', '#7ca68d'], ['18:00', 'Dinner by the water', '#a092bf']].map((event, i) => <View class="absolute left-[22] w-[276] h-[68] rounded-xl bg-white" style={{ insetT: 308 + i * 79 }}>
      <View class="absolute left-[12] top-[13] w-[3] h-[40] rounded" style={{ bgColor: event[2] }} />
      <Text class="absolute left-[26] top-[13] text-xs text-[#aa928c]">{event[0]}</Text>
      <Text class="absolute left-[26] top-[34] text-sm font-bold text-[#65575c]">{event[1]}</Text>
    </View>)}
  </>;
}

function Clock() {
  return <>
    <View class="absolute left-[76] top-[8] w-[168] h-[168] rounded-full bg-white border-[3] border-[#dad9e6]">
      <Text class="absolute top-[10] w-[162] text-center text-sm text-[#a29db4]">12</Text>
      <Text class="absolute bottom-[9] w-[162] text-center text-sm text-[#a29db4]">6</Text>
      <Text class="absolute left-[11] top-[73] text-sm text-[#a29db4]">9</Text>
      <Text class="absolute right-[11] top-[73] text-sm text-[#a29db4]">3</Text>
      <View class="absolute left-[79] top-[43] w-[4] h-[42] rounded bg-[#555c76]" style={{ rotate: -40, originY: 0.5 }} />
      <View class="absolute left-[79] top-[29] w-[3] h-[57] rounded bg-[#555c76]" style={{ rotate: 70, originY: 0.5 }} />
      <View class="absolute left-[76] top-[76] w-[10] h-[10] rounded-full bg-[#de796b]" />
    </View>
    <Text class="absolute left-0 top-[191] w-[320] text-center text-sm text-[#89829d]">SAN FRANCISCO · 9:41 AM</Text>
    {[['07:30', 'A fresh start', 'ON'], ['08:00', 'Slow Sunday', 'OFF'], ['22:30', 'Time to wind down', 'ON']].map((alarm, i) => <View class="absolute left-[22] w-[276] h-[83]" style={{ insetT: 228 + i * 89 }}>
      <View class="absolute left-0 bottom-0 w-[276] h-[1] bg-[#dedde8]" />
      <Text class="absolute left-[2] top-[3] text-2xl text-[#55516b]">{alarm[0]}</Text>
      <Text class="absolute left-[4] top-[48] text-xs text-[#928aa4]">{alarm[1]}</Text>
      <View class="absolute right-[2] top-[20] w-[42] h-[23] rounded-full" style={{ bgColor: alarm[2] === 'ON' ? '#93b6a6' : '#d5d1df' }}>
        <View class="absolute top-[3] w-[17] h-[17] rounded-full bg-white" style={{ insetL: alarm[2] === 'ON' ? 22 : 3 }} />
      </View>
    </View>)}
  </>;
}

function Safari() {
  return <>
    <View class="absolute left-[22] top-[8] w-[276] h-[36] rounded-xl bg-[#e0eeed]">
      <Text class="absolute top-[10] w-[276] text-center text-xs text-[#72938f]">pocketjournal.example</Text>
    </View>
    <View class="absolute left-[22] top-[62] w-[276] h-[220] rounded-[16] bg-[#afd0c1] overflow-hidden">
      <View class="absolute left-[167] top-[27] w-[61] h-[61] rounded-full bg-[#f9e4ad]" />
      <View class="absolute left-[-40] top-[104] w-[340] h-[200] rounded-full bg-[#779f8c]" style={{ rotate: -12 }} />
      <View class="absolute left-[55] top-[153] w-[290] h-[150] rounded-full bg-[#577d72]" />
      <Text class="absolute left-[20] top-[26] text-xs font-bold text-[#365b52]">THE POCKET JOURNAL</Text>
      <Text class="absolute left-[20] top-[123] text-2xl font-bold text-white">The art of</Text>
      <Text class="absolute left-[20] top-[156] text-2xl font-bold text-white">going nowhere.</Text>
    </View>
    <Text class="absolute left-[24] top-[308] text-xs font-bold text-[#7b9992]">5 MIN READ · TRAVEL</Text>
    <Text class="absolute left-[24] top-[337] text-xl font-bold text-[#365b52]">Take the longer way.</Text>
    {['Leave the map in your pocket.', 'Follow the light through the trees.', 'Find a bench with a quiet view.', 'Some days, that is enough.'].map((line, i) => <Text class="absolute left-[24] text-sm text-[#7b938c]" style={{ insetT: 378 + i * 37 }}>{line}</Text>)}
  </>;
}

function Files() {
  return <>
    <Text class="absolute left-[24] top-[10] text-xs font-bold text-[#8293b3]">ON MY POCKET</Text>
    {['Documents', 'Sketches', 'Downloads', 'Projects'].map((name, i) => <View class="absolute w-[132] h-[109] rounded-xl bg-white" style={{ insetL: 22 + i % 2 * 144, insetT: 39 + Math.floor(i / 2) * 123 }}>
      <View class="absolute left-[17] top-[19] w-[28] h-[15] rounded bg-[#c0d2f0]" />
      <View class="absolute left-[17] top-[28] w-[48] h-[32] rounded bg-[#94b0de]" />
      <Text class="absolute left-[17] top-[77] text-sm font-bold text-[#566989]">{name}</Text>
    </View>)}
    <Text class="absolute left-[24] top-[309] text-xs font-bold text-[#8293b3]">RECENT FILES</Text>
    {['Weekend plans.pdf', 'A small idea.txt', 'Moodboard · PNG', 'September notes.txt'].map((name, i) => <View class="absolute left-[22] w-[276] h-[53]" style={{ insetT: 338 + i * 57 }}>
      <View class="absolute left-0 bottom-0 w-[276] h-[1] bg-[#dfe5f0]" />
      <View class="absolute left-[4] top-[7] w-[24] h-[31] rounded bg-white border border-[#bccbe2]" />
      <Text class="absolute left-[43] top-[12] text-sm text-[#617393]">{name}</Text>
    </View>)}
  </>;
}

function Settings() {
  return <>
    <View class="absolute left-[22] top-[8] w-[276] h-[91] rounded-[16] bg-white">
      <View class="absolute left-[15] top-[17] w-[56] h-[56] rounded-full bg-[#d6c9df]">
        <Text class="absolute top-[17] w-[56] text-center text-xl font-bold text-white">E</Text>
      </View>
      <Text class="absolute left-[86] top-[23] text-lg font-bold text-[#4e5366]">Your pocket</Text>
      <Text class="absolute left-[86] top-[52] text-xs text-[#8d91a1]">A little space of your own</Text>
    </View>
    {['Wi-Fi', 'Bluetooth', 'Notifications', 'Display', 'Wallpaper', 'Sounds', 'Privacy', 'About'].map((name, i) => <View class="absolute left-[22] w-[276] h-[53] rounded-lg bg-white" style={{ insetT: 123 + i * 59 }}>
      <View class="absolute left-[12] top-[12] w-[29] h-[29] rounded-lg" style={{ bgColor: ['#87afcb', '#849aca', '#d99394', '#b2a1ca', '#93b6a6', '#dab184', '#99abc0', '#a7aab7'][i] }} />
      <Text class="absolute left-[55] top-[18] text-sm text-[#666d82]">{name}</Text>
      <Text class="absolute right-[15] top-[14] text-xl text-[#bcc0cc]">›</Text>
    </View>)}
  </>;
}

function Camera() {
  return <>
    <View class="absolute left-[22] top-[8] w-[276] h-[278] rounded-[16] bg-[#b3c9ba] overflow-hidden">
      <View class="absolute left-[178] top-[31] w-[48] h-[48] rounded-full bg-[#f5e5b9]" />
      <View class="absolute left-[-45] top-[117] w-[375] h-[220] rounded-full bg-[#7e9f8b]" style={{ rotate: -17 }} />
      <View class="absolute left-[54] top-[194] w-[305] h-[160] rounded-full bg-[#587a69]" />
      {[92, 184].map(n => <View class="absolute top-0 w-[1] h-[278] bg-white opacity-25" style={{ insetL: n }} />)}
      {[93, 186].map(n => <View class="absolute left-0 w-[276] h-[1] bg-white opacity-25" style={{ insetT: n }} />)}
      <View class="absolute left-[107] top-[109] w-[61] h-[61] border-[2] border-[#f9de9a]" />
      <Text class="absolute left-[15] top-[14] text-xs font-bold text-white">SCENIC PREVIEW</Text>
    </View>
    {['PORTRAIT', 'PHOTO', 'SQUARE'].map((label, i) => <Text class="absolute top-[310] w-[80] text-center text-xs font-bold text-[#738d7d]" style={{ insetL: 31 + i * 90 }}>{label}</Text>)}
    <View class="absolute left-[129] top-[351] w-[62] h-[62] rounded-full border-[3] border-[#829a8c]">
      <View class="absolute left-[5] top-[5] w-[46] h-[46] rounded-full bg-white" />
    </View>
    <Text class="absolute left-0 top-[442] w-[320] text-center text-xs text-[#94a69c]">A study in light and quiet.</Text>
  </>;
}

function Health() {
  return <>
    <View class="absolute left-[22] top-[8] w-[276] h-[138] rounded-[16] bg-white">
      <Text class="absolute left-[18] top-[18] text-xs font-bold text-[#ce7893]">STEPS TODAY</Text>
      <Text class="absolute left-[17] top-[49] text-4xl font-bold text-[#a45d78]">6,842</Text>
      <Text class="absolute left-[19] top-[105] text-xs text-[#b894a3]">A good day to take the scenic route.</Text>
    </View>
    <View class="absolute left-[22] top-[163] w-[276] h-[168] rounded-[16] bg-[#f3dfe8]">
      <Text class="absolute left-[18] top-[17] text-xs font-bold text-[#a86881]">THIS WEEK</Text>
      {[44, 72, 59, 93, 68, 105, 81].map((h, i) => <View class="absolute w-[20] rounded" style={{ insetL: 20 + i * 34, insetT: 143 - h, height: h, bgColor: i === 6 ? '#b66c89' : '#d69bb1' }} />)}
    </View>
    {[['Sleep', '7 hr 42 min'], ['Mindful time', '12 minutes'], ['Distance', '4.8 km']].map((item, i) => <View class="absolute left-[22] w-[276] h-[67] rounded-xl bg-white" style={{ insetT: 349 + i * 76 }}>
      <Text class="absolute left-[18] top-[13] text-xs text-[#b28b9c]">{item[0]}</Text>
      <Text class="absolute left-[18] top-[35] text-base font-bold text-[#a45d78]">{item[1]}</Text>
    </View>)}
  </>;
}

function Books() {
  return <>
    <Text class="absolute left-[24] top-[9] text-xs font-bold text-[#b19970]">CURRENTLY READING</Text>
    <View class="absolute left-[22] top-[41] w-[276] h-[211] rounded-[16] bg-[#eee1c7]">
      <View class="absolute left-[18] top-[20] w-[113] h-[164] rounded-lg bg-[#7e9d89]">
        <View class="absolute left-[6] top-0 w-[2] h-[164] bg-[#b7cbbb]" />
        <Text class="absolute left-[17] top-[20] text-sm font-bold text-[#f3ebd8]">A FIELD</Text>
        <Text class="absolute left-[17] top-[43] text-sm font-bold text-[#f3ebd8]">GUIDE</Text>
        <View class="absolute left-[26] top-[79] w-[57] h-[57] rounded-full border-[2] border-[#e1d9b6]" />
      </View>
      <Text class="absolute left-[148] top-[35] text-lg font-bold text-[#887350]">Little places,</Text>
      <Text class="absolute left-[148] top-[61] text-lg font-bold text-[#887350]">big skies.</Text>
      <Text class="absolute left-[149] top-[112] text-xs text-[#aa9772]">Chapter 4 of 12</Text>
      <View class="absolute left-[149] top-[142] w-[105] h-[4] rounded bg-[#d9c9a7]">
        <View class="w-[37] h-[4] rounded bg-[#a18d64]" />
      </View>
    </View>
    <Text class="absolute left-[24] top-[281] text-xs font-bold text-[#b19970]">YOUR SHELF</Text>
    {['Small Hours', 'The Long Way', 'Open Water'].map((name, i) => <View class="absolute w-[80] h-[131] rounded-lg" style={{ insetL: 22 + i * 98, insetT: 316, bgColor: ['#bf9280', '#8d9ba8', '#ad9cba'][i] }}>
      <View class="absolute left-[5] top-0 w-[2] h-[131] bg-white opacity-25" />
      <Text class="absolute left-[9] top-[23] w-[63] text-xs font-bold text-white">{name}</Text>
    </View>)}
    <Text class="absolute left-[24] top-[486] text-sm text-[#ab9878]">Make a little room for a story.</Text>
  </>;
}

function Calculator() {
  return <>
    <View class="absolute left-[22] top-[8] w-[276] h-[84] rounded-[16] bg-[#e8e0f2]">
      <Text class="absolute right-[18] top-[12] text-xs text-[#a390b9]">128 × 4</Text>
      <Text class="absolute right-[17] top-[36] text-2xl text-[#75618f]">512</Text>
    </View>
    {['AC', '+/-', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '⌫', '='].map((label, i) => <View class="absolute w-[60] h-[51] rounded-[14]" style={{ insetL: 22 + i % 4 * 72, insetT: 110 + Math.floor(i / 4) * 61, bgColor: i % 4 === 3 ? '#a38fbc' : i < 4 ? '#ddd2e9' : '#ffffff' }}>
      <Text class="absolute top-[15] w-[60] text-center text-lg" style={{ textColor: i % 4 === 3 ? '#ffffff' : '#8e7ba7' }}>{label}</Text>
    </View>)}
  </>;
}

const MOCKUPS = [Today, Music, Places, Weather, Notes, Photos, Mail, Calendar, Clock, Safari, Files, Settings, Camera, Health, Books, Calculator];
export function AppMockup(props: { index: number }) { return MOCKUPS[props.index](); }
