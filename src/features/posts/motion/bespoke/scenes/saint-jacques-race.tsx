import { useId } from "react";
import { interpolate } from "remotion";
import { Box, Camera, Checkpoint, ease, easeOut, enter, lerp, pop, Pulse, stagger, Tag, Text, tint, TONE, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Trail du Saint-Jacques 100K (86 km, 3,500 m D+), drawn like a race broadcast:
// one elevation profile, the runner travelling along it with a live card, and
// Blandine as a second, quieter dot. The pace tells the story: fast to the first
// two aid stations, stalled at Pont-d'Alleyras, slow under the sun, reset at Lac
// du Bouchet, slowed by Recours, then the last 15 km into the night.
//
// Distances: only the article's facts are placed to scale (86 km total, ≈ 16 km
// Pont-d'Alleyras → Lac du Bouchet, ≈ 15 km from Saint-Christophe to the finish).
// The relief itself is schematic, and the stage says so.

const T = {
  run: 24,
  as1: 72,
  stJean: 118,
  valley: 150,
  dry: 186,
  pont: 214,
  leavePont: 240,
  mirage: 286,
  lac: 326,
  leaveLac: 350,
  recours: 385,
  deves: 412,
  stChristophe: 432,
  night: 452,
  chibottes: 482,
  finish: 512,
  blandine: 540,
  end: 600,
} as const;

const CP = {
  start: 0,
  as1: .13,
  stJean: .26,
  valley: .335,
  climb: .365,
  dry: .377, // last 1.5–2 km before Pont-d'Alleyras without water
  pont: .40,
  mirage: .52,
  lac: .586,
  recours: .665,
  deves: .745,
  stChristophe: .826,
  chibottes: .93,
  finish: 1,
} as const;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Runner position (share of 86 km) over time; flat segments are the stops, and
// the slope of each segment is the pace.
const RUNNER: readonly (readonly [number, number])[] = [
  [0, 0], [T.run, 0], [T.as1, CP.as1], [T.stJean, CP.stJean], [T.valley, CP.valley], [172, CP.climb], [T.dry, CP.dry],
  [T.pont, CP.pont], [T.leavePont, CP.pont], [T.lac, CP.lac], [T.leaveLac, CP.lac], [T.recours, CP.recours],
  [T.deves, CP.deves], [T.stChristophe, CP.stChristophe], [T.chibottes, CP.chibottes], [T.finish, 1],
];
// Blandine: together to Saint-Jean, a little ahead until the catch-up five km
// into section 3, gone ahead after Pont (impossible to follow), waiting at the
// lake, then behind from Recours, finishing about twenty minutes later.
const BLANDINE: readonly (readonly [number, number])[] = [
  [0, 0], [T.run, 0], [T.as1, CP.as1], [T.stJean, CP.stJean], [140, .33], [172, CP.climb], [T.pont, CP.pont],
  [222, CP.pont], [300, CP.lac], [T.leaveLac, CP.lac], [T.recours, .635], [T.deves, .7], [T.finish, .955], [T.blandine, 1],
];

const track = (keys: readonly (readonly [number, number])[], frame: number) =>
  interpolate(frame, keys.map(([at]) => at), keys.map(([, t]) => t), clamp);

// Schematic relief (t, relative height). Monistrol sits in the gorge and the
// start climbs at once; Recours goes almost straight up; Devès is a long hump.
const RELIEF: readonly (readonly [number, number])[] = [
  [0, .04], [.03, .36], [.07, .58], [.13, .6], [.18, .72], [.22, .64], [.26, .68], [.30, .66],
  [.335, .16], [.365, .58], [.40, .24], [.44, .32], [.48, .42], [.52, .56], [.545, .5], [.586, .58],
  [.625, .6], [.665, 1], [.69, .72], [.71, .74], [.745, .94], [.79, .72], [.826, .54], [.855, .6], [.875, .5],
  [.90, .56], [.93, .42], [.95, .5], [.975, .4], [1, .48],
];

const SAMPLES = 240;
const smooth = (values: readonly number[]) => values.map((value, index) => index === 0 || index === values.length - 1
  ? value
  : (values[index - 1]! + 2 * value + values[index + 1]!) / 4);
const PROFILE: readonly number[] = [0, 1, 2].reduce<readonly number[]>((values) => smooth(values), Array.from({ length: SAMPLES + 1 }, (_, index) => {
  const t = index / SAMPLES;
  const right = RELIEF.findIndex(([at]) => at >= t);
  if (right <= 0) return RELIEF[0]![1];
  const [t0, e0] = RELIEF[right - 1]!;
  const [t1, e1] = RELIEF[right]!;
  return e0 + (e1 - e0) * ((t - t0) / (t1 - t0));
}));

function heightAt(t: number) {
  const position = Math.max(0, Math.min(1, t)) * SAMPLES;
  const index = Math.min(SAMPLES - 1, Math.floor(position));
  return lerp(PROFILE[index]!, PROFILE[index + 1]!, position - index);
}

type Geo = { x0: number; x1: number; axis: number; lift: number; rise: number };
const WIDE_GEO: Geo = { x0: 48, x1: 912, axis: 294, lift: 12, rise: 148 };
const COMPACT_GEO: Geo = { x0: 24, x1: 516, axis: 232, lift: 8, rise: 118 };

const xAt = (geo: Geo, t: number) => geo.x0 + t * (geo.x1 - geo.x0);
const at = (geo: Geo, t: number): [number, number] => [xAt(geo, t), geo.axis - geo.lift - heightAt(t) * geo.rise];

function pathBetween(geo: Geo, from: number, to: number) {
  if (to <= from) return "";
  const inner = PROFILE.map((_, index) => index / SAMPLES).filter((t) => t > from && t < to);
  return [from, ...inner, to].map((t, index) => {
    const [x, y] = at(geo, t);
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join("");
}

type Station = { key: keyof typeof CP; at: number; name: { en: string; fr: string }; state: "pass" | "fail" };
const STATIONS: readonly Station[] = [
  { key: "as1", at: T.as1, name: { en: "Aid station 1", fr: "1er ravito" }, state: "pass" },
  { key: "stJean", at: T.stJean, name: { en: "Saint-Jean-Lachalm", fr: "Saint-Jean-Lachalm" }, state: "pass" },
  { key: "pont", at: T.pont, name: { en: "Pont-d’Alleyras", fr: "Pont-d’Alleyras" }, state: "fail" },
  { key: "lac", at: T.lac, name: { en: "Lac du Bouchet", fr: "Lac du Bouchet" }, state: "pass" },
  { key: "stChristophe", at: T.stChristophe, name: { en: "Saint-Christophe", fr: "Saint-Christophe" }, state: "pass" },
  { key: "chibottes", at: T.chibottes, name: { en: "Les Chibottes", fr: "Les Chibottes" }, state: "pass" },
  { key: "finish", at: T.finish, name: { en: "Le Puy-en-Velay", fr: "Le Puy-en-Velay" }, state: "pass" },
];

type Copy = ReturnType<typeof copyFor>;
function copyFor(fr: boolean) {
  return {
    start: "Monistrol-d’Allier",
    total: fr ? "86 km · 3 500 m D+" : "86 km · 3,500 m D+",
    schematic: fr ? "profil schématique" : "schematic profile",
    promise: fr ? "« 500 m »" : "“500 m”",
    lakeQ: fr ? "le lac ?" : "the lake?",
    hill: fr ? "✗ une colline" : "✗ a hill",
    sun: fr ? "plein soleil" : "midday sun",
    night: fr ? "nuit · frontale" : "night · headlamp",
    km16: "≈ 16 km",
    km15: "≈ 15 km",
    recours: "Mont Recours",
    deves: "Mont Devès",
    blandine: "Blandine",
    blandineLate: "Blandine +20 min",
    toGo: fr ? "restants" : "to go",
  };
}

// The live card that rides above the runner: one fact at a time.
type Live = { at: number; eyebrow: string; value: string | ((km: number) => string); tone: Tone };
function liveFor(fr: boolean, c: Copy): readonly Live[] {
  return [
    { at: 0, eyebrow: c.start, value: fr ? "plan 13 h 30" : "plan 13:30", tone: "ink" },
    { at: T.as1 - 4, eyebrow: fr ? "1er ravito · avance" : "aid station 1 · lead", value: "+35–40 min", tone: "ok" },
    { at: T.stJean - 4, eyebrow: "Saint-Jean-Lachalm", value: "+30 min", tone: "ok" },
    { at: T.dry - 6, eyebrow: fr ? "→ Pont-d’Alleyras" : "→ Pont-d’Alleyras", value: fr ? "plus d’eau · 1,5–2 km" : "no water · 1.5–2 km", tone: "danger" },
    { at: T.pont, eyebrow: "Pont-d’Alleyras", value: fr ? "déshydraté" : "dehydrated", tone: "danger" },
    { at: T.leavePont + 6, eyebrow: fr ? "≈ 16 km · faux plat" : "≈ 16 km · false flat", value: c.sun, tone: "hot" },
    { at: T.lac - 4, eyebrow: "Lac du Bouchet", value: fr ? "assistance · reset ✓" : "crew · reset ✓", tone: "ok" },
    { at: T.leaveLac + 8, eyebrow: c.recours, value: fr ? "le vrai mur" : "the real wall", tone: "danger" },
    { at: T.recours + 6, eyebrow: c.deves, value: fr ? "ça passe ✓" : "it passes ✓", tone: "ok" },
    { at: T.stChristophe, eyebrow: fr ? "derniers km" : "final km", value: (km) => `≈ ${km} km ${c.toGo}`, tone: "line" },
    { at: T.finish - 2, eyebrow: fr ? "Le Puy-en-Velay · arrivée" : "Le Puy-en-Velay · finish", value: fr ? "15 h+ · plan 13 h 30" : "15 h+ · plan 13:30", tone: "hot" },
  ];
}

function Sun({ x, y, frame }: { x: number; y: number; frame: number }) {
  return <g transform={`translate(${x} ${y}) rotate(${frame * .4})`}>
    <circle r={6.5} fill={TONE.hot} className="scene-glow" style={{ color: TONE.hot }} />
    {Array.from({ length: 8 }, (_, index) => {
      const angle = index * Math.PI / 4;
      return <line key={index} x1={Math.cos(angle) * 10} y1={Math.sin(angle) * 10} x2={Math.cos(angle) * 14} y2={Math.sin(angle) * 14} stroke={TONE.hot} strokeWidth={1.4} strokeLinecap="round" />;
    })}
  </g>;
}

function Moon({ x, y }: { x: number; y: number }) {
  return <path d={`M${x + 3} ${y - 8}a8 8 0 1 0 5 13a6.5 6.5 0 1 1 -5 -13Z`} fill={TONE.muted} opacity={.85} />;
}

function Flag({ x, y, tone = "hot", scale = 1 }: { x: number; y: number; tone?: Tone; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <line x1={0} y1={0} x2={0} y2={-22} stroke={TONE[tone]} strokeWidth={1.5} strokeLinecap="round" />
    <path d="M0 -22L12 -18L0 -14Z" fill={TONE[tone]} />
  </g>;
}

/** Condition band over a stretch of the course: sun from above, night from the right. */
function Band({ geo, from, to, kind, appear, id }: { geo: Geo; from: number; to: number; kind: "sun" | "night"; appear: number; id: string }) {
  if (appear <= 0) return null;
  const x0 = xAt(geo, from);
  const x1 = xAt(geo, to);
  const top = geo.axis - geo.lift - geo.rise - 22;
  const tone: Tone = kind === "sun" ? "hot" : "ink";
  return <g opacity={appear}>
    <defs>
      <linearGradient id={id} x1={kind === "sun" ? 0 : 0} y1={0} x2={kind === "sun" ? 0 : 1} y2={kind === "sun" ? 1 : 0}>
        <stop offset="0" style={{ stopColor: TONE[tone], stopOpacity: kind === "sun" ? .16 : .02 }} />
        <stop offset="1" style={{ stopColor: TONE[tone], stopOpacity: kind === "sun" ? .01 : .12 }} />
      </linearGradient>
    </defs>
    <rect x={x0} y={top} width={x1 - x0} height={geo.axis - top} fill={`url(#${id})`} />
    <line x1={x0} x2={x0} y1={top} y2={geo.axis} stroke="var(--scene-hairline)" strokeDasharray="2 4" />
  </g>;
}

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const c = copyFor(fr);
  const uid = useId().replaceAll(":", "");
  const geo = compact ? COMPACT_GEO : WIDE_GEO;
  const progress = track(RUNNER, frame);
  const partner = track(BLANDINE, frame);
  const runner = at(geo, progress);
  const her = at(geo, partner);

  // The course draws itself first, then the day starts.
  const drawn = easeOut(frame, 0, 34);
  const full = pathBetween(geo, 0, 1);
  const area = `${full}L${geo.x1} ${geo.axis}L${geo.x0} ${geo.axis}Z`;
  const covered = pathBetween(geo, 0, progress);
  const dry = pathBetween(geo, CP.dry, Math.min(progress, CP.pont));
  const trail = pathBetween(geo, Math.max(0, progress - .05), progress);

  const sun = easeOut(frame, T.leavePont - 6, T.leavePont + 18) * (1 - .45 * ease(frame, T.lac, T.lac + 24));
  const night = easeOut(frame, T.stChristophe + 6, T.chibottes);
  const headlamp = ease(frame, T.night, T.night + 16) * (frame < T.finish + 10 ? 1 : 1 - ease(frame, T.finish + 10, T.finish + 30));
  const promises = [0, 1, 2].map((index) => pop(frame, T.dry + 2 + index * 10) * (1 - ease(frame, T.leavePont - 6, T.leavePont + 8)));
  const mirageAsk = pop(frame, T.mirage - 20);
  const mirageNo = frame >= T.mirage;
  const mirageFade = 1 - .55 * ease(frame, T.lac, T.lac + 20);

  // Blandine's name shows when the two of them are apart, at the start and at her finish.
  const apart = Math.min(1, Math.max(0, (Math.abs(partner - progress) - .026) / .015));
  const herLabel = Math.max(apart, 1 - ease(frame, 40, 60), ease(frame, T.finish + 4, T.finish + 16)) * easeOut(frame, 8, 26);
  const herVisible = frame < T.blandine + 4;

  const lean = (t: number): [number, number] => {
    const [x, y] = at(geo, t);
    return [lerp(width / 2, x, .3), lerp(height / 2, y, .3)];
  };
  const camera = compact ? [{ at: 0 }] : [
    { at: 0 },
    { at: T.run, dur: 60, zoom: 1.035, focus: lean(.14) },
    { at: T.stJean, dur: 70, zoom: 1.04, focus: lean(.4) },
    { at: T.leavePont, dur: 80, zoom: 1.035, focus: lean(.6) },
    { at: T.leaveLac, dur: 70, zoom: 1.04, focus: lean(.8) },
    { at: T.stChristophe + 20, dur: 60, zoom: 1.03, focus: lean(1) },
    { at: T.finish + 8, dur: 56, zoom: 1 },
  ];

  const stationMarks = STATIONS.map((station, index) => {
    const [x, y] = at(geo, CP[station.key]);
    const reached = frame >= station.at;
    const appear = easeOut(frame, stagger(index, 14, 4), stagger(index, 14, 4) + 16);
    const hit = pop(frame, station.at, 200);
    const r = compact ? 8.5 : 10;
    return <g key={station.key} opacity={appear}>
      <line x1={x} x2={x} y1={y + r + 2} y2={geo.axis} stroke="var(--scene-hairline)" strokeDasharray="1.5 3.5" />
      {reached
        ? <g transform={`translate(${x} ${y}) scale(${.55 + .45 * hit}) translate(${-x} ${-y})`}><Checkpoint x={x} y={y} r={r} state={station.state} /></g>
        : <circle cx={x} cy={y} r={r * .55} style={{ fill: "var(--scene-card)" }} stroke="var(--scene-hairline)" strokeWidth={1.5} />}
      {reached && frame < station.at + 40 ? <Pulse x={x} y={y} frame={frame} at={station.at} period={40} r={r} tone={station.state === "fail" ? "danger" : "ok"} /> : null}
    </g>;
  });

  const chart = <g>
    <defs>
      <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={{ stopColor: TONE.line, stopOpacity: .14 }} />
        <stop offset="1" style={{ stopColor: TONE.line, stopOpacity: 0 }} />
      </linearGradient>
      <linearGradient id={`${uid}-run`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={{ stopColor: TONE.line, stopOpacity: .34 }} />
        <stop offset="1" style={{ stopColor: TONE.line, stopOpacity: .03 }} />
      </linearGradient>
      <radialGradient id={`${uid}-lamp`} cx="0" cy=".5" r="1">
        <stop offset="0" style={{ stopColor: TONE.hot, stopOpacity: .42 }} />
        <stop offset="1" style={{ stopColor: TONE.hot, stopOpacity: 0 }} />
      </radialGradient>
      <clipPath id={`${uid}-clip`}><rect x={geo.x0 - 2} y={0} width={Math.max(0, runner[0] - geo.x0 + 2)} height={geo.axis + 1} /></clipPath>
    </defs>

    <Band geo={geo} from={CP.pont} to={CP.lac} kind="sun" appear={sun} id={`${uid}-sun`} />
    <Band geo={geo} from={CP.stChristophe} to={1} kind="night" appear={night} id={`${uid}-night`} />

    {/* Topographic echoes of the relief: a mountain-theme flourish only. */}
    <g className="scene-only-mountain" opacity={drawn}>
      {[16, 32, 48].map((offset, index) => <path key={offset} d={full} transform={`translate(0 ${-offset})`} fill="none" stroke="var(--scene-hairline)" strokeOpacity={.5 - index * .13} strokeWidth={1} />)}
      <g opacity={easeOut(frame, T.deves, T.deves + 20)}><Flag x={at(geo, CP.deves)[0]} y={at(geo, CP.deves)[1] - 3} tone="ok" scale={compact ? .8 : 1} /></g>
    </g>

    <path d={area} fill={`url(#${uid}-fill)`} opacity={easeOut(frame, 8, 40)} />
    <path d={area} fill={`url(#${uid}-run)`} clipPath={`url(#${uid}-clip)`} />
    <line x1={geo.x0} x2={geo.x1} y1={geo.axis} y2={geo.axis} stroke="var(--scene-hairline)" strokeWidth={1} opacity={drawn} />
    <path d={full} fill="none" stroke="var(--scene-hairline)" strokeWidth={1.5} strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - drawn} />
    {covered ? <path d={covered} fill="none" stroke={TONE.line} strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" /> : null}
    {dry ? <path d={dry} fill="none" stroke={TONE.danger} strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" /> : null}
    {trail && frame < T.finish + 6 ? <path className="scene-glow" d={trail} fill="none" stroke={progress > CP.dry && progress <= CP.pont ? TONE.danger : TONE.line} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" opacity={.55} style={{ color: TONE.line }} /> : null}

    {/* Summits on the map: named when the runner gets there. */}
    {([["recours", c.recours, T.leaveLac, "danger"], ["deves", c.deves, T.recours, "ok"]] as const).map(([key, name, start, tone]) => {
      const [x, y] = at(geo, CP[key]);
      const reach = easeOut(frame, start, start + 18);
      const hot = key === "recours" ? within(frame, T.leaveLac + 6, T.recours + 6) : within(frame, T.recours + 6, T.deves + 8);
      return <g key={key} opacity={reach}>
        <path d={`M${x - 4} ${y - 9}L${x} ${y - 15}L${x + 4} ${y - 9}Z`} fill={hot > .5 ? TONE[tone] : TONE.muted} />
        <Text x={key === "recours" ? x - 12 : x + 12} y={y - 6} size={compact ? 13 : 13.5} weight={600} anchor={key === "recours" ? "end" : "start"} tone={hot > .5 ? tone : "muted"}>{compact ? name.replace("Mont ", "") : name}</Text>
      </g>;
    })}

    {stationMarks}

    {/* “500 m”, three times: the promises pop just ahead of the runner. */}
    {promises.map((appear, index) => {
      const pontX = xAt(geo, CP.pont);
      const x = compact ? pontX - 150 + index * 80 : pontX - 236 + index * 96;
      const y = compact ? 84 : 150;
      const latest = index === 2 || promises[index + 1]! < .5 ? 1 : .5;
      return <Tag key={index} x={x} y={y} text={c.promise} tone="hot" appear={appear * latest} size={compact ? 12 : 13} />;
    })}

    {/* The lake on the horizon is just another hill. */}
    {mirageAsk > 0 ? (() => {
      const [x, y] = at(geo, CP.mirage);
      const tone: Tone = mirageNo ? "danger" : "hot";
      return <g opacity={Math.min(1, mirageAsk) * mirageFade}>
        <line x1={x} x2={x} y1={y - (compact ? 20 : 34)} y2={y - 8} stroke={TONE[tone]} strokeWidth={1} strokeDasharray="2 3" />
        <Tag x={compact ? x - 20 : x} y={y - (compact ? 30 : 44)} text={mirageNo ? c.hill : c.lakeQ} tone={tone} appear={mirageNo ? pop(frame, T.mirage) : mirageAsk} size={compact ? 12 : 13} />
      </g>;
    })() : null}

    {/* Band glyphs: sun overhead, dusk then night on the last 15 km. */}
    <g opacity={sun}>{compact
      ? <g transform={`translate(${xAt(geo, CP.pont) + 16} ${geo.axis - 14}) scale(.62)`}><Sun x={0} y={0} frame={frame} /></g>
      : <Sun x={xAt(geo, (CP.pont + CP.lac) / 2)} y={geo.axis - geo.lift - geo.rise - 4} frame={frame} />}</g>
    <g opacity={night} transform={`translate(${geo.x1 - 22 - (compact ? c.km15 : `${c.night} · ${c.km15}`).length * 7.9} ${geo.axis - 14}) scale(.62)`}><Moon x={0} y={0} /></g>
    <g opacity={sun}>
      <Text x={xAt(geo, CP.pont) + (compact ? 30 : 10)} y={geo.axis - 14} size={11} font="mono" weight={600} tone="hot" caps>{compact ? c.km16 : `${c.sun} · ${c.km16}`}</Text>
    </g>
    <g opacity={night}>
      <Text x={geo.x1 - 8} y={geo.axis - 14} size={11} font="mono" weight={600} tone="muted" anchor="end" caps>{compact ? c.km15 : `${c.night} · ${c.km15}`}</Text>
    </g>

    {/* Blandine: a quieter dot, sometimes ahead, sometimes behind. */}
    {herVisible ? <g opacity={easeOut(frame, 8, 26) * (frame > T.blandine - 4 ? 1 - ease(frame, T.blandine - 4, T.blandine + 4) : 1)}>
      <circle cx={her[0]} cy={her[1]} r={compact ? 4.5 : 5} style={{ fill: "var(--scene-card)" }} stroke={TONE.ok} strokeWidth={2} />
      <g opacity={herLabel}>
        <Text x={her[0]} y={her[1] + (compact ? 18 : 20)} size={13} weight={600} font="mono" tone="ok" anchor="middle">{c.blandine}</Text>
      </g>
    </g> : null}

    {/* Headlamp: a warm cone ahead of the runner once night falls. */}
    {headlamp > 0 ? <path d={`M${runner[0]} ${runner[1] - 2}L${runner[0] + 64} ${runner[1] - 24}L${runner[0] + 64} ${runner[1] + 22}Z`} fill={`url(#${uid}-lamp)`} opacity={headlamp} /> : null}

    {/* The runner: halo, ring, core. */}
    {frame >= 6 ? <g opacity={easeOut(frame, 6, 22)}>
      <circle cx={runner[0]} cy={runner[1]} r={compact ? 13 : 15} style={{ fill: tint(frame < T.finish ? "line" : "ok", 16) }} />
      <circle className="scene-glow" cx={runner[0]} cy={runner[1]} r={compact ? 6 : 7} style={{ fill: "var(--scene-card)", color: TONE.line }} stroke={frame < T.finish ? TONE.line : TONE.ok} strokeWidth={2.5} />
      <circle cx={runner[0]} cy={runner[1]} r={compact ? 2.5 : 3} fill={frame < T.finish ? TONE.line : TONE.ok} />
    </g> : null}
    {frame >= T.pont && frame < T.leavePont ? <Pulse x={runner[0]} y={runner[1]} frame={frame} at={T.pont} period={26} r={10} tone="danger" /> : null}
    {frame >= T.lac && frame < T.leaveLac ? <Pulse x={runner[0]} y={runner[1]} frame={frame} at={T.lac} period={24} r={10} tone="ok" /> : null}
    {frame >= T.finish ? <Pulse x={runner[0]} y={runner[1]} frame={frame} at={T.finish} period={46} r={11} tone="hot" /> : null}
    {frame >= T.blandine ? <Pulse x={runner[0]} y={runner[1]} frame={frame} at={T.blandine} period={46} r={8} tone="ok" /> : null}
    <g opacity={easeOut(frame, T.finish - 6, T.finish + 12)}><Flag x={xAt(geo, 1) + (compact ? 0 : 0)} y={at(geo, 1)[1] - 12} tone="hot" scale={compact ? .8 : 1} /></g>
  </g>;

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    {compact
      ? <CompactLayer frame={frame} fr={fr} c={c} geo={geo} progress={progress} />
      : <WideLayer frame={frame} locale={locale} c={c} geo={geo} runnerX={runner[0]} runnerY={runner[1]} progress={progress} />}
    {chart}
    {!compact ? <LiveCard frame={frame} fr={fr} c={c} runnerX={runner[0]} runnerY={runner[1]} progress={progress} /> : null}
  </Camera>;
}

function within(frame: number, start: number, end: number) {
  return frame >= start && frame < end ? 1 : 0;
}

const kmToGo = (progress: number) => Math.max(0, Math.round(15 * (1 - (progress - CP.stChristophe) / (1 - CP.stChristophe))));

function LiveCard({ frame, fr, c, runnerX, runnerY, progress }: { frame: number; fr: boolean; c: Copy; runnerX: number; runnerY: number; progress: number }) {
  const live = liveFor(fr, c);
  const index = live.reduce((found, item, i) => (frame >= item.at ? i : found), 0);
  const current = live[index]!;
  const previous = index > 0 ? live[index - 1] : undefined;
  const swap = easeOut(frame, current.at, current.at + 14);
  const w = 232;
  const h = 56;
  const y = 58;
  const x = Math.max(40, Math.min(920 - w, runnerX - w / 2));
  const appear = easeOut(frame, 16, 34);
  const valueOf = (item: Live) => typeof item.value === "string" ? item.value : item.value(kmToGo(progress));
  const content = (item: Live, opacity: number, dy: number) => <g opacity={opacity} transform={`translate(0 ${dy})`}>
    <Text x={x + 16} y={y + 19} size={11} font="mono" weight={600} tone="muted" caps>{item.eyebrow}</Text>
    <Text x={x + 16} y={y + 38} size={16} font="mono" weight={600} tone={item.tone}>{valueOf(item)}</Text>
  </g>;
  const stemX = Math.max(x + 18, Math.min(x + w - 18, runnerX));
  const blandine = pop(frame, T.blandine);
  return <g opacity={appear}>
    <line x1={stemX} x2={runnerX} y1={y + h} y2={runnerY - 17} stroke={TONE[current.tone === "ink" ? "muted" : current.tone]} strokeOpacity={.55} strokeWidth={1} />
    <Box x={x} y={y} w={w} h={h} tone={current.tone === "ink" ? "line" : current.tone} focus={.25 + .5 * (1 - swap)} radius={12}>
      <rect x={x} y={y + 10} width={3} height={h - 20} rx={1.5} fill={TONE[current.tone === "ink" ? "line" : current.tone]} opacity={.9} />
      {previous && swap < 1 ? content(previous, 1 - swap, -6 * swap) : null}
      {content(current, previous ? swap : 1, previous ? 6 * (1 - swap) : 0)}
    </Box>
    <Tag x={x - 12} y={y + h / 2} anchor="end" text={c.blandineLate} tone="ok" appear={blandine} />
  </g>;
}

function WideLayer({ frame, locale, c, geo }: { frame: number; locale: "en" | "fr"; c: Copy; geo: Geo; runnerX: number; runnerY: number; progress: number }) {
  const rows = [316, 336, 356] as const;
  const row: Record<string, 0 | 1 | 2> = { start: 0, as1: 1, stJean: 0, pont: 1, lac: 0, stChristophe: 1, chibottes: 0, finish: 2 };
  const labels = [{ key: "start" as const, name: c.start, at: 0 }, ...STATIONS.map((station) => ({ key: station.key, name: station.name[locale], at: station.at }))];
  return <g>
    <g {...enter(frame, 4, { from: "down", distance: 8 })}>
      <Tag x={geo.x1} y={30} anchor="end" text={c.total} tone="muted" size={12} />
    </g>
    {labels.map((label, index) => {
      const x = xAt(geo, CP[label.key]);
      const y = rows[row[label.key]!];
      const reached = frame >= label.at;
      const anchor = label.key === "start" ? "start" : label.key === "finish" ? "end" : "middle";
      const labelX = label.key === "start" ? x - 4 : label.key === "finish" ? x + 4 : x;
      return <g key={label.key} {...enter(frame, stagger(index, 18, 4), { distance: 6 })}>
        <line x1={x} x2={x} y1={geo.axis} y2={y - 9} stroke="var(--scene-hairline)" strokeWidth={1} />
        <Text x={labelX} y={y} size={13.5} weight={600} anchor={anchor} tone={reached ? "ink" : "muted"} opacity={reached ? 1 : .6}>{label.name}</Text>
      </g>;
    })}
    <g opacity={easeOut(frame, 30, 50)}>
      <Text x={geo.x0} y={394} size={11} font="mono" weight={600} tone="muted" caps opacity={.8}>{c.schematic}</Text>
    </g>
  </g>;
}

function CompactLayer({ frame, fr, c, geo, progress }: { frame: number; fr: boolean; c: Copy; geo: Geo; progress: number }) {
  const rows: readonly { n: string; key: keyof typeof CP; name: string; event: string; tone: Tone; at: number }[] = [
    { n: "0", key: "start", name: c.start, event: fr ? "plan 13 h 30" : "plan 13:30", tone: "ink", at: 0 },
    { n: "1", key: "as1", name: fr ? "1er ravito" : "Aid station 1", event: "+35–40 min", tone: "ok", at: T.as1 },
    { n: "2", key: "stJean", name: "Saint-Jean-Lachalm", event: "+30 min", tone: "ok", at: T.stJean },
    { n: "3", key: "pont", name: "Pont-d’Alleyras", event: fr ? "plus d’eau ✗" : "no water ✗", tone: "danger", at: T.pont },
    { n: "4", key: "lac", name: "Lac du Bouchet", event: fr ? "assistance ✓" : "crew ✓", tone: "ok", at: T.lac },
    { n: "5", key: "stChristophe", name: "Saint-Christophe", event: fr ? "Recours · Devès ✓" : "Recours · Devès ✓", tone: "ok", at: T.stChristophe },
    { n: "6", key: "chibottes", name: "Les Chibottes", event: fr ? "nuit · frontale" : "night · headlamp", tone: "muted", at: T.chibottes },
    { n: "7", key: "finish", name: "Le Puy-en-Velay", event: "15 h+", tone: "hot", at: T.finish },
  ];
  const top = 282;
  const step = 29;
  const reachedIndex = rows.reduce((found, row, index) => (frame >= row.at ? index : found), 0);
  // The highlight travels from row to row as the runner reaches each station.
  const rowAt = rows.map((row, index) => ({ index, t: easeOut(frame, row.at, row.at + 14) }));
  const barY = rowAt.reduce((y, { index, t }) => (index === 0 ? top : lerp(y, top + index * step, t)), top);
  const barTone = rows[reachedIndex]!.tone === "ink" ? "line" : rows[reachedIndex]!.tone === "muted" ? "line" : rows[reachedIndex]!.tone;
  const live = frame >= T.stChristophe && frame < T.finish;
  return <g>
    <g {...enter(frame, 4, { from: "down", distance: 8 })}>
      <Tag x={geo.x1} y={30} anchor="end" text={c.total} tone="muted" size={12} />
    </g>
    {rows.map((row, index) => {
      const x = xAt(geo, CP[row.key]);
      const reached = frame >= row.at;
      return <g key={row.n} opacity={easeOut(frame, stagger(index, 14, 3), stagger(index, 14, 3) + 14)}>
        <circle cx={x} cy={geo.axis + 16} r={8.5} style={{ fill: reached ? tint(row.tone === "ink" || row.tone === "muted" ? "line" : row.tone, 22) : "var(--scene-card)" }} stroke={reached ? TONE[row.tone === "ink" || row.tone === "muted" ? "line" : row.tone] : "var(--scene-hairline)"} strokeWidth={1} />
        <Text x={x} y={geo.axis + 16.5} size={10.5} font="mono" weight={700} anchor="middle" tone={reached ? "ink" : "muted"}>{row.n}</Text>
      </g>;
    })}
    <g opacity={easeOut(frame, 16, 34)}>
      <rect x={geo.x0} y={barY - step / 2 + 1} width={geo.x1 - geo.x0} height={step - 2} rx={8} style={{ fill: tint(barTone, 12) }} />
      <rect x={geo.x0} y={barY - step / 2 + 6} width={3} height={step - 12} rx={1.5} fill={TONE[barTone]} />
    </g>
    {rows.map((row, index) => {
      const y = top + index * step;
      const reached = frame >= row.at;
      const appear = easeOut(frame, stagger(index, 20, 4), stagger(index, 20, 4) + 16);
      const event = row.key === "stChristophe" && live ? `≈ ${kmToGo(progress)} km ${c.toGo}` : row.event;
      return <g key={row.n} opacity={appear * (reached ? 1 : .45)} transform={`translate(0 ${(1 - appear) * 8})`}>
        <Text x={geo.x0 + 18} y={y} size={12} font="mono" weight={600} tone="muted" anchor="middle">{row.n}</Text>
        <Text x={geo.x0 + 34} y={y} size={15} weight={600} tone={reached ? "ink" : "muted"}>{row.name}</Text>
        {reached ? <g opacity={pop(frame, row.at + 4)}>
          <Text x={geo.x1 - 10} y={y} size={13} font="mono" weight={600} tone={row.tone} anchor="end">{event}</Text>
        </g> : <Text x={geo.x1 - 10} y={y} size={13} font="mono" weight={600} tone="muted" anchor="end" opacity={.6}>·</Text>}
      </g>;
    })}
    <g opacity={pop(frame, T.blandine)}>
      <Tag x={geo.x1 - 70} y={top + 7 * step} anchor="end" text={c.blandineLate} tone="ok" size={12} />
    </g>
  </g>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 1,
  title: { en: "86 km, aid station by aid station", fr: "86 km, ravito par ravito" },
  caption: {
    en: "The lead from a fast start melted in the dry, hot middle; the crew at Lac du Bouchet reset the race all the way to the cathedral.",
    fr: "L’avance d’un départ trop rapide a fondu dans un milieu sec et brûlant ; l’assistance du lac du Bouchet a relancé la course jusqu’à la cathédrale.",
  },
  beats: [
    { at: 0, text: { en: "Monistrol-d’Allier: 86 km, 3,500 m D+, a 13:30 plan. With Blandine, the start climbs at once, far too fast.", fr: "Monistrol-d’Allier : 86 km, 3 500 m D+, plan en 13 h 30. Avec Blandine, ça monte d’emblée, bien trop vite." } },
    { at: T.as1, text: { en: "35–40 minutes ahead at the first aid station, still 30 at Saint-Jean-Lachalm. The race seems on plan.", fr: "35 à 40 min d’avance au 1er ravitaillement, encore 30 à Saint-Jean-Lachalm. La course semble lancée." } },
    { at: T.valley - 18, text: { en: "The “easy” descent to Pont-d’Alleyras: steep down, steep up, 1.5–2 km without water. “500 m”, three times.", fr: "La « simple descente » vers Pont-d’Alleyras : raide, puis 1,5 à 2 km sans eau. « 500 m », trois fois." } },
    { at: T.leavePont, text: { en: "Dehydrated, no way to follow Blandine. 16 km of false flat under the midday sun; the lake is just a hill.", fr: "Déshydraté, impossible de suivre Blandine. 16 km de faux plat en plein soleil ; le lac n’est qu’une colline." } },
    { at: T.lac, text: { en: "Lac du Bouchet: the whole crew is there. Socks, water, reset. Recours is the real wall; Devès passes.", fr: "Lac du Bouchet : toute l’assistance est là, tout se remet en place. Le vrai mur : Recours. Le Devès passe." } },
    { at: T.stChristophe, text: { en: "Last 15 km: legs locking, night, headlamp. The cathedral after 15+ hours; Blandine 20 minutes later.", fr: "15 derniers km : jambes bloquées, nuit, frontale. La cathédrale après 15 h+ ; Blandine 20 min plus tard." } },
  ],
  Stage,
});
