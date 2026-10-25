import { Box, Comet, ease, easeOut, enter, Tag, Text, TONE, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// The same terminal connects an already broad staff role to adjacent practices,
// then to a concrete initiative beyond it. Reveals indicate scope, not workload.
const T = { practices: 104, design: 190, factory: 266, communication: 390, end: 510 } as const;
const PRACTICES = ["Data engineering", "BI", "Data analyst", "SRE-ish", "Design"] as const;
const SCOPE = {
  en: ["Frame the problem", "Make design tradeoffs", "Coordinate delivery"],
  fr: ["Cadrer le problème", "Arbitrer le design", "Coordonner la delivery"],
} as const;
const FACTORY = {
  en: ["Brief & storyboard", "Narration & scenes", "Release communication"],
  fr: ["Brief et storyboard", "Narration et scènes", "Communication de release"],
} as const;
const PROMPTS = [
  { at: 0, en: "Frame the project", fr: "Cadrer le projet" },
  { at: T.practices, en: "Prepare a data pipeline", fr: "Préparer un pipeline data" },
  { at: T.design, en: "Prepare a design", fr: "Préparer un design" },
  { at: T.factory, en: "Prepare the release video", fr: "Préparer la vidéo de release" },
  { at: T.communication, en: "Prepare release communication", fr: "Préparer la communication" },
] as const;

type Point = readonly [number, number];

function Stage({ frame, compact, locale }: SceneStageProps) {
  const fr = locale === "fr";
  const panels = compact
    ? {
      scope: { x: 20, y: 132, w: 500, h: 76 },
      practices: { x: 20, y: 224, w: 500, h: 104 },
      factory: { x: 20, y: 344, w: 500, h: 132 },
    }
    : {
      scope: { x: 40, y: 152, w: 240, h: 192 },
      practices: { x: 304, y: 152, w: 264, h: 192 },
      factory: { x: 592, y: 152, w: 328, h: 192 },
    };
  const terminal = { x: compact ? 20 : 40, y: 60, w: compact ? 500 : 880, h: 48 };
  const { scope, practices, factory } = panels;
  const active = frame >= T.factory ? 2 : frame >= T.practices ? 1 : 0;
  const prompt = PROMPTS.filter(item => frame >= item.at).at(-1)!;
  const typed = Math.floor(prompt[locale].length * easeOut(frame, prompt.at + 4, prompt.at + 28));
  const reveal = (at: number) => easeOut(frame, at, at + 24);
  const anchor = (panel: typeof scope): Point => [panel.x + panel.w / 2, panel.y - 6];
  const terminalOut: Point = compact
    ? [terminal.x + terminal.w - 12, terminal.y + terminal.h / 2]
    : [terminal.x + terminal.w / 2, terminal.y + terminal.h];
  const path = (panel: typeof scope): readonly Point[] => compact
    ? [terminalOut, [530, terminalOut[1]], [530, panel.y + panel.h / 2], [panel.x + panel.w, panel.y + panel.h / 2]]
    : [terminalOut, [terminalOut[0], 126], [anchor(panel)[0], 126], anchor(panel)];
  const panelTone = (index: number): Tone => active === index ? "hot" : "line";
  const factoryProgress = [T.factory + 18, T.factory + 58, T.communication] as const;

  return <>
    {/* A shared working surface remains as the range of work grows. */}
    <Box {...terminal} tone="line" radius={12}>
      <Text x={terminal.x + 16} y={terminal.y + 26} size={13} font="mono" tone="muted">terminal</Text>
      <Text x={terminal.x + 112} y={terminal.y + 26} size={compact ? 14 : 16} font="mono" weight={600}>
        {prompt[locale].slice(0, typed)}{frame < prompt.at + 36 ? "▌" : ""}
      </Text>
    </Box>

    {/* The boundaries are permeable; no role is a queued interruption. */}
    {!compact ? [292, 580].map((x, index) => <line key={x}
      x1={x} x2={x} y1={140} y2={356} stroke="var(--scene-hairline)" strokeWidth={1}
      strokeDasharray="3 8" opacity={reveal(index === 0 ? T.practices : T.factory)} />) : null}
    {[scope, practices, factory].map((panel, index) => <Comet key={index}
      points={path(panel)} t={ease(frame, index === 0 ? 12 : index === 1 ? T.practices : T.factory,
        (index === 0 ? 12 : index === 1 ? T.practices : T.factory) + 28)}
      tone={panelTone(index)} r={4.5} tail={.28} />)}

    {/* Staff engineering already includes framing, tradeoffs and coordination. */}
    <Box {...scope} tone={panelTone(0)} focus={active === 0 ? .7 : 0} radius={16}>
      <Text x={scope.x + 16} y={scope.y + 25} size={18} weight={650}>Staff engineer</Text>
      {compact ? <Text x={scope.x + 16} y={scope.y + 54} size={15} tone="muted">
        {fr ? "Cadrer · arbitrer · coordonner la delivery" : "Frame · make tradeoffs · coordinate delivery"}
      </Text> : SCOPE[locale].map((line, index) => <Text key={line}
        x={scope.x + 16} y={scope.y + 72 + index * 32} size={15.5} tone="muted">{line}</Text>)}
    </Box>

    {/* Additional practices require their own skills and judgment. */}
    <g {...enter(frame, T.practices, { distance: compact ? 12 : 18 })}>
      <Box {...practices} tone={panelTone(1)} focus={active === 1 ? .7 : 0} radius={16}>
        <Text x={practices.x + 16} y={practices.y + 25} size={compact ? 16 : 18} weight={650}>
          {fr ? "Compétences voisines" : "Adjacent practices"}
        </Text>
        {PRACTICES.map((name, index) => {
          const at = name === "Design" ? T.design : T.practices + 10 + index * 10;
          const x = compact ? practices.x + 16 + (index % 3) * 158 : practices.x + 16;
          const y = compact ? practices.y + 50 + Math.floor(index / 3) * 30 : practices.y + 56 + index * 28;
          const highlighted = name === "Design" && frame >= T.design && frame < T.factory;
          return <g key={name} opacity={reveal(at)}>
            {compact ? <Tag x={x} y={y} text={name} anchor="start" size={13}
              tone={highlighted ? "hot" : "line"} />
              : <Text x={x} y={y} size={16} weight={highlighted ? 650 : 500}
                tone={highlighted ? "hot" : "ink"}>{name}</Text>}
          </g>;
        })}
      </Box>
    </g>

    {/* The factory is an initiative, with editorial work as well as engineering. */}
    <g {...enter(frame, T.factory, { distance: compact ? 12 : 18 })}>
      <Box {...factory} tone={panelTone(2)} focus={active === 2 ? .7 : 0} radius={16}>
        <Text x={factory.x + 16} y={factory.y + 25} size={18} weight={650}>
          {fr ? "Vidéo factory" : "Video factory"}
        </Text>
        {FACTORY[locale].map((label, index) => {
          const x = factory.x + (compact ? 24 + index * 158 : 30);
          const y = factory.y + (compact ? 67 : 70 + index * 34);
          const at = factoryProgress[index]!;
          const visible = reveal(at);
          return <g key={label} opacity={visible}>
            {!compact ? <>
              {index > 0 ? <line x1={x - 12} x2={x - 12} y1={y - 27} y2={y - 9}
                stroke="var(--scene-hairline)" strokeWidth={1.25} /> : null}
              <circle cx={x - 12} cy={y - 3} r={3} fill={TONE.line} />
              <Text x={x} y={y} size={15.5}>{label}</Text>
            </> : <>
              <Text x={x} y={y} size={15} weight={600}>{index === 0 ? "Brief" : index === 1 ? "Narration" : "Release"}</Text>
              <Text x={x} y={y + 24} size={13} font="mono" tone="muted">
                {index === 0 ? "storyboard" : index === 1 ? (fr ? "scènes" : "scenes") : "communication"}
              </Text>
              {index < 2 ? <Text x={x + 116} y={y + 2} size={16} tone="line">→</Text> : null}
            </>}
          </g>;
        })}
      </Box>
    </g>

    <g opacity={reveal(T.communication)}>
      <Text x={compact ? 270 : 480} y={compact ? 501 : 386} size={compact ? 15 : 19}
        anchor="middle" weight={600} tone="hot">
        {fr ? "Staff engineer, option vidéo factory." : "Staff engineer, video factory included."}
      </Text>
    </g>
  </>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: 460,
  title: { en: "A broader scope from one terminal", fr: "Un périmètre qui s'élargit" },
  caption: {
    en: "The staff role already spans several concerns. Agents make adjacent work and initiatives such as release videos more accessible, with new skills to learn.",
    fr: "Le rôle de staff engineer est déjà transverse. Les agents facilitent les pratiques voisines et des initiatives comme la vidéo de release, avec d'autres compétences à acquérir.",
  },
  beats: [
    { at: 0, text: { en: "Staff engineering: framing, tradeoffs and delivery.", fr: "Staff engineer : cadrer, arbitrer, coordonner." } },
    { at: T.practices, text: { en: "Data, BI, analysis and SRE-ish work need other skills.", fr: "Data engineering, BI, analyse, SRE-ish : d'autres savoir-faire." } },
    { at: T.design, text: { en: "Prepare designs: user journeys and interface states.", fr: "Préparer des designs : parcours et états de l'interface." } },
    { at: T.factory, text: { en: "Video factory: brief, storyboard, narration and scenes.", fr: "Vidéo factory : brief, storyboard, narration et scènes." } },
    { at: T.communication, text: { en: "Another initiative: communicating our releases.", fr: "Une initiative en plus : communiquer sur nos releases." } },
  ],
  Stage,
});
