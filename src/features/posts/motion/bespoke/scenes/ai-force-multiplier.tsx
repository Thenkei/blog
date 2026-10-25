import { Box, Comet, ease, easeOut, enter, hash, lerp, pop, Pulse, Tag, Text, tint, TONE, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Compare illustrative architecture drafts against the system's constraints.
// The animation shows a review sequence, without implying measured time savings.
const T = {
  intent: 0,
  ai: 28,
  drafts: [60, 70, 80] as const,
  question: 116,
  checks: [136, 148, 160] as const,
  fly: 192,
  land: 220,
  end: 318,
} as const;

type Pt = readonly [number, number];

const KEEP = 1;
const DRAFT_LINES = [[.78, .52, .66], [.6, .84, .44], [.7, .4, .74]] as const;

const quad = (a: Pt, c: Pt, b: Pt, t: number): [number, number] => [
  (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
  (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
];
const curve = (a: Pt, c: Pt, b: Pt, steps = 14): Pt[] => Array.from({ length: steps + 1 }, (_, i) => quad(a, c, b, i / steps));

function Stage({ frame, compact, locale }: SceneStageProps) {
  const fr = locale === "fr";
  const G = compact
    ? {
      intent: { x: 20, y: 112, w: 240, h: 84 },
      ai: { x: 280, y: 112, w: 240, h: 84 },
      draft: (i: number) => ({ x: 20 + i * 176, y: 244, w: 148, h: 72 }),
      question: [270, 346] as Pt,
      decision: { x: 130, y: 386, w: 280, h: 96 },
    }
    : {
      intent: { x: 40, y: 206, w: 196, h: 92 },
      ai: { x: 280, y: 206, w: 212, h: 92 },
      draft: (i: number) => ({ x: 548, y: 146 + i * 86, w: 150, h: 70 }),
      question: [623, 118] as Pt,
      decision: { x: 740, y: 202, w: 180, h: 100 },
    };
  const intentOut: Pt = compact ? [G.intent.x + G.intent.w, G.intent.y + G.intent.h / 2] : [G.intent.x + G.intent.w, G.intent.y + G.intent.h / 2];
  const aiIn: Pt = [G.ai.x, G.ai.y + G.ai.h / 2];
  const aiOut: Pt = compact ? [G.ai.x + G.ai.w / 2, G.ai.y + G.ai.h] : [G.ai.x + G.ai.w, G.ai.y + G.ai.h / 2];
  const draftIn = (i: number): Pt => {
    const d = G.draft(i);
    return compact ? [d.x + d.w / 2, d.y] : [d.x, d.y + d.h / 2];
  };
  const fanPath = (i: number) => {
    const to = draftIn(i);
    const c: Pt = compact ? [lerp(aiOut[0], to[0], .5), aiOut[1] + 26] : [aiOut[0] + 30, lerp(aiOut[1], to[1], .9)];
    return curve(aiOut, c, to);
  };
  const judged = (i: number) => frame >= T.checks[i]!;
  const rejected = (i: number) => judged(i) && i !== KEEP;
  const flight = easeOut(frame, T.fly, T.land);
  const flying = frame >= T.fly && frame < T.land;
  const landed = frame >= T.land;

  const draftCard = (i: number) => {
    const d = G.draft(i);
    const at = T.drafts[i]! + 12;
    const appear = pop(frame, at);
    if (frame < at) return null;
    const tone: Tone = !judged(i) ? "line" : i === KEEP ? "ok" : "danger";
    const recede = rejected(i) ? ease(frame, T.checks[i]! + 8, T.checks[i]! + 26) : 0;
    const shift = recede * (compact ? 0 : -10);
    const ghost = i === KEEP && frame >= T.fly;
    const letter = "ABC"[i]!;
    return <g key={i} opacity={lerp(1, .28, recede) * (rejected(i) ? 1 - .4 * ease(frame, T.land, T.land + 20) : 1)} transform={`translate(${shift} ${recede * (compact ? 6 : 0)})`}>
      {ghost
        ? <rect x={d.x + .5} y={d.y + .5} width={d.w - 1} height={d.h - 1} rx={12} fill="none" stroke={TONE.ok} strokeOpacity={.45} strokeWidth={1} strokeDasharray="4 5" />
        : <Box x={d.x} y={d.y} w={d.w} h={d.h} tone={tone} appear={Math.min(1, appear)} radius={12} focus={i === KEEP && judged(i) ? ease(frame, T.checks[i], T.checks[i] + 10) : 0}>
          <Text x={d.x + 14} y={d.y + 18} size={11} font="mono" weight={600} tone={judged(i) ? tone : "muted"} caps>{`draft ${letter}`}</Text>
          {DRAFT_LINES[i]!.map((len, k) => <rect key={k} x={d.x + 14 + (k === 1 ? 12 : 0)} y={d.y + 34 + k * 10} width={(d.w - 40) * len * Math.min(1, easeOut(frame, at + k * 3, at + 14 + k * 3))} height={3.5} rx={1.75} style={{ fill: tint(k === 0 ? "line" : "ink", k === 0 ? 55 : 22 + 8 * hash(i * 7 + k)) }} />)}
          {judged(i) ? <g transform={`translate(${d.x + d.w - 18} ${d.y + 18}) scale(${pop(frame, T.checks[i]!, 200)})`}>
            <circle r={9} fill={TONE[tone]} className="scene-glow" style={{ color: TONE[tone] }} />
            {i === KEEP
              ? <path d="M-3.6 .2L-1 2.9L3.8 -2.8" fill="none" style={{ stroke: "var(--scene-card)" }} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              : <path d="M-3 -3L3 3M3 -3L-3 3" style={{ stroke: "var(--scene-card)" }} strokeWidth={2} strokeLinecap="round" />}
          </g> : null}
        </Box>}
    </g>;
  };

  // The kept draft flies out of the fan and becomes the decision.
  const src = G.draft(KEEP);
  const dst = G.decision;
  const flyCtrl: Pt = compact ? [src.x + src.w / 2 + 70, lerp(src.y, dst.y, .5) + 10] : [lerp(src.x, dst.x, .5) + 20, src.y - 40];
  const [flyCx, flyCy] = quad([src.x + src.w / 2, src.y + src.h / 2], flyCtrl, [dst.x + dst.w / 2, dst.y + dst.h / 2], flight);
  const flyW = lerp(src.w, dst.w, flight);
  const flyH = lerp(src.h, dst.h, flight);

  const intentIn = enter(frame, T.intent, { from: "left", distance: 18 });
  const aiIn2 = enter(frame, T.ai, { from: "left", distance: 18 });
  const intentComet = ease(frame, T.ai - 12, T.ai + 4);

  return <g>
    <Text x={compact ? 20 : 40} y={56} size={13} font="mono" weight={600} tone="muted" caps>
      {fr ? "Contexte → propositions → vérifications" : "Context → proposals → checks"}
    </Text>

    <g {...intentIn}>
      <Box x={G.intent.x} y={G.intent.y} w={G.intent.w} h={G.intent.h} tone="hot" radius={14} focus={during(frame, T.intent, T.ai + 6) * .6}>
        <Text x={G.intent.x + 16} y={G.intent.y + 22} size={11} font="mono" weight={600} tone="hot" caps>{fr ? "intention" : "intent"}</Text>
        <Text x={G.intent.x + 16} y={G.intent.y + 50} size={17} weight={650}>{fr ? "architecture" : "event-driven"}</Text>
        <Text x={G.intent.x + 16} y={G.intent.y + 72} size={17} weight={650}>{fr ? "événementielle" : "architecture"}</Text>
      </Box>
    </g>
    <Comet points={[intentOut, aiIn]} t={intentComet} tone="hot" r={5} tail={.5} />

    <g {...aiIn2}>
      <Box x={G.ai.x} y={G.ai.y} w={G.ai.w} h={G.ai.h} tone="line" radius={14} focus={during(frame, T.ai + 4, T.drafts[2] + 20) * .7}>
        <Text x={G.ai.x + 16} y={G.ai.y + 22} size={11} font="mono" weight={600} tone="line" caps>{fr ? "IA · propositions" : "AI · proposals"}</Text>
        <Text x={G.ai.x + 16} y={G.ai.y + 50} size={13} font="mono" weight={600}>{fr ? "plusieurs approches" : "several approaches"}</Text>
        <Text x={G.ai.x + 16} y={G.ai.y + 70} size={13} font="mono" weight={600} tone="muted">{fr ? "hypothèses à vérifier" : "assumptions to check"}</Text>
      </Box>
    </g>

    {/* Illustrative alternatives, checked against the same constraints. */}
    {[0, 1, 2].map((i) => <g key={i}>
      <path d={`M${fanPath(i).map(([x, y]) => `${x} ${y}`).join("L")}`} fill="none" style={{ stroke: "var(--scene-hairline)" }} strokeWidth={1} opacity={ease(frame, T.drafts[i]!, T.drafts[i]! + 10) * (rejected(i) ? .35 : 1)} />
      <Comet points={fanPath(i)} t={ease(frame, T.drafts[i]!, T.drafts[i]! + 14)} tone="line" r={4.5} tail={.4} />
    </g>)}
    {[0, 1, 2].map(draftCard)}

    {/* Check transaction boundaries, retries, and consumer lag. */}
    <Tag x={G.question[0]} y={G.question[1]} text={fr ? "transactions · retries · retard" : "transactions · retries · lag"} tone="hot" size={12.5} appear={frame >= T.question ? pop(frame, T.question) : 0} />

    {flying ? <g>
      <rect className="scene-card" x={flyCx - flyW / 2} y={flyCy - flyH / 2} width={flyW} height={flyH} rx={13} style={{ fill: "var(--scene-card)" }} />
      <rect className="scene-glow" x={flyCx - flyW / 2} y={flyCy - flyH / 2} width={flyW} height={flyH} rx={13} style={{ fill: tint("ok", 16), color: TONE.ok }} stroke={TONE.ok} strokeOpacity={.7} />
      <Text x={flyCx} y={flyCy} size={13} font="mono" weight={600} tone="ok" anchor="middle">draft B</Text>
    </g> : null}
    {landed ? <g>
      <Box x={dst.x} y={dst.y} w={dst.w} h={dst.h} tone="ok" radius={14} fill={.55} focus={1 - ease(frame, T.land + 20, T.land + 50) * .6}>
        <Text x={dst.x + 16} y={dst.y + 22} size={11} font="mono" weight={600} tone="ok" caps>{fr ? "un choix" : "one choice"}</Text>
        <Text x={dst.x + 16} y={dst.y + 50} size={17} weight={650}>architecture</Text>
        <Text x={dst.x + 16} y={dst.y + 72} size={compact ? 13 : 11} font="mono" weight={600} tone="muted">{fr ? "à valider dans le repo" : "validate in the repo"}</Text>
      </Box>
      {frame < T.land + 40 ? <Pulse x={dst.x + dst.w / 2} y={dst.y + dst.h / 2} frame={frame} at={T.land} period={40} r={dst.h / 2} tone="ok" /> : null}
    </g> : null}

    {/* Theme flourish: a trail marker beside the kept path (mountain), a spark (rocket). */}
    <g className="scene-only-mountain" opacity={landed ? ease(frame, T.land + 10, T.land + 26) : 0}>
      <path d={`M${dst.x + dst.w - 30} ${dst.y - 6}l7 -13l7 13z`} style={{ fill: tint("ok", 70) }} />
    </g>
    <g className="scene-only-rocket" opacity={landed ? ease(frame, T.land + 10, T.land + 26) : 0}>
      <path d={`M${dst.x + dst.w + 2} ${dst.y - 10}l2 -6l2 6l6 2l-6 2l-2 6l-2 -6l-6 -2z`} style={{ fill: tint("ok", 80) }} />
    </g>
  </g>;
}

function during(frame: number, start: number, end: number) {
  return Math.min(ease(frame, start, start + 10), 1 - ease(frame, end - 10, end));
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: 278,
  title: { en: "Comparing architecture proposals", fr: "Comparer des propositions d'architecture" },
  caption: {
    en: "AI drafts several approaches. The engineer checks their assumptions against transaction boundaries, retries, and consumer lag before choosing what to validate in the repository.",
    fr: "L'IA prépare plusieurs approches. L'ingénieur vérifie leurs hypothèses : transactions, retries et retard des consommateurs, avant de choisir ce qu'il faut valider dans le repo.",
  },
  beats: [
    { at: 0, text: { en: "Start with the system's constraints and the architecture question.", fr: "Partir des contraintes du système et de la question d'architecture." } },
    { at: T.ai, text: { en: "Ask for several approaches, with their assumptions.", fr: "Demander plusieurs approches, avec leurs hypothèses." } },
    { at: T.drafts[0], text: { en: "These drafts are alternatives to examine, not validated implementations.", fr: "Ces drafts sont des propositions à examiner, pas des implémentations validées." } },
    { at: T.question, text: { en: "Check transactions, retries, and what happens when a consumer falls behind.", fr: "Vérifier les transactions, les retries et le comportement quand un consommateur prend du retard." } },
    { at: T.fly, text: { en: "Choose an approach, then validate it against the repository's code, contracts, and tests.", fr: "Choisir une approche, puis la valider avec le code, les contrats et les tests du repo." } },
  ],
  Stage,
});
