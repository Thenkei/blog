import { Box, ease, Text, TONE } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

function Stage({ frame, compact, locale }: SceneStageProps) {
  const fr = locale === "fr";
  const replay = frame >= 220;
  const tapped = replay ? frame >= 340 : frame >= 150;
  const progress = replay ? ease(frame, 220, 340) : ease(frame, 0, 150);
  const halfSide = 20 + progress * (replay ? 68 : 50);
  const angle = (tapped ? (replay ? 340 : 150) : frame) * 0.012;
  const radius = 110;
  const fits = Math.SQRT2 * halfSide <= radius;
  const tone = tapped ? (fits ? "ok" : "danger") : "hot";
  const center = { x: 270, y: compact ? 195 : 220 };
  const panel = compact ? { x: 20, y: 342, w: 500, h: 136 } : { x: 500, y: 126, w: 420, h: 188 };
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const;
  const verdict = tapped
    ? fits ? (fr ? "✓ Forme contenue" : "✓ Shape contained") : (fr ? "✗ Les coins dépassent" : "✗ Corners cross the boundary")
    : (fr ? "La forme grandit…" : "The shape is growing…");

  return <>
    <g transform={`translate(${center.x} ${center.y})`}>
      <circle r={radius} fill="var(--scene-card)" stroke={TONE.line} strokeWidth={1.5} />
      <g transform={`rotate(${angle * 180 / Math.PI})`}>
        <rect x={-halfSide} y={-halfSide} width={halfSide * 2} height={halfSide * 2}
          fill="none" stroke={TONE[tone]} strokeWidth={2} />
        {corners.map(([x, y]) => <circle key={`${x},${y}`} cx={x * halfSide} cy={y * halfSide}
          r={tapped ? 5 : 3} fill={TONE[tone]} />)}
      </g>
      <Text x={0} y={-radius - 20} size={15} tone="muted" anchor="middle">
        {fr ? "Contour de la forme précédente" : "Previous shape’s boundary"}
      </Text>
    </g>
    <Box {...panel} tone={tone} radius={16}>
      <Text x={panel.x + 24} y={panel.y + 30} size={13} tone="muted" font="mono">
        {replay ? (fr ? "ESSAI PLUS TARDIF" : "LATER ATTEMPT") : (fr ? "PREMIER ESSAI" : "FIRST ATTEMPT")}
      </Text>
      <Text x={panel.x + 24} y={panel.y + 66} size={compact ? 20 : 21} tone={tone}>{verdict}</Text>
      <Text x={panel.x + 24} y={panel.y + 102} size={16} tone="muted">
        {fr ? "Tester chaque sommet, pas seulement la taille." : "Check every corner, not just the size."}
      </Text>
    </Box>
  </>;
}

export default defineScene({
  durationInFrames: 420,
  posterFrame: 180,
  title: { en: "Timing meets geometry", fr: "Le timing rencontre la géométrie" },
  caption: {
    en: "A square must fit inside the previous circle at the tap. Its corners decide whether the placement succeeds.",
    fr: "Au toucher, le carré doit tenir dans le cercle précédent. Ses sommets déterminent si le placement réussit.",
  },
  beats: [
    { at: 0, text: { en: "A square grows and rotates inside the previous circle.", fr: "Un carré grandit et tourne à l’intérieur du cercle précédent." } },
    { at: 150, text: { en: "Tap now: all four corners are inside the circle. The shape is accepted.", fr: "Toucher maintenant : les quatre coins sont dans le cercle. La forme est acceptée." } },
    { at: 220, text: { en: "Replay the same boundary, but wait longer before tapping.", fr: "Rejouer avec le même contour, mais attendre plus longtemps avant de toucher." } },
    { at: 340, text: { en: "Tap too late: the corners cross the boundary. This placement fails.", fr: "Toucher trop tard : les coins dépassent le contour. Ce placement échoue." } },
  ],
  Stage,
});
