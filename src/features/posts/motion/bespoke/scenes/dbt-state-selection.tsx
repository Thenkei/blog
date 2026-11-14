import { Box, Comet, dim, during, ease, easeOut, enter, Flight, lerp, pop, Pulse, Tag, tagWidth, Text, textWidth, TONE, Wire, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// One small dbt graph, two pull requests. First PR: the SQL of
// int_active_contracts changes. `@state:modified` (build) reaches the model, its
// descendant and every ancestor of that descendant; `state:modified+` (test)
// reaches the model, its descendant and their unit tests. Second PR: only a
// fixture of the unit test changes. The test is its own node, the model is not
// state:modified, the descendant and its test stay out, until the model that
// owns the changed YAML entry is added to both selectors and the same two
// selections replay on the same graph.
const T = {
  change: 36,
  build: 84,
  test: 184,
  reset: 276,
  fixture: 284,
  miss: 372,
  fix: 458,
  rebuild: 500,
  retest: 548,
  settle: 592,
  end: 672,
} as const;

const MODEL = "int_active_contracts";
const PARENT = "stg_partner_contracts";
const UNIT_TEST = "test_closed_contracts_are_excluded";

type Pt = readonly [number, number];
type Rect = { x: number; y: number; w: number; h: number };
type Kind = "build" | "test";
type NodeId = "stg" | "other" | "model" | "desc" | "modelTest" | "descTest";
type EdgeId = "stgModel" | "otherDesc" | "modelDesc" | "modelTest" | "descTest";

// A selection spreads from the selected model along the graph. Offsets are in
// frames after the wave starts, scaled by `k` (the replay runs faster).
type Wave = { kind: Kind; at: number; until: number; k: number; firstPr: boolean };
const WAVES: readonly Wave[] = [
  { kind: "build", at: T.build, until: T.test, k: 1, firstPr: true },
  { kind: "test", at: T.test, until: T.reset, k: 1, firstPr: true },
  { kind: "build", at: T.rebuild, until: T.retest, k: .7, firstPr: false },
  { kind: "test", at: T.retest, until: Infinity, k: .7, firstPr: false },
];

/** When each node joins the selection. `@` walks down, then back up to every ancestor. */
const REACH: Record<Kind, Partial<Record<NodeId, number>>> = {
  build: { model: 6, desc: 30, stg: 58, other: 58 },
  test: { model: 6, modelTest: 24, desc: 30, descTest: 48 },
};

type Hop = { edge: EdgeId; span: readonly [number, number]; upstream?: boolean };
const HOPS: Record<Kind, readonly Hop[]> = {
  build: [
    { edge: "modelDesc", span: [10, 30] },
    { edge: "otherDesc", span: [36, 58], upstream: true },
    { edge: "stgModel", span: [36, 58], upstream: true },
  ],
  test: [
    { edge: "modelDesc", span: [10, 30] },
    { edge: "modelTest", span: [10, 24] },
    { edge: "descTest", span: [34, 48] },
  ],
};

const NODE_ORDER: readonly NodeId[] = ["stg", "other", "model", "desc", "modelTest", "descTest"];
const EDGE_ORDER: readonly EdgeId[] = ["stgModel", "otherDesc", "modelDesc", "modelTest", "descTest"];
const isTestNode = (id: NodeId) => id === "modelTest" || id === "descTest";
const isAttachment = (id: EdgeId) => id === "modelTest" || id === "descTest";

/** Samples a cubic Bézier so a wire and a Comet share the same path. */
function cubic(a: Pt, c1: Pt, c2: Pt, b: Pt, steps = 18): Pt[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const u = 1 - t;
    return [
      u ** 3 * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t ** 3 * b[0],
      u ** 3 * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t ** 3 * b[1],
    ] as const;
  });
}

const pathOf = (points: readonly Pt[]) => `M${points.map((point) => `${point[0]} ${point[1]}`).join("L")}`;

