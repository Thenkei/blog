import { Box, ease, Text, TONE } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// A deterministic, illustrative distribution of the same 24 first attempts.
// Buckets are relative time intervals, not production throughput measurements.
const BURST = [24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const SPREAD = [1, 3, 2, 1, 2, 4, 1, 3, 2, 1, 2, 2];
const START = 60;
const END = 300;

function Stage({ frame, compact, locale, width }: SceneStageProps) {
  const fr = locale === "fr";
  const panelWidth = compact ? 500 : 430;
  const panelHeight = compact ? 210 : 290;
  const progress = ease(frame, START, END, (value) => value);

  return <>
    {[BURST, SPREAD].map((counts, panel) => {
      const x = compact ? 20 : 30 + panel * 470;
      const y = compact ? 60 + panel * 225 : 72;
      const left = x + 38;
      const chartWidth = panelWidth - 72;
      const bottom = y + panelHeight - 44;
      const unit = compact ? 3.9 : 6.6;
      const tone = panel === 0 ? "danger" : "ok";
      const arrived = counts.reduce((sum, count, index) =>
        sum + (progress >= (index + 0.5) / counts.length ? count : 0), 0);

      return <g key={panel}>
        <Box x={x} y={y} w={panelWidth} h={panelHeight} tone={tone} />
        <Text x={x + 20} y={y + 28} size={17} weight={600}>
          {panel === 0
            ? (fr ? "Reconnexion immédiate" : "Immediate reconnect")
            : (fr ? "Attente aléatoire" : "Randomized delay")}
        </Text>
        <Text x={x + panelWidth - 20} y={y + 28} size={16} anchor="end" tone={tone}>
          {arrived} / 24
        </Text>
        <Text x={left} y={y + 53} size={15} tone="muted">
          {fr ? "Tentatives par intervalle" : "Attempts per time interval"}
        </Text>
        {[0, 12, 24].map((count) => <g key={count}>
          <line x1={left} x2={left + chartWidth} y1={bottom - count * unit} y2={bottom - count * unit}
            stroke={TONE.muted} strokeOpacity={0.2} strokeDasharray={count === 0 ? undefined : "3 5"} />
          <Text x={left - 7} y={bottom - count * unit + 4} size={14} anchor="end" tone="muted">{count}</Text>
        </g>)}
        {counts.map((count, index) => {
          const barX = left + index * chartWidth / counts.length + 4;
          const barWidth = chartWidth / counts.length - 8;
          const arrivalFrame = START + (index + 0.5) / counts.length * (END - START);
          const reveal = ease(frame, arrivalFrame, arrivalFrame + 8);
          return <rect key={index} x={barX} y={bottom - count * unit}
            width={barWidth} height={count * unit} rx={2}
            fill={TONE[tone]} opacity={0.22 + reveal * 0.68} />;
        })}
        <line x1={left + progress * chartWidth} x2={left + progress * chartWidth}
          y1={y + 68} y2={bottom} stroke={TONE.ink} strokeWidth={1.5} strokeDasharray="3 4" />
        <Text x={left} y={bottom + 24} size={14} tone="muted">{fr ? "coupure" : "disconnect"}</Text>
        <Text x={left + chartWidth} y={bottom + 24} size={14} anchor="end" tone="muted">
          {fr ? "temps →" : "time →"}
        </Text>
      </g>;
    })}
    {!compact && <Text x={width / 2} y={396} size={13} anchor="middle" tone="muted">
      {fr ? "Même nombre de tentatives · mêmes axes · répartition illustrative" : "Same attempt count · same axes · illustrative distribution"}
    </Text>}
  </>;
}

export default defineScene({
  durationInFrames: 390,
  posterFrame: 330,
  title: { fr: "Étaler les reconnexions", en: "Spreading reconnections" },
  caption: {
    fr: "24 clients fictifs, une première tentative chacun et la même échelle sur les deux graphiques. Le jitter répartit les tentatives dans le temps ; il ne garantit pas un plafond de débit. Ce schéma ne représente pas des mesures de Forest.",
    en: "24 illustrative clients, one first attempt each, and the same scale in both charts. Jitter spreads attempts over time; it does not guarantee a rate limit. This diagram does not show Forest measurements.",
  },
  beats: [
    { at: 0, text: { fr: "Une coupure commune : les 24 clients doivent rétablir leur connexion.", en: "A shared disconnect: all 24 clients need to restore their connection." } },
    { at: 80, text: { fr: "Sans attente, les premières tentatives arrivent ensemble.", en: "Without a delay, the first attempts arrive together." } },
    { at: 160, text: { fr: "Avec une attente aléatoire dès le départ, les retours s'étalent.", en: "A randomized delay from the first attempt spreads clients' return." } },
    { at: 310, text: { fr: "24 tentatives dans les deux cas. Le pic change, pas le travail total de cette première tentative.", en: "24 attempts in both cases. The peak changes, not the total work of this first attempt." } },
  ],
  Stage,
});
