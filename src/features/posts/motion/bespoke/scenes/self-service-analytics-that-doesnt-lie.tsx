import { Box, Camera, Comet, dim, ease, easeOut, enter, lerp, pop, Pulse, stagger, Tag, Text, tint, TONE, type Tone } from "../primitives";
import { defineScene, type Localized, type SceneStageProps } from "../types";

// Timeline (30 fps). The same six flows are counted three times by three
// correct queries; each query differs by one semantic choice from the article
// (effective date, cancellation treatment). Illustrative rows. The flows stay on
// the same rows: only the rule changes, so only the rule's effect moves.
const T = {
  runs: [48, 124, 204] as const,
  slide: 24,
  diff: 282,
  end: 432,
} as const;

type Day = [month: number, day: number];
type Flow = { id: string; event: Day; effective: Day; cancelled: boolean };

const FLOWS: readonly Flow[] = [
  { id: "#1", event: [8, 4], effective: [8, 6], cancelled: false },
  { id: "#2", event: [8, 12], effective: [8, 14], cancelled: true },
  { id: "#3", event: [8, 20], effective: [8, 22], cancelled: false },
  { id: "#4", event: [8, 30], effective: [9, 2], cancelled: false },
  { id: "#5", event: [7, 30], effective: [8, 1], cancelled: false },
  { id: "#6", event: [7, 31], effective: [8, 2], cancelled: false },
];

type Dashboard = { key: "A" | "B" | "C"; time: "event" | "effective"; cancellations: "in" | "out" };

const DASHBOARDS: readonly Dashboard[] = [
  { key: "A", time: "event", cancellations: "in" },
  { key: "B", time: "effective", cancellations: "in" },
  { key: "C", time: "event", cancellations: "out" },
];

const counts = (dashboard: Dashboard, flow: Flow) => {
  const [month] = dashboard.time === "event" ? flow.event : flow.effective;
  return month === 8 && (dashboard.cancellations === "in" || !flow.cancelled);
};

const TIME_LABEL: Record<Dashboard["time"], Localized> = {
  event: { en: "event date", fr: "date d’événement" },
  effective: { en: "effective date", fr: "date effective" },
};
const CANCEL_LABEL: Record<Dashboard["cancellations"], Localized> = {
  in: { en: "incl. cancelled", fr: "annulés inclus" },
  out: { en: "excl. cancelled", fr: "annulés exclus" },
};

