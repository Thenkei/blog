import type { ReactNode } from "react";
import { Box, Camera, Counter, Dot, during, ease, easeOut, enter, lerp, pop, Pulse, stagger, Tag, Text, TONE, tint } from "../primitives";
import { defineScene, type Localized, type SceneStageProps } from "../types";

// One leaderboard breaks into the seven dimensions the article lists: each bar
// splits into seven cells that fly to the seven axes, and only the leader of
// each axis stays lit. Models A–D are the article's four archetypes, not real
// products: A leads long-context reasoning, B multimodality, C token efficiency
// and deployment control, D distribution ("already in the product where millions
// of people work"). No full ranking is drawn: the article only names leaders.
const T = {
  bars: 12,
  crown: 50,
  split: 110,
  walk: 232,
  notes: 364,
  bands: 440,
  end: 560,
} as const;
const WALK_STEP = 33;

const MODELS = ["A", "B", "C", "D"] as const;
// Schematic single-benchmark ranking: no scores, only an order.
const BAR_SHARE = [1, .84, .72, .5] as const;

type Row = { label: Localized; leader: number };
const ROWS: readonly Row[] = [
  { label: { en: "Reasoning & reliability", fr: "Raisonnement & fiabilité" }, leader: 0 },
  { label: { en: "Coding & tools, long tasks", fr: "Code & outils, tâches longues" }, leader: 2 },
  { label: { en: "Context length & handling", fr: "Taille du contexte" }, leader: 0 },
  { label: { en: "Multimodal capability", fr: "Capacités multimodales" }, leader: 1 },
  { label: { en: "Latency, tokens, inference cost", fr: "Latence, tokens, coût d’inférence" }, leader: 2 },
  { label: { en: "Openness & deployment control", fr: "Ouverture & contrôle du déploiement" }, leader: 2 },
  { label: { en: "Distribution & governance", fr: "Distribution & gouvernance" }, leader: 3 },
];

const BANDS: readonly { from: number; label: Localized }[] = [
  { from: 0, label: { en: "capability", fr: "capacités" } },
  { from: 4, label: { en: "economics & control", fr: "économie & contrôle" } },
  { from: 6, label: { en: "workflow fit", fr: "adéquation au workflow" } },
];
const bandOf = (row: number) => BANDS.filter((band) => row >= band.from).length - 1;

const PROFILES: readonly Localized<readonly [string, string]>[] = [
  { en: ["Strongest at", "long-context reasoning"], fr: ["Le meilleur en", "raisonnement long"] },
  { en: ["Better at multimodal", "understanding"], fr: ["Plus performant en", "compréhension multimodale"] },
  { en: ["Fewer tokens, cheaper,", "deployable in-house"], fr: ["Moins de tokens, moins cher,", "déployable en interne"] },
  { en: ["Less impressive in a benchmark,", "already where millions work"], fr: ["Moins brillant en benchmark,", "déjà là où des millions travaillent"] },
];

type Layout = {
  card: { x: number; y: number; w: number; h: number };
  labelX: number;
  labelSize: number;
  colX: readonly [number, number, number, number];
  headY: number;
  rows: { start: number; pitch: number; startBands: number; pitchBands: number; gap: number };
  bar: { base: number; max: number; w: number };
  panel: { x: number; y: number; w: number; h: number };
};

const WIDE: Layout = {
  card: { x: 40, y: 64, w: 560, h: 318 },
  labelX: 62,
  labelSize: 15,
  colX: [360, 430, 500, 570],
  headY: 96,
  rows: { start: 134, pitch: 34, startBands: 144, pitchBands: 29, gap: 21 },
  bar: { base: 356, max: 212, w: 36 },
  panel: { x: 624, y: 64, w: 296, h: 318 },
};

const COMPACT: Layout = {
  card: { x: 20, y: 56, w: 500, h: 332 },
  labelX: 36,
  labelSize: 14,
  colX: [338, 384, 430, 476],
  headY: 84,
  rows: { start: 122, pitch: 36, startBands: 128, pitchBands: 30, gap: 22 },
  bar: { base: 364, max: 230, w: 28 },
  panel: { x: 20, y: 400, w: 500, h: 108 },
};

