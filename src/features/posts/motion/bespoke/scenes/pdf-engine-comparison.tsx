import { Box, Checkpoint, Comet, Counter, during, ease, easeOut, enter, lerp, Meter, NBSP, pop, Pulse, Tag, tagWidth, Text, tint, TONE, Wire } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Timeline (30 fps). Act 1: the same input goes to both engines, two PDFs come
// out, and the checks compare what is visible instead of pixels. Act 2: the
// timing protocol (one warm-up render that does not count, the engine order
// reversed on each round, the median), then the loop to the next round.
// Only the medians and "12 warm renders" are measurements from the article;
// the three rounds drawn stand for the sequence, not for individual timings.
const RENDER = 12;
const ROUND = 2 * RENDER + 4;
const T = {
  send: 12,
  pages: 34,
  wraps: 62,
  checks: 142,
  count: 146,
  countOk: 166,
  words: 172,
  wordsFrom: 178,
  wordsTo: 206,
  wordsOk: 208,
  foot: 216,
  footOk: 236,
  same: 244,
  swap: 262,
  warm: 284,
  rounds: 312,
  more: 394,
  median: 398,
  loop: 472,
  end: 600,
} as const;

const ENGINES = ["LaTeX", "WeasyPrint"] as const;
// One-page bulletin, medians over 12 warm renders (article table, first row).
const MEDIAN_MS = [1127, 141] as const;

type Run = { engine: 0 | 1; row: number; slot: 0 | 1; start: number };
// Warm-up: each engine once. Then three rounds, the order reversed on each one.
const RUNS: readonly Run[] = [
  { engine: 0, row: 0, slot: 0, start: T.warm },
  { engine: 1, row: 0, slot: 1, start: T.warm + RENDER },
  ...[0, 1, 2].flatMap((round) => ([0, 1] as const).map((slot): Run => ({
    engine: round % 2 === 0 ? slot : slot === 0 ? 1 : 0,
    row: round + 1,
    slot,
    start: T.rounds + round * ROUND + slot * RENDER,
  }))),
];

const COPY = {
  fr: {
    sameInput: "même entrée",
    doc: "bulletin",
    engineSub: ["Tectonic", "HTML et CSS"],
    wraps: "retours à la ligne ≠",
    same: "même sortie ✓",
    checks: "contrôles",
    visible: "ce qui est visible",
    pixels: "mêmes pixels",
    notRequired: "≠ non exigés",
    rows: [
      { label: "nombre de pages", sub: "1 = 1" },
      { label: "mots et nombres", sub: "comptés des deux côtés" },
      { label: "pied de page, numérotation", sub: "page par page" },
    ],
    warm: "mesure à chaud",
    counted: "compté",
    yes: "oui",
    no: "non",
    warmup: "préchauffage",
    round: (n: number) => `tour ${n}`,
    median: "médiane",
    renders: "12 rendus à chaud",
    decide: "je décide du tour suivant",
    variant: "variante contre le rendu existant",
  },
  en: {
    sameInput: "same input",
    doc: "bulletin",
    engineSub: ["Tectonic", "HTML and CSS"],
    wraps: "line wrapping ≠",
    same: "same output ✓",
    checks: "checks",
    visible: "what is visible",
    pixels: "identical pixels",
    notRequired: "≠ not required",
    rows: [
      { label: "page count", sub: "1 = 1" },
      { label: "words and numbers", sub: "counted on both sides" },
      { label: "footer, page numbering", sub: "page by page" },
    ],
    warm: "warm measurement",
    counted: "counted",
    yes: "yes",
    no: "no",
    warmup: "warmup",
    round: (n: number) => `round ${n}`,
    median: "median",
    renders: "12 warm renders",
    decide: "I decide the next round",
    variant: "variant against the existing render",
  },
} as const;

/** "1 127 ms" in French, "1,127 ms" in English, as in the article's table. */
function ms(value: number, fr: boolean) {
  const n = Math.round(value);
  const digits = n >= 1000 ? `${Math.floor(n / 1000)}${fr ? NBSP : ","}${String(n % 1000).padStart(3, "0")}` : String(n);
  return `${digits}${NBSP}ms`;
}

