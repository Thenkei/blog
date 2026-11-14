import type { ReactNode } from "react";
import { Boundary, Checkpoint, dim, during, ease, easeOut, enter, lerp, Meter, NBSP, pop, Pulse, Tag, Text, TONE, tint, type Tone } from "../primitives";
import { defineScene, type Localized, type SceneStageProps } from "../types";

// The article's text diagram, animated: the stored transcript on the left never
// changes; the copy sent to the model on the right is the only thing that is cut.
// The meter carries no value, only its position against the 120,000 trigger:
// the proportions are illustrative, nothing here is a measurement.
const T = {
  grow: 10,
  over: 98,
  tryCut: 110,
  refuse: 134,
  move: 196,
  allow: 218,
  collapse: 228,
  step: 300,
  stepCut: 308,
  allowStep: 324,
  collapseStep: 332,
  verbatim: 404,
  stored: 476,
  end: 574,
} as const;

const ROW_STEP = 8;

type Card = { turn: number; row: number; lines: readonly Localized[] };

const QUESTION: Localized = { en: "question", fr: "question" };
const ANSWER: Localized = { en: "answer", fr: "réponse" };

// One card per message; a tool call and its result share a card, two lines tall.
const CARDS: readonly Card[] = [
  { turn: 0, row: 0, lines: [QUESTION] },
  { turn: 0, row: 1, lines: [{ en: "call", fr: "appel" }, { en: "result", fr: "résultat" }] },
  { turn: 0, row: 3, lines: [ANSWER] },
  { turn: 1, row: 4, lines: [QUESTION] },
  { turn: 1, row: 5, lines: [ANSWER] },
  { turn: 2, row: 6, lines: [{ en: "current question", fr: "question en cours" }] },
  { turn: 2, row: 7, lines: [{ en: "call A", fr: "appel A" }, { en: "result A", fr: "résultat A" }] },
  { turn: 2, row: 9, lines: [{ en: "calls B and C", fr: "appels B et C" }, { en: "results", fr: "résultats" }] },
];
const STEP_A = 6;
const VERBATIM: readonly number[] = [5, 7];
const TURN_OF_ROW = CARDS.flatMap((card) => card.lines.map(() => card.turn));
const ROWS = TURN_OF_ROW.length;
const TURNS = [0, 1, 2].map((turn) => ({ first: TURN_OF_ROW.indexOf(turn), last: TURN_OF_ROW.lastIndexOf(turn) }));

// Share of the meter track each message adds (illustrative). The current turn
// alone stays above the trigger, which is why its step A is summarized too.
const WEIGHT = [.02, .02, .08, .03, .02, .05, .02, .02, .29, .03, .37] as const;
const LIMIT = .66;
const NOTE = .03;
const PAST_TURNS = WEIGHT.slice(0, 6).reduce((sum, weight) => sum + weight, 0);
const STEP_WEIGHT = WEIGHT[7] + WEIGHT[8];

type Layout = {
  stored: { x: number; w: number };
  sent: { x: number; w: number };
  top: number;
  rowsTop: number;
  pitch: number;
  gap: number;
  turnGap: number;
  size: number;
  /** Left gutter for the turn labels; 0 puts them at the end of the question row. */
  labelGutter: number;
  meter: { x: number; y: number; w: number };
  /** Where the cut's checkpoint sits, between the two columns. */
  markX: number;
  /** Fixed verdict line under the columns (compact); wide puts verdicts in the gutter. */
  statusY: number | null;
};

const WIDE: Layout = {
  stored: { x: 40, w: 330 },
  sent: { x: 590, w: 330 },
  top: 84,
  rowsTop: 102,
  pitch: 25,
  gap: 3,
  turnGap: 9,
  size: 14,
  labelGutter: 62,
  meter: { x: 590, y: 45, w: 330 },
  markX: 564,
  statusY: null,
};

const COMPACT: Layout = {
  stored: { x: 20, w: 224 },
  sent: { x: 276, w: 244 },
  top: 126,
  rowsTop: 143,
  pitch: 27,
  gap: 4,
  turnGap: 10,
  size: 13.5,
  labelGutter: 0,
  meter: { x: 20, y: 80, w: 500 },
  markX: 260,
  statusY: 494,
};