/** Panel slide: fades and rises in over [from, from+16], out over [to-10, to]. */
function Slide({ frame, from, to, children }: { frame: number; from: number; to: number; children: ReactNode }) {
  const inT = easeOut(frame, from, from + 18);
  const out = to === Infinity ? 0 : ease(frame, to - 10, to);
  const opacity = inT * (1 - out);
  if (opacity <= 0) return null;
  return <g opacity={opacity} transform={`translate(0 ${10 * (1 - inT) - 8 * out})`}>{children}</g>;
}

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const L = compact ? COMPACT : WIDE;
  const { card, panel, bar } = L;
  const col = (c: number) => L.colX[c]!;

  const bands = ease(frame, T.bands, T.bands + 24);
  const rowY = (i: number) => lerp(L.rows.start + i * L.rows.pitch, L.rows.startBands + i * L.rows.pitchBands + bandOf(i) * L.rows.gap, bands);
  const splitEyebrow = easeOut(frame, T.split + 8, T.split + 22);

  // Column walk: which archetype is in focus.
  const walkIndex = MODELS.findIndex((_, c) => frame >= T.walk + c * WALK_STEP && frame < T.walk + (c + 1) * WALK_STEP);
  const walking = frame >= T.walk && frame < T.notes;
  const colFocus = (c: number) => during(frame, T.walk + c * WALK_STEP, T.walk + (c + 1) * WALK_STEP + 4, 8);

  const camera = [
    { at: 0 },
    { at: T.split - 6, dur: 50, zoom: compact ? 1.01 : 1.015 },
    { at: T.notes - 10, dur: 50, zoom: 1 },
  ];

  const px = panel.x + 18;
  const compareItems = fr ? ["le modèle", "les contraintes d’exploitation", "le workflow produit"] : ["the model", "the operating constraints", "the product workflow"];
  // Chips laid out by their own widths (Tag: 0.6em per glyph + 1.5em padding).
  const chipOffset = (n: number) => compareItems.slice(0, n).reduce((sum, item) => sum + item.length * 10.5 * .6 + 10.5 * 1.5 + 8, 0);
  // Wide slides sit in the panel's optical centre; compact ones start under the eyebrow.
  const oy = compact ? 0 : 58;
  const lastRow = rowY(6);

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    {/* The table card. */}
    <g {...enter(frame, 0)}>
      <Box x={card.x} y={card.y} w={card.w} h={card.h} tone="line" radius={16}>
        <g opacity={1 - ease(frame, T.split, T.split + 8)}>
          <Text x={card.x + 20} y={card.y + 26} size={11} weight={600} font="mono" tone="muted" caps>{fr ? "un classement · un benchmark" : "one leaderboard · one benchmark"}</Text>
        </g>
        <g opacity={splitEyebrow}>
          <Text x={card.x + 20} y={card.y + 26} size={11} weight={600} font="mono" tone="muted" caps>{fr ? "sept axes" : "seven axes"}</Text>
        </g>
      </Box>
    </g>

    {/* Column highlight during the walk. */}
    {walking ? MODELS.map((_, c) => {
      const focus = colFocus(c);
      if (focus <= 0) return null;
      return <rect key={c} x={col(c) - 22} y={L.headY - 22} width={44} height={lastRow - L.headY + 42} rx={22} style={{ fill: tint("line", 9 * focus) }} />;
    }) : null}

    {/* Archetype heads. */}
    {MODELS.map((model, c) => {
      const focus = walking ? colFocus(c) : 0;
      return <g key={model} {...enter(frame, stagger(c, 6, 4))}>
        <circle cx={col(c)} cy={L.headY} r={14} style={{ fill: tint("line", 12 + 20 * focus) }} stroke={TONE.line} strokeOpacity={.45 + .55 * focus} strokeWidth={1} />
        <Text x={col(c)} y={L.headY + 1} size={14} weight={700} font="mono" tone="line" anchor="middle">{model}</Text>
      </g>;
    })}

    {/* Band headers open up between the row groups at the end. */}
    {BANDS.map((band, b) => {
      const appear = easeOut(frame, stagger(b, T.bands + 12, 6), stagger(b, T.bands + 12, 6) + 18);
      if (appear <= 0) return null;
      const y = rowY(band.from) - 21;
      return <g key={b} opacity={appear} transform={`translate(${-6 * (1 - appear)} 0)`}>
        <Text x={L.labelX} y={y} size={10.5} weight={600} font="mono" tone="hot" caps>{band.label[locale]}</Text>
        <line x1={L.labelX + band.label[locale].length * 7.6 + 10} x2={card.x + card.w - 20} y1={y} y2={y} stroke={TONE.hot} strokeOpacity={.35} strokeWidth={1} />
      </g>;
    })}

    {/* Rows: labels, hairlines and the cells the bars split into. */}
    {ROWS.map((row, i) => {
      const y = rowY(i);
      const rowIn = easeOut(frame, stagger(i, T.split + 16, 5), stagger(i, T.split + 16, 5) + 18);
      return <g key={i} opacity={rowIn} transform={`translate(${-10 * (1 - rowIn)} 0)`}>
        {i < 6 ? <line x1={L.labelX - 4} x2={card.x + card.w - 20} y1={y + (rowY(i + 1) - y) / 2} y2={y + (rowY(i + 1) - y) / 2} stroke="var(--scene-hairline)" strokeWidth={1} opacity={.55 * (1 - (bandOf(i + 1) !== bandOf(i) ? bands : 0))} /> : null}
        <Text x={L.labelX} y={y} size={L.labelSize} weight={600} tone={walking && walkIndex >= 0 && row.leader !== walkIndex ? "muted" : "ink"}>{row.label[locale]}</Text>
      </g>;
    })}

    {/* Act 1 bars → Act 2 cells. Each bar breaks into seven pieces, one per axis. */}
    {MODELS.map((_, c) => {
      const grow = easeOut(frame, stagger(c, T.bars, 5), stagger(c, T.bars, 5) + 30);
      const h = bar.max * BAR_SHARE[c]! * grow;
      const segH = h / 7;
      if (h <= .5) return null;
      // Act 1: one solid bar. The seven pieces only exist from the split on.
      if (frame < T.split - 16) {
        return <rect key={c} x={col(c) - bar.w / 2} y={bar.base - h} width={bar.w} height={h} rx={6} style={{ fill: tint("line", c === 0 ? 70 : 38) }} />;
      }
      return ROWS.map((row, k) => {
        // Top segment goes to the first axis.
        const at = T.split + k * 3 + c * 2;
        const t = ease(frame, at, at + 26);
        const leader = row.leader === c;
        const lit = leader ? pop(frame, at + 22, 200) : 0;
        const fromY = bar.base - h + (k + .5) * segH;
        const toY = rowY(k);
        const cx = col(c);
        const cy = lerp(fromY, toY, t);
        const w = lerp(bar.w, leader ? 14 : 9, t);
        // Seams open just before the split: the bar reads solid until then.
        const seam = 2.5 * ease(frame, T.split - 16, T.split);
        const hh = lerp(Math.max(0, segH - seam + (k === 6 ? 0 : .01)), leader ? 14 : 9, t);
        const settled = t >= 1;
        if (settled && leader) {
          const s = .6 + .4 * Math.min(1.2, lit);
          const pulse = walking && colFocus(c) > .5;
          return <g key={`${c}-${k}`}>
            <g transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}><Dot x={cx} y={cy} r={7} tone="ok" /></g>
            {pulse ? <Pulse x={cx} y={cy} frame={frame} at={T.walk + c * WALK_STEP + 2} period={30} r={8} tone="ok" /> : null}
          </g>;
        }
        if (settled) return <circle key={`${c}-${k}`} cx={cx} cy={cy} r={4.5} style={{ fill: "var(--scene-card)" }} stroke="var(--scene-hairline)" strokeWidth={1.25} />;
        const fill = c === 0 ? 70 : 38;
        return <rect key={`${c}-${k}`} x={cx - w / 2} y={cy - hh / 2} width={w} height={hh} rx={lerp(k === 0 ? 6 : 1.5, hh / 2, t)}
          style={{ fill: tint(t > .6 && leader ? "ok" : "line", lerp(fill, leader ? 90 : 26, t)) }} />;

      });
    })}
    {/* The benchmark baseline and its "winner". */}
    <g opacity={easeOut(frame, T.bars, T.bars + 20) * (1 - ease(frame, T.split, T.split + 14))}>
      <line x1={L.colX[0] - 34} x2={L.colX[3] + 34} y1={bar.base + 1} y2={bar.base + 1} stroke="var(--scene-hairline)" strokeWidth={1} />
      <Tag x={L.colX[0]} y={bar.base - bar.max - 22} text={fr ? "le meilleur ?" : "best?"} tone="hot" size={12} appear={pop(frame, T.crown, 170)} />
    </g>

    {/* Side panel: one idea per beat. */}
    <g {...enter(frame, 4, { from: compact ? "up" : "right", distance: 14 })}>
      <Box x={panel.x} y={panel.y} w={panel.w} h={panel.h} tone={frame >= T.bands ? "hot" : "line"} focus={during(frame, T.bands + 24, T.end + 30, 12) * .7} radius={16} />
    </g>

    <Slide frame={frame} from={10} to={T.split + 4}>
      <Text x={px} y={panel.y + 26} size={11} weight={600} font="mono" tone="muted" caps>{fr ? "la question" : "the question"}</Text>
      {compact
        ? <Text x={px} y={panel.y + 58} size={21} weight={700}>{fr ? "« Quel est le meilleur LLM ? »" : "“Which LLM is the best?”"}</Text>
        : <>
          <Text x={px} y={panel.y + 72 + oy} size={24} weight={700}>{fr ? "« Quel est le" : "“Which LLM"}</Text>
          <Text x={px} y={panel.y + 102 + oy} size={24} weight={700}>{fr ? "meilleur LLM ? »" : "is the best?”"}</Text>
        </>}
      <Text x={px} y={panel.y + (compact ? 88 : 140 + oy)} size={12.5} weight={500} font="mono" tone="muted">{fr ? "un benchmark → un gagnant" : "one benchmark → one winner"}</Text>
    </Slide>

    <Slide frame={frame} from={T.split + 6} to={T.walk}>
      <Text x={px} y={panel.y + 26} size={11} weight={600} font="mono" tone="muted" caps>{fr ? "la frontière" : "the frontier"}</Text>
      <Counter x={px} y={panel.y + (compact ? 66 : 90 + oy)} frame={frame} from={1} to={7} start={T.split + 10} end={T.split + 60} size={compact ? 44 : 64} weight={700} font="mono" tone="line" />
      <Text x={px + (compact ? 44 : 60)} y={panel.y + (compact ? 58 : 78 + oy)} size={compact ? 15 : 16} weight={650}>{fr ? "axes à la fois," : "axes at once,"}</Text>
      <Text x={px + (compact ? 44 : 60)} y={panel.y + (compact ? 78 : 100 + oy)} size={compact ? 15 : 16} weight={650} tone="muted">{fr ? "pas un classement" : "not one leaderboard"}</Text>
    </Slide>

    {MODELS.map((model, c) => <Slide key={model} frame={frame} from={T.walk + c * WALK_STEP + (c === 0 ? 0 : 6)} to={c === 3 ? T.notes : T.walk + (c + 1) * WALK_STEP + 4}>
      <Text x={px} y={panel.y + 26} size={11} weight={600} font="mono" tone="muted" caps>{fr ? `modèle type ${model}` : `archetype ${model}`}</Text>
      {compact
        ? <Text x={px} y={panel.y + 56} size={15} weight={650}>{PROFILES[c]![locale].join(" ")}</Text>
        : PROFILES[c]![locale].map((line, l) => <Text key={l} x={px} y={panel.y + 70 + oy + l * 26} size={18} weight={650}>{line}</Text>)}
      <Tag x={px} y={panel.y + (compact ? 86 : 138 + oy)} anchor="start" tone="ok" size={11.5}
        text={(() => {
          const count = ROWS.filter((row) => row.leader === c).length;
          return fr ? `● en tête sur ${count} axe${count > 1 ? "s" : ""}` : `● leads ${count} ax${count > 1 ? "es" : "is"}`;
        })()} />
    </Slide>)}

    <Slide frame={frame} from={T.notes} to={T.bands}>
      <Text x={px} y={panel.y + 26} size={11} weight={600} font="mono" tone="muted" caps>{fr ? "un axe ne tranche pas les autres" : "one axis settles nothing else"}</Text>
      {[
        { at: T.notes + 6, model: "A", lines: fr ? ["en avance techniquement,", "en retard commercialement"] : ["technically ahead,", "commercially behind"] },
        { at: T.notes + 26, model: "C", lines: fr ? ["ouvert et bon marché,", "plus d’ingénierie à opérer"] : ["open and inexpensive,", "more engineering to operate"] },
      ].map((note, n) => {
        const ny = compact ? panel.y + 58 + n * 30 : panel.y + 92 + n * 100;
        return <g key={n} {...enter(frame, note.at, { from: "left", distance: 10 })}>
          <circle cx={px + 13} cy={compact ? ny : ny + 12} r={12} style={{ fill: tint("hot", 16) }} stroke={TONE.hot} strokeOpacity={.4} strokeWidth={1} />
          <Text x={px + 13} y={(compact ? ny : ny + 12) + 1} size={12.5} weight={700} font="mono" tone="hot" anchor="middle">{note.model}</Text>
          {compact
            ? <Text x={px + 34} y={ny} size={14} weight={600}>{note.lines.join(" ")}</Text>
            : note.lines.map((line, l) => <Text key={l} x={px + 36} y={ny + l * 24} size={16} weight={600} tone={l === 0 ? "ink" : "muted"}>{line}</Text>)}
        </g>;
      })}
    </Slide>

    <Slide frame={frame} from={T.bands + 8} to={Infinity}>
      <Text x={px} y={panel.y + 26} size={11} weight={600} font="mono" tone="hot" caps>{fr ? "avant de désigner un leader" : "before naming a leader"}</Text>
      <Text x={px} y={panel.y + (compact ? 54 : 66 + oy / 2)} size={compact ? 18 : 22} weight={700}>{fr ? "4 leaders · 7 axes" : "4 leaders · 7 axes"}</Text>
      {!compact ? <Text x={px} y={panel.y + 100 + oy / 2} size={14.5} weight={600} tone="muted">{fr ? "Comparer :" : "Compare:"}</Text> : null}
      {compareItems.map((item, n) => {
        const at = stagger(n, T.bands + 20, 6);
        return compact
          ? <Tag key={n} x={px + chipOffset(n)} y={panel.y + 86} anchor="start" text={item} tone="hot" size={10.5} appear={pop(frame, at)} />
          : <g key={n} {...enter(frame, at, { from: "left", distance: 8 })}>
            <Text x={px} y={panel.y + 132 + oy / 2 + n * 28} size={13} weight={700} font="mono" tone="hot">{`${n + 1}`}</Text>
            <Text x={px + 20} y={panel.y + 132 + oy / 2 + n * 28} size={15.5} weight={600}>{item}</Text>
          </g>;
      })}
    </Slide>
  </Camera>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 30,
  title: { en: "A frontier is not one leaderboard", fr: "Une frontière, pas un classement" },
  caption: {
    en: "The best score on one axis does not settle the others. Compare the model, the operating constraints and the product workflow before naming a leader.",
    fr: "Le meilleur score sur un axe ne tranche pas les autres. Comparer le modèle, les contraintes d’exploitation et le workflow produit avant de désigner un leader.",
  },
  beats: [
    { at: 0, text: { en: "“Which LLM is the best?” A single leaderboard answers with one benchmark and one winner.", fr: "« Quel est le meilleur LLM ? » Un classement unique répond avec un seul benchmark et un seul gagnant." } },
    { at: T.split, text: { en: "But the frontier moves along at least seven axes at once, from reasoning quality to distribution.", fr: "Mais la frontière avance sur au moins sept axes à la fois, de la qualité du raisonnement à la distribution." } },
    { at: T.walk, text: { en: "One model leads long-context reasoning, one multimodality, one efficiency and control, one distribution.", fr: "Un modèle mène en raisonnement long, un en multimodal, un en efficacité et contrôle, un en distribution." } },
    { at: T.notes, text: { en: "The best score on one axis does not settle the others: ahead technically can mean behind commercially.", fr: "Le meilleur score sur un axe ne tranche pas les autres : en avance techniquement, en retard commercialement." } },
    { at: T.bands, text: { en: "Compare the model, the operating constraints and the product workflow before naming a leader.", fr: "Comparer le modèle, les contraintes d’exploitation et le workflow produit avant de désigner un leader." } },
  ],
  Stage,
});