function headOf(points: readonly Pt[], size = 7) {
  const tip = points.at(-1)!;
  const before = points.at(-2)!;
  const angle = Math.atan2(tip[1] - before[1], tip[0] - before[0]);
  const side = (offset: number) => `${tip[0] - size * Math.cos(angle + offset)} ${tip[1] - size * Math.sin(angle + offset)}`;
  return `M${side(-.45)}L${tip[0]} ${tip[1]}L${side(.45)}Z`;
}

type Layout = {
  selectors: Record<Kind, Rect>;
  /** Compact: eyebrow and selector share one line. */
  inline: boolean;
  selectorSize: number;
  nodes: Record<NodeId, Rect>;
  edges: Record<EdgeId, readonly Pt[]>;
  /** The `model:` key that attaches the unit test to its model. */
  key: { x: number; y: number };
};

const WIDE_LAYOUT: Layout = {
  selectors: { build: { x: 40, y: 56, w: 430, h: 60 }, test: { x: 490, y: 56, w: 430, h: 60 } },
  inline: false,
  selectorSize: 15,
  nodes: {
    other: { x: 370, y: 132, w: 220, h: 62 },
    stg: { x: 40, y: 218, w: 220, h: 62 },
    model: { x: 370, y: 218, w: 220, h: 62 },
    desc: { x: 700, y: 218, w: 220, h: 62 },
    modelTest: { x: 335, y: 322, w: 290, h: 62 },
    descTest: { x: 700, y: 322, w: 220, h: 62 },
  },
  edges: {
    stgModel: [[260, 249], [368, 249]],
    modelDesc: [[590, 249], [698, 249]],
    otherDesc: cubic([590, 163], [760, 163], [810, 163], [810, 216]),
    modelTest: [[480, 280], [480, 322]],
    descTest: [[810, 280], [810, 322]],
  },
  key: { x: 470, y: 301 },
};

const COMPACT_LAYOUT: Layout = {
  selectors: { build: { x: 20, y: 52, w: 500, h: 38 }, test: { x: 20, y: 96, w: 500, h: 38 } },
  inline: true,
  selectorSize: 14,
  nodes: {
    stg: { x: 20, y: 150, w: 220, h: 62 },
    other: { x: 324, y: 150, w: 196, h: 62 },
    model: { x: 20, y: 240, w: 220, h: 62 },
    modelTest: { x: 20, y: 332, w: 290, h: 62 },
    desc: { x: 324, y: 332, w: 196, h: 62 },
    descTest: { x: 324, y: 426, w: 196, h: 62 },
  },
  edges: {
    stgModel: [[80, 212], [80, 238]],
    modelDesc: cubic([240, 271], [340, 271], [400, 271], [400, 330]),
    otherDesc: [[470, 212], [470, 330]],
    modelTest: [[80, 302], [80, 332]],
    descTest: [[422, 394], [422, 426]],
  },
  key: { x: 70, y: 317 },
};

const COPY = {
  fr: {
    build: "pour construire", test: "pour tester",
    descendant: "descendant", otherParent: "autre parent", unitTest: "test unitaire",
    built: "construit", tested: "testé", ran: "✓ exécuté",
    sqlChanged: "SQL modifié", sqlSame: "SQL inchangé", fixtureChanged: "fixture modifiée",
    notModified: "pas state:modified", out: "✗ hors sélection",
  },
  en: {
    build: "to build", test: "to test",
    descendant: "descendant", otherParent: "other parent", unitTest: "unit test",
    built: "built", tested: "tested", ran: "✓ ran",
    sqlChanged: "SQL changed", sqlSame: "SQL unchanged", fixtureChanged: "fixture changed",
    notModified: "not state:modified", out: "✗ out of selection",
  },
} as const;

type Chip = { text: string; tone: Tone; appear: number };

