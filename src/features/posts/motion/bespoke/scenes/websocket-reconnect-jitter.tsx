import { Axis, Box, during, easeOut, hash, lerp, NBSP, pop, Pulse, Tag, Text, TONE, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// The same 24 first attempts replayed under three waiting rules, on the same
// ten-second axis. One square is one client; one column is one second.
// The distribution is illustrative, not a production measurement.
const CLIENTS = 24;
const SECONDS = 10;
const FIXED_DELAY = 5;
const FRAMES_PER_SECOND = 24;

const T = {
  sweep: 60,
  spread: 130,
  fixed: 60 + FIXED_DELAY * FRAMES_PER_SECOND,
  settled: 60 + SECONDS * FRAMES_PER_SECOND,
  end: 400,
} as const;

// Attempts drawn into each one-second column by the randomized rule (sums to 24).
const RANDOM_PER_SECOND = [3, 1, 3, 2, 4, 2, 1, 3, 2, 3] as const;

type Attempt = { second: number; rank: number; land: number };

/** Every client waits `delay` seconds: the attempts land together, bottom row first. */
const together = (delay: number): Attempt[] => Array.from({ length: CLIENTS }, (_, rank) => ({
  second: delay,
  rank,
  land: T.sweep + delay * FRAMES_PER_SECOND + rank * .4,
}));

/** Each client draws its own delay: a fixed seed keeps the poster and the replay identical. */
const RANDOMIZED: Attempt[] = RANDOM_PER_SECOND.flatMap((count, second) => Array.from({ length: count }, (_, rank) => ({
  second,
  rank,
  land: T.sweep + (second + (rank + .2 + .6 * hash(second * 7 + rank)) / count) * FRAMES_PER_SECOND,
})));

const RULES = [
  { id: "immediate", tone: "danger", attempts: together(0), focusAt: T.sweep, peakAt: T.sweep + 12 },
  { id: "fixed", tone: "danger", attempts: together(FIXED_DELAY), focusAt: T.fixed, peakAt: T.fixed + 12 },
  { id: "randomized", tone: "ok", attempts: RANDOMIZED, focusAt: T.settled, peakAt: T.settled + 6 },
] as const satisfies readonly { id: string; tone: Tone; attempts: Attempt[]; focusAt: number; peakAt: number }[];

type Layout = {
  panel: (index: number) => { x: number; y: number; w: number; h: number };
  inset: number;
  titleY: number;
  /** Rule detail: under the title when wide, in a shared column on the title line when compact. */
  detail: { x: number; y: number };
  baseFromBottom: number;
  perRow: number;
  unit: number;
  gap: number;
  tagRise: number;
};

const WIDE_LAYOUT: Layout = {
  panel: (index) => ({ x: 40 + index * 300, y: 64, w: 280, h: 300 }),
  inset: 20, titleY: 28, detail: { x: 20, y: 52 }, baseFromBottom: 40, perRow: 2, unit: 9, gap: 2, tagRise: 66,
};

const COMPACT_LAYOUT: Layout = {
  panel: (index) => ({ x: 20, y: 54 + index * 146, w: 500, h: 138 }),
  inset: 20, titleY: 23, detail: { x: 228, y: 23.5 }, baseFromBottom: 28, perRow: 4, unit: 9, gap: 2, tagRise: 34,
};

function Stage({ frame, compact, locale, width }: SceneStageProps) {
  const fr = locale === "fr";
  const L = compact ? COMPACT_LAYOUT : WIDE_LAYOUT;
  const pitch = L.unit + L.gap;
  const now = (frame - T.sweep) / FRAMES_PER_SECOND;
  const sweeping = during(frame, T.sweep - 8, T.settled + 16, 8);

  const t = {
    immediate: { title: fr ? "Sans attente" : "No delay", detail: fr ? `attente${NBSP}: 0${NBSP}s` : "wait: 0 s" },
    fixed: { title: fr ? "Attente fixe" : "Fixed delay", detail: fr ? `attente${NBSP}: 5${NBSP}s` : "wait: 5 s" },
    randomized: { title: fr ? "Attente aléatoire" : "Randomized delay", detail: fr ? `attente${NBSP}: 0 à 10${NBSP}s` : "wait: 0 to 10 s" },
    peak: (count: number) => (fr ? `pic${NBSP}: ${count}/s` : `peak: ${count}/s`),
    footnote: fr
      ? "Temps écoulé depuis la coupure · 24 clients par cas · répartition illustrative"
      : "Time since the disconnect · 24 clients per case · illustrative distribution",
  };

  return <>
    {RULES.map((rule, index) => {
      const P = L.panel(index);
      const x0 = P.x + L.inset;
      const chartW = P.w - 2 * L.inset;
      const columnW = chartW / SECONDS;
      const base = P.y + P.h - L.baseFromBottom;
      const stackW = L.perRow * L.unit + (L.perRow - 1) * L.gap;
      const arrived = rule.attempts.filter((attempt) => frame >= attempt.land);
      const peak = Math.max(0, ...Array.from({ length: SECONDS }, (_, second) => arrived.filter((attempt) => attempt.second === second).length));
      const appear = easeOut(frame, index * 5, index * 5 + 18);
      const copy = t[rule.id];
      const spreadOut = rule.id === "randomized";
      const peakSecond = spreadOut ? RANDOM_PER_SECOND.indexOf(4) : rule.attempts[0]!.second;
      const towerTop = base - 3 - Math.ceil(CLIENTS / L.perRow) * pitch;
      // The verdict sits beside a tower, and above the low spread-out row.
      const tagX = spreadOut ? x0 + chartW / 2 : x0 + (peakSecond + 1) * columnW + 8;
      const cursorX = x0 + Math.max(0, Math.min(SECONDS, now)) / SECONDS * chartW;

      return <g key={rule.id} data-rule={rule.id} opacity={appear} transform={`translate(0 ${(1 - appear) * 10})`}>
        <Box x={P.x} y={P.y} w={P.w} h={P.h} tone={rule.tone} radius={16} focus={during(frame, rule.focusAt, rule.focusAt + 54, 12)} />
        <Text x={P.x + L.inset} y={P.y + L.titleY} size={16} weight={600}>{copy.title}</Text>
        <Text x={P.x + L.detail.x} y={P.y + L.detail.y} size={13} weight={500} font="mono" tone="muted">{copy.detail}</Text>
        <Text x={P.x + P.w - L.inset} y={P.y + L.titleY} size={14} weight={600} font="mono" tone={rule.tone} anchor="end">
          {arrived.length} / {CLIENTS}
        </Text>

        <Axis x={x0} y={base} w={chartW} ticks={[0, 5, 10]} format={(second) => `${second} s`} />
        {sweeping > 0 ? <line
          x1={cursorX} x2={cursorX} y1={towerTop - 8} y2={base}
          stroke="var(--scene-ink)" strokeOpacity={.28 * sweeping} strokeWidth={1} strokeDasharray="3 4"
        /> : null}

        {arrived.map((attempt) => {
          const settle = easeOut(frame, attempt.land, attempt.land + 7);
          const column = attempt.rank % L.perRow;
          const row = Math.floor(attempt.rank / L.perRow);
          return <rect
            key={`${attempt.second}-${attempt.rank}`} data-attempt=""
            x={x0 + attempt.second * columnW + (columnW - stackW) / 2 + column * pitch}
            y={base - 3 - (row + 1) * pitch + L.gap - lerp(8, 0, settle)}
            width={L.unit} height={L.unit} rx={2}
            fill={TONE[rule.tone]} opacity={.25 + .7 * settle}
          />;
        })}

        {spreadOut ? null : <Pulse x={x0 + (peakSecond + .5) * columnW} y={towerTop} frame={frame} at={rule.peakAt - 4} period={30} r={9} tone="danger" once />}
        <Tag
          x={tagX} y={base - L.tagRise} anchor={spreadOut ? "middle" : "start"}
          text={t.peak(peak)} tone={rule.tone} size={13} appear={pop(frame, rule.peakAt)}
        />
      </g>;
    })}
    <Text x={width / 2} y={compact ? 503 : 392} size={13} weight={500} anchor="middle" tone="muted" opacity={easeOut(frame, 16, 34)}>
      {t.footnote}
    </Text>
  </>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.settled + 40,
  title: { fr: "Étaler les reconnexions", en: "Spreading reconnections" },
  caption: {
    fr: "24 clients fictifs, une première tentative chacun, la même échelle sur les trois graphiques. Une attente fixe déplace le pic ; une attente aléatoire l'étale, sans garantir un plafond de débit. Ce schéma ne représente pas des mesures de Forest.",
    en: "24 illustrative clients, one first attempt each, the same scale in all three charts. A fixed delay moves the peak; a randomized delay spreads it, without guaranteeing a rate limit. This diagram does not show Forest measurements.",
  },
  beats: [
    { at: 0, text: { fr: "Une coupure commune : 24 clients doivent rétablir leur connexion.", en: "A shared disconnect: 24 clients need to restore their connection." } },
    { at: T.sweep, text: { fr: "Sans attente, les 24 premières tentatives arrivent dans la même seconde.", en: "Without a delay, the 24 first attempts arrive within the same second." } },
    { at: T.spread, text: { fr: "Avec une attente aléatoire entre 0 et 10 s, elles arrivent quelques-unes à la fois.", en: "With a randomized delay between 0 and 10 s, they arrive a few at a time." } },
    { at: T.fixed - 4, text: { fr: "Une attente fixe de 5 s déplace le pic de 5 s. Il est aussi haut.", en: "A fixed 5 s delay moves the peak by 5 s. It is just as high." } },
    { at: T.settled + 10, text: { fr: "24 tentatives dans les trois cas. Seule l'attente aléatoire réduit le pic.", en: "24 attempts in all three cases. Only the randomized delay lowers the peak." } },
  ],
  Stage,
});
