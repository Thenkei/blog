import type { PostLocale } from "../../../content/types";
import { Boundary, Box, Camera, Checkpoint, Comet, dim, during, ease, easeOut, enter, lerp, pop, Pulse, stagger, Tag, Text, TONE, type Tone } from "../primitives";
import { defineScene, type Localized, type SceneStageProps } from "../types";

// One vague prompt, four candidate sources. Each source is docked against the
// context interface (provenance, access, validity); it either flies through into
// its slot of the context window or drops onto the "left out" shelf. What nothing
// authoritative answers falls to the fourth property, the missing-information rule,
// and is flagged back to the author instead of guessed.
const CYCLE = 76;
const T = {
  sources: [70, 146, 222, 298],
  missing: 384,
  flagCard: 396,
  flag: 414,
  flagLand: 446,
  end: 530,
} as const;

// Per-source choreography, relative to the source's start frame.
const S = { dock: 18, checks: [20, 30, 40] as const, verdict: 48, fly: 54, land: 76 } as const;

type Check = { value: Localized; pass: boolean };
type Source = {
  title: Localized;
  mono: boolean;
  meta: Localized;
  checks: readonly [Check, Check, Check];
  verdict: Localized;
  /** Window slot it fills when loaded; null when it stays out. */
  slot: 0 | 1 | null;
};

const READABLE: Check = { value: { en: "readable", fr: "lisible" }, pass: true };
const IN_FORCE: Check = { value: { en: "in force", fr: "en vigueur" }, pass: true };

const SOURCES: readonly [Source, Source, Source, Source] = [
  {
    title: { en: "branch: main", fr: "branch: main" }, mono: true,
    meta: { en: "git · current state", fr: "git · état courant" },
    checks: [{ value: { en: "git", fr: "git" }, pass: true }, READABLE, IN_FORCE],
    verdict: { en: "✓ loaded", fr: "✓ chargé" }, slot: 0,
  },
  {
    title: { en: "Old checkout proposal", fr: "Ancienne proposition" }, mono: false,
    meta: { en: "doc · proposal", fr: "doc · proposition" },
    checks: [{ value: { en: "doc", fr: "doc" }, pass: true }, READABLE, { value: { en: "not in force", fr: "pas en vigueur" }, pass: false }],
    verdict: { en: "✗ proposal ≠ decision", fr: "✗ proposition ≠ décision" }, slot: null,
  },
  {
    title: { en: "Payment invariant", fr: "Invariant de paiement" }, mono: false,
    meta: { en: "domain contract", fr: "contrat métier" },
    checks: [{ value: { en: "contract", fr: "contrat" }, pass: true }, READABLE, IN_FORCE],
    verdict: { en: "✓ loaded", fr: "✓ chargé" }, slot: 1,
  },
  {
    title: { en: "Deploy tool", fr: "Outil de déploiement" }, mono: false,
    meta: { en: "tool · read access", fr: "outil · accès lecture" },
    checks: [{ value: { en: "tooling", fr: "outillage" }, pass: true }, { value: { en: "read ≠ act", fr: "lire ≠ agir" }, pass: false }, IN_FORCE],
    verdict: { en: "✗ access ≠ authorisation", fr: "✗ accès ≠ autorisation" }, slot: null,
  },
];

const PROPERTIES: readonly Localized[] = [
  { en: "provenance", fr: "provenance" },
  { en: "access", fr: "accès" },
  { en: "validity", fr: "validité" },
  { en: "missing info", fr: "info absente" },
];

// Window slots follow the article's stack vocabulary.
const LAYERS: readonly Localized[] = [
  { en: "current state", fr: "état courant" },
  { en: "contracts", fr: "contrats" },
  { en: "authority", fr: "autorité" },
];

const QUESTIONS: readonly { q: Localized; a: Localized; at: number; tone: Tone }[] = [
  { q: { en: "which branch is current?", fr: "quelle branche fait foi ?" }, a: { en: "→ branch: main", fr: "→ branch: main" }, at: T.sources[0] + S.land, tone: "ok" },
  { q: { en: "which payment invariant?", fr: "quel invariant financier ?" }, a: { en: "→ the domain contract", fr: "→ le contrat métier" }, at: T.sources[2] + S.land, tone: "ok" },
  { q: { en: "patch or deploy?", fr: "patch ou déploiement ?" }, a: { en: "→ flag it, don’t guess", fr: "→ signaler, pas deviner" }, at: T.flagLand, tone: "hot" },
];

