import { Box, Camera, Checkpoint, ease, easeOut, enter, lerp, pop, Pulse, stagger, Tag, Text, tint, TONE, Wire, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// One context card rides the article's delivery chain twice. Act 1 (linear
// chain): a piece of context falls off at a hand-off, the card reaches review
// empty and faster implementation only piles PRs there. Act 2 (Product OS): the
// same trip, but each piece is pinned in the artefact a step leaves, human gates
// hold the decisions, and a false assumption sends the card back to the DiveIn.

type Pt = readonly [number, number];
type Key = readonly [frame: number, position: number];

/** Card schedule: hop between nodes with short holds (in-out on every hop). */
function hops(start: number, from: number, to: number, hop: number, hold: number): Key[] {
  const count = Math.abs(to - from);
  const dir = Math.sign(to - from);
  return Array.from({ length: count }, (_, i) => {
    const at = start + i * (hop + hold);
    return [[at, from + i * dir], [at + hop, from + (i + 1) * dir]] as Key[];
  }).flat();
}

function track(frame: number, keys: readonly Key[]) {
  const first = keys[0]!;
  if (frame <= first[0]) return first[1];
  const index = keys.findIndex(([at]) => at >= frame);
  if (index < 0) return keys.at(-1)![1];
  const [f0, p0] = keys[index - 1]!;
  const [f1, p1] = keys[index]!;
  return lerp(p0, p1, ease(frame, f0, f1));
}

const T = {
  run1: 30,
  review1: 156,
  prs: [166, 174, 182] as const,
  reset: 206,
  run2: 262,
  gates: 244,
  wrong: 406,
  back: 418,
  redecide: 460,
  review2: 530,
  merge: 578,
  end: 650,
} as const;

// Act 1: 16-frame hops, 6-frame holds, Discovery → Review.
const RUN1 = hops(T.run1, 0, 6, 16, 6);
const RESET: Key[] = [[T.reset + 6, 6], [T.reset + 36, 0]];
const RUN2: Key[] = [
  [T.run2, 0], [278, 1], [286, 1], [302, 2], [308, 2], [324, 3],
  [352, 3], [368, 4], [382, 4], [398, 5],
  [T.back, 5], [446, 3],
  [474, 3], [500, 5], [514, 5], [T.review2, 6],
];

const STEPS = {
  en: ["Discovery", "PRD", "Workshop", "DiveIn", "Slices", "PR", "Review"],
  fr: ["Découverte", "PRD", "Workshop", "DiveIn", "Slices", "PR", "Review"],
} as const;
const ITEMS = {
  en: ["problem", "decision", "boundary", "done"],
  fr: ["problème", "décision", "limite", "«\u00a0terminé\u00a0»"],
} as const;
// Act 1: the hand-off (gap after step g) where each piece falls off.
const LOST_GAP = [1, 2, 4, 3] as const;
const lostAt = (item: number) => T.run1 + LOST_GAP[item]! * 22 + 8;
// Act 2: the artefact that pins each piece, and when.
const PIN = [{ step: 1, at: 282 }, { step: 3, at: 328 }, { step: 3, at: 333 }, { step: 3, at: 338 }] as const;
// Human gates of the article: product decisions, architecture, sensitive changes, merge.
const GATES = [
  { step: 3, en: "product", fr: "produit" },
  { step: 4, en: "architecture", fr: "architecture" },
  { step: 5, en: "sensitive", fr: "sensible" },
  { step: 6, en: "merge", fr: "merge" },
] as const;

type RowState = "carried" | "lost" | "pinned" | "doubt";

const tagWidth = (text: string, size: number) => text.length * size * .6 + size * 1.5;
const quad = (a: Pt, c: Pt, b: Pt, t: number): [number, number] => [
  (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
  (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
];

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const steps = STEPS[locale];
  const items = ITEMS[locale];
  const actB = frame >= T.reset;

  // ── Geometry ──────────────────────────────────────────────────────────────
  // Wide: horizontal chain, the card rides above it. Compact: vertical chain on
  // the left, the card rides beside it.
  const card = compact ? { w: 208, h: 138, header: 24, row0: 50, rowStep: 23 } : { w: 200, h: 160, header: 26, row0: 60, rowStep: 26 };
  const node = (i: number): Pt => compact ? [150, 92 + i * 62] : [140 + i * (680 / 6), 280];
  const nodeAt = (p: number): Pt => {
    const a = node(Math.floor(p));
    const b = node(Math.min(6, Math.floor(p) + 1));
    const t = p - Math.floor(p);
    return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
  };
  const cardAt = (p: number): Pt => {
    const [nx, ny] = nodeAt(p);
    return compact
      ? [196, Math.max(62, Math.min(height - 20 - card.h, ny - card.h / 2))]
      : [nx - card.w / 2, 248 - card.h];
  };
  const labelAt = (i: number): Pt => compact ? [132, node(i)[1]] : [node(i)[0], 306];
  const rowY = (cardY: number, i: number) => cardY + card.row0 + i * card.rowStep;
  const pinX = (cardX: number) => cardX + card.w - 14;

  const position = (f: number) => f < T.reset ? track(f, RUN1) : f < T.run2 ? track(f, RESET) : track(f, RUN2);
  const p = position(frame);
  const [cardX, cardY] = cardAt(p);
  const [dotX, dotY] = nodeAt(p);
  const flowTone: Tone = frame >= T.reset + 36 ? "ok" : "line";

  // ── State ─────────────────────────────────────────────────────────────────
  const act1Out = 1 - ease(frame, T.reset, T.reset + 16);
  const restore = (item: number) => stagger(item, T.reset + 38, 5);
  const doubting = frame >= T.wrong && frame < T.redecide;
  const rowState = (item: number): RowState => {
    if (!actB) return frame >= lostAt(item) ? "lost" : "carried";
    if (frame < restore(item)) return "lost";
    if (item === 1 && doubting) return "doubt";
    return frame >= PIN[item]!.at ? "pinned" : "carried";
  };
  const allLost = !actB && frame >= Math.max(...LOST_GAP.map((_, i) => lostAt(i)));
  const merged = frame >= T.merge;
  const cardTone: Tone = !actB ? (allLost ? "danger" : "line") : doubting ? "hot" : merged ? "ok" : "line";
  const cardFocus = !actB
    ? ease(frame, T.review1, T.review1 + 12) * act1Out
    : Math.max(during(frame, T.wrong, T.redecide + 10), ease(frame, T.merge, T.merge + 14));

  const gateState = (step: number): "pending" | "pass" => {
    if (step === 3) return (frame >= 346 && frame < T.back) || frame >= 466 ? "pass" : "pending";
    if (step === 4) return frame >= 376 ? "pass" : "pending";
    if (step === 5) return frame >= 508 ? "pass" : "pending";
    return merged ? "pass" : "pending";
  };
  const gatesIn = (index: number) => easeOut(frame, stagger(index, T.gates, 5), stagger(index, T.gates, 5) + 18);

  // Camera: lean toward the review pile, then toward the reopened DiveIn.
  const lean = (point: Pt, k = .22): Pt => [lerp(width / 2, point[0], k), lerp(height / 2, point[1], k)];
  const camera = compact ? [{ at: 0 }] : [
    { at: 0 },
    { at: T.review1 - 6, zoom: 1.03, focus: lean(node(6)) },
    { at: T.reset - 4, zoom: 1 },
    { at: T.wrong - 10, zoom: 1.035, focus: lean(node(4)) },
    { at: T.redecide + 10, zoom: 1 },
  ];

  // ── Pieces ────────────────────────────────────────────────────────────────
  const railFrom = node(0);
  const railTo = node(6);
  const railPath = `M${railFrom[0]} ${railFrom[1]}L${railTo[0]} ${railTo[1]}`;
  const progressPath = `M${railFrom[0]} ${railFrom[1]}L${dotX} ${dotY}`;
  const backTrace = frame >= T.back && frame < 480
    ? `M${dotX} ${dotY}L${node(5)[0]} ${node(5)[1]}`
    : undefined;

  const stepLabels = steps.map((label, i) => {
    const [lx, ly] = labelAt(i);
    const near = Math.max(0, 1 - Math.abs(p - i) * 1.6);
    const reviewAlarm = i === 6 && allLost ? act1Out : 0;
    const tone: Tone = reviewAlarm > .5 ? "danger" : near > .5 ? "ink" : "muted";
    return <g key={label} {...enter(frame, stagger(i, 8, 4), { distance: 10 })}>
      <Text x={lx} y={ly} size={compact ? 15 : 15.5} weight={near > .5 || reviewAlarm > .5 ? 650 : 550} anchor={compact ? "end" : "middle"} tone={tone}>{label}</Text>
    </g>;
  });

  const nodeDots = steps.map((_, i) => {
    const [nx, ny] = node(i);
    const gate = GATES.findIndex((g) => g.step === i);
    const gateVisible = actB && gate >= 0 ? gatesIn(gate) : 0;
    const reached = p >= i - .05;
    return <g key={i} {...enter(frame, stagger(i, 8, 4), { distance: 0, from: "none" })}>
      {gateVisible < 1 ? <circle cx={nx} cy={ny} r={4.5} opacity={1 - gateVisible}
        style={{ fill: reached ? TONE[flowTone] : "var(--scene-card)" }} stroke={reached ? TONE[flowTone] : "var(--scene-hairline)"} strokeWidth={1.25} /> : null}
      {gateVisible > 0 ? <g transform={`translate(${nx} ${ny}) scale(${.6 + .4 * gateVisible}) translate(${-nx} ${-ny})`}>
        <Checkpoint x={nx} y={ny} r={compact ? 10 : 11} state={gateState(i)} appear={gateVisible} />
      </g> : null}
    </g>;
  });

  const gateLabels = GATES.map((gate, index) => {
    const [nx, ny] = node(gate.step);
    const state = gateState(gate.step);
    const x = compact ? 418 : nx;
    const y = compact ? ny : 342;
    const passedAt = gate.step === 3 ? (frame >= 466 ? 466 : 346) : gate.step === 4 ? 376 : gate.step === 5 ? 508 : T.merge;
    return <g key={gate.step} opacity={actB ? gatesIn(index) : 0}>
      <Text x={x} y={y} size={13} font="mono" weight={600} tone={state === "pass" ? "ok" : "hot"} anchor={compact ? "start" : "middle"}>{gate[locale]}</Text>
      {state === "pass" && frame < passedAt + 30 ? <Pulse x={nx} y={ny} frame={frame} at={passedAt} period={30} r={11} tone="ok" /> : null}
    </g>;
  });
  const gateEyebrow = [418, node(3)[1] - 28] as const;

  // Act 1: the lost piece leaves the card and lands on the hand-off it fell at.
  const lostChips = items.map((item, index) => {
    const at = lostAt(index);
    if (actB || frame < at) return null;
    const text = `− ${item}`;
    const size = 12.5;
    const [cx0, cy0] = cardAt(position(at));
    const start: Pt = [cx0 + 40 + tagWidth(text, size) / 2 - 10, rowY(cy0, index)];
    const g = LOST_GAP[index]!;
    const a = node(g);
    const b = node(g + 1);
    const end: Pt = compact
      ? [132 - tagWidth(text, size) / 2, (a[1] + b[1]) / 2]
      : [(a[0] + b[0]) / 2, 342];
    const control: Pt = compact ? [lerp(start[0], end[0], .5), start[1] - 30] : [end[0], start[1] + 10];
    const t = easeOut(frame, at, at + 20);
    const [x, y] = quad(start, control, end, t);
    return <g key={index}>
      <Tag x={x} y={y} text={text} tone="danger" size={size} appear={Math.min(1, t * 2.5) * act1Out} />
    </g>;
  });

  // Act 1: faster implementation — PRs fly from PR to review and wait there.
  const pile = T.prs.map((at, index) => {
    const t = easeOut(frame, at, at + 16);
    if (t <= 0 || actB) return null;
    const from: Pt = node(5);
    const rest: Pt = compact ? [438 + index * 16, 474 - index * 7] : [800 + index * 18, 360 - index * 6];
    const control: Pt = compact ? [from[0] + 140, from[1] + 10] : [lerp(from[0], rest[0], .5), from[1] + 70];
    const [x, y] = quad(from, control, rest, t);
    return <g key={index} opacity={Math.min(1, t * 3) * act1Out} transform={`translate(${x} ${y}) rotate(${(index - 1) * 4 * t})`}>
      <Box x={-24} y={-14} w={48} h={28} tone="danger" radius={8} label="PR" labelSize={12.5} mono focus={index === 2 ? ease(frame, T.prs[2] + 16, T.prs[2] + 26) : 0} />
    </g>;
  });
  const waitingAt: Pt = compact ? [462, 424] : [890, 392];

  // Act 2: each pinned piece receives a chip that flies up from its step.
  const pinChips = items.map((_, index) => {
    const { step, at } = PIN[index]!;
    const state = rowState(index);
    if (!actB || frame < at) return null;
    const text = steps[step];
    const size = 11.5;
    const w = tagWidth(text, size);
    const target: Pt = [pinX(cardX) - w / 2, rowY(cardY, index)];
    const [lx, ly] = labelAt(step);
    const from: Pt = compact ? [lx - 30, ly] : [lx, ly];
    const t = easeOut(frame, at, at + 16);
    const control: Pt = compact ? [lerp(from[0], target[0], .5), Math.min(from[1], target[1]) - 26] : [lerp(from[0], target[0], .5), target[1] + 20];
    const [x, y] = quad(from, control, target, t);
    const tone: Tone = state === "doubt" ? "hot" : "ok";
    return <Tag key={index} x={x} y={y} text={state === "doubt" ? "?" : text} tone={tone} size={size} appear={Math.min(1, t * 2)} />;
  });

  const rows = items.map((item, index) => {
    const state = rowState(index);
    const y = rowY(cardY, index);
    const gx = cardX + 22;
    const tx = cardX + 40;
    const since = state === "lost" ? (actB ? T.reset : lostAt(index)) : state === "pinned" ? PIN[index]!.at : state === "doubt" ? T.wrong : 0;
    const glyph = pop(frame, since, 200);
    const textW = item.length * (compact ? 15 : 16) * .47;
    return <g key={index} {...(actB && frame >= restore(index) && frame < restore(index) + 18 ? enter(frame, restore(index), { distance: 6 }) : {})}>
      {state === "carried"
        ? <circle cx={gx} cy={y} r={5} fill="none" style={{ stroke: "var(--scene-hairline)" }} strokeWidth={1.5} />
        : <g transform={`translate(${gx} ${y}) scale(${.5 + .5 * glyph}) translate(${-gx} ${-y})`}>
          <Checkpoint x={gx} y={y} r={8} state={state === "lost" ? "fail" : state === "pinned" ? "pass" : "pending"} />
        </g>}
      <Text x={tx} y={y} size={compact ? 15 : 16} weight={600} tone={state === "lost" ? "muted" : "ink"} opacity={state === "lost" ? .6 : 1}>{item}</Text>
      {state === "lost" ? <line x1={tx - 2} x2={tx - 2 + (textW + 4) * easeOut(frame, since, since + 10)} y1={y + 1} y2={y + 1} stroke={TONE.danger} strokeWidth={1.5} /> : null}
    </g>;
  });

  const modeA = 1 - ease(frame, T.reset + 10, T.reset + 22);
  const modeB = pop(frame, T.reset + 22);
  const modeAt: Pt = compact ? [width - 20, 32] : [width - 40, 34];

  // Short captions above the card: the reopen, then "tests ≠ merge", then the human merge.
  const noteY = cardY - 20;
  const noteX = cardX + card.w / 2;
  const notes = [
    { from: T.wrong, to: T.redecide + 6, text: compact ? (fr ? "↺ rouvrir le DiveIn" : "↺ reopen the DiveIn") : fr ? "hypothèse fausse → rouvrir le DiveIn" : "false assumption → reopen DiveIn", tone: "danger" as Tone },
    { from: T.review2 + 6, to: T.merge, text: "tests ✓ ≠ merge", tone: "hot" as Tone },
    { from: T.merge + 4, to: T.end + 60, text: fr ? "mergé par une personne ✓" : "merged by a person ✓", tone: "ok" as Tone },
  ];

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    {/* Mode switch: same trip, two ways of carrying context. */}
    <Tag x={modeAt[0]} y={modeAt[1]} anchor="end" text={fr ? "chaîne linéaire" : "linear chain"} tone="muted" appear={enter(frame, 4).opacity * modeA} />
    <Tag x={modeAt[0]} y={modeAt[1]} anchor="end" text="Product OS" tone="ok" appear={frame >= T.reset + 22 ? modeB : 0} />

    {/* Rail: hairline structure, toned progress up to the card. */}
    <Wire d={railPath} draw={easeOut(frame, 4, 40)} tone="muted" width={1.25} opacity={.55} />
    {p > .01 ? <Wire d={progressPath} tone={flowTone} width={2} opacity={.9} /> : null}
    {backTrace ? <Wire d={backTrace} tone="danger" dashed width={2} opacity={1 - ease(frame, 460, 480)} /> : null}
    {nodeDots}
    {stepLabels}

    {/* Tether from the card to where it currently is on the chain. */}
    {compact
      ? <path d={`M${dotX + 8} ${dotY}C${dotX + 26} ${dotY} ${cardX - 18} ${cardY + card.h / 2} ${cardX} ${cardY + card.h / 2}`} fill="none" style={{ stroke: "var(--scene-hairline)" }} strokeWidth={1.25} opacity={enter(frame, 20).opacity} />
      : <line x1={dotX} x2={dotX} y1={cardY + card.h} y2={dotY - 7} style={{ stroke: "var(--scene-hairline)" }} strokeWidth={1.25} opacity={enter(frame, 20).opacity} />}

    {/* Act 1 residue: what fell off, and the pile in front of review. */}
    {lostChips}
    {pile}
    <Tag x={waitingAt[0]} y={waitingAt[1]} text={fr ? "en attente" : "waiting"} tone="danger" size={12} appear={pop(frame, T.prs[2] + 14) * act1Out * (actB ? 0 : 1)} />

    {/* Act 2: human gates. */}
    <g opacity={actB ? gatesIn(0) : 0}>
      {compact
        ? <Text x={gateEyebrow[0]} y={gateEyebrow[1]} size={11} font="mono" weight={600} tone="hot" caps>{fr ? "gates humaines" : "human gates"}</Text>
        : <>
          <path d={`M${node(3)[0] - 44} 358v6H${node(6)[0] + 44}v-6`} fill="none" stroke={TONE.hot} strokeOpacity={.45} strokeWidth={1} />
          <Text x={(node(3)[0] + node(6)[0]) / 2} y={382} size={11} font="mono" weight={600} tone="hot" caps anchor="middle">{fr ? "gates humaines" : "human gates"}</Text>
        </>}
    </g>
    {gateLabels}

    {/* The context card. */}
    <g {...enter(frame, 18, { distance: 16 })}>
      <Box x={cardX} y={cardY} w={card.w} h={card.h} tone={cardTone} focus={cardFocus} radius={14}>
        <Text x={cardX + 16} y={cardY + card.header} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "contexte" : "context"}</Text>
        <Tag x={cardX + card.w - 12} y={cardY + card.header} anchor="end" size={11} text={fr ? "intention ?" : "intent?"} tone="danger" appear={pop(frame, T.review1 + 4) * act1Out * (actB ? 0 : 1)} />
        <line x1={cardX + 14} x2={cardX + card.w - 14} y1={cardY + card.header + 14} y2={cardY + card.header + 14} style={{ stroke: "var(--scene-hairline)" }} strokeWidth={1} opacity={.7} />
        {rows}
      </Box>
    </g>
    {pinChips}

    {notes.map((note) => {
      const appear = frame >= note.from && frame < note.to ? Math.min(pop(frame, note.from), 1 - ease(frame, note.to - 8, note.to)) : 0;
      return <Tag key={note.text} x={noteX} y={noteY} text={note.text} tone={note.tone} size={12.5} appear={appear} />;
    })}

    {/* Theme flourishes, decorative only: a summit flag / an orbit on the merged review. */}
    <g className="scene-only-mountain" opacity={ease(frame, T.merge + 6, T.merge + 20)}>
      <line x1={node(6)[0] + 16} x2={node(6)[0] + 16} y1={node(6)[1] - 6} y2={node(6)[1] - 28} style={{ stroke: TONE.ok }} strokeWidth={1.5} />
      <path d={`M${node(6)[0] + 16} ${node(6)[1] - 28}l13 5l-13 5z`} style={{ fill: TONE.ok }} transform={`translate(0 ${-6 * (1 - easeOut(frame, T.merge + 6, T.merge + 24))})`} />
    </g>
    <g className="scene-only-rocket" opacity={.8 * ease(frame, T.merge + 6, T.merge + 20)}>
      <ellipse cx={node(6)[0]} cy={node(6)[1]} rx={24} ry={9} fill="none" style={{ stroke: tint("ok", 70) }} strokeWidth={1} strokeDasharray="2 5" strokeDashoffset={-frame * .5} />
    </g>
  </Camera>;
}

function during(frame: number, start: number, end: number) {
  return Math.min(ease(frame, start, start + 10), 1 - ease(frame, end - 10, end));
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: 600,
  title: { en: "A human-led loop, not an agent", fr: "Une boucle humaine, pas un agent" },
  caption: {
    en: "Speeding up implementation alone moves the bottleneck to review. The Product OS pins the problem, decisions, boundaries and definition of done in artefacts, and keeps human gates on product, architecture, sensitive changes and merge.",
    fr: "Accélérer uniquement l'implémentation déplace le goulot vers la review. Le Product OS fixe le problème, les décisions, les limites et la définition de « terminé » dans des artefacts, et garde des gates humaines sur le produit, l'architecture, les changements sensibles et le merge.",
  },
  beats: [
    { at: 0, text: { en: "Between product discovery and a PR, context crosses several handoffs.", fr: "Entre une découverte produit et une PR, le contexte traverse plusieurs handoffs." } },
    { at: 54, text: { en: "Each handoff can drop something: the problem, a decision, a boundary, the definition of done.", fr: "Chaque handoff peut perdre le problème, une décision, une limite ou la définition de « terminé »." } },
    { at: T.review1, text: { en: "Speed up only implementation: PRs pile up at review, with no intent left to check.", fr: "Accélérer seulement l'implémentation : les PR s'empilent en review, sans intention à vérifier." } },
    { at: T.reset + 38, text: { en: "Product OS: each step leaves an artefact the next can use; human gates hold the decisions.", fr: "Product OS : chaque étape laisse un artefact à la suivante ; des gates humaines gardent les décisions." } },
    { at: T.wrong, text: { en: "A false assumption found during implementation reopens the DiveIn instead of being accelerated.", fr: "Une hypothèse fausse découverte en implémentation rouvre le DiveIn au lieu d'être accélérée." } },
    { at: T.review2, text: { en: "Tests pass, yet merge stays a human gate. AI carries the context; people own the outcome.", fr: "Les tests passent, le merge reste une gate humaine. L'IA transporte le contexte ; l'humain porte le résultat." } },
  ],
  Stage,
});