/** A graph node: label on the first line, selection chips on the second. */
function GraphNode({ rect, label, mono, labelSize, tone, focus, radius, chips, note }: {
  rect: Rect;
  label: string;
  mono: boolean;
  labelSize: number;
  tone: Tone;
  focus: number;
  radius: number;
  chips: readonly Chip[];
  note?: string | undefined;
}) {
  const chipY = rect.y + rect.h - 17;
  const placed = chips.filter((chip) => chip.appear > 0).reduce<{ next: number; items: (Chip & { x: number })[] }>(
    (row, chip) => ({ next: row.next + tagWidth(chip.text, 11) + 6, items: [...row.items, { ...chip, x: row.next }] }),
    { next: rect.x + 12, items: [] },
  ).items;
  return <Box x={rect.x} y={rect.y} w={rect.w} h={rect.h} tone={tone} focus={focus} fill={focus * .5} radius={radius}>
    <Text x={rect.x + 14} y={rect.y + 20} size={labelSize} font={mono ? "mono" : "display"} weight={600}>{label}</Text>
    {note ? <Text x={rect.x + rect.w - 14} y={chipY} size={11} font="mono" weight={600} tone="muted" anchor="end" caps>{note}</Text> : null}
    {placed.map((chip) => <Tag key={chip.text} x={chip.x} y={chipY} anchor="start" text={chip.text} tone={chip.tone} appear={chip.appear} size={11} />)}
  </Box>;
}

/** A lineage edge (arrow) or a test attachment (dashed), lit while it carries a selection. */
function Edge({ points, draw, lit, dashed }: { points: readonly Pt[]; draw: number; lit: number; dashed: boolean }) {
  const d = pathOf(points);
  const head = dashed ? null : headOf(points);
  return <g>
    <Wire d={d} draw={draw} tone="muted" width={dashed ? 1.75 : 1.25} dashed={dashed} opacity={dashed ? 1 : .7} />
    {head && draw > .95 ? <path d={head} fill={TONE.muted} opacity={.7} /> : null}
    {lit > 0 ? <g opacity={lit}>
      <path d={d} fill="none" stroke={TONE.line} strokeWidth={2} strokeLinecap="round" strokeDasharray={dashed ? "4 7" : undefined} />
      {head ? <path d={head} fill={TONE.line} /> : null}
    </g> : null}
  </g>;
}

/** A selector card: what it is for, then the expression passed to `--select`. */
function Selector({ rect, inline, textX, size, eyebrow, base, added, addedIn, focus }: {
  rect: Rect;
  inline: boolean;
  /** Where the selector expression starts. */
  textX: number;
  size: number;
  eyebrow: string;
  base: string;
  added: string;
  /** 0→1 once the owning model has been appended to the selector. */
  addedIn: number;
  focus: number;
}) {
  const textY = inline ? rect.y + rect.h / 2 + .5 : rect.y + 41;
  return <Box x={rect.x} y={rect.y} w={rect.w} h={rect.h} tone="line" focus={focus} radius={inline ? 12 : 14}>
    <Text x={rect.x + (inline ? 16 : 18)} y={inline ? rect.y + rect.h / 2 + .5 : rect.y + 19} size={11} font="mono" weight={600} tone="muted" caps>{eyebrow}</Text>
    <Text x={textX} y={textY} size={size} font="mono" weight={600}>{base}</Text>
    {addedIn > 0 ? <Text x={textX + textWidth(`${base} `, size)} y={textY} size={size} font="mono" weight={600} tone="hot" opacity={addedIn}>{added}</Text> : null}
  </Box>;
}

