import type { PostLocale } from "../../../content/types";
import { Boundary, Box, Camera, Comet, Counter, dim, during, ease, easeOut, enter, lerp, Meter, pop, Pulse, stagger, Tag, Text, TONE, tint, Wire } from "../primitives";
import { defineScene, type Localized, type SceneStageProps } from "../types";

// "My hesitation begins beneath the interface." A cross-section: the chat window
// sits on the surface; beneath it lie the strata the cloud hides. A probe drills
// down one stratum per act: computation, electricity (with the article's IEA
// figures), extraction. The finale names the whole underground: the building
// behind the front door, which belongs to someone and stands somewhere.
const T = {
  typed: 12,
  answer: 50,
  weightless: 66,
  compute: 100,
  power: 170,
  meters: 222,
  extract: 300,
  building: 386,
  end: 510,
} as const;
const DRILL = 18;

const NBSP = "\u00a0";
const TWH_2025 = 485;
const TWH_2030 = 950;

type Stratum = { title: Localized; sub: Localized; at: number };
const STRATA: readonly [Stratum, Stratum, Stratum] = [
  { title: { en: "Computation", fr: "Calcul" }, sub: { en: "what “the cloud” hides", fr: "ce que cache le « cloud »" }, at: T.compute },
  { title: { en: "Electricity", fr: "Électricité" }, sub: { en: "+17% in 2025", fr: "+17 % en 2025" }, at: T.power },
  { title: { en: "Extraction", fr: "Extraction" }, sub: { en: "where the chain leads", fr: "au bout de la chaîne" }, at: T.extract },
];

const COMPUTE: readonly Localized[] = [
  { en: "data centres", fr: "centres de données" },
  { en: "processors", fr: "processeurs" },
  { en: "cooling", fr: "refroidissement" },
];
const PRESSURE: readonly (readonly Localized[])[] = [
  [{ en: "grids", fr: "réseaux" }, { en: "transformers", fr: "transformateurs" }, { en: "turbines", fr: "turbines" }],
  [{ en: "chips", fr: "puces" }, { en: "supply chains", fr: "approvisionnement" }],
];
const EXTRACT: readonly Localized[] = [
  { en: "minerals", fr: "minerais" },
  { en: "factories", fr: "usines" },
  { en: "workers", fr: "travailleurs" },
  { en: "territories", fr: "territoires" },
];

const tagWidth = (text: string, size: number) => text.length * size * .6 + size * 1.5;
/** Left edges of a row of chips laid out by their own widths. */
const lefts = (items: readonly string[], x: number, size: number, gap: number) => items.map((_, i) => items.slice(0, i).reduce((sum, item) => sum + tagWidth(item, size) + gap, x));

type Rect = { x: number; y: number; w: number; h: number };
type Layout = {
  chat: Rect;
  question: Rect;
  answerX: number;
  answerY: number;
  weightless: { x: number; y: number; anchor: "start" | "end" };
  surfaceY: number;
  bands: readonly [Rect, Rect, Rect];
  inlineTitle: boolean;
  contentX: number;
  shaftX: number;
  chipY: readonly [number, number, number];
  pressureRows: readonly [number, number];
  meters: { labelX: number; x: number; w: number; valueX: number; y: readonly [number, number] };
  chip: number;
  building: Rect;
};

const WIDE: Layout = {
  chat: { x: 40, y: 54, w: 400, h: 78 },
  question: { x: 176, y: 64, w: 250, h: 28 },
  answerX: 58,
  answerY: 106,
  weightless: { x: 470, y: 93, anchor: "start" },
  surfaceY: 146,
  bands: [{ x: 40, y: 156, w: 880, h: 70 }, { x: 40, y: 234, w: 880, h: 86 }, { x: 40, y: 328, w: 880, h: 68 }],
  inlineTitle: false,
  contentX: 292,
  shaftX: 256,
  chipY: [35, 0, 34],
  pressureRows: [30, 58],
  meters: { labelX: 580, x: 664, w: 150, valueX: 826, y: [42, 64] },
  chip: 12.5,
  building: { x: 30, y: 150, w: 900, h: 254 },
};

const COMPACT: Layout = {
  chat: { x: 20, y: 56, w: 500, h: 84 },
  question: { x: 246, y: 66, w: 262, h: 28 },
  answerX: 36,
  answerY: 112,
  weightless: { x: 506, y: 118, anchor: "end" },
  surfaceY: 152,
  bands: [{ x: 20, y: 162, w: 500, h: 78 }, { x: 20, y: 248, w: 500, h: 142 }, { x: 20, y: 398, w: 500, h: 110 }],
  inlineTitle: true,
  contentX: 36,
  shaftX: 504,
  chipY: [52, 0, 52],
  pressureRows: [50, 78],
  meters: { labelX: 36, x: 128, w: 250, valueX: 390, y: [118, 134] },
  chip: 11.5,
  building: { x: 14, y: 158, w: 512, h: 356 },
};

