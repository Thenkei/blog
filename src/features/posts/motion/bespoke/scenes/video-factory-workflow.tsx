import { Box, Comet, ease, enter, Tag, Text, tint, TONE, Wire } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

function Stage({ frame, compact, locale }: SceneStageProps) {
  const fr = locale === "fr";
  const input = compact ? { x: 24, y: 72, w: 224, h: 112 } : { x: 40, y: 94, w: 208, h: 148 };
  const factory = compact ? { x: 286, y: 72, w: 230, h: 112 } : { x: 292, y: 110, w: 228, h: 116 };
  const output = compact ? { x: 96, y: 222, w: 108, step: 120 } : { x: 600, y: 100, w: 100, step: 110 };
  const useY = compact ? 386 : 296;
  const live = compact ? { x: 24, w: 238 } : { x: 292, w: 276 };
  const future = compact ? { x: 286, w: 230 } : { x: 600, w: 320 };
  const outputCenter = output.x + output.step + output.w / 2;
  const path = compact
    ? [[factory.x + factory.w / 2, factory.y + factory.h], [factory.x + factory.w / 2, 204], [outputCenter, 204], [outputCenter, output.y]] as const
    : [[factory.x + factory.w, 168], [output.x, 168]] as const;
  const branchY = compact ? 366 : 274;
  const labelY = compact ? 352 : 244;
  return <g>
    <Wire d={`M${input.x + input.w} ${input.y + input.h / 2} H${factory.x}`} draw={ease(frame, 55, 85)} width={1.5} />
    <Comet points={[[input.x + input.w, input.y + input.h / 2], [factory.x, factory.y + factory.h / 2]]} t={ease(frame, 55, 85)} tone="line" r={4} />
    <Wire d={compact ? `M401 184 V204 H${outputCenter} V222` : "M520 168 H600"} draw={ease(frame, 135, 170)} width={1.5} />
    <Comet points={path} t={ease(frame, 135, 170)} tone="line" r={4} />
    <g {...enter(frame, 8)}>
      <Box {...input} tone="line" radius={12}>
        <Text x={input.x + 16} y={input.y + 27} size={20} weight={600}>{fr ? "Consignes" : "Instructions"}</Text>
        {(fr ? ["Public et sujet", "Message et format", "Sources à utiliser"] : ["Audience and topic", "Message and format", "Sources to use"]).map((line, i) =>
          <Text key={line} x={input.x + 16} y={input.y + 53 + i * 21} size={15} tone="muted">{line}</Text>,
        )}
      </Box>
    </g>
    <g {...enter(frame, 80)}>
      <Box {...factory} tone="line" radius={12} focus={ease(frame, 80, 100) * (1 - ease(frame, 150, 175))}>
        <Text x={factory.x + 16} y={factory.y + 29} size={21}>Video Factory</Text>
        <Text x={factory.x + 16} y={factory.y + 57} size={15} tone="muted">{fr ? "Règles communes" : "Shared production rules"}</Text>
        <Text x={factory.x + 16} y={factory.y + 84} size={14}>{fr ? "Récit · image · voix · son" : "Story · picture · voice · sound"}</Text>
      </Box>
    </g>
    {[0, 1, 2].map((i) => {
      const x = output.x + output.step * i;
      return <g key={i} {...enter(frame, 170 + i * 22)}>
        <Box x={x} y={output.y} w={output.w} h={104} tone="ok" radius={10}>
          <rect x={x + 12} y={output.y + 12} width={output.w - 24} height={46} rx={5} fill={tint("line", 12)} />
          <path d={`M${x + output.w / 2 - 5} ${output.y + 25} l14 10 -14 10 Z`} fill={TONE.line} />
          <line x1={x + 12} x2={x + output.w - 12} y1={output.y + 72} y2={output.y + 72} stroke={TONE.ink} strokeWidth={1.5} />
          <line x1={x + 12} x2={x + output.w - 28} y1={output.y + 83} y2={output.y + 83} stroke={TONE.muted} strokeWidth={1} />
          <line x1={x + 12} x2={x + output.w - 12} y1={output.y + 94} y2={output.y + 94} stroke={TONE.ok} strokeWidth={2} />
        </Box>
      </g>;
    })}
    <g {...enter(frame, 220)}>
      <Text x={compact ? 270 : outputCenter} y={labelY} size={16} anchor="middle" weight={600}>{fr ? "Simple · uniforme · reproductible" : "Simple · uniform · reproducible"}</Text>
    </g>
    <Wire d={`M${outputCenter} ${labelY + 10} V${branchY} H${live.x + live.w / 2} V${useY}`} tone="ok" draw={ease(frame, 250, 275)} width={1.5} />
    <g {...enter(frame, 270)}>
      <Box x={live.x} y={useY} w={live.w} h={88} tone="ok" radius={12}>
        <Tag x={live.x + 16} y={useY + 24} text={fr ? "AUJOURD’HUI" : "TODAY"} tone="ok" anchor="start" size={11} />
        <Text x={live.x + 16} y={useY + 52} size={18}>{fr ? "Releases RockFi" : "RockFi releases"}</Text>
        <Text x={live.x + 16} y={useY + 73} size={14} tone="muted">{fr ? "Vidéos produites en interne" : "Videos produced internally"}</Text>
      </Box>
    </g>
    <Wire d={`M${outputCenter} ${branchY} H${future.x + future.w / 2} V${useY}`} tone="hot" dashed draw={ease(frame, 335, 360)} width={1.5} />
    <g {...enter(frame, 360)}>
      <Box x={future.x} y={useY} w={future.w} h={88} tone="hot" variant="ghost" radius={12}>
        <Tag x={future.x + 16} y={useY + 24} text={fr ? "PISTE À EXPLORER" : "POSSIBLE NEXT STEP"} tone="hot" anchor="start" size={11} />
        <Text x={future.x + 16} y={useY + 52} size={18}>YouTube</Text>
        <Text x={future.x + 16} y={useY + 73} size={14} tone="muted">{fr ? "Chaînes de vulgarisation" : "Accessible explainers"}</Text>
      </Box>
    </g>
  </g>;
}

export default defineScene({
  title: { en: "Instructions become videos", fr: "Des consignes aux vidéos" },
  caption: {
    en: "Instructions feed a shared production workflow for simple, uniform, reproducible videos. RockFi uses it for release videos; YouTube explainer channels are a possibility I want to explore.",
    fr: "Des consignes alimentent un workflow commun pour des vidéos simples, uniformes et reproductibles. RockFi l’utilise pour ses vidéos de release ; des chaînes YouTube de vulgarisation sont une piste que je veux explorer.",
  },
  durationInFrames: 510,
  posterFrame: 445,
  beats: [
    { at: 0, text: { en: "Give instructions: the audience, topic, message, format and sources.", fr: "Donner les consignes : public, sujet, message, format et sources." } },
    { at: 80, text: { en: "Video Factory applies shared rules to story, picture, voice and sound.", fr: "Video Factory applique des règles communes au récit, à l’image, à la voix et au son." } },
    { at: 170, text: { en: "Produce new videos with a simple, uniform format and a reproducible workflow.", fr: "Produire des vidéos au format simple et uniforme, avec un workflow reproductible." } },
    { at: 270, text: { en: "At RockFi, we use the factory to produce release videos.", fr: "Chez RockFi, nous utilisons la factory pour produire les vidéos de release." } },
    { at: 360, text: { en: "This opens a possibility: YouTube channels that make complex topics accessible.", fr: "Cela ouvre une piste : des chaînes YouTube pour rendre des sujets complexes accessibles." } },
  ],
  Stage,
});