const MONTHS_EN = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FR = ["", "janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const formatDate = ([month, day]: Day, fr: boolean) => fr ? `${day} ${MONTHS_FR[month]}` : `${MONTHS_EN[month]} ${day}`;

// Day index on the timeline: 26 July = 0 … 5 September = 41.
const dayIndex = ([month, day]: Day) => month === 7 ? day - 26 : month === 8 ? day + 5 : day + 36;
const SPAN = 41;
const AUG_START = dayIndex([8, 1]) - .5;
const AUG_END = dayIndex([9, 1]) - .5;

// Counting order within a run: rows top to bottom, only the flows that count.
const tickAt = (dashboardIndex: number, row: number) => {
  const dashboard = DASHBOARDS[dashboardIndex]!;
  const rank = FLOWS.slice(0, row).filter((flow) => counts(dashboard, flow)).length;
  const settle = dashboardIndex === 0 ? 14 : T.slide + 10;
  return T.runs[dashboardIndex]! + settle + rank * 6;
};
const HOP = 14;

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const wide = !compact;
  const axis = wide ? { x0: 64, x1: 616, top: 102, rowY: 124, pitch: 30, axisY: 304 } : { x0: 40, x1: 500, top: 92, rowY: 108, pitch: 24, axisY: 250 };
  const dayX = (d: number) => lerp(axis.x0, axis.x1, d / SPAN);
  const chip = wide ? { w: 38, h: 22 } : { w: 34, h: 20 };
  const card = (i: number) => wide ? { x: 676, y: 64 + i * 110, w: 244, h: 96 } : { x: 20 + i * 172, y: 288, w: 156, h: 102 };
  const numberAt = (i: number) => wide ? [card(i).x + card(i).w - 44, card(i).y + 50] as const : [card(i).x + card(i).w / 2, card(i).y + 46] as const;

  const runIndex = T.runs.reduce((found, start, i) => frame >= start ? i : found, -1);
  const current = runIndex >= 0 ? DASHBOARDS[runIndex]! : DASHBOARDS[0]!;
  const diff = ease(frame, T.diff, T.diff + 20);
  // Positions: event date, sliding to the effective date for B, then back for C.
  const slide = (row: number) => ease(frame, stagger(row, T.runs[1], 2), stagger(row, T.runs[1] + T.slide, 2)) - ease(frame, stagger(row, T.runs[2], 2), stagger(row, T.runs[2] + T.slide, 2));
  const excluded = ease(frame, T.runs[2] + 6, T.runs[2] + 22);

  const camera = [
    { at: 0 },
    { at: T.runs[1] - 10, dur: 40, zoom: 1.025, focus: [lerp(width / 2, dayX(20), .2), height / 2] as const },
    { at: T.diff - 10, dur: 40, zoom: 1 },
  ];

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    {/* The question everyone asked. */}
    <g {...enter(frame, 0)}>
      <Text x={wide ? 40 : 20} y={wide ? 76 : 70} size={wide ? 18 : 16} weight={600}>{fr ? "«\u00a0Combien de flux entrants en août\u00a0?\u00a0»" : "“How many inflows in August?”"}</Text>
    </g>

    {/* Timeline: July | August | September, with the question's window. */}
    <g opacity={dim(diff, .55)}>
      <g {...enter(frame, 6)}>
        <rect x={dayX(AUG_START)} y={axis.top} width={dayX(AUG_END) - dayX(AUG_START)} height={axis.axisY - axis.top} rx={10}
          style={{ fill: tint(runIndex >= 0 ? "line" : "muted", runIndex >= 0 ? 7 : 4) }} />
        {[AUG_START, AUG_END].map((d) => <line key={d} x1={dayX(d)} x2={dayX(d)} y1={axis.top} y2={axis.axisY + 4} stroke={TONE.line} strokeOpacity={.45} strokeWidth={1} strokeDasharray="3 4" />)}
        <line x1={axis.x0 - 16} x2={axis.x1 + 16} y1={axis.axisY} y2={axis.axisY} stroke="var(--scene-hairline)" strokeWidth={1} />
        {[
          { label: fr ? "juillet" : "July", d: (0 + AUG_START) / 2 },
          { label: fr ? "août" : "August", d: (AUG_START + AUG_END) / 2 },
          { label: fr ? "sept." : "Sept.", d: (AUG_END + SPAN) / 2 },
        ].map((m, i) => <Text key={m.label} x={dayX(m.d)} y={axis.axisY + 16} size={11} font="mono" weight={600} tone={i === 1 ? "line" : "muted"} anchor="middle" caps>{m.label}</Text>)}
      </g>

      {FLOWS.map((flow, row) => {
        const y = axis.rowY + row * axis.pitch;
        const s = slide(row);
        const d = lerp(dayIndex(flow.event), dayIndex(flow.effective), s);
        const x = dayX(d);
        const inside = d > AUG_START && d < AUG_END;
        const out = flow.cancelled ? excluded : 0;
        const tick = runIndex >= 0 && counts(current, flow) ? tickAt(runIndex, row) : Infinity;
        const counted = frame >= tick;
        const tone: Tone = counted ? "ok" : inside && runIndex >= 0 ? "line" : "muted";
        const date = s < .5 ? flow.event : flow.effective;
        return <g key={flow.id} {...enter(frame, stagger(row, 12, 4), { from: "left", distance: 10 })}>
          <line x1={axis.x0 - 16} x2={axis.x1 + 16} y1={y} y2={y} stroke="var(--scene-hairline)" strokeWidth={1} opacity={.35} />
          <g opacity={1 - .6 * out} transform={`translate(0 ${out * 4})`}>
            <rect className="scene-card" x={x - chip.w / 2} y={y - chip.h / 2} width={chip.w} height={chip.h} rx={7} style={{ fill: "var(--scene-card)" }} />
            <rect x={x - chip.w / 2} y={y - chip.h / 2} width={chip.w} height={chip.h} rx={7} style={{ fill: tint(tone, counted ? 22 : 10) }} stroke={TONE[tone]} strokeOpacity={.55} strokeWidth={1} strokeDasharray={out > .5 ? "3 3" : undefined} />
            <Text x={x} y={y + .5} size={12} font="mono" weight={600} tone={tone === "muted" ? "ink" : tone} anchor="middle">{flow.id}</Text>
            {wide ? <Text x={x + chip.w / 2 + 8} y={y + .5} size={12} font="mono" weight={500} tone="muted">{formatDate(date, fr)}</Text> : null}
          </g>
          {flow.cancelled ? <Tag x={x + (wide ? chip.w / 2 + 64 : chip.w / 2 + 8)} y={y} anchor="start" size={11} tone="danger"
            text={out > .5 ? (fr ? "✗ exclu" : "✗ excluded") : (fr ? "annulé" : "cancelled")} appear={easeOut(frame, 30, 44)} /> : null}
          {counted && frame < tick + 24 ? <Pulse x={x} y={y} frame={frame} at={tick} period={24} r={10} tone="ok" /> : null}
        </g>;
      })}
    </g>

    {/* Each counted flow travels to its dashboard. */}
    {runIndex >= 0 ? FLOWS.map((flow, row) => {
      if (!counts(current, flow)) return null;
      const tick = tickAt(runIndex, row);
      const s = slide(row);
      const from: [number, number] = [dayX(lerp(dayIndex(flow.event), dayIndex(flow.effective), s)), axis.rowY + row * axis.pitch];
      const to = numberAt(runIndex);
      const mid: [number, number] = wide ? [lerp(from[0], to[0], .55), Math.min(from[1], to[1]) - 20] : [lerp(from[0], to[0], .5), lerp(from[1], to[1], .5) + 10];
      return <Comet key={flow.id} points={[from, mid, to]} t={ease(frame, tick, tick + HOP)} tone="ok" r={4} tail={.25} />;
    }) : null}

    {/* Three dashboards, three numbers. */}
    {DASHBOARDS.map((dashboard, i) => {
      const c = card(i);
      const start = T.runs[i]!;
      const ticks = FLOWS.map((flow, row) => counts(dashboard, flow) ? tickAt(i, row) + HOP : Infinity);
      const value = ticks.filter((at) => frame >= at).length;
      const lastTick = Math.max(...ticks.filter(Number.isFinite));
      const active = runIndex === i && frame < T.diff;
      const settled = frame >= lastTick;
      const timeHot = dashboard.time !== "event";
      const cancelHot = dashboard.cancellations !== "in";
      const chips = [
        { text: TIME_LABEL[dashboard.time][locale], hot: timeHot },
        { text: CANCEL_LABEL[dashboard.cancellations][locale], hot: cancelHot },
      ];
      const [nx, ny] = numberAt(i);
      const bump = ticks.reduce((b, at) => Math.max(b, frame >= at ? 1 - ease(frame, at, at + 10) : 0), 0);
      return <g key={dashboard.key} {...enter(frame, stagger(i, 20, 6), { from: wide ? "right" : "up", distance: 16 })}>
        <g opacity={frame >= start - 10 || runIndex >= i ? 1 : .55}>
          <Box x={c.x} y={c.y} w={c.w} h={c.h} tone={active ? "line" : settled ? "ok" : "muted"} focus={active ? ease(frame, start - 8, start + 4) : 0} radius={14}>
            <Text x={c.x + 16} y={c.y + 20} size={11} font="mono" weight={600} tone={active ? "line" : "muted"} caps>{`Dashboard ${dashboard.key}`}</Text>
            {chips.map((item, k) => {
              const hot = item.hot && diff > 0;
              return <Tag key={k} x={wide ? c.x + 16 : c.x + c.w / 2} y={wide ? c.y + 46 + k * 28 : c.y + 82} anchor={wide ? "start" : "middle"} size={11}
                text={hot ? `≠ ${item.text}` : item.text} tone={hot ? "hot" : "muted"}
                appear={wide ? 1 : k === (dashboard.key === "C" ? 1 : 0) ? 1 : 0} />;
            })}
            <g transform={`translate(${nx} ${ny}) scale(${1 + .12 * bump}) translate(${-nx} ${-ny})`}>
              <Text x={nx} y={ny} size={wide ? 40 : 36} font="mono" weight={700} anchor="middle" tone={runIndex >= i ? (settled ? "ink" : "line") : "muted"}>{runIndex >= i ? String(value) : "–"}</Text>
            </g>
          </Box>
        </g>
      </g>;
    })}

    {/* Same SQL correctness, different semantics. */}
    <Tag x={wide ? (axis.x0 + axis.x1) / 2 : 270} y={wide ? 352 : 424} size={wide ? 13 : 12} tone="danger" appear={pop(frame, T.diff + 12)}
      text={fr ? "3 requêtes justes · 3 chiffres" : "3 correct queries · 3 numbers"} />
    <g {...enter(frame, T.diff + 26)}>
      <Text x={wide ? (axis.x0 + axis.x1) / 2 : 270} y={wide ? 388 : 462} size={wide ? 18 : 17} weight={600} anchor="middle">{fr ? "Qu’a-t-on compté, exactement\u00a0?" : "What, exactly, did we count?"}</Text>
    </g>
  </Camera>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 30,
  title: { en: "Same question, three numbers", fr: "Même question, trois chiffres" },
  caption: {
    en: "Each query is correct SQL. They disagree on effective date and cancellation treatment, a choice that stays hidden until someone makes a decision on the number.",
    fr: "Chaque requête est du SQL correct. Elles divergent sur la date effective et le traitement des annulations, un choix invisible jusqu’à ce qu’une décision repose sur le chiffre.",
  },
  beats: [
    { at: 0, text: { en: "Three dashboards answer the same question from the same six flows.", fr: "Trois dashboards répondent à la même question à partir des six mêmes flux." } },
    { at: T.runs[0], text: { en: "Dashboard A filters on the event date and counts every flow: 4.", fr: "Le dashboard A filtre sur la date d’événement et compte tous les flux\u00a0: 4." } },
    { at: T.runs[1], text: { en: "Dashboard B uses the effective date: two July events move into August, one leaves. 5.", fr: "Le dashboard B prend la date effective\u00a0: deux flux de juillet entrent en août, un en sort. 5." } },
    { at: T.runs[2], text: { en: "Dashboard C is back on the event date and excludes the cancelled flow: 3.", fr: "Le dashboard C revient à la date d’événement et exclut le flux annulé\u00a0: 3." } },
    { at: T.diff, text: { en: "All three are correct SQL. What differs is semantics: which date, which population.", fr: "Les trois sont du SQL correct. Ce qui diffère, c’est la sémantique\u00a0: quelle date, quelle population." } },
  ],
  Stage,
});