function ChipRow({ items, x, y, size, frame, start, locale, tone = "line", gap = 10 }: { items: readonly Localized[]; x: number; y: number; size: number; frame: number; start: number; locale: PostLocale; tone?: "line" | "hot" | "muted"; gap?: number }) {
  const xs = lefts(items.map((item) => item[locale]), x, size, gap);
  return <>{items.map((item, i) => <Tag key={i} x={xs[i]!} y={y} anchor="start" text={item[locale]} tone={tone} size={size} appear={pop(frame, stagger(i, start, 6))} />)}</>;
}

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const L = compact ? COMPACT : WIDE;
  const { chat, question: q } = L;

  const questionText = fr ? "Compare ces deux architectures" : "Compare these two architectures";
  const typedChars = Math.max(0, Math.min(questionText.length, Math.floor((frame - T.typed) / 1.1)));
  const typing = typedChars > 0 && typedChars < questionText.length;
  const answerIn = easeOut(frame, T.answer, T.answer + 16);
  const building = ease(frame, T.building, T.building + 20);

  // The probe: one drill per stratum, arriving at its `at`.
  const depths = [chat.y + chat.h, ...L.bands.map((band) => band.y + band.h / 2)];
  const reached = STRATA.filter((stratum) => frame >= stratum.at).length;
  const drilling = STRATA.findIndex((stratum) => frame >= stratum.at - DRILL && frame < stratum.at);
  const shaftEnd = drilling >= 0
    ? lerp(depths[drilling]!, depths[drilling + 1]!, ease(frame, STRATA[drilling]!.at - DRILL, STRATA[drilling]!.at))
    : depths[reached]!;

  // Attention: the stratum being explored leads; the others recede until the finale.
  const active = reached - 1;
  const bandFocus = (i: number) => i === active ? during(frame, STRATA[i]!.at, (STRATA[i + 1]?.at ?? T.building) + 6, 12) : 0;
  const recede = (i: number) => frame >= T.building ? 1 : i < active ? dim(1, .55) : 1;

  const camera = [
    { at: 0 },
    { at: T.power - 10, dur: 50, zoom: compact ? 1.01 : 1.02, focus: [width / 2, lerp(height / 2, L.bands[1].y + L.bands[1].h / 2, .25)] as const },
    { at: T.building - 10, dur: 50, zoom: 1 },
  ];

  const meterRows = [
    { year: "2025", twh: TWH_2025, at: T.meters, tone: "line" as const },
    { year: fr ? "2030 proj." : "2030 proj.", twh: TWH_2030, at: T.meters + 30, tone: "hot" as const },
  ];

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    {/* The front door: a question, an answer, no machinery in sight. */}
    <g {...enter(frame, 0)}>
      <Box x={chat.x} y={chat.y} w={chat.w} h={chat.h} tone={building > .5 ? "ok" : "line"} radius={16}>
        <rect x={q.x} y={q.y} width={q.w} height={q.h} rx={14} style={{ fill: tint("line", 14) }} />
        <Text x={q.x + 14} y={q.y + q.h / 2} size={13.5} weight={600}>{questionText.slice(0, typedChars)}</Text>
        {typing ? <rect x={q.x + 14 + typedChars * 6.9} y={q.y + 7} width={1.6} height={14} fill={TONE.ink} /> : null}
        <g opacity={answerIn} transform={`translate(${-6 * (1 - answerIn)} 0)`}>
          <circle cx={L.answerX + 6} cy={L.answerY} r={6} style={{ fill: tint("ok", 30) }} />
          {[.9, .62].map((share, i) => <rect key={i} x={L.answerX + 20} y={L.answerY - 4 + i * 14} width={(compact ? 220 : 230) * share * easeOut(frame, T.answer + i * 6, T.answer + 24 + i * 6)} height={6} rx={3} style={{ fill: tint("ink", 16) }} />)}
        </g>
      </Box>
    </g>
    <Tag x={L.weightless.x} y={L.weightless.y} anchor={L.weightless.anchor} size={12}
      text={building > .5 ? (compact ? (fr ? "✓ ouverte à tous" : "✓ open to everyone") : (fr ? "porte d’entrée · ✓ ouverte à tous" : "front door · ✓ open to everyone")) : (fr ? "sans poids ?" : "weightless?")}
      tone={building > .5 ? "ok" : "muted"}
      appear={pop(frame, T.weightless) * (building > 0 && building < 1 ? Math.abs(building - .5) * 2 : 1)} />

    {/* The surface: everything below it is what the screen does not show. */}
    <g {...enter(frame, 20, { from: "none" })}>
      <line x1={compact ? 20 : 40} x2={compact ? 520 : 920} y1={L.surfaceY} y2={L.surfaceY} stroke="var(--scene-hairline)" strokeWidth={1} />
      {!compact ? <Text x={920} y={L.surfaceY - 10} size={10.5} weight={600} font="mono" tone="muted" caps anchor="end" opacity={1 - building}>{fr ? "sous l’interface ↓" : "beneath the interface ↓"}</Text> : null}
    </g>

    {/* Strata: present from the start, unseen until the probe reaches them. */}
    {L.bands.map((band, i) => {
      const stratum = STRATA[i]!;
      const lit = easeOut(frame, stratum.at, stratum.at + 18);
      const focus = bandFocus(i);
      return <g key={i} {...enter(frame, stagger(i, 24, 6), { from: "none" })} opacity={recede(i)}>
        <rect x={band.x} y={band.y} width={band.w} height={band.h} rx={14} style={{ fill: tint("line", 4 + 3 * i + 5 * lit) }} />
        {focus > 0 ? <rect x={band.x + .5} y={band.y + .5} width={band.w - 1} height={band.h - 1} rx={13.5} fill="none" stroke={TONE[i === 1 ? "hot" : "line"]} strokeOpacity={.5 * focus} strokeWidth={1.25} /> : null}
        <g opacity={.35 + .65 * lit}>
          {L.inlineTitle
            ? <Text x={band.x + 16} y={band.y + 20} size={14.5} weight={650}>{stratum.title[locale]}<tspan dx={10} fill={TONE[i === 1 ? "hot" : "muted"]} style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, fontWeight: 600 }} opacity={lit}>{stratum.sub[locale]}</tspan></Text>
            : <>
              <Text x={band.x + 20} y={band.y + band.h / 2 - 10} size={16.5} weight={650}>{stratum.title[locale]}</Text>
              <Text x={band.x + 20} y={band.y + band.h / 2 + 12} size={11.5} weight={600} font="mono" tone={i === 1 ? "hot" : "muted"} opacity={lit}>{stratum.sub[locale]}</Text>
            </>}
        </g>
      </g>;
    })}

    {/* The probe's shaft. */}
    {frame >= T.compute - DRILL ? <g>
      <line x1={L.shaftX} x2={L.shaftX} y1={depths[0]} y2={shaftEnd} stroke={TONE.hot} strokeOpacity={.6 * (1 - building * .5)} strokeWidth={1.5} strokeDasharray="3 4" />
      {drilling >= 0
        ? <Comet points={[[L.shaftX, depths[drilling]!], [L.shaftX, depths[drilling + 1]!]]} t={ease(frame, STRATA[drilling]!.at - DRILL, STRATA[drilling]!.at)} tone="hot" r={6} tail={.4} />
        : <circle cx={L.shaftX} cy={shaftEnd} r={5} fill={TONE.hot} className="scene-glow" style={{ color: TONE.hot }} opacity={1 - building * .5} />}
      {STRATA.map((stratum, i) => frame >= stratum.at && frame < stratum.at + 44
        ? <Pulse key={i} x={L.shaftX} y={depths[i + 1]!} frame={frame} at={stratum.at} period={44} r={7} tone="hot" />
        : null)}
    </g> : null}

    {/* Computation */}
    <ChipRow items={COMPUTE} x={L.contentX} y={L.bands[0].y + L.chipY[0]} size={L.chip} frame={frame} start={T.compute + 8} locale={locale} />

    {/* Electricity: delivered to specific places; the grid strains; demand doubles. */}
    {(() => {
      const band = L.bands[1];
      return <g>
        {PRESSURE.map((row, r) => <ChipRow key={r} items={row} x={L.contentX} y={band.y + L.pressureRows[r]!} size={compact ? 11 : 11.5} frame={frame} start={T.power + 10 + r * 16} locale={locale} tone="muted" gap={8} />)}
        {/* Power delivered up to the computation stratum. */}
        {!compact ? <Wire d={`M${band.x + band.w - 18} ${band.y + band.h - 12}V${L.bands[0].y + 12}`} draw={ease(frame, T.power + 20, T.power + 40)} tone="hot" width={1.5} flow={frame} opacity={.8} /> : null}
        <g opacity={easeOut(frame, T.meters - 14, T.meters)}>
          {meterRows.map((row, r) => {
            const y = band.y + L.meters.y[r]!;
            const value = easeOut(frame, row.at, row.at + 30) * row.twh / TWH_2030;
            return <g key={r}>
              <Text x={L.meters.labelX} y={y} size={12} weight={600} font="mono" tone="muted">{row.year}</Text>
              <Meter x={L.meters.x} y={y - 4} w={L.meters.w} h={8} value={value} tone={row.tone} />
              <Counter x={L.meters.valueX} y={y} frame={frame} from={0} to={row.twh} start={row.at} end={row.at + 30} size={13} weight={700} font="mono" tone={row.tone === "hot" ? "hot" : "ink"}
                format={(v) => `${r === 0 ? `≈${NBSP}` : ""}${Math.round(v)}${NBSP}TWh`} />
            </g>;
          })}
          {<Text x={L.meters.labelX} y={band.y + (compact ? 100 : 18)} size={10.5} weight={600} font="mono" tone="muted" caps>{fr ? "centres de données, monde · IEA" : "data centres, world · IEA"}</Text>}
        </g>
      </g>;
    })()}

    {/* Extraction */}
    <ChipRow items={EXTRACT} x={L.contentX} y={L.bands[2].y + L.chipY[2]} size={L.chip} frame={frame} start={T.extract + 8} locale={locale} />
    {(() => {
      const names = EXTRACT.map((item) => item[locale]);
      const xs = lefts(names, L.contentX, L.chip, 10);
      const pinText = fr ? "⌖ occupe un territoire" : "⌖ stands somewhere";
      const territoriesEnd = xs[3]! + tagWidth(names[3]!, L.chip);
      const pin = compact
        ? { x: xs[3]! + tagWidth(names[3]!, L.chip) / 2, y: L.bands[2].y + 86, anchor: "middle" as const }
        : { x: territoriesEnd + 12, y: L.bands[2].y + L.chipY[2], anchor: "start" as const };
      return <Tag x={Math.min(pin.x, (compact ? 506 : 906) - (pin.anchor === "middle" ? tagWidth(pinText, 12) / 2 : tagWidth(pinText, 12)))} y={pin.y} anchor={pin.anchor} text={pinText} tone="hot" size={12} appear={pop(frame, T.building + 14)} />;
    })()}

    {/* The building behind the front door. */}
    <Boundary x={L.building.x} y={L.building.y} w={L.building.w} h={L.building.h} label={fr ? "le bâtiment · appartient à quelqu’un" : "the building · belongs to someone"} tone="hot" labelAt="top-end" appear={building} />
  </Camera>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 30,
  title: { en: "Beneath the interface", fr: "Sous l’interface" },
  caption: {
    en: "The physical chain behind AI: extraction, electricity and computation sharing the same landscape.",
    fr: "La chaîne matérielle de l’IA : extraction, électricité et calcul partagent le même paysage.",
  },
  beats: [
    { at: 0, text: { en: "I type a question and an answer appears. Nothing on screen shows the machinery behind it.", fr: "Je tape une question, une réponse apparaît. Rien à l’écran ne montre la machinerie derrière." } },
    { at: T.compute - DRILL, text: { en: "“The cloud” hides data centres, processors and cooling.", fr: "Le « cloud » cache des centres de données, des processeurs et du refroidissement." } },
    { at: T.power - DRILL, text: { en: "That computation needs electricity delivered in specific places, straining grids, turbines and chips.", fr: "Ce calcul exige une électricité acheminée dans des lieux précis : réseaux, turbines et puces sous tension." } },
    { at: T.meters, text: { en: "IEA: data-centre electricity grew 17% in 2025; roughly 485 TWh in 2025, 950 TWh projected for 2030.", fr: "IEA : +17 % pour les centres de données en 2025 ; d’environ 485 TWh en 2025 à 950 TWh prévus en 2030." } },
    { at: T.extract - DRILL, text: { en: "Follow the chain further and you reach minerals, factories, workers and territories.", fr: "En remontant la chaîne, on trouve des minerais, des usines, des travailleurs et des territoires." } },
    { at: T.building, text: { en: "The front door may be open to everyone; the building still belongs to someone and stands somewhere.", fr: "La porte peut être ouverte à tous ; le bâtiment appartient toujours à quelqu’un et occupe un territoire." } },
  ],
  Stage,
});