// ─── The page: the same words, wrapped differently by each engine ────────────
const SHEET = { w: 96, h: 128, inset: 10, top: 38, pitch: 10, wordH: 5 } as const;
const WORD_WIDTHS = [18, 12, 22, 10, 16, 20, 9, 14, 24, 12, 17, 11, 19, 13, 21, 10] as const;
type Word = { x: number; line: number; w: number };

/** Greedy line wrapping: other glyph metrics, other line breaks, same words. */
function wrap(scale: number, gap: number): readonly Word[] {
  const max = SHEET.w - 2 * SHEET.inset;
  const words: Word[] = [];
  let x = 0;
  let line = 0;
  for (const width of WORD_WIDTHS) {
    const w = width * scale;
    if (x > 0 && x + w > max) {
      line += 1;
      x = 0;
    }
    words.push({ x, line, w });
    x += w + gap;
  }
  return words;
}

const WRAPPED = [wrap(1, 4), wrap(1.08, 4)] as const;
/** First word that sits on another line in the second PDF. */
const MOVED = WRAPPED[0].findIndex((word, index) => word.line !== WRAPPED[1][index]!.line);
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

type Rect = { x: number; y: number; w: number; h: number };
type Pt = readonly [number, number];
const cx = (r: Rect) => r.x + r.w / 2;
const cy = (r: Rect) => r.y + r.h / 2;

function Page({ rect, words, shown, counted, countedTone, mark, edge, foot, flash }: {
  rect: Rect;
  words: readonly Word[];
  /** Words drawn so far (the page being rendered). */
  shown: number;
  /** Words counted so far by the check. */
  counted: number;
  countedTone: number;
  /** 0→1 highlight of the word whose line differs. */
  mark: number;
  /** 0→1 `ok` outline: the page-count check. */
  edge: number;
  /** 0→1 `ok` footer and page number. */
  foot: number;
  /** 0→1 wash when the engine has just rendered the page again. */
  flash: number;
}) {
  const { w, h, inset } = SHEET;
  const footY = h - 15;
  return <g transform={`translate(${rect.x} ${rect.y}) scale(${rect.w / w})`}>
    <rect className="scene-card" width={w} height={h} rx={7} style={{ fill: "var(--scene-card)" }} />
    {flash > 0 ? <rect width={w} height={h} rx={7} style={{ fill: tint("line", 18 * flash) }} /> : null}
    {edge > 0 ? <rect className="scene-glow" x={.75} y={.75} width={w - 1.5} height={h - 1.5} rx={6.25} fill="none" stroke={TONE.ok} strokeWidth={1.75} strokeOpacity={edge} style={{ color: TONE.ok }} /> : null}
    <rect x={inset} y={13} width={38} height={6} rx={3} style={{ fill: tint("ink", 42) }} />
    <rect x={inset} y={24} width={22} height={3} rx={1.5} style={{ fill: tint("ink", 20) }} />
    {words.map((word, index) => {
      const on = clamp01(shown - index);
      if (on <= 0) return null;
      const ok = clamp01(counted - index) * countedTone;
      const hot = index === MOVED ? mark : 0;
      const y = SHEET.top + word.line * SHEET.pitch;
      return <g key={index} opacity={on}>
        <rect x={inset + word.x} y={y} width={word.w} height={SHEET.wordH} rx={2} style={{ fill: tint("ink", 26) }} />
        {ok > 0 ? <rect x={inset + word.x} y={y} width={word.w} height={SHEET.wordH} rx={2} fill={TONE.ok} opacity={ok} /> : null}
        {hot > 0 ? <rect className="scene-glow" x={inset + word.x} y={y} width={word.w} height={SHEET.wordH} rx={2} fill={TONE.hot} opacity={hot} style={{ color: TONE.hot }} /> : null}
      </g>;
    })}
    <line x1={inset} x2={w - inset} y1={h - 23} y2={h - 23} stroke="var(--scene-hairline)" strokeWidth={1} />
    <rect x={inset} y={footY} width={40} height={4} rx={2} style={{ fill: tint("ink", 22) }} />
    <rect x={w - inset - 12} y={footY} width={12} height={4} rx={2} style={{ fill: tint("ink", 34) }} />
    {foot > 0 ? <g opacity={foot}>
      <rect x={inset} y={footY} width={40} height={4} rx={2} fill={TONE.ok} />
      <rect x={w - inset - 12} y={footY} width={12} height={4} rx={2} fill={TONE.ok} />
    </g> : null}
  </g>;
}