function Stage({ frame, compact, locale }: SceneStageProps) {
  const c = COPY[locale];
  const L = compact ? COMPACT_LAYOUT : WIDE_LAYOUT;

  // ── Selections ────────────────────────────────────────────────────────────
  const reachAt = (wave: Wave, id: NodeId) => {
    const offset = REACH[wave.kind][id];
    return offset === undefined ? undefined : wave.at + offset * wave.k;
  };
  const released = (wave: Wave) => 1 - ease(frame, wave.until, wave.until + 14);
  const firstPrGone = 1 - ease(frame, T.reset, T.reset + 14);
  const settle = ease(frame, T.settle, T.settle + 18);

  /** 0→1 while the node belongs to the selection being shown. */
  const lit = (id: NodeId) => WAVES.reduce((best, wave) => {
    const at = reachAt(wave, id);
    return at === undefined ? best : Math.max(best, easeOut(frame, at, at + 10) * released(wave));
  }, 0);

  /** Chip left on a node once a selector has reached it. */
  const mark = (kind: Kind, id: NodeId) => WAVES.filter((wave) => wave.kind === kind).reduce((best, wave) => {
    const at = reachAt(wave, id);
    if (at === undefined || frame < at) return best;
    return Math.max(best, pop(frame, at) * (wave.firstPr ? firstPrGone : 1));
  }, 0);

  const running = (kind: Kind) => WAVES.some((wave) => wave.kind === kind && frame >= wave.at && frame < wave.until);
  const chipTone = (kind: Kind): Tone => running(kind) || frame >= T.settle ? "line" : "muted";
  const waveFocus = (kind: Kind) => WAVES.filter((wave) => wave.kind === kind).reduce((best, wave) => Math.max(best, during(frame, wave.at, wave.until + 10, 10)), 0);

  const edgeLit = (id: EdgeId) => WAVES.reduce((best, wave) => {
    const hop = HOPS[wave.kind].find((candidate) => candidate.edge === id);
    if (!hop) return best;
    const arrival = wave.at + hop.span[1] * wave.k;
    return Math.max(best, easeOut(frame, arrival - 8, arrival + 4) * released(wave));
  }, 0);

  // ── The two changes and what the second one misses ────────────────────────
  const sqlChanged = frame >= T.change ? pop(frame, T.change) * firstPrGone : 0;
  const fixtureAt = T.fixture + 18;
  const fixtureChanged = frame >= fixtureAt ? pop(frame, fixtureAt) : 0;
  const sqlSameAt = T.fixture + 34;
  const sqlSame = frame >= sqlSameAt ? pop(frame, sqlSameAt) : 0;
  const notModifiedAt = T.miss + 8;
  const notModified = frame >= notModifiedAt ? pop(frame, notModifiedAt) * (1 - ease(frame, T.fix + 22, T.fix + 36)) : 0;
  const outGone = 1 - ease(frame, T.fix, T.fix + 14);
  const outAt = { desc: T.miss + 30, descTest: T.miss + 42 } as const;
  const out = (id: "desc" | "descTest") => frame >= outAt[id] ? pop(frame, outAt[id]) * outGone : 0;

  const changeFocus: Partial<Record<NodeId, number>> = {
    model: during(frame, T.change - 2, T.build + 8, 10),
    modelTest: during(frame, fixtureAt - 4, T.miss + 6, 10),
  };
  const missFocus: Partial<Record<NodeId, number>> = {
    desc: during(frame, outAt.desc - 2, T.fix + 12, 10),
    descTest: during(frame, outAt.descTest - 2, T.fix + 12, 10),
  };

  const look = (id: NodeId): { tone: Tone; focus: number } => {
    const states: { tone: Tone; focus: number }[] = [
      { tone: isTestNode(id) ? "ok" : "line", focus: lit(id) * lerp(.9, .6, settle) },
      { tone: "hot", focus: (changeFocus[id] ?? 0) * .9 },
      { tone: "danger", focus: (missFocus[id] ?? 0) * .9 },
    ];
    const top = states.reduce((best, state) => state.focus > best.focus ? state : best);
    return top.focus > .02 ? top : { tone: "muted", focus: 0 };
  };

  const chipsFor = (id: NodeId): Chip[] => {
    if (id === "modelTest") return [{ text: c.ran, tone: "ok", appear: mark("test", id) }];
    if (id === "descTest") return [{ text: c.out, tone: "danger", appear: out("descTest") }, { text: c.ran, tone: "ok", appear: mark("test", id) }];
    return [
      ...(id === "model" ? [{ text: c.notModified, tone: "ink" as const, appear: notModified }] : []),
      ...(id === "desc" ? [{ text: c.out, tone: "danger" as const, appear: out("desc") }] : []),
      { text: c.built, tone: chipTone("build"), appear: mark("build", id) },
      { text: c.tested, tone: chipTone("test"), appear: mark("test", id) },
    ];
  };

  // Parents recede while the stage is about the model, its descendant and their tests.
  const sidelined = Math.max(
    during(frame, T.test + 4, T.reset + 10, 12),
    during(frame, T.miss, T.fix + 20, 12),
    during(frame, T.retest + 4, T.settle + 14, 12),
  );

  const labels: Record<NodeId, { label: string; mono: boolean; size: number }> = {
    stg: { label: PARENT, mono: true, size: 13.5 },
    other: { label: c.otherParent, mono: false, size: 15 },
    model: { label: MODEL, mono: true, size: 13.5 },
    desc: { label: c.descendant, mono: false, size: 15 },
    modelTest: { label: UNIT_TEST, mono: true, size: 13 },
    descTest: { label: c.unitTest, mono: false, size: 15 },
  };

  // ── The fix: the owning model's name flies into both selectors ────────────
  const size = L.selectorSize;
  const base = { build: "@state:modified", test: "state:modified+" } as const;
  const added = { build: `@${MODEL}`, test: `${MODEL}+` } as const;
  const flightAt = { build: T.fix + 4, test: T.fix + 10 } as const;
  const flightFrames = 30;
  // Compact: both expressions start in the same column, after the longer eyebrow (11 px caps, 1.3 tracking).
  const eyebrowColumn = Math.max(c.build.length, c.test.length) * (11 * .6 + 1.3) + 14;
  const textX = (kind: Kind) => L.selectors[kind].x + (L.inline ? 16 + eyebrowColumn : 18);
  const landing = (kind: Kind): Pt => {
    const rect = L.selectors[kind];
    return [textX(kind) + textWidth(`${base[kind]} `, size) + textWidth(added[kind], size) / 2, L.inline ? rect.y + rect.h / 2 : rect.y + 41];
  };
  const liftOff: Pt = [L.nodes.model.x + 14 + textWidth(MODEL, 13.5) / 2, L.nodes.model.y + 20];
  const keyTone: Tone = frame >= T.fix && frame < T.rebuild ? "hot" : "muted";

  // Change badges ride the top edge of the node they belong to.
  const badgeX = (id: NodeId) => L.nodes[id].x + L.nodes[id].w - 12;
  const badgeY = (id: NodeId) => L.nodes[id].y - 5;
  // Second PR: both selectors look at the graph and find no modified model.
  const searching = during(frame, T.miss, T.miss + 44, 10) * .7;

  return <g>
    {/* Selectors */}
    {(["build", "test"] as const).map((kind, index) => {
      const landed = flightAt[kind] + flightFrames;
      const focus = Math.max(searching, kind === "build" ? Math.max(waveFocus(kind), settle * .6) : waveFocus(kind) * lerp(1, .6, settle));
      return <g key={kind} {...enter(frame, index * 5)}>
        <Selector
          rect={L.selectors[kind]} inline={L.inline} textX={textX(kind)} size={size} eyebrow={c[kind]}
          base={base[kind]} added={added[kind]} addedIn={easeOut(frame, landed - 2, landed + 10)} focus={focus}
        />
      </g>;
    })}

    {/* Lineage and test attachments */}
    {EDGE_ORDER.map((id, index) => <Edge
      key={id} points={L.edges[id]} dashed={isAttachment(id)}
      draw={easeOut(frame, 20 + index * 4, 44 + index * 4)} lit={edgeLit(id)}
    />)}
    <Text x={L.key.x} y={L.key.y} size={13} font="mono" weight={600} tone={keyTone} anchor="end" opacity={easeOut(frame, 40, 56)}>model:</Text>

    {/* Nodes */}
    {NODE_ORDER.map((id, index) => {
      const state = look(id);
      const parent = id === "stg" || id === "other";
      return <g key={id} {...enter(frame, 8 + index * 5, { opacity: parent ? dim(sidelined, .45) : 1 })}>
        <GraphNode
          rect={L.nodes[id]} label={labels[id].label} mono={labels[id].mono} labelSize={labels[id].size}
          tone={state.tone} focus={state.focus} radius={isTestNode(id) ? 20 : 12}
          chips={chipsFor(id)} note={id === "modelTest" ? c.unitTest : undefined}
        />
      </g>;
    })}

    {/* What each pull request changes */}
    <Tag x={badgeX("model")} y={badgeY("model")} anchor="end" text={c.sqlChanged} tone="hot" appear={sqlChanged} size={11} />
    <Tag x={badgeX("model")} y={badgeY("model")} anchor="end" text={c.sqlSame} tone="muted" appear={sqlSame} size={11} />
    <Tag x={badgeX("modelTest")} y={badgeY("modelTest")} anchor="end" text={c.fixtureChanged} tone="hot" appear={fixtureChanged} size={11} />
    <Pulse x={badgeX("model") - tagWidth(c.sqlChanged, 11) / 2} y={badgeY("model")} frame={frame} at={T.change} period={36} r={12} tone="hot" once />
    <Pulse x={badgeX("modelTest") - tagWidth(c.fixtureChanged, 11) / 2} y={badgeY("modelTest")} frame={frame} at={fixtureAt} period={36} r={12} tone="hot" once />

    {/* Selections travelling along the graph */}
    {WAVES.flatMap((wave) => HOPS[wave.kind].map((hop) => {
      const points = hop.upstream ? [...L.edges[hop.edge]].reverse() : L.edges[hop.edge];
      const t = ease(frame, wave.at + hop.span[0] * wave.k, wave.at + hop.span[1] * wave.k);
      return <Comet key={`${wave.at}-${hop.edge}`} points={points} t={t} tone="line" r={5} tail={.3} />;
    }))}

    {/* The owning model joins both selectors */}
    {(["build", "test"] as const).map((kind) => <g key={kind}>
      <Flight
        from={liftOff} to={landing(kind)} bend={compact ? [70, -10] : [0, -30]}
        t={(frame - flightAt[kind]) / flightFrames} label={MODEL} tone="hot" endWidth={tagWidth(added[kind], size)} size={13}
      />
      <Pulse x={landing(kind)[0]} y={landing(kind)[1]} frame={frame} at={flightAt[kind] + flightFrames} period={32} r={12} tone="hot" once />
    </g>)}
  </g>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.miss + 70,
  title: { fr: "Ce que state:modified sélectionne", en: "What state:modified selects" },
  caption: {
    fr: "@state:modified construit le modèle modifié, ses descendants et tous les ancêtres de ces descendants ; state:modified+ ne lance que les tests du modèle et de ses descendants. Une fixture modifiée ne rend pas le modèle state:modified : le modèle propriétaire de l'entrée YAML s'ajoute aux deux sélecteurs.",
    en: "@state:modified builds the modified model, its descendants and all the ancestors of those descendants; state:modified+ only runs the tests of the model and its descendants. A changed fixture does not make the model state:modified: the owning model of the YAML entry is added to both selectors.",
  },
  beats: [
    { at: 0, text: { fr: "Une PR modifie le SQL de int_active_contracts. Pour dbt, le modèle est state:modified.", en: "A PR changes the SQL of int_active_contracts. For dbt, the model is state:modified." } },
    { at: T.build, text: { fr: "@state:modified construit le modèle, ses descendants et tous les ancêtres de ces descendants.", en: "@state:modified builds the model, its descendants and all the ancestors of those descendants." } },
    { at: T.test, text: { fr: "state:modified+ ne lance que les tests unitaires du modèle et de ses descendants.", en: "state:modified+ only runs the unit tests of the model and its descendants." } },
    { at: T.fixture, text: { fr: "Autre PR : seule une ligne de given change. Le test unitaire est un nœud à part, le SQL n'a pas bougé.", en: "Another PR: only a row in given changes. The unit test is a separate node; the SQL has not moved." } },
    { at: T.miss, text: { fr: "Le modèle n'est pas state:modified. Ses descendants et leurs tests restent hors de la sélection.", en: "The model is not state:modified. Its descendants and their tests stay out of the selection." } },
    { at: T.fix, text: { fr: "Le modèle propriétaire de l'entrée YAML modifiée s'ajoute aux deux sélecteurs. Les mêmes tests passent.", en: "The owning model of the changed YAML entry is added to both selectors. The same tests pass." } },
  ],
  Stage,
});