/** A message as stored or sent. Two lines stapled together are a call and its result. */
function Message({ x, y, w, h, pitch, gap, size, lines, second = 1, tone = "muted", focus = 0, children }: {
  x: number;
  y: number;
  w: number;
  h: number;
  pitch: number;
  gap: number;
  size: number;
  lines: readonly string[];
  /** 0→1 presence of the second line (the result that joins its call). */
  second?: number | undefined;
  tone?: Tone | undefined;
  focus?: number | undefined;
  children?: ReactNode | undefined;
}) {
  const pair = lines.length > 1;
  const first = y + (pitch - gap) / 2;
  return <g>
    <rect x={x} y={y} width={w} height={h} rx={7} style={{ fill: "var(--scene-card)" }} stroke="var(--scene-hairline)" strokeWidth={1} />
    {focus > 0 ? <rect className="scene-glow" x={x} y={y} width={w} height={h} rx={7} style={{ fill: tint(tone, 14 * focus), color: TONE[tone] }} stroke={TONE[tone]} strokeOpacity={focus} strokeWidth={1.5} /> : null}
    {pair ? <g opacity={second}>
      <line x1={x + 14} x2={x + 14} y1={first} y2={first + pitch} stroke={TONE.muted} strokeWidth={1.25} />
      <circle cx={x + 14} cy={first} r={2.6} fill={TONE.muted} />
      <circle cx={x + 14} cy={first + pitch} r={2.6} fill={TONE.muted} />
    </g> : null}
    {lines.map((line, index) => <Text key={index} x={x + (pair ? 27 : 12)} y={first + index * pitch + .5} size={size} weight={600} opacity={index === 0 ? 1 : second}>{line}</Text>)}
    {children}
  </g>;
}

/** The note that replaces complete exchanges in what is sent. */
function Summary({ x, y, w, h, size, text, appear, opacity, focus }: { x: number; y: number; w: number; h: number; size: number; text: string; appear: number; opacity: number; focus: number }) {
  if (appear <= 0) return null;
  return <g opacity={appear * opacity} transform={`translate(0 ${(1 - appear) * 6})`}>
    <rect x={x} y={y} width={w} height={h} rx={7} style={{ fill: "var(--scene-card)" }} />
    <rect className={focus > .01 ? "scene-glow" : undefined} x={x} y={y} width={w} height={h} rx={7} style={{ fill: tint("line", 9 + 9 * focus), color: TONE.line }} stroke={TONE.line} strokeOpacity={.45 + .55 * focus} strokeWidth={1 + .5 * focus} />
    <rect x={x + 5} y={y + 4.5} width={3} height={h - 9} rx={1.5} fill={TONE.line} />
    <Text x={x + 17} y={y + h / 2 + .5} size={size} weight={650}>{text}</Text>
  </g>;
}

/** A candidate cut: a dashed line across what is sent, with its verdict at the left end. */
function Cut({ y, markX, endX, state, draw, shift = 0, strength = 1 }: {
  y: number;
  markX: number;
  endX: number;
  state: "pending" | "pass" | "fail";
  draw: number;
  shift?: number | undefined;
  strength?: number | undefined;
}) {
  if (draw <= 0) return null;
  const tone: Tone = state === "pass" ? "ok" : state === "fail" ? "danger" : "hot";
  const startX = markX + 13;
  return <g transform={`translate(${shift} 0)`} opacity={strength}>
    <line x1={startX} x2={lerp(startX, endX, draw)} y1={y} y2={y} stroke={TONE[tone]} strokeWidth={1.75} strokeDasharray="6 4" strokeLinecap="round" />
    <Checkpoint x={markX} y={y} state={state} r={9} appear={Math.min(1, draw * 2)} />
  </g>;
}