/** S-curve between two anchors, sampled so a `Comet` can follow the same line. */
function sCurve(from: Pt, to: Pt, vertical: boolean): Pt[] {
  const c1: Pt = vertical ? [from[0], (from[1] + to[1]) / 2] : [(from[0] + to[0]) / 2, from[1]];
  const c2: Pt = vertical ? [to[0], (from[1] + to[1]) / 2] : [(from[0] + to[0]) / 2, to[1]];
  return Array.from({ length: 13 }, (_, index) => {
    const t = index / 12;
    const u = 1 - t;
    const at = (k: 0 | 1) => Math.round((u ** 3 * from[k] + 3 * u * u * t * c1[k] + 3 * u * t * t * c2[k] + t ** 3 * to[k]) * 10) / 10;
    return [at(0), at(1)] as const;
  });
}
/** "Then": the second render of a round follows the first one. */
function Then({ x, y, length, opacity }: { x: number; y: number; length: number; opacity: number }) {
  if (opacity <= 0) return null;
  const tip = x + length / 2;
  return <path d={`M${x - length / 2} ${y}H${tip}M${tip - 3.5} ${y - 3}L${tip} ${y}L${tip - 3.5} ${y + 3}`} fill="none" stroke={TONE.muted} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />;
}

const toPath = (points: readonly Pt[]) => `M${points.map(([x, y]) => `${x} ${y}`).join("L")}`;
const linear = (t: number) => t;

type Layout = {
  input: Rect;
  engines: readonly [Rect, Rect];
  pages: readonly [Rect, Rect];
  /** Where the statement about the pair of PDFs sits. */
  slot: Pt;
  panel: Rect;
};

const WIDE_LAYOUT: Layout = {
  input: { x: 40, y: 162, w: 120, h: 84 },
  engines: [{ x: 220, y: 85, w: 160, h: 66 }, { x: 220, y: 257, w: 160, h: 66 }],
  pages: [{ x: 440, y: 54, w: 96, h: 128 }, { x: 440, y: 226, w: 96, h: 128 }],
  slot: [488, 204],
  panel: { x: 588, y: 54, w: 332, h: 300 },
};

const COMPACT_LAYOUT: Layout = {
  input: { x: 140, y: 52, w: 260, h: 32 },
  engines: [{ x: 20, y: 102, w: 240, h: 36 }, { x: 280, y: 102, w: 240, h: 36 }],
  pages: [{ x: 102.5, y: 150, w: 75, h: 100 }, { x: 362.5, y: 150, w: 75, h: 100 }],
  slot: [270, 200],
  panel: { x: 20, y: 262, w: 500, h: 166 },
};

