import { Boundary, Checkpoint, Dot, ease, easeOut, enter, lerp, pop, Pulse, stagger, Tag, Text, tint, TONE, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// The same four next actions, on the same clock, under the article's three
// policies: approve every step, no checkpoints, bounded. The cost of being wrong
// is a region of the stage (only the production change sits in it); the bounded
// lane places its single human gate exactly where that region begins.
const START = 30;
const APPROACH = 10;
const WAIT = 44;
const RUN = 20;
const END = 420;

const ACTIONS = {
  en: ["recent changes", "known diagnostics", "compare regions", "change prod config"],
  fr: ["changements récents", "diagnostics connus", "comparer les régions", "modifier la config prod"],
} as const;
const HEADERS = {
  en: [["recent", "changes"], ["known", "diagnostics"], ["compare", "regions"], ["change", "prod config"]],
  fr: [["changements", "récents"], ["diagnostics", "connus"], ["comparer", "les régions"], ["modifier la", "config prod"]],
} as const;
const HIGH_COST = [false, false, false, true] as const;

type Lane = { key: "all" | "none" | "bounded"; gates: readonly boolean[]; label: { en: string; fr: string }; verdict: { en: string; fr: string }; tone: Tone };
const LANES: readonly Lane[] = [
  { key: "all", gates: [true, true, true, true], label: { en: "Approve every step", fr: "Tout approuver" }, verdict: { en: "bottleneck", fr: "goulot" }, tone: "hot" },
  { key: "none", gates: [false, false, false, false], label: { en: "No checkpoints", fr: "Aucun contrôle" }, verdict: { en: "unreviewed", fr: "sans revue" }, tone: "danger" },
  { key: "bounded", gates: [false, false, false, true], label: { en: "Bounded", fr: "Borné" }, verdict: { en: "one pause", fr: "une pause" }, tone: "ok" },
];

// Per step: [approach start, gate pass] when gated, then the run to the station.
type Step = { gate?: { at: number; pass: number } | undefined; runStart: number; runEnd: number };
function schedule(gates: readonly boolean[]): Step[] {
  return gates.reduce<{ t: number; steps: Step[] }>(({ t, steps }, gated) => {
    if (!gated) return { t: t + RUN, steps: [...steps, { runStart: t, runEnd: t + RUN }] };
    const pass = t + APPROACH + WAIT;
    return { t: pass + RUN, steps: [...steps, { gate: { at: t, pass }, runStart: pass, runEnd: pass + RUN }] };
  }, { t: START, steps: [] }).steps;
}
const PLANS = LANES.map((lane) => schedule(lane.gates));
const finish = (plan: readonly Step[]) => plan.at(-1)!.runEnd;

const B = { all: 28, none: 96, bounded: 140, bottleneck: 240, close: 330 } as const;
function focusLane(frame: number) {
  if (frame >= B.close) return -1;
  if (frame >= B.bottleneck) return 0;
  if (frame >= B.bounded) return 2;
  if (frame >= B.none) return 1;
  if (frame >= B.all) return 0;
  return -1;
}

/** A human approval: pending ring, then a filled checkpoint in the decision tone. */
function HumanGate({ x, y, passed }: { x: number; y: number; passed: boolean }) {
  if (!passed) return <Checkpoint x={x} y={y} r={9} state="pending" />;
  return <g>
    <circle className="scene-glow" cx={x} cy={y} r={8} fill={TONE.hot} style={{ color: TONE.hot }} />
    <path d={`M${x - 3.4} ${y + .2}L${x - .9} ${y + 2.8}L${x + 3.6} ${y - 2.6}`} fill="none" style={{ stroke: "var(--scene-card)" }} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </g>;
}

function Stage({ frame, compact, locale }: SceneStageProps) {
  const fr = locale === "fr";
  const actions = ACTIONS[locale];

  // ── Geometry ──────────────────────────────────────────────────────────────
  const G = compact
    ? { station: [88, 192, 296, 440], track: [30, 508] as const, lane: [206, 316, 426], zone: { x: 376, y: 150, w: 128, h: 348 }, r: 12 }
    : { station: [300, 430, 560, 720], track: [226, 792] as const, lane: [188, 268, 348], zone: { x: 640, y: 56, w: 160, h: 338 }, r: 12 };
  const stationX = (j: number) => G.station[j]!;
  const gateX = (j: number) => HIGH_COST[j] ? G.zone.x + 14 : stationX(j) - (compact ? 36 : 42);

  const laneViews = LANES.map((lane, i) => {
    const plan = PLANS[i]!;
    const y = G.lane[i]!;
    // Focus follows the narration; averaging the last 12 frames turns each switch into a ramp.
    const on = Array.from({ length: 12 }, (_, k) => {
      const lane = focusLane(frame - k);
      return lane === -1 || lane === i ? 1 : .36;
    }).reduce((sum, value) => sum + value, 0) / 12;
    const laneOpacity = on * enter(frame, stagger(i, 14, 6)).opacity;
    const approvals = plan.filter((step) => step.gate && frame >= step.gate.pass).length;
    const done = frame >= finish(plan) + 4;

    // Token: rides to each station, stopping in front of a gate until it passes.
    const tokenX = plan.reduce<number>((x, step, j) => {
      const from = j === 0 ? G.track[0] : stationX(j - 1);
      if (step.gate && frame >= step.gate.at && frame < step.runStart) return lerp(from, gateX(j) - (compact ? 15 : 18), easeOut(frame, step.gate.at, step.gate.at + APPROACH));
      if (frame >= step.runStart) return lerp(step.gate ? gateX(j) : from, stationX(j), ease(frame, step.runStart, step.runEnd));
      return x;
    }, G.track[0]);
    const waiting = plan.findIndex((step) => step.gate && frame >= step.gate.at + APPROACH && frame < step.gate.pass);
    const progress = done ? G.track[1] : tokenX;
    const laneTone: Tone = lane.key === "none" && frame >= plan[3]!.runEnd ? "danger" : lane.key === "bounded" ? "ok" : "line";

    return <g key={lane.key} opacity={laneOpacity}>
      {/* Lane title and its approval count. */}
      <Text x={compact ? 20 : 40} y={compact ? y - 36 : y - 9} size={compact ? 16 : 17} weight={650}>{lane.label[locale]}</Text>
      <Text x={compact ? 20 + lane.label[locale].length * 8.4 + 12 : 40} y={compact ? y - 36 : y + 14} size={12.5} font="mono" weight={600} tone={approvals > 0 && lane.key === "all" ? "hot" : "muted"}>
        {`${approvals} ${fr ? (approvals > 1 ? "validations" : "validation") : approvals === 1 ? "approval" : "approvals"}`}
      </Text>

      {/* Track: hairline, toned up to the token. */}
      <line x1={G.track[0]} x2={G.track[1]} y1={y} y2={y} style={{ stroke: "var(--scene-hairline)" }} strokeWidth={1.25} />
      {progress > G.track[0] ? <line x1={G.track[0]} x2={progress} y1={y} y2={y} stroke={TONE[laneTone]} strokeWidth={2} strokeLinecap="round" opacity={.85} /> : null}

      {plan.map((step, j) => {
        const ran = frame >= step.runEnd;
        const unreviewed = HIGH_COST[j] && !lane.gates[j];
        const x = stationX(j);
        const tick = pop(frame, step.runEnd, 190);
        const stationTone: Tone = unreviewed ? "danger" : "ok";
        return <g key={j}>
          {step.gate ? <g transform={`translate(${gateX(j)} ${y}) scale(${frame >= step.gate.pass ? .75 + .25 * pop(frame, step.gate.pass, 220) : 1}) translate(${-gateX(j)} ${-y})`}>
            <HumanGate x={gateX(j)} y={y} passed={frame >= step.gate.pass} />
          </g> : null}
          {ran
            ? <g transform={`translate(${x} ${y}) scale(${.6 + .4 * tick}) translate(${-x} ${-y})`}>
              <Checkpoint x={x} y={y} r={G.r} state={unreviewed ? "fail" : "pass"} />
            </g>
            : <>
              <circle className="scene-card" cx={x} cy={y} r={G.r} style={{ fill: "var(--scene-card)" }} />
              <circle cx={x} cy={y} r={G.r - .5} fill="none" stroke={TONE[HIGH_COST[j] ? "danger" : "line"]} strokeOpacity={.45} strokeWidth={1} />
              <Text x={x} y={y + .5} size={12} font="mono" weight={600} tone="muted" anchor="middle">{j + 1}</Text>
            </>}
          {ran && unreviewed && frame < step.runEnd + 60 ? <Pulse x={x} y={y} frame={frame} at={step.runEnd} period={30} r={G.r} tone={stationTone} /> : null}
        </g>;
      })}

      {!done ? <Dot x={tokenX} y={y} r={5.5} tone={waiting >= 0 ? "hot" : "line"} /> : null}
      {waiting >= 0 ? <Tag x={gateX(waiting) - 14} y={compact ? y + 26 : y - 26} anchor={compact && waiting === 3 ? "end" : "start"} text={fr ? "attend l'astreinte" : "waits for on duty"} tone="hot" size={11.5} appear={easeOut(frame, plan[waiting]!.gate!.at + APPROACH, plan[waiting]!.gate!.at + APPROACH + 8)} /> : null}

      <Tag x={compact ? 520 : 920} y={compact ? y - 36 : y} anchor="end" text={lane.verdict[locale]} tone={lane.tone} appear={frame >= finish(plan) + 4 ? pop(frame, finish(plan) + 4) : 0} size={13} />
    </g>;
  });

  // Where each lane stands in time: the approve-everything lane is still queued.
  const zoneIn = easeOut(frame, 10, 30);
  return <g>
    <Boundary x={G.zone.x} y={G.zone.y} w={G.zone.w} h={G.zone.h} label={fr ? "erreur coûteuse" : "costly if wrong"} tone="danger" labelAt="bottom-start" appear={zoneIn} />

    {/* The four next actions and their cost of being wrong. */}
    {compact
      ? actions.map((action, j) => {
        const x = 20 + (j % 2) * 262;
        const y = 70 + Math.floor(j / 2) * 34;
        return <g key={j} {...enter(frame, stagger(j, 2, 4))}>
          <circle cx={x + 9} cy={y} r={9} fill="none" stroke={TONE[HIGH_COST[j] ? "danger" : "line"]} strokeOpacity={.5} strokeWidth={1} />
          <Text x={x + 9} y={y + .5} size={11} font="mono" weight={600} tone={HIGH_COST[j] ? "danger" : "muted"} anchor="middle">{j + 1}</Text>
          <Text x={x + 26} y={y} size={14.5} weight={600} tone={HIGH_COST[j] ? "danger" : "ink"}>{action}</Text>
        </g>;
      })
      : HEADERS[locale].map((lines, j) => <g key={j} {...enter(frame, stagger(j, 2, 4))}>
        {lines.map((line, k) => <Text key={k} x={stationX(j)} y={80 + k * 18} size={14} weight={600} anchor="middle" tone={HIGH_COST[j] ? "danger" : "ink"}>{line}</Text>)}
        <Tag x={stationX(j)} y={124} text={HIGH_COST[j] ? (fr ? "risque élevé" : "high risk") : (fr ? "risque faible" : "low risk")} tone={HIGH_COST[j] ? "danger" : "muted"} size={11} />
      </g>)}

    {laneViews}

    {/* Theme flourishes: purely decorative. */}
    <g className="scene-only-rocket" opacity={.5 * zoneIn}>
      <path d={`M${G.zone.x + G.zone.w / 2 - 30} ${G.zone.y + 14}q30 -10 60 0`} fill="none" style={{ stroke: tint("danger", 60) }} strokeWidth={1} strokeDasharray="2 5" strokeDashoffset={-frame * .4} />
    </g>
  </g>;
}

export default defineScene({
  durationInFrames: END,
  posterFrame: 400,
  title: { en: "Where the chain should pause", fr: "Où la chaîne doit s'arrêter" },
  caption: {
    en: "Approving every tiny step recreates the bottleneck; running without checkpoints lets a costly change through. The cost of being wrong, not confidence alone, decides where a person must decide.",
    fr: "Approuver chaque petite étape recrée le goulot ; avancer sans contrôle laisse passer une modification coûteuse. C'est le coût d'une erreur, pas la seule confiance, qui décide où une personne doit trancher.",
  },
  beats: [
    { at: 0, text: { en: "The same four next actions, three ways to run them. Only the production change is costly if wrong.", fr: "Quatre actions, trois façons de les enchaîner. Seule la modification de production coûte cher." } },
    { at: B.all, text: { en: "Approve every step: each diagnostic waits for the person on duty before it runs.", fr: "Tout approuver : chaque diagnostic attend la personne d'astreinte avant de partir." } },
    { at: B.none, text: { en: "No checkpoints: the chain is fast, and the production change runs unreviewed.", fr: "Aucun contrôle : la chaîne va vite, et la modification de production part sans revue." } },
    { at: B.bounded, text: { en: "Bounded: diagnostics run on their own, then one pause before the high-impact action.", fr: "Borné : les diagnostics avancent seuls, puis une seule pause avant l'action à fort impact." } },
    { at: B.bottleneck, text: { en: "Approving every tiny step keeps the person on duty as the queue: it finishes last.", fr: "Tout approuver fait de la personne d'astreinte la file d'attente : la chaîne finit en dernier." } },
    { at: B.close, text: { en: "Confidence alone is not enough: the cost of being wrong decides where a person must decide.", fr: "La confiance ne suffit pas : le coût d'une erreur détermine où une personne doit trancher." } },
  ],
  Stage,
});