const LEFT_OUT = SOURCES.map((source, index) => SOURCES.slice(0, index).filter((item) => item.slot === null).length);

type Rect = { x: number; y: number; w: number; h: number };
type Pt = readonly [number, number];

type Layout = {
  prompt: Rect;
  promptSize: number;
  questions: { x: number; eyebrowY: number; rows: readonly [number, number, number]; answers: boolean };
  stagingEyebrow: { x: number; y: number };
  card: Rect;
  verdict: { x: number; y: number; anchor: "middle" | "end" };
  shelf: Rect;
  shelfRows: readonly [number, number];
  gate: Rect;
  gateRows: readonly [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }, { x: number; y: number }];
  window: Rect;
  slots: readonly [Rect, Rect, Rect];
  slotStacked: boolean;
};

const WIDE: Layout = {
  prompt: { x: 40, y: 64, w: 216, h: 104 },
  promptSize: 18,
  questions: { x: 40, eyebrowY: 206, rows: [240, 294, 348], answers: true },
  stagingEyebrow: { x: 276, y: 84 },
  card: { x: 276, y: 104, w: 224, h: 64 },
  verdict: { x: 388, y: 196, anchor: "middle" },
  shelf: { x: 276, y: 230, w: 224, h: 150 },
  shelfRows: [62, 112],
  gate: { x: 520, y: 64, w: 148, h: 316 },
  gateRows: [{ x: 16, y: 64 }, { x: 16, y: 128 }, { x: 16, y: 192 }, { x: 16, y: 268 }],
  window: { x: 688, y: 64, w: 232, h: 316 },
  slots: [{ x: 702, y: 98, w: 204, h: 70 }, { x: 702, y: 186, w: 204, h: 70 }, { x: 702, y: 274, w: 204, h: 70 }],
  slotStacked: true,
};

const COMPACT: Layout = {
  prompt: { x: 20, y: 60, w: 232, h: 88 },
  promptSize: 16.5,
  questions: { x: 270, eyebrowY: 62, rows: [90, 116, 142], answers: false },
  stagingEyebrow: { x: 20, y: 0 },
  card: { x: 20, y: 166, w: 500, h: 52 },
  verdict: { x: 506, y: 192, anchor: "end" },
  shelf: { x: 340, y: 334, w: 180, h: 174 },
  shelfRows: [56, 108],
  gate: { x: 20, y: 250, w: 500, h: 62 },
  gateRows: [{ x: 14, y: 22 }, { x: 128, y: 22 }, { x: 246, y: 22 }, { x: 380, y: 22 }],
  window: { x: 20, y: 334, w: 304, h: 174 },
  slots: [{ x: 32, y: 354, w: 280, h: 44 }, { x: 32, y: 404, w: 280, h: 44 }, { x: 32, y: 454, w: 280, h: 44 }],
  slotStacked: false,
};

const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });

/** Cubic Bézier sampled as a polyline, for Comet paths. */
const curve = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, steps = 28): Pt[] => Array.from({ length: steps + 1 }, (_, index) => {
  const t = index / steps;
  const u = 1 - t;
  return [
    u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
    u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1],
  ] as const;
});

/** Circled glyph for an open question: ? → ✓ / !, with a spring on change. */
function QuestionMark({ x, y, tone, glyph, bounce }: { x: number; y: number; tone: Tone; glyph: string; bounce: number }) {
  const scale = .7 + .3 * bounce;
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <circle r={10.5} style={{ fill: "var(--scene-card)" }} stroke={TONE[tone]} strokeWidth={1.25} />
    {tone !== "muted" ? <circle r={10.5} fill={TONE[tone]} opacity={.14} /> : null}
    <Text x={0} y={1} size={12.5} weight={700} font="mono" tone={tone} anchor="middle">{glyph}</Text>
  </g>;
}

/**
 * A source card. `morph` goes 0 → 1 as it turns from a candidate (title + meta)
 * into a context-window entry (layer eyebrow + title).
 */