function Stage({ frame, compact, locale }: SceneStageProps) {
  const fr = locale === "fr";
  const c = COPY[locale];
  const L = compact ? COMPACT_LAYOUT : WIDE_LAYOUT;
  const { input, engines, pages, panel } = L;
  const both = [0, 1] as const;

  const inPath = (i: 0 | 1) => compact
    ? sCurve([cx(input), input.y + input.h], [cx(engines[i]), engines[i].y], true)
    : sCurve([input.x + input.w, cy(input)], [engines[i].x, cy(engines[i])], false);
  const outPath = (i: 0 | 1): Pt[] => compact
    ? [[cx(engines[i]), engines[i].y + engines[i].h], [cx(engines[i]), pages[i].y]]
    : [[engines[i].x + engines[i].w, cy(engines[i])], [pages[i].x, cy(engines[i])]];

  // Act 1 sends the input to both engines at once; act 2 renders one engine at a time.
  const runsOf = (engine: 0 | 1) => RUNS.filter((run) => run.engine === engine);
  const busy = (engine: 0 | 1) => Math.max(
    during(frame, T.send + 13, T.pages + 8, 5),
    ...runsOf(engine).map((run) => during(frame, run.start + 3, run.start + RENDER + 1, 3)),
  );
  const flash = (engine: 0 | 1) => Math.max(0, ...runsOf(engine).map((run) => {
    const done = run.start + RENDER - 1;
    return frame >= done ? 1 - ease(frame, done, done + 14) : 0;
  }));
  const inT = (engine: 0 | 1) => Math.max(
    ease(frame, T.send, T.send + 16, linear) % 1,
    ...runsOf(engine).map((run) => ease(frame, run.start, run.start + 5, linear) % 1),
  );
  const outT = (engine: 0 | 1) => Math.max(
    ease(frame, T.pages - 8, T.pages, linear) % 1,
    ...runsOf(engine).map((run) => ease(frame, run.start + 7, run.start + RENDER - 1, linear) % 1),
  );

  // Checks leave their trace on the pages until the panel turns to the timing.
  const kept = 1 - ease(frame, T.swap, T.swap + 16);
  const shown = lerp(0, WORD_WIDTHS.length, ease(frame, T.pages + 6, T.pages + 26, linear));
  const counted = lerp(0, WORD_WIDTHS.length, ease(frame, T.wordsFrom, T.wordsTo, linear));
  const countedTone = lerp(1, .55, ease(frame, T.wordsOk, T.wordsOk + 16)) * kept;
  const mark = during(frame, T.wraps, T.checks - 4, 10);
  const edge = during(frame, T.count, T.countOk + 16, 8);
  const foot = ease(frame, T.foot + 2, T.foot + 12) * lerp(1, .55, ease(frame, T.footOk, T.footOk + 16)) * kept;
  const pageIn = (i: 0 | 1) => enter(frame, T.pages + i * 3, { from: compact ? "down" : "right", distance: 16 });
  const markAt = (i: 0 | 1): Pt => {
    const word = WRAPPED[i][MOVED]!;
    const scale = pages[i].w / SHEET.w;
    return [pages[i].x + (SHEET.inset + word.x + word.w / 2) * scale, pages[i].y + (SHEET.top + word.line * SHEET.pitch + SHEET.wordH / 2) * scale];
  };

  const px = panel.x + (compact ? 16 : 20);
  const right = panel.x + panel.w - (compact ? 16 : 20);
  const checksOn = 1 - ease(frame, T.swap, T.swap + 12);
  const timingOn = easeOut(frame, T.swap + 8, T.swap + 24);

  // Check rows: wide stacks label and detail, compact puts them on one line.
  const checkRows = [
    { at: T.count, pass: T.countOk },
    { at: T.words, pass: T.wordsOk },
    { at: T.foot, pass: T.footOk },
  ].map((row, index) => ({ ...row, ...c.rows[index]!, y: panel.y + (compact ? 90 + index * 26 : 142 + index * 48) }));

  // Timing log: one row per round, the chips in the order the engines ran.
  const log = compact
    ? { rowY: (row: number) => panel.y + 46 + row * 27, chipsX: px + 100, gap: 14, countedX: 322, label: 12.5, moreY: panel.y + 148 }
    : { rowY: (row: number) => panel.y + 52 + row * 27, chipsX: px + 104, gap: 22, countedX: right, label: 13, moreY: panel.y + 153 };
  const chipX = (run: Run) => {
    if (run.slot === 0) return log.chipsX;
    const first = RUNS.find((other) => other.row === run.row && other.slot === 0)!;
    return log.chipsX + tagWidth(ENGINES[first.engine], 11) + log.gap;
  };
  const med = compact
    ? { x: 346, w: right - 346, rows: [panel.y + 72, panel.y + 116] as const }
    : { x: px, w: right - px, rows: [panel.y + 218, panel.y + 256] as const };
  const medianIn = easeOut(frame, T.median, T.median + 18);
  const fill = easeOut(frame, T.median + 6, T.median + 40);

  // The loop: from the measurement to my decision, then to the next variant.
  const loop = compact
    ? { path: [[270, panel.y + panel.h], [270, 486]] as Pt[], decide: [270, 452] as Pt, variant: [270, 486] as Pt }
    : { path: [[cx(panel), panel.y + panel.h], [cx(panel), 388], [300, 388]] as Pt[], decide: [596, 388] as Pt, variant: [300, 388] as Pt };

  return <g>
    {/* Same input, two engines */}
    {both.map((i) => <Wire key={i} d={toPath(inPath(i))} tone="muted" width={1.25} opacity={.6} draw={easeOut(frame, 4 + i * 4, 22 + i * 4)} />)}
    {both.map((i) => <Wire key={i} d={toPath(outPath(i))} tone="muted" width={1.25} opacity={.6} draw={easeOut(frame, T.pages - 10, T.pages)} />)}

    <g {...enter(frame, 0)}>
      <Box x={input.x} y={input.y} w={input.w} h={input.h} tone="line" radius={compact ? 12 : 14}>
        {compact ? <>
          <Text x={input.x + 16} y={cy(input) + .5} size={15} font="mono" weight={600}>JSON</Text>
          <Text x={input.x + input.w - 16} y={cy(input) + .5} size={12.5} font="mono" weight={500} tone="muted" anchor="end">{`${c.sameInput} · ${c.doc}`}</Text>
        </> : <>
          <Text x={cx(input)} y={input.y + 20} size={11} font="mono" weight={600} tone="muted" anchor="middle" caps>{c.sameInput}</Text>
          <Text x={cx(input)} y={input.y + 46} size={19} font="mono" weight={600} anchor="middle">JSON</Text>
          <Text x={cx(input)} y={input.y + 67} size={12.5} font="mono" weight={500} tone="muted" anchor="middle">{c.doc}</Text>
        </>}
      </Box>
    </g>

    {both.map((i) => {
      const e = engines[i];
      return <g key={i} {...enter(frame, 6 + i * 5, compact ? {} : { from: "right", distance: 18 })}>
        {compact
          ? <Box x={e.x} y={e.y} w={e.w} h={e.h} tone="line" focus={busy(i)} radius={12}>
            <Text x={e.x + 16} y={cy(e) + .5} size={16} weight={600}>{ENGINES[i]}</Text>
            <Text x={e.x + e.w - 16} y={cy(e) + .5} size={12} font="mono" weight={500} tone="muted" anchor="end">{c.engineSub[i]}</Text>
          </Box>
          : <Box x={e.x} y={e.y} w={e.w} h={e.h} tone="line" focus={busy(i)} label={ENGINES[i]} sub={c.engineSub[i]} labelSize={18} />}
      </g>;
    })}
    {both.map((i) => <Comet key={i} points={inPath(i)} t={inT(i)} tone="line" r={5} tail={.3} />)}
    {both.map((i) => <Comet key={i} points={outPath(i)} t={outT(i)} tone="line" r={4.5} tail={.4} />)}

    {/* Two PDFs: same words, other line breaks */}
    {both.map((i) => <g key={i} {...pageIn(i)}>
      <Page rect={pages[i]} words={WRAPPED[i]} shown={shown} counted={counted} countedTone={countedTone} mark={mark} edge={edge} foot={foot} flash={flash(i)} />
      {compact
        ? <Text x={pages[i].x - 10} y={pages[i].y + 10} size={11} font="mono" weight={600} tone="muted" anchor="end">PDF</Text>
        : <Text x={(engines[i].x + engines[i].w + pages[i].x) / 2} y={cy(engines[i]) - 13} size={11} font="mono" weight={600} tone="muted" anchor="middle">PDF</Text>}
    </g>)}
    {both.map((i) => <Pulse key={i} x={markAt(i)[0]} y={markAt(i)[1]} frame={frame} at={T.wraps + 4} period={34} r={7} tone="hot" once />)}
    <Tag x={L.slot[0]} y={L.slot[1]} text={c.wraps} tone="hot" size={12} appear={Math.min(pop(frame, T.wraps + 6), 1 - ease(frame, T.checks - 12, T.checks - 2))} />
    <g opacity={lerp(1, .6, ease(frame, T.swap, T.swap + 16))}>
      <Tag x={L.slot[0]} y={L.slot[1]} text={c.same} tone="ok" size={12} appear={pop(frame, T.same)} />
    </g>

    {/* One panel: the checks, then the timing */}
    <g {...enter(frame, T.wraps - 4)}>
      <Box x={panel.x} y={panel.y} w={panel.w} h={panel.h} tone="line" radius={16} />
    </g>

    {checksOn > 0 ? <g opacity={checksOn}>
      <g {...enter(frame, T.wraps, { distance: 8 })}>
        <Text x={px} y={panel.y + (compact ? 20 : 24)} size={11} font="mono" weight={600} tone="muted" caps>{c.checks}</Text>
      </g>
      <g {...enter(frame, T.wraps + 12, { distance: 8 })}>
        <Text x={px} y={panel.y + (compact ? 47 : 58)} size={15} weight={600} tone="muted">{c.pixels}</Text>
        <Tag x={right} y={panel.y + (compact ? 47 : 58)} anchor="end" text={c.notRequired} tone="muted" size={12} appear={pop(frame, T.wraps + 24)} />
        <line x1={px} x2={right} y1={panel.y + (compact ? 68 : 86)} y2={panel.y + (compact ? 68 : 86)} stroke="var(--scene-hairline)" strokeWidth={1} />
      </g>
      {compact ? null : <g {...enter(frame, T.checks - 6, { distance: 8 })}>
        <Text x={px} y={panel.y + 108} size={11} font="mono" weight={600} tone="muted" caps>{c.visible}</Text>
      </g>}
      {checkRows.map((row) => {
        const passed = frame >= row.pass;
        const markY = compact ? row.y : row.y + 9;
        return <g key={row.at} {...enter(frame, row.at, { dur: 14, distance: 8 })}>
          <Text x={px} y={row.y} size={15} weight={600}>{row.label}</Text>
          <Text x={compact ? px + 238 : px} y={compact ? row.y + .5 : row.y + 20} size={12.5} font="mono" weight={500} tone="muted">{row.sub}</Text>
          <g transform={`translate(${right - 11} ${markY}) scale(${passed ? .7 + .3 * pop(frame, row.pass, 180) : 1})`}>
            <Checkpoint x={0} y={0} r={compact ? 9.5 : 11} state={passed ? "pass" : "pending"} />
          </g>
        </g>;
      })}
    </g> : null}

    {timingOn > 0 ? <g opacity={timingOn}>
      <Text x={px} y={panel.y + (compact ? 20 : 24)} size={11} font="mono" weight={600} tone="muted" caps>{c.warm}</Text>
      <Text x={log.countedX} y={panel.y + (compact ? 20 : 24)} size={11} font="mono" weight={600} tone="muted" anchor="end" caps>{c.counted}</Text>
      {[0, 1, 2, 3].map((row) => {
        const runs = RUNS.filter((run) => run.row === row);
        const y = log.rowY(row);
        const last = runs[1]!.start + RENDER - 1;
        return <g key={row} {...enter(frame, runs[0]!.start - 4, { dur: 12, distance: 6 })}>
          <Text x={px} y={y + .5} size={log.label} font="mono" weight={500} tone={row === 0 ? "muted" : "ink"}>{row === 0 ? c.warmup : c.round(row)}</Text>
          {runs.map((run) => <Tag key={run.slot} x={chipX(run)} y={y} anchor="start" size={11} text={ENGINES[run.engine]} tone={row === 0 ? "muted" : "ink"} appear={pop(frame, run.start + RENDER - 1)} />)}
          {row > 0 ? <Then x={chipX(runs[1]!) - log.gap / 2} y={y} length={log.gap - 6} opacity={easeOut(frame, runs[1]!.start, runs[1]!.start + 8)} /> : null}
          <Text x={log.countedX} y={y + .5} size={log.label} font="mono" weight={600} tone={row === 0 ? "muted" : "ink"} anchor="end" opacity={easeOut(frame, last, last + 10)}>{row === 0 ? c.no : c.yes}</Text>
        </g>;
      })}
      <g opacity={easeOut(frame, T.more, T.more + 10)}>
        {[0, 1, 2].map((dot) => <circle key={dot} cx={px + 3 + dot * 7} cy={log.moreY} r={1.6} fill={TONE.muted} />)}
      </g>

      {medianIn > 0 ? <g opacity={medianIn}>
        {compact
          ? <>
            <line x1={334} x2={334} y1={panel.y + 14} y2={panel.y + panel.h - 14} stroke="var(--scene-hairline)" strokeWidth={1} />
            <Text x={med.x} y={panel.y + 20} size={11} font="mono" weight={600} tone="muted" caps>{c.median}</Text>
            <Text x={med.x} y={panel.y + 40} size={12} font="mono" weight={500} tone="muted">{c.renders}</Text>
          </>
          : <>
            <line x1={px} x2={right} y1={panel.y + 172} y2={panel.y + 172} stroke="var(--scene-hairline)" strokeWidth={1} />
            <Text x={med.x} y={panel.y + 192} size={11} font="mono" weight={600} tone="muted" caps>{`${c.median} · ${c.renders}`}</Text>
          </>}
        {both.map((i) => <g key={i}>
          <Text x={med.x} y={med.rows[i]} size={15} weight={600}>{ENGINES[i]}</Text>
          <Counter frame={frame} from={0} to={MEDIAN_MS[i]} start={T.median + 6} end={T.median + 40} format={(value) => ms(value, fr)} x={med.x + med.w} y={med.rows[i] + .5} size={15} font="mono" weight={600} anchor="end" />
          <Meter x={med.x} y={med.rows[i] + 13} w={med.w} h={8} value={fill * MEDIAN_MS[i] / MEDIAN_MS[0]} tone="line" />
        </g>)}
      </g> : null}
    </g> : null}

    {/* Next round */}
    <Wire d={toPath(loop.path)} tone="muted" width={1.25} opacity={.7} draw={easeOut(frame, T.loop, T.loop + 24)} />
    <Comet points={loop.path} t={ease(frame, T.loop + 2, T.loop + 36, linear)} tone="hot" r={5} tail={.2} />
    <Tag x={loop.decide[0]} y={loop.decide[1]} text={c.decide} tone="hot" size={12} appear={pop(frame, T.loop + (compact ? 10 : 14))} />
    <Tag x={loop.variant[0]} y={loop.variant[1]} text={c.variant} tone="line" size={12} appear={pop(frame, T.loop + 36)} />
  </g>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.swap - 4,
  title: { fr: "Comparer deux moteurs PDF", en: "Comparing two PDF engines" },
  caption: {
    fr: `LaTeX et WeasyPrint reçoivent la même entrée. Les retours à la ligne peuvent différer, donc les contrôles portent sur ce qui est visible. Les temps sont des médianes à chaud, mesurées sur un Mac arm64${NBSP}; aucun ne mesure une Lambda.`,
    en: "LaTeX and WeasyPrint receive the same input. Line wrapping can differ, so the checks cover what is visible. The timings are warm medians measured on an arm64 Mac; none of them measures a Lambda.",
  },
  beats: [
    { at: 0, text: { fr: `La même entrée part vers les deux moteurs${NBSP}: LaTeX et WeasyPrint.`, en: "The same input goes to both engines: LaTeX and WeasyPrint." } },
    { at: T.wraps, text: { fr: "Deux PDF sortent. Les retours à la ligne diffèrent, donc les mêmes pixels ne sont pas exigés.", en: "Two PDFs come out. Line wrapping differs, so identical pixels are not required." } },
    { at: T.checks, text: { fr: `Les contrôles portent sur ce qui est visible${NBSP}: nombre de pages, mots et nombres comptés, pied de page.`, en: "The checks cover what is visible: page count, words and numbers counted, footer and page numbering." } },
    { at: T.swap, text: { fr: `Mesure à chaud${NBSP}: un rendu de préchauffage non compté, puis l'ordre des moteurs s'inverse à chaque tour.`, en: "Warm measurement: one warmup render that does not count, then the engine order reverses on each round." } },
    { at: T.median, text: { fr: `Bulletin d'une page, médiane sur 12 rendus à chaud${NBSP}: 1${NBSP}127${NBSP}ms avec LaTeX, 141${NBSP}ms avec WeasyPrint.`, en: "One-page bulletin, median over 12 warm renders: 1,127 ms with LaTeX, 141 ms with WeasyPrint." } },
    { at: T.loop, text: { fr: "Une variante est mesurée contre le rendu existant. Je lis le résultat et je décide du tour suivant.", en: "A variant is measured against the existing render. I read the result and decide the next round." } },
  ],
  Stage,
});
