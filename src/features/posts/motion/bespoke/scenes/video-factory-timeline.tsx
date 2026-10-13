import { Box, ease, enter, Tag, Text, tint } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Illustrative arithmetic, not timing taken from a production video.
function Stage({ frame, compact, locale }: SceneStageProps) {
  const fr = locale === "fr";
  const x = compact ? 32 : 48;
  const span = compact ? 476 : 864;
  const unit = span / 360;
  const overlap = 12 * ease(frame, 75, 135);
  const secondStart = 180 - overlap;
  const total = 360 - overlap;
  const y = compact ? 150 : 116;
  const playhead = x + unit * total * ease(frame, 150, 240);
  return <g>
    <g {...enter(frame, 0)}>
      <Text x={x} y={y - 28} size={16} tone="muted">{fr ? "Exemple à 30 fps" : "Example at 30 fps"}</Text>
      <Box x={x} y={y} w={180 * unit} h={62} tone="line" radius={10}>
        <Text x={x + 14} y={y + 26} size={17} weight={600}>{fr ? "Scène A" : "Scene A"}</Text>
        <Text x={x + 14} y={y + 48} size={15} font="mono">180 frames</Text>
      </Box>
    </g>
    <g {...enter(frame, 20)}>
      <Box x={x + secondStart * unit} y={y + 84} w={180 * unit} h={62} tone="line" radius={10}>
        <Text x={x + secondStart * unit + 14} y={y + 110} size={17} weight={600}>{fr ? "Scène B" : "Scene B"}</Text>
        <Text x={x + secondStart * unit + 14} y={y + 132} size={15} font="mono">180 frames</Text>
      </Box>
    </g>
    <rect x={x + secondStart * unit} y={y - 8} width={Math.max(0, overlap * unit)} height={162} fill={tint("hot", 22)} />
    <g {...enter(frame, 95)}>
      <Tag x={x} y={y + 185} text={fr ? "12 frames communes" : "12 shared frames"} tone="hot" size={16} anchor="start" />
    </g>
    <g {...enter(frame, 150)}>
      <line x1={playhead} x2={playhead} y1={y - 8} y2={y + 154} stroke="var(--scene-ink-soft)" strokeWidth={1.5} />
      <Text x={x} y={y + 232} size={compact ? 18 : 21} font="mono" weight={600}>180 + 180 − 12 = 348 frames</Text>
      <Text x={x} y={y + 263} size={16} tone="muted">{fr ? "Image et son finissent ensemble." : "Picture and sound finish together."}</Text>
    </g>
  </g>;
}

export default defineScene({
  title: { en: "Count the overlap once", fr: "Compter le chevauchement une seule fois" },
  caption: {
    en: "Illustrative example: two 180-frame scenes share a 12-frame transition. The film lasts 348 frames, or 11.6 seconds at 30 fps. Audio and verification use that same duration.",
    fr: "Exemple illustratif : deux scènes de 180 frames partagent une transition de 12 frames. Le film dure 348 frames, soit 11,6 secondes à 30 fps. Audio et vérification utilisent cette même durée.",
  },
  durationInFrames: 330,
  posterFrame: 275,
  beats: [
    { at: 0, text: { en: "Two scenes each contain 180 frames.", fr: "Deux scènes contiennent chacune 180 frames." } },
    { at: 75, text: { en: "The second starts 12 frames before the first ends.", fr: "La seconde commence 12 frames avant la fin de la première." } },
    { at: 150, text: { en: "Subtract the overlap: picture and sound share a 348-frame timeline.", fr: "Retirer le chevauchement : image et son partagent une timeline de 348 frames." } },
  ],
  Stage,
});