function SourceCard({ rect, source, locale, tone, focus, morph, layer, stacked }: {
  rect: Rect;
  source: Source;
  locale: PostLocale;
  tone: Tone;
  focus: number;
  morph: number;
  layer: Localized | undefined;
  stacked: boolean;
}) {
  const { x, y, w, h } = rect;
  const asCandidate = 1 - ease(morph, .35, .7);
  const asEntry = ease(morph, .55, .95);
  const titleSize = source.mono ? 14.5 : 15.5;
  return <Box x={x} y={y} w={w} h={h} tone={tone} focus={focus} radius={12}>
    <g opacity={asCandidate}>
      <Text x={x + 16} y={y + h / 2 - 10} size={titleSize + .5} weight={650} font={source.mono ? "mono" : "display"}>{source.title[locale]}</Text>
      <Text x={x + 16} y={y + h / 2 + 12} size={12.5} weight={500} font="mono" tone="muted">{source.meta[locale]}</Text>
    </g>
    {layer ? <g opacity={asEntry}>
      <Text x={x + 14} y={stacked ? y + 22 : y + 14} size={11} weight={600} font="mono" tone="ok" caps>{layer[locale]}</Text>
      <Text x={x + 14} y={stacked ? y + 46 : y + 31} size={stacked ? titleSize : 14} weight={650} font={source.mono ? "mono" : "display"}>{source.title[locale]}</Text>
      <Text x={x + w - 14} y={stacked ? y + 22 : y + h / 2} size={14} weight={700} font="mono" tone="ok" anchor="end">✓</Text>
    </g> : null}
  </Box>;
}

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const L = compact ? COMPACT : WIDE;
  const { prompt, card, shelf, gate, window: win } = L;

  const activeIndex = T.sources.findIndex((at) => frame >= at && frame < at + CYCLE);
  const active = activeIndex >= 0 ? SOURCES[activeIndex]! : null;
  const activeAt = activeIndex >= 0 ? T.sources[activeIndex]! : 0;

  // Finale: the interface and the candidates step back, the missing-info rule leads.
  const finale = ease(frame, T.missing - 6, T.missing + 16);
  const rule = pop(frame, T.missing);
  const flagCard = pop(frame, T.flagCard, 130);
  const flagT = ease(frame, T.flag, T.flagLand, (t) => 1 - (1 - t) ** 2.4);

  const authoritySlot = L.slots[2];
  const q3: Pt = [L.questions.x + 10.5, L.questions.rows[2]];
  const flagPath = compact
    ? curve([authoritySlot.x + authoritySlot.w, authoritySlot.y + authoritySlot.h / 2], [332, 440], [332, 210], [q3[0], q3[1] + 14])
    : curve([authoritySlot.x, authoritySlot.y + authoritySlot.h / 2 + 16], [600, 410], [150, 410], [q3[0], q3[1] + 14]);
  const flagEnd = flagPath.at(-1)!;

  // Camera: lean on the interface while the first source is checked, then on the
  // window when the rule takes over.
  const lean = (point: Pt, share = .22): Pt => [lerp(width / 2, point[0], share), lerp(height / 2, point[1], share)];
  const camera = [
    { at: 0 },
    { at: T.sources[0] + 4, dur: 40, zoom: 1.03, focus: lean([gate.x, card.y + card.h / 2]) },
    { at: T.sources[1] + 10, dur: 50, zoom: 1 },
    { at: T.missing - 4, dur: 50, zoom: 1.025, focus: lean([compact ? width / 2 : gate.x + gate.w / 2, compact ? 330 : 300]) },
  ];

  const promptIn = enter(frame, 0, { distance: 18 });
  const tapeIn = easeOut(frame, 10, 26);

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    {/* The prompt: all the author gave the agent (a Post-it). */}
    <g {...promptIn}>
      <g transform={`rotate(-1.4 ${prompt.x + prompt.w / 2} ${prompt.y + prompt.h / 2})`}>
        <Box x={prompt.x} y={prompt.y} w={prompt.w} h={prompt.h} tone="hot" radius={8}>
          <Text x={prompt.x + 16} y={prompt.y + 22} size={11} weight={600} font="mono" tone="hot" caps>prompt</Text>
          <Text x={prompt.x + 16} y={prompt.y + (compact ? 48 : 52)} size={L.promptSize} weight={650}>{fr ? "« Mettre à jour le" : "“Update the"}</Text>
          <Text x={prompt.x + 16} y={prompt.y + (compact ? 70 : 76)} size={L.promptSize} weight={650}>{fr ? "tunnel de paiement »" : "checkout flow”"}</Text>
        </Box>
        {/* Light theme: a strip of tape holds the Post-it to the paper. */}
        <g className="scene-only-light" opacity={tapeIn}>
          <rect x={prompt.x + prompt.w / 2 - 30} y={prompt.y - 9} width={60} height={18} rx={2} transform={`rotate(3 ${prompt.x + prompt.w / 2} ${prompt.y})`} style={{ fill: "var(--scene-hairline)" }} opacity={.45} />
        </g>
      </g>
    </g>

    {/* What the prompt does not say. */}
    <g>
      <g {...enter(frame, 16)}>
        <Text x={L.questions.x} y={L.questions.eyebrowY} size={11} weight={600} font="mono" tone="muted" caps>{fr ? "ce qu’il ne dit pas" : "what it does not say"}</Text>
      </g>
      {QUESTIONS.map((item, index) => {
        const y = L.questions.rows[index]!;
        const answered = frame >= item.at;
        const tone: Tone = answered ? item.tone : "muted";
        const glyph = answered ? (item.tone === "ok" ? "✓" : "!") : "?";
        const bounce = answered ? pop(frame, item.at, 190) : 1;
        const answer = easeOut(frame, item.at, item.at + 16);
        const highlight = item.tone === "hot" ? ease(frame, T.flagLand - 4, T.flagLand + 12) : 0;
        return <g key={index} {...enter(frame, stagger(index, 22, 6))}>
          {highlight > 0 ? <rect x={L.questions.x - 8} y={y - 17} width={(compact ? 250 : 232)} height={L.questions.answers ? 50 : 34} rx={10} style={{ fill: `color-mix(in srgb, ${TONE.hot} ${10 * highlight}%, transparent)` }} /> : null}
          <QuestionMark x={L.questions.x + 10.5} y={y} tone={tone} glyph={glyph} bounce={bounce} />
          <Text x={L.questions.x + 30} y={y} size={compact ? 14 : 15} weight={600} tone={answered ? "ink" : "muted"}>{item.q[locale]}</Text>
          {L.questions.answers && answer > 0 ? <g opacity={answer} transform={`translate(${6 * (1 - answer)} 0)`}>
            <Text x={L.questions.x + 30} y={y + 20} size={12.5} weight={600} font="mono" tone={item.tone}>{item.a[locale]}</Text>
          </g> : null}
          {answered && frame < item.at + 72 ? <Pulse x={L.questions.x + 10.5} y={y} frame={frame} at={item.at} period={36} r={10} tone={item.tone} /> : null}
        </g>;
      })}
    </g>

    {/* Candidates and the shelf of sources that stayed out. */}
    <g opacity={dim(finale, .55)}>
      {!compact ? <g {...enter(frame, 30)}>
        <Text x={L.stagingEyebrow.x} y={L.stagingEyebrow.y} size={11} weight={600} font="mono" tone="muted" caps>{fr ? "sources candidates" : "candidate sources"}</Text>
      </g> : null}
      {/* Progress: one dot per source, toned by its verdict. */}
      <g {...enter(frame, 34)}>
        {SOURCES.map((source, index) => {
          const decided = frame >= T.sources[index]! + S.verdict;
          const current = index === activeIndex && !decided;
          const tone: Tone = decided ? (source.slot !== null ? "ok" : "danger") : current ? "hot" : "muted";
          const cx = compact ? gate.x + gate.w - 6 - (3 - index) * 14 : card.x + card.w - 6 - (3 - index) * 14;
          const cy = compact ? gate.y - 16 : L.stagingEyebrow.y;
          const on = decided ? pop(frame, T.sources[index]! + S.verdict, 200) : 1;
          return <circle key={index} cx={cx} cy={cy} r={decided ? 3.4 + .6 * on : 3.4} fill={decided || current ? TONE[tone] : "none"} stroke={TONE[tone]} strokeOpacity={decided || current ? 1 : .6} strokeWidth={1.2} />;
        })}
      </g>

      <Box x={shelf.x} y={shelf.y} w={shelf.w} h={shelf.h} tone="danger" variant="ghost" radius={14} appear={easeOut(frame, T.sources[1] + S.verdict - 6, T.sources[1] + S.verdict + 14)}>
        <Text x={shelf.x + 16} y={shelf.y + 22} size={11} weight={600} font="mono" tone="danger" caps>{fr ? "✗ laissé dehors" : "✗ left out"}</Text>
      </Box>
      {SOURCES.map((source, index) => {
        if (source.slot !== null) return null;
        const at = T.sources[index]! + S.land - 6;
        const settled = easeOut(frame, at, at + 16);
        if (settled <= 0) return null;
        const row = shelf.y + L.shelfRows[LEFT_OUT[index]!]!;
        const title = source.title[locale];
        const strike = ease(frame, at + 8, at + 22);
        const titleW = title.length * (compact ? 6.9 : 7.3);
        return <g key={index} opacity={settled} transform={`translate(0 ${-8 * (1 - settled)})`}>
          <Text x={shelf.x + 16} y={row} size={compact ? 13.5 : 14.5} weight={600} tone="muted">{title}</Text>
          <line x1={shelf.x + 14} x2={shelf.x + 14 + (titleW + 4) * strike} y1={row + 1} y2={row + 1} stroke={TONE.danger} strokeWidth={1.25} opacity={.75} />
          <Text x={shelf.x + 16} y={row + 20} size={compact ? 11.5 : 12.5} weight={600} font="mono" tone="danger">{source.verdict[locale].replace("✗ ", "")}</Text>
        </g>;
      })}
    </g>

    {/* The context interface every source must cross. */}
    <g {...enter(frame, 26, { from: "none" })}>
      <Box x={gate.x} y={gate.y} w={gate.w} h={gate.h} tone={active && frame < activeAt + S.fly ? "hot" : "line"} focus={active ? during(frame, activeAt + S.dock, activeAt + S.fly + 6) * (1 - finale) : 0} radius={14}>
        <Text x={gate.x + (compact ? 16 : 18)} y={gate.y + (compact ? -16 : 24)} size={11} weight={600} font="mono" tone="muted" caps>{compact ? (fr ? "interface de contexte" : "context interface") : "interface"}</Text>
        {!compact ? <line x1={gate.x + 16} x2={gate.x + gate.w - 16} y1={gate.y + 232} y2={gate.y + 232} stroke="var(--scene-hairline)" strokeWidth={1} /> : null}
      </Box>
      {PROPERTIES.map((label, index) => {
        const pos = L.gateRows[index]!;
        const cx = gate.x + pos.x + 9;
        const cy = gate.y + pos.y;
        if (index === 3) {
          const tone: Tone = frame >= T.missing ? "hot" : "muted";
          return <g key={index} opacity={lerp(.55, 1, finale)}>
            <g transform={`translate(${cx} ${cy}) scale(${frame >= T.missing ? .75 + .25 * rule : 1})`}>
              <circle r={9} style={{ fill: frame >= T.missing ? TONE.hot : "var(--scene-card)" }} stroke={TONE[tone]} strokeWidth={1.25} strokeDasharray={frame >= T.missing ? undefined : "3 3"} className={frame >= T.missing ? "scene-glow" : undefined} />
              <Text x={0} y={1} size={11.5} weight={700} font="mono" tone={frame >= T.missing ? "ink" : "muted"} anchor="middle">{frame >= T.missing ? "" : "?"}</Text>
              {frame >= T.missing ? <path d="M0 -4.5V1.5M0 4.4v.1" stroke="var(--scene-card)" strokeWidth={2.2} strokeLinecap="round" /> : null}
            </g>
            <Text x={cx + 17} y={cy} size={compact ? 12 : 12.5} weight={600} font="mono" tone={tone}>{label[locale]}</Text>
            <g opacity={easeOut(frame, T.missing + 8, T.missing + 24)}>
              <Text x={cx + 17} y={cy + 18} size={compact ? 11.5 : 12} weight={600} font="mono" tone="hot">{fr ? "→ signaler" : "→ flag it"}</Text>
            </g>
            {frame >= T.missing && frame < T.missing + 88 ? <Pulse x={cx} y={cy} frame={frame} at={T.missing} period={44} r={9} tone="hot" /> : null}
          </g>;
        }
        const at = activeAt + S.checks[index]!;
        const check = active?.checks[index];
        const judged = check !== undefined && frame >= at;
        const state = judged ? (check.pass ? "pass" : "fail") : "pending";
        const valueIn = judged ? easeOut(frame, at, at + 12) : 0;
        const tone: Tone = state === "pass" ? "ok" : state === "fail" ? "danger" : "muted";
        const bounce = judged ? pop(frame, at, 220) : 1;
        return <g key={index} opacity={dim(finale, .42)}>
          <g transform={`translate(${cx} ${cy}) scale(${.7 + .3 * bounce}) translate(${-cx} ${-cy})`}>
            {active && frame >= activeAt + S.dock - 4
              ? <Checkpoint x={cx} y={cy} r={9} state={state} />
              : <circle cx={cx} cy={cy} r={9} style={{ fill: "var(--scene-card)" }} stroke="var(--scene-hairline)" strokeWidth={1.25} strokeDasharray="3 3" />}
          </g>
          <Text x={cx + 17} y={cy} size={compact ? 12 : 12.5} weight={600} font="mono" tone={judged ? "ink" : "muted"}>{label[locale]}</Text>
          {check ? <g opacity={valueIn}>
            <Text x={cx + 17} y={cy + 18} size={compact ? 11.5 : 12} weight={600} font="mono" tone={tone}>{check.value[locale]}</Text>
          </g> : null}
        </g>;
      })}
    </g>

    {/* The context window, with one slot per layer the task needs. */}
    <g {...enter(frame, 12, { from: "left", distance: 10 })}>
      <Boundary x={win.x} y={win.y} w={win.w} h={win.h} label={fr ? "fenêtre de contexte" : "context window"} tone="line" />
      {L.slots.map((slot, index) => {
        const filled = index === 2 ? frame >= T.flagCard : frame >= T.sources[index === 0 ? 0 : 2] + S.land;
        const placeholder = 1 - (index === 2 ? flagCard : 0);
        return filled && index !== 2 ? null : <g key={index} opacity={Math.max(0, placeholder)}>
          <rect x={slot.x} y={slot.y} width={slot.w} height={slot.h} rx={12} fill="none" stroke="var(--scene-hairline)" strokeWidth={1} strokeDasharray="4 5" />
          <Text x={slot.x + 14} y={slot.y + slot.h / 2} size={11} weight={600} font="mono" tone="muted" caps opacity={.8}>{LAYERS[index]![locale]}</Text>
        </g>;
      })}
    </g>

    {/* Authority slot: nothing answers "patch or deploy?". */}
    {flagCard > 0 ? (() => {
      const slot = L.slots[2];
      return <g opacity={Math.min(1, flagCard)} transform={`translate(0 ${8 * (1 - Math.min(1, flagCard))})`}>
        <Box x={slot.x} y={slot.y} w={slot.w} h={slot.h} tone="hot" focus={during(frame, T.flagCard, T.flagLand + 20, 12)} radius={12}>
          <Text x={slot.x + 14} y={L.slotStacked ? slot.y + 22 : slot.y + 14} size={11} weight={600} font="mono" tone="hot" caps>{LAYERS[2]![locale]}</Text>
          <Text x={slot.x + 14} y={L.slotStacked ? slot.y + 46 : slot.y + 31} size={14.5} weight={650}>{fr ? "aucune source d’autorité" : "no authoritative source"}</Text>
          <Text x={slot.x + slot.w - 14} y={L.slotStacked ? slot.y + 22 : slot.y + slot.h / 2} size={14} weight={700} font="mono" tone="hot" anchor="end">!</Text>
        </Box>
      </g>;
    })() : null}
    <Comet points={flagPath} t={flagT} tone="hot" tail={.22} r={6} />
    {frame >= T.flagLand && frame < T.flagLand + 60 ? <Pulse x={flagEnd[0]} y={flagEnd[1]} frame={frame} at={T.flagLand} period={60} r={6} tone="hot" /> : null}

    {/* Candidate sources: dock, get checked, then cross or drop. */}
    {SOURCES.map((source, index) => {
      const at = T.sources[index]!;
      if (frame < at) return null;
      const dock = easeOut(frame, at, at + S.dock);
      const decided = frame >= at + S.verdict;
      const verdictTone: Tone = source.slot !== null ? "ok" : "danger";
      const fly = ease(frame, at + S.fly, at + S.land);
      const from: Rect = { ...card, x: card.x + (compact ? 0 : -28) * (1 - dock), y: card.y + (compact ? -20 : 0) * (1 - dock) };
      const verdictChip = decided ? <Tag
        x={L.verdict.x} y={L.verdict.y} anchor={L.verdict.anchor} text={source.verdict[locale]} tone={verdictTone} size={12}
        appear={pop(frame, at + S.verdict, 170) * (1 - ease(frame, at + S.fly, at + S.fly + 10))}
      /> : null;

      if (source.slot !== null) {
        const slot = L.slots[source.slot];
        const rect = lerpRect(from, slot, fly);
        // A small hop while crossing the interface so the move reads as a flight.
        const lifted = { ...rect, y: rect.y - Math.sin(Math.PI * fly) * (compact ? 0 : 10), x: rect.x + Math.sin(Math.PI * fly) * (compact ? 26 : 0) };
        const landed = frame >= at + S.land;
        return <g key={index}>
          <g opacity={dock}>
            <SourceCard rect={lifted} source={source} locale={locale} tone={decided ? "ok" : "line"} focus={decided ? during(frame, at + S.verdict, at + S.land + 14, 8) : 0} morph={fly} layer={LAYERS[source.slot]} stacked={L.slotStacked} />
          </g>
          {verdictChip}
          {landed && frame < at + S.land + 80 ? <Pulse x={slot.x + slot.w - 18} y={L.slotStacked ? slot.y + 22 : slot.y + slot.h / 2} frame={frame} at={at + S.land} period={40} r={9} tone="ok" /> : null}
        </g>;
      }

      // Rejected: the card slides down onto the shelf and fades into its entry.
      const drop = ease(frame, at + S.fly, at + S.land, (t) => t * t);
      const target: Rect = { x: shelf.x + 8, y: shelf.y + L.shelfRows[LEFT_OUT[index]!]! - 22, w: shelf.w - 16, h: 48 };
      const rect = lerpRect(from, target, drop);
      if (drop >= 1) return <g key={index}>{verdictChip}</g>;
      return <g key={index}>
        <g opacity={dock * (1 - ease(frame, at + S.land - 10, at + S.land))}>
          <SourceCard rect={rect} source={source} locale={locale} tone={decided ? "danger" : "line"} focus={decided ? .6 * (1 - drop) : 0} morph={0} layer={undefined} stacked />
        </g>
        {verdictChip}
      </g>;
    })}

  </Camera>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 30,
  title: { en: "What actually enters the context", fr: "Ce qui entre vraiment dans le contexte" },
  caption: {
    en: "A prompt cannot compensate for missing, stale or unauthorised context. Each source crosses the interface with its provenance, access rules and validity period; what nothing answers is flagged, not guessed.",
    fr: "Un prompt ne compense pas un contexte absent, périmé ou non autorisé. Chaque source passe l’interface avec sa provenance, ses droits d’accès et sa durée de validité ; ce qui manque se signale, ne se devine pas.",
  },
  beats: [
    { at: 0, text: { en: "The prompt fits on a Post-it: no current branch, no payment invariant, no patch-or-deploy answer.", fr: "Le prompt tient sur un Post-it : ni branche qui fait foi, ni invariant financier, ni patch ou déploiement." } },
    { at: T.sources[0], text: { en: "Context is an interface: each source crosses it with provenance, access and validity.", fr: "Le contexte est une interface : chaque source passe avec provenance, droits et validité." } },
    { at: T.sources[1], text: { en: "An old proposal is not a current decision: it stays out. The payment invariant goes in.", fr: "Une ancienne proposition n’est pas une décision : elle reste dehors. L’invariant de paiement entre." } },
    { at: T.sources[3], text: { en: "Technical access is not domain authorisation: reading the deploy tool is not permission to deploy.", fr: "Une capacité technique n’est pas une autorisation : lire l’outil de déploiement n’autorise pas à déployer." } },
    { at: T.missing, text: { en: "Nothing authoritative says patch or deploy. The missing-information rule applies: flag it, don’t guess.", fr: "Rien ne dit avec autorité s’il faut patcher ou déployer. La règle s’applique : signaler, pas deviner." } },
  ],
  Stage,
});
