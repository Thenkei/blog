import { Boundary, Box, Checkpoint, Comet, ease, easeOut, enter, lerp, pop, Pulse, stagger, Tag, Text, tint, TONE, Wire, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Timeline (30 fps). Act 1 routes three unproven assumptions through the review
// passes; each leaves with evidence, a signal or an explicitly accepted risk.
// Act 2 is "tomorrow": the signalled assumption turns false, the signal carries
// it to the reconciliation alert and the recovery path answers the article's
// final question: will we notice, and respond?
const LANE_START = [52, 108, 164] as const;
const TRAVEL = 30;
const T = {
  tomorrow: 232,
  broken: 252,
  replay: 282,
  alert: 310,
  handoff: 336,
  recover: 364,
  end: 480,
} as const;

type Lane = {
  assume: Record<"en" | "fr", readonly [string, string]>;
  pass: string;
  kind: Record<"en" | "fr", string>;
  detail: Record<"en" | "fr", string>;
  tone: Tone;
};

// Assumptions come from the article's review questions; outcomes from its
// Reduce / Detect steps and its "a known risk can be accepted" rule.
const LANES: readonly Lane[] = [
  {
    assume: { en: ["the financial invariant", "cannot fail silently"], fr: ["l’invariant financier", "ne casse pas en silence"] },
    pass: "gate",
    kind: { en: "EVIDENCE", fr: "PREUVE" },
    detail: { en: "executable invariant", fr: "invariant exécutable" },
    tone: "ok",
  },
  {
    assume: { en: ["operators always follow", "the nominal path"], fr: ["les opérateurs suivent", "le chemin nominal"] },
    pass: "find blind spots",
    kind: { en: "SIGNAL", fr: "SIGNAL" },
    detail: { en: "reconciliation alert", fr: "alerte de rapprochement" },
    tone: "line",
  },
  {
    assume: { en: ["cardinality stays low", "enough for this component"], fr: ["la cardinalité reste", "basse pour ce composant"] },
    pass: "adversarial review",
    kind: { en: "ACCEPTED RISK", fr: "RISQUE ACCEPTÉ" },
    detail: { en: "accepted by a human reviewer", fr: "acceptée par un humain" },
    tone: "hot",
  },
];

const COPY = {
  en: {
    assumption: "ASSUMPTION",
    review: "review",
    outcome: "OUTCOME",
    tomorrow: "TOMORROW · THE ASSUMPTION IS FALSE",
    steps: [["assumption false", "an operator replays a call"], ["we notice", "before a customer does"], ["we respond", "controlled replay"]],
    alert: "ALERT",
    fail: "false",
  },
  fr: {
    assumption: "HYPOTHÈSE",
    review: "revue",
    outcome: "RÉSULTAT",
    tomorrow: "DEMAIN · L’HYPOTHÈSE EST FAUSSE",
    steps: [["hypothèse fausse", "un opérateur rejoue un appel"], ["on le voit", "avant qu’un client le voie"], ["on réagit", "replay contrôlé"]],
    alert: "ALERTE",
    fail: "fausse",
  },
} as const;

type Pt = readonly [number, number];

function Stage({ frame, compact, locale }: SceneStageProps) {
  const c = COPY[locale];
  const isBroken = frame >= T.broken;
  const broken = Math.min(1, pop(frame, T.broken));
  const alertOn = pop(frame, T.alert);

  // Geometry. Wide: three lanes crossing a review boundary. Compact: one card per lane.
  const G = compact
    ? { laneY: (i: number) => 52 + i * 88, card: { x: 20, w: 500, h: 78 }, strip: { x: 20, y: 322, w: 500, h: 178 } }
    : { laneY: (i: number) => 95 + i * 60, card: { x: 40, w: 250, h: 50 }, strip: { x: 40, y: 296, w: 880, h: 100 } };
  const station = { x: 318, y: 74, w: 254, h: 206 };
  const out = { x: 600, w: 320 };
  const headerY = 74;

  const lane = (l: Lane, i: number) => {
    const y = G.laneY(i);
    const start = LANE_START[i]!;
    const arrive = start + TRAVEL;
    const reviewed = frame >= arrive;
    const outIn = pop(frame, arrive);
    const travel = ease(frame, start, arrive);
    const inStation = during01(travel, .22, .78);
    const failing = i === 1 && isBroken;
    const flash = ease(frame, arrive, arrive + 6) * (1 - ease(frame, arrive + 10, arrive + 30));
    const cardTone: Tone = failing ? "danger" : reviewed ? l.tone : "muted";
    const lines = l.assume[locale];
    const alertHere = i === 1 ? alertOn : 0;
    const appear = enter(frame, stagger(i, 8, 6), { from: "left", distance: 16 });

    if (compact) {
      const x = G.card.x;
      const w = G.card.w;
      return <g key={l.pass} {...appear}>
        <Box x={x} y={y} w={w} h={G.card.h} tone={cardTone} radius={14} focus={Math.max(inStation, i === 1 ? alertHere * (1 - ease(frame, T.alert + 30, T.alert + 50)) : 0)} fill={failing ? .8 * broken : flash * .6}>
          <Text x={x + 18} y={y + 20} size={11} font="mono" weight={600} tone={inStation > .3 ? "hot" : "muted"} caps>{l.pass}</Text>
          <Text x={x + 18} y={y + 44} size={15} weight={600} tone={failing ? "danger" : reviewed ? "ink" : "muted"}>{failing ? "✗ " : ""}{lines.join(" ")}</Text>
          <g {...enter(frame, arrive + 2, { from: "left", distance: 10 })}>
            <Text x={x + 18} y={y + 64} size={13} font="mono" weight={600} tone={l.tone}>→ {l.detail[locale]}</Text>
          </g>
        </Box>
        <Tag x={x + w - 16} y={y + 20} anchor="end" size={11.5} tone={l.tone} appear={outIn} text={i === 1 && alertHere > .5 ? `${l.kind[locale]} · ${c.alert} ●` : l.kind[locale]} />
        {failing ? <Tag x={x + w - 16} y={y + 44} anchor="end" size={11.5} tone="danger" appear={broken} text={`✗ ${c.fail}`} /> : null}
        {i === 1 && frame >= T.alert && frame < T.alert + 40 ? <Pulse x={x + w - 60} y={y + 20} frame={frame} at={T.alert} period={40} r={14} tone="line" /> : null}
      </g>;
    }

    const midY = y + G.card.h / 2;
    const pill = { x: station.x + 22, w: station.w - 44 };
    const path: Pt[] = [[G.card.x + G.card.w, midY], [out.x, midY]];
    const replay = i === 1 ? ease(frame, T.replay, T.alert) : 0;
    return <g key={l.pass}>
      {/* The lane: faint until the review has run on it. */}
      <g opacity={easeOut(frame, stagger(i, 14, 6), stagger(i, 32, 6))}>
        <line x1={G.card.x + G.card.w} x2={out.x} y1={midY} y2={midY} stroke="var(--scene-hairline)" strokeWidth={1} strokeDasharray="3 5" />
        <Wire d={`M${G.card.x + G.card.w} ${midY}H${out.x}`} draw={travel} tone={l.tone} width={1.5} opacity={.7} />
      </g>

      <g {...appear}>
        <Box x={G.card.x} y={y} w={G.card.w} h={G.card.h} tone={cardTone} radius={12} fill={failing ? .8 * broken : flash * .6} focus={failing ? broken * (1 - ease(frame, T.replay + 20, T.replay + 40)) : 0}>
          <Text x={G.card.x + 16} y={y + 17} size={14.5} weight={600} tone={failing ? "danger" : reviewed ? "ink" : "muted"}>{lines[0]}</Text>
          <Text x={G.card.x + 16} y={y + 34} size={14.5} weight={600} tone={failing ? "danger" : reviewed ? "ink" : "muted"}>{lines[1]}</Text>
        </Box>
        {failing ? <Tag x={G.card.x + G.card.w - 12} y={y} anchor="end" size={11} tone="danger" appear={broken} text={`✗ ${c.fail}`} /> : null}
      </g>

      {/* The pass that catches it. */}
      <g {...enter(frame, stagger(i, 20, 6))}>
        <rect x={pill.x} y={midY - 15} width={pill.w} height={30} rx={15} style={{ fill: "var(--scene-card)" }} />
        <rect className={inStation > .05 ? "scene-glow" : undefined} x={pill.x} y={midY - 15} width={pill.w} height={30} rx={15} style={{ fill: tint("hot", 6 + 18 * inStation), color: TONE.hot }} stroke={TONE.hot} strokeOpacity={.3 + .6 * Math.max(inStation, reviewed ? .3 : 0)} strokeWidth={1 + .5 * inStation} />
        <Text x={pill.x + pill.w / 2} y={midY + .5} size={13.5} font="mono" weight={600} tone={inStation > .3 || reviewed ? "hot" : "muted"} anchor="middle">{l.pass}</Text>
      </g>

      {/* Outcome: rises into its slot when the packet lands. */}
      <rect x={out.x} y={y} width={out.w} height={G.card.h} rx={12} fill="none" stroke="var(--scene-hairline)" strokeDasharray="3 5" opacity={easeOut(frame, stagger(i, 20, 6), stagger(i, 40, 6)) * (1 - Math.min(1, outIn))} />
      <Box x={out.x} y={y} w={out.w} h={G.card.h} tone={l.tone} radius={12} appear={Math.min(1, outIn)} fill={alertHere > 0 ? .9 * alertHere * (1 - ease(frame, T.alert + 20, T.alert + 60)) + .25 * Math.min(1, alertHere) : 0} focus={alertHere * (1 - ease(frame, T.alert + 30, T.alert + 60))}>
        <Text x={out.x + 16} y={y + 17} size={11} font="mono" weight={600} tone={l.tone} caps>{l.kind[locale]}</Text>
        <Text x={out.x + 16} y={y + 35} size={15.5} weight={600}>{l.detail[locale]}</Text>
      </Box>
      {i === 1 ? <Tag x={out.x + out.w - 14} y={y + 17} anchor="end" size={11} tone="line" appear={alertOn} text={`${c.alert} ●`} /> : null}
      {i === 1 && frame >= T.alert && frame < T.alert + 40 ? <Pulse x={out.x} y={midY} frame={frame} at={T.alert} period={40} r={14} tone="line" /> : null}

      <Comet points={path} t={travel} tone="hot" r={5.5} tail={.18} />
      {i === 1 ? <Comet points={path} t={replay} tone="danger" r={5.5} tail={.18} /> : null}
    </g>;
  };

  // "Tomorrow": the chain of consequences, read along a rail.
  const strip = G.strip;
  const stripIn = enter(frame, T.tomorrow, { distance: 16 });
  const stepAt = [T.broken, T.alert, T.recover] as const;
  const stepPos = (index: number): Pt => compact
    ? [strip.x + 34, strip.y + 60 + index * 47]
    : [strip.x + 34 + index * 296, strip.y + 48];
  const railFrom = stepPos(0);
  const railTo = stepPos(2);
  const hop1 = ease(frame, T.replay, T.alert);
  const hop2 = ease(frame, T.handoff, T.recover);

  return <g>
    {!compact ? <g {...enter(frame, 0)}>
      <Text x={G.card.x} y={headerY} size={11} font="mono" weight={600} tone="muted" caps>{c.assumption}</Text>
      <Text x={out.x} y={headerY} size={11} font="mono" weight={600} tone="muted" caps>{c.outcome}</Text>
      <Boundary x={station.x} y={station.y} w={station.w} h={station.h} label={c.review} tone="hot" />
    </g> : null}

    {LANES.map(lane)}

    {frame >= T.tomorrow ? <g {...stripIn}>
      <Box x={strip.x} y={strip.y} w={strip.w} h={strip.h} tone="danger" radius={16}>
        <Text x={strip.x + 18} y={strip.y + 22} size={11} font="mono" weight={600} tone="danger" caps>{c.tomorrow}</Text>
      </Box>
      <line x1={railFrom[0]} y1={railFrom[1]} x2={railTo[0]} y2={railTo[1]} stroke="var(--scene-hairline)" strokeWidth={1} />
      <line x1={railFrom[0]} y1={railFrom[1]} x2={lerp(railFrom[0], stepPos(1)[0], hop1)} y2={lerp(railFrom[1], stepPos(1)[1], hop1)} stroke={TONE.danger} strokeWidth={1.5} strokeOpacity={.6} />
      <line x1={stepPos(1)[0]} y1={stepPos(1)[1]} x2={lerp(stepPos(1)[0], railTo[0], hop2)} y2={lerp(stepPos(1)[1], railTo[1], hop2)} stroke={TONE.ok} strokeWidth={1.5} strokeOpacity={.6} />
      <Comet points={[stepPos(0), stepPos(1)]} t={hop1} tone="danger" r={5} tail={.3} />
      <Comet points={[stepPos(1), stepPos(2)]} t={hop2} tone="ok" r={5} tail={.3} />
      {c.steps.map(([main, sub], index) => {
        const [x, y] = stepPos(index);
        const at = stepAt[index]!;
        const settled = frame >= at;
        const state = index === 0 ? (settled ? "fail" as const : "pending" as const) : settled ? "pass" as const : "pending" as const;
        const tone: Tone = state === "fail" ? "danger" : state === "pass" ? "ok" : "muted";
        const mark = pop(frame, at, 170);
        return <g key={main} {...enter(frame, stagger(index, T.tomorrow + 8, 6), { distance: 8 })}>
          <g transform={`translate(${x} ${y}) scale(${settled ? .7 + .3 * mark : 1}) translate(${-x} ${-y})`}>
            <Checkpoint x={x} y={y} r={11} state={state} />
          </g>
          {settled && frame < at + 40 ? <Pulse x={x} y={y} frame={frame} at={at} period={40} r={12} tone={tone === "muted" ? "hot" : tone} /> : null}
          {compact
            ? <>
              <Text x={x + 24} y={y - 9} size={15} weight={600} tone={settled ? tone : "muted"}>{main}</Text>
              <Text x={x + 24} y={y + 11} size={13} font="mono" weight={500} tone="muted">{sub}</Text>
            </>
            : <>
              <Text x={x - 11} y={y + 26} size={15} weight={600} tone={settled ? tone : "muted"}>{main}</Text>
              <Text x={x - 11} y={y + 44} size={13} font="mono" weight={500} tone="muted">{sub}</Text>
            </>}
        </g>;
      })}
    </g> : null}
  </g>;
}

/** 1 while t is inside [a, b] (with soft edges), for "the packet is inside the station". */
function during01(t: number, a: number, b: number) {
  if (t <= 0 || t >= 1) return 0;
  const edge = .08;
  return Math.max(0, Math.min(1, (t - a + edge) / edge, (b + edge - t) / edge));
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 30,
  title: { en: "From assumption to evidence", fr: "De l’hypothèse à la preuve" },
  caption: {
    en: "A useful review turns an assumption into evidence, a signal, or an explicitly accepted risk.",
    fr: "Une revue utile transforme une hypothèse en preuve, en signal ou en risque explicitement accepté.",
  },
  beats: [
    { at: 0, text: { en: "Three assumptions enter the review. None is proven yet.", fr: "Trois hypothèses entrent en revue. Aucune n’est encore prouvée." } },
    { at: LANE_START[0] + TRAVEL - 6, text: { en: "Gates cover known invariants: the financial invariant becomes an executable one.", fr: "Les gates couvrent les invariants connus : l’invariant financier devient exécutable." } },
    { at: LANE_START[1] + TRAVEL - 6, text: { en: "Find blind spots: nothing proves operators stay on the nominal path, so it gets a signal.", fr: "Find blind spots : rien ne prouve que les opérateurs suivent le chemin nominal. On y lie un signal." } },
    { at: LANE_START[2] + TRAVEL - 6, text: { en: "An adversarial review questions cardinality. A human reviewer accepts that known risk explicitly.", fr: "Une adversarial review interroge la cardinalité. Un humain accepte ce risque connu, explicitement." } },
    { at: T.broken, text: { en: "Tomorrow the operator assumption is false: a call is replayed by hand.", fr: "Demain, l’hypothèse sur les opérateurs est fausse : un appel est rejoué à la main." } },
    { at: T.alert, text: { en: "We notice: the reconciliation alert fires before a customer does. We respond: a controlled replay.", fr: "On le voit : l’alerte de rapprochement sonne avant qu’un client le voie. On réagit : un replay contrôlé." } },
  ],
  Stage,
});