function Stage({ frame, compact, locale }: SceneStageProps) {
  const fr = locale === "fr";
  const L = compact ? COMPACT : WIDE;
  const single = L.pitch - L.gap;
  const rowY = (row: number) => L.rowsTop + row * L.pitch + TURN_OF_ROW[row]! * L.turnGap;
  const cardH = (card: Card) => card.lines.length * L.pitch - L.gap;
  const boundaryH = L.rowsTop - L.top + ROWS * L.pitch + 2 * L.turnGap - L.gap + 10;

  const storedX = L.stored.x + 10 + L.labelGutter;
  const storedW = L.stored.w - 20 - L.labelGutter;
  const sentX = L.sent.x + 10;
  const sentW = L.sent.w - 20;

  const storedAt = (row: number) => T.grow + row * ROW_STEP;
  const sentAt = (row: number) => storedAt(row) + 5;

  const t = {
    stored: fr ? "Dans la base" : "In the database",
    sent: fr ? "Envoyé au modèle" : "Sent to the model",
    turn: (index: number) => (fr ? `tour ${index + 1}` : `turn ${index + 1}`),
    meter: fr ? "tokens estimés" : "estimated tokens",
    limit: fr ? `seuil${NBSP}: 120${NBSP}000` : "trigger: 120,000",
    over: fr ? "au-dessus du seuil" : "over the trigger",
    under: fr ? "sous le seuil" : "under the trigger",
    refused: fr ? "coupe refusée" : "cut refused",
    turnStart: fr ? "début d’un tour" : "start of a turn",
    stepDone: fr ? "étape A terminée" : "step A completed",
    verbatim: fr ? "mot pour mot" : "verbatim",
    originals: fr ? "messages d’origine" : "original messages",
    pastTurns: fr ? "résumé des tours 1 et 2" : "summary of turns 1 and 2",
    stepA: fr ? "résumé de l’étape A" : "summary of step A",
  };

  // What is sent shrinks twice: the complete past turns, then the completed step A.
  const turnsOut = ease(frame, T.collapse, T.collapse + 30);
  const stepOut = ease(frame, T.collapseStep, T.collapseStep + 26);
  const grown = WEIGHT.reduce((sum, weight, row) => sum + weight * easeOut(frame, sentAt(row), sentAt(row) + 14), 0);
  const budget = grown - (PAST_TURNS - NOTE) * turnsOut - (STEP_WEIGHT - NOTE) * stepOut;
  const over = budget > LIMIT;
  const planning = Math.max(during(frame, T.tryCut, T.collapse - 2, 10), during(frame, T.stepCut, T.collapseStep - 2, 10));

  // The cut first lands between a call and its result, then moves to the start of turn 3.
  const refusedY = rowY(2) - L.gap / 2;
  const turnY = rowY(6) - (L.gap + L.turnGap) / 2;
  const stepY = rowY(9) - L.gap / 2;
  const cutY = lerp(refusedY, turnY, ease(frame, T.move, T.move + 20));
  const cutState = frame < T.refuse ? "pending" : frame < T.move ? "fail" : frame < T.allow ? "pending" : "pass";
  const sinceRefusal = frame - T.refuse;
  const shake = sinceRefusal >= 0 && sinceRefusal < 18 ? Math.sin(sinceRefusal * 1.9) * 4 * (1 - sinceRefusal / 18) : 0;
  const refusal = during(frame, T.refuse, T.move + 4, 8);

  const verbatim = ease(frame, T.verbatim, T.verbatim + 16);
  const verbatimFocus = during(frame, T.verbatim, T.stored + 4, 12);
  const kept = ease(frame, T.stored, T.stored + 18);
  const storedOpacity = dim(during(frame, T.tryCut, T.stored - 2, 14), .66);
  const cutEndX = sentX + sentW;

  const storedCentre = L.stored.x + L.stored.w / 2;
  const sentCentre = L.sent.x + L.sent.w / 2;

  return <>
    {/* The estimated budget of what is sent, against the trigger. */}
    <g {...enter(frame, 2, { opacity: dim(planning, .7) })}>
      <Meter
        x={L.meter.x} y={L.meter.y} w={L.meter.w} h={8} value={budget} limit={LIMIT}
        tone={stepOut >= 1 ? "ok" : "line"} label={t.meter} valueLabel={over ? t.over : t.under} limitLabel={t.limit}
      />
      <Pulse x={L.meter.x + L.meter.w * LIMIT} y={L.meter.y + 4} frame={frame} at={T.over - 2} period={34} r={7} tone="danger" once />
    </g>

    {/* Stored transcript: every original message, untouched from start to end. */}
    <g {...enter(frame, 0, { from: "none" })}>
      <Boundary x={L.stored.x} y={L.top} w={L.stored.w} h={boundaryH} label={t.stored} appear={1 - kept} />
      <Boundary x={L.stored.x} y={L.top} w={L.stored.w} h={boundaryH} label={t.stored} tone="ok" appear={kept} />
    </g>
    <g opacity={storedOpacity}>
      {TURNS.map((turn, index) => {
        const y = rowY(turn.first) + single / 2 + .5;
        return <g key={index} {...enter(frame, storedAt(turn.first), { dur: 14, distance: 8 })}>
          {L.labelGutter > 0 ? <>
            <Text x={L.stored.x + 14} y={y} size={11} weight={600} font="mono" tone="muted" caps>{t.turn(index)}</Text>
            <line x1={storedX - 8} x2={storedX - 8} y1={rowY(turn.first) + 3} y2={lerp(rowY(turn.first) + single - 3, rowY(turn.last) + single - 3, easeOut(frame, storedAt(turn.first), storedAt(turn.last) + 12))} stroke="var(--scene-hairline)" strokeWidth={1.25} strokeLinecap="round" />
          </> : null}
        </g>;
      })}
      {CARDS.map((card, index) => {
        const second = card.lines.length > 1 ? easeOut(frame, storedAt(card.row + 1), storedAt(card.row + 1) + 12) : 1;
        return <g key={index} {...enter(frame, storedAt(card.row), { dur: 14, distance: 8 })}>
          <Message
            x={storedX} y={rowY(card.row)} w={storedW} h={lerp(single, cardH(card), second)} pitch={L.pitch} gap={L.gap} size={L.size}
            lines={card.lines.map((line) => line[locale])} second={second}
          >
            {L.labelGutter === 0 && card.row === TURNS[card.turn]!.first
              ? <Text x={storedX + storedW - 10} y={rowY(card.row) + single / 2 + .5} size={11} weight={600} font="mono" tone="muted" anchor="end" caps>{t.turn(card.turn)}</Text>
              : null}
          </Message>
        </g>;
      })}
    </g>

    {/* What is sent to the model: the same messages, until the plan cuts. */}
    <g {...enter(frame, 4, { from: "none" })}>
      <Boundary x={L.sent.x} y={L.top} w={L.sent.w} h={boundaryH} label={t.sent} />
    </g>
    {CARDS.map((card, index) => {
      const out = card.turn < 2 ? turnsOut : index === STEP_A ? stepOut : 0;
      if (out >= 1) return null;
      const second = card.lines.length > 1 ? easeOut(frame, sentAt(card.row + 1), sentAt(card.row + 1) + 12) * (1 - ease(out, 0, .3)) : 1;
      const y = lerp(rowY(card.row), rowY(card.turn < 2 ? 0 : card.row), out);
      const h = lerp(lerp(single, cardH(card), card.lines.length > 1 ? easeOut(frame, sentAt(card.row + 1), sentAt(card.row + 1) + 12) : 1), single, out);
      const refused = index === 1 ? refusal : 0;
      const keptVerbatim = VERBATIM.includes(index);
      const focus = refused > 0 ? refused : keptVerbatim ? verbatimFocus * .85 : 0;
      const opacity = (1 - ease(out, .05, .5)) * (index === 1 ? 1 : dim(refusal, .5));
      return <g key={index} {...enter(frame, sentAt(card.row), { dur: 14, from: "right", distance: 18, opacity })}>
        <Message
          x={sentX} y={y} w={sentW} h={h} pitch={L.pitch} gap={L.gap} size={L.size}
          lines={card.lines.map((line) => line[locale])} second={second} tone={refused > 0 ? "danger" : "ok"} focus={focus}
        >
          {keptVerbatim && verbatim > 0 ? <Text
            x={sentX + sentW - 12} y={y + h / 2 + .5} size={compact ? 15 : 13} weight={compact ? 700 : 600} font="mono" tone="ok" anchor="end"
            opacity={verbatim * dim(kept, .7)}
          >{compact ? "=" : `= ${t.verbatim}`}</Text> : null}
        </Message>
      </g>;
    })}
    <Summary x={sentX} y={rowY(0)} w={sentW} h={single} size={L.size} text={t.pastTurns} appear={ease(turnsOut, .4, 1)} opacity={dim(verbatimFocus, .6)} focus={during(frame, T.collapse + 14, T.step, 10)} />
    <Summary x={sentX} y={rowY(7)} w={sentW} h={single} size={L.size} text={t.stepA} appear={ease(stepOut, .4, 1)} opacity={dim(verbatimFocus, .6)} focus={during(frame, T.collapseStep + 12, T.verbatim, 10)} />

    {/* Candidate cuts, drawn over what is sent. */}
    <Cut y={cutY} markX={L.markX} endX={cutEndX} state={cutState} draw={easeOut(frame, T.tryCut, T.tryCut + 18)} shift={shake} strength={lerp(1, .5, ease(frame, T.step - 8, T.step + 8))} />
    <Cut y={stepY} markX={L.markX} endX={cutEndX} state={frame < T.allowStep ? "pending" : "pass"} draw={easeOut(frame, T.stepCut, T.stepCut + 18)} strength={lerp(1, .5, ease(frame, T.verbatim - 8, T.verbatim + 8))} />

    {L.statusY === null ? <>
      <Tag x={L.markX - 18} y={refusedY} anchor="end" text={t.refused} tone="danger" appear={pop(frame, T.refuse) * (1 - ease(frame, T.move - 4, T.move + 6))} />
      <g opacity={lerp(1, .5, ease(frame, T.step - 8, T.step + 8))}>
        <Tag x={L.markX - 18} y={turnY} anchor="end" text={t.turnStart} tone="ok" appear={pop(frame, T.allow)} />
      </g>
      <g opacity={lerp(1, .5, ease(frame, T.verbatim - 8, T.verbatim + 8))}>
        <Tag x={L.markX - 18} y={stepY} anchor="end" text={t.stepDone} tone="ok" appear={pop(frame, T.allowStep)} />
      </g>
      <Tag x={L.stored.x + L.stored.w - 16} y={L.top} anchor="end" text={`✓ ${t.originals}`} tone="ok" size={12} appear={pop(frame, T.stored + 6)} />
    </> : <>
      <Tag x={sentCentre} y={L.statusY} text={`✗ ${t.refused}`} tone="danger" appear={pop(frame, T.refuse) * (1 - ease(frame, T.move - 4, T.move + 6))} />
      <Tag x={sentCentre} y={L.statusY} text={`✓ ${t.turnStart}`} tone="ok" appear={pop(frame, T.allow) * (1 - ease(frame, T.allowStep - 8, T.allowStep))} />
      <Tag x={sentCentre} y={L.statusY} text={`✓ ${t.stepDone}`} tone="ok" appear={pop(frame, T.allowStep) * (1 - ease(frame, T.verbatim - 8, T.verbatim))} />
      <g opacity={dim(kept, .6)}>
        <Tag x={sentCentre} y={L.statusY} text={`= ${t.verbatim}`} tone="ok" appear={pop(frame, T.verbatim)} />
      </g>
      <Tag x={storedCentre} y={L.statusY} text={`✓ ${t.originals}`} tone="ok" appear={pop(frame, T.stored + 6)} />
    </>}
  </>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 30,
  title: { fr: "Où l’historique peut être coupé", en: "Where the history can be cut" },
  caption: {
    fr: `Une coupe ne tombe qu’au début d’un tour ou après une étape d’outil terminée${NBSP}: un appel n’est jamais séparé de ses résultats. Le résumé ne remplace que ce qui est envoyé au modèle${NBSP}; la base garde les messages d’origine. Schéma illustratif${NBSP}: rien n’a été mesuré en staging.`,
    en: "A cut only falls at the start of a turn or after a completed tool step: a call is never separated from its results. The summary only replaces what is sent to the model; the database keeps the original messages. Illustrative diagram: nothing has been measured in staging.",
  },
  beats: [
    { at: 0, text: { fr: "À chaque étape, l’historique complet repart au modèle. Le budget estimé augmente avec lui.", en: "At every step, the whole history is sent to the model again. The estimated budget grows with it." } },
    { at: T.over, text: { fr: `Le seuil de 120${NBSP}000 tokens estimés est dépassé. Couper ici séparerait un appel d’outil de son résultat.`, en: "The history passes the trigger of 120,000 estimated tokens. A cut here would separate a call from its result." } },
    { at: T.move, text: { fr: "Une coupe ne tombe qu’au début d’un tour. Les tours 1 et 2, complets, sont remplacés par un résumé.", en: "A cut only falls at the start of a turn. Turns 1 and 2, complete, are replaced with one summary." } },
    { at: T.step, text: { fr: "Le tour en cours dépasse le budget à lui seul. Son ancienne étape d’outil A, terminée, est résumée aussi.", en: "The current turn alone exceeds the budget. Its older tool step A, completed, is summarized too." } },
    { at: T.verbatim, text: { fr: "La question en cours et le dernier échange d’outil restent mot pour mot.", en: "The current question and the latest tool exchange stay verbatim." } },
    { at: T.stored, text: { fr: "La base garde les messages d’origine. Seul ce qui est envoyé au modèle a changé.", en: "The database keeps the original messages. Only what is sent to the model has changed." } },
  ],
  Stage,
});
