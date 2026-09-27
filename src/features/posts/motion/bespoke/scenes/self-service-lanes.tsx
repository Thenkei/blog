import { Box, Camera, Checkpoint, Comet, ease, easeOut, enter, lerp, pop, Pulse, stagger, Tag, Text, tint, TONE, type Tone } from "../primitives";
import { defineScene, type Localized, type SceneStageProps } from "../types";

// Timeline (30 fps). A query aimed at the raw tables is refused and rerouted to
// the modelling layer; then one analysis is promoted through the three lanes,
// each lane adding its own controls on top of that layer, never on raw tables.
const T = {
  probe: 10,
  bounce: 40,
  lanes: [92, 184, 286] as const,
  checkGap: 14,
  permissions: 366,
  end: 470,
} as const;

type Lane = {
  key: string;
  title: Localized;
  token: Localized;
  checks: readonly Localized[];
  /** Which modelling components the lane leans on (indices into LAYER). */
  uses: readonly number[];
  tone: Tone;
};

const LANES: readonly Lane[] = [
  {
    key: "explore", tone: "line",
    title: { en: "Exploration", fr: "Exploration" },
    token: { en: "draft analysis", fr: "analyse brouillon" },
    checks: [
      { en: "bounded access", fr: "accès borné" },
      { en: "temporary output", fr: "résultat temporaire" },
      { en: "visible assumptions", fr: "hypothèses visibles" },
    ],
    uses: [0],
  },
  {
    key: "certify", tone: "ok",
    title: { en: "Certified metric", fr: "Métrique certifiée" },
    token: { en: "metric v1", fr: "métrique v1" },
    checks: [
      { en: "versioned definition", fr: "définition versionnée" },
      { en: "owner", fr: "responsable" },
      { en: "tests", fr: "tests" },
      { en: "freshness policy", fr: "politique de fraîcheur" },
    ],
    uses: [1, 2],
  },
  {
    key: "publish", tone: "hot",
    title: { en: "Decision", fr: "Décision" },
    token: { en: "published", fr: "diffusée" },
    checks: [
      { en: "provenance shown", fr: "provenance affichée" },
      { en: "access controls", fr: "accès contrôlés" },
      { en: "review ∝ impact", fr: "revue ∝ impact" },
    ],
    uses: [0],
  },
];

const LAYER: readonly Localized[] = [
  { en: "governed marts", fr: "marts gouvernés" },
  { en: "semantic layer", fr: "couche sémantique" },
  { en: "catalogue", fr: "catalogue" },
];

type Rect = { x: number; y: number; w: number; h: number };
const checkAt = (lane: number, check: number) => T.lanes[lane]! + 22 + check * T.checkGap;
const laneDoneAt = (lane: number) => checkAt(lane, LANES[lane]!.checks.length - 1) + 10;

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const wide = !compact;
  const lane = (i: number): Rect => wide ? { x: 40 + i * 300, y: 56, w: 280, h: 170 } : { x: 20, y: 54 + i * 96, w: 500, h: 88 };
  const checkPos = (i: number, c: number) => {
    const l = lane(i);
    return wide ? { x: l.x + 26, y: l.y + 84 + c * 22 } : { x: l.x + 26 + (c % 2) * 240, y: l.y + 52 + Math.floor(c / 2) * 24 };
  };
  const layer: Rect = wide ? { x: 40, y: 256, w: 880, h: 48 } : { x: 20, y: 350, w: 500, h: 46 };
  const raw: Rect = wide ? { x: 40, y: 318, w: 880, h: 34 } : { x: 20, y: 408, w: 500, h: 32 };
  const chip = (index: number): Rect => {
    const gap = 12;
    const w = (layer.w - 32 - 2 * gap) / 3;
    return { x: layer.x + 16 + index * (w + gap), y: layer.y + (layer.h - 28) / 2, w, h: 28 };
  };
  const tokenW = wide ? 164 : 170;
  const tokenPos = (i: number) => wide ? { x: lane(i).x + 16, y: lane(i).y + 38 } : { x: lane(i).x + lane(i).w - 16 - tokenW, y: lane(i).y + 8 };

  const activeLane = LANES.reduce((found, _, i) => frame >= T.lanes[i]! ? i : found, -1);
  const tokenLane = Math.max(0, activeLane);

  // The analysis card flies from lane to lane as it is promoted.
  const flight = activeLane > 0 ? ease(frame, T.lanes[activeLane]!, T.lanes[activeLane]! + 20) : 1;
  const from = tokenPos(Math.max(0, tokenLane - 1));
  const to = tokenPos(tokenLane);
  const tokenX = lerp(from.x, to.x, flight);
  const tokenY = lerp(from.y, to.y, flight);
  const tokenXArc = tokenX + (wide ? 0 : Math.sin(Math.PI * flight) * 14);
  const tokenTone = LANES[tokenLane]!.tone;
  const tokenIn = pop(frame, T.lanes[0]);

  // Opening probe: a query aimed at the raw tables is refused and rerouted.
  const probeX = wide ? 250 : 200;
  const probeDown: [number, number][] = [[probeX, wide ? 110 : 96], [probeX, raw.y + raw.h / 2]];
  const probeUp: [number, number][] = [[probeX + 28, raw.y + 4], [probeX + 28, chip(0).y + chip(0).h / 2]];
  const probeT = ease(frame, T.probe, T.bounce);
  const rerouteT = ease(frame, T.bounce + 6, T.bounce + 24);
  const probeFade = 1 - ease(frame, T.lanes[0] - 16, T.lanes[0]);

  const camera = [
    { at: 0 },
    { at: T.lanes[1] - 10, dur: 60, zoom: 1.025, focus: [lerp(width / 2, lane(1).x + lane(1).w / 2, .2), lerp(height / 2, lane(1).y + 60, .2)] as const },
    { at: T.lanes[2] + 20, dur: 60, zoom: 1 },
  ];

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    {/* Raw tables: not where self-service starts. */}
    <g {...enter(frame, 4)}>
      <Box x={raw.x} y={raw.y} w={raw.w} h={raw.h} tone="muted" variant="ghost" radius={10} />
      <Text x={raw.x + 16} y={raw.y + raw.h / 2} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "tables brutes" : "raw tables"}</Text>
    </g>

    {/* Modelling and controls: where self-service actually starts. */}
    <g {...enter(frame, 0)}>
      <Box x={layer.x} y={layer.y} w={layer.w} h={layer.h} tone="ok" radius={14} />
      <g opacity={wide ? 1 : easeOut(frame, T.lanes[0], T.lanes[0] + 16)}>
        <Text x={wide ? layer.x + layer.w - 4 : raw.x + raw.w - 16} y={wide ? layer.y - 12 : raw.y + raw.h / 2} size={11} font="mono" weight={600} tone="ok" anchor="end" caps>{fr ? "▲ le libre-service commence ici" : "▲ self-service starts here"}</Text>
      </g>
    </g>
    {LAYER.map((name, index) => {
      const c = chip(index);
      const lit = activeLane >= 0 && LANES[activeLane]!.uses.includes(index) ? ease(frame, T.lanes[activeLane]! + 8, T.lanes[activeLane]! + 18) : 0;
      const rerouted = index === 0 ? ease(frame, T.bounce + 22, T.bounce + 30) * probeFade : 0;
      const glow = Math.max(lit, rerouted);
      return <g key={index} {...enter(frame, stagger(index, 6, 4), { distance: 8 })}>
        <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={8} style={{ fill: tint("ok", 6 + 16 * glow) }} stroke={TONE.ok} strokeOpacity={.3 + .5 * glow} strokeWidth={1} />
        <Text x={c.x + c.w / 2} y={c.y + c.h / 2 + .5} size={wide ? 13 : 12} font="mono" weight={600} anchor="middle" tone={glow > .5 ? "ok" : "ink"}>{name[locale]}</Text>
      </g>;
    })}

    {/* The probe: straight to the raw tables, refused, rerouted to governed marts. */}
    {probeFade > 0 ? <g opacity={probeFade}>
      <Comet points={probeDown} t={probeT} tone="danger" r={5} tail={.3} />
      {frame >= T.bounce ? <>
        <Pulse x={probeX} y={raw.y + raw.h / 2} frame={frame} at={T.bounce} period={40} r={8} tone="danger" />
        <Text x={probeX} y={raw.y + raw.h / 2 + 1} size={13} font="mono" weight={700} tone="danger" anchor="middle" opacity={pop(frame, T.bounce)}>✗</Text>
      </> : null}
      <Tag x={probeX + 22} y={raw.y + raw.h / 2} anchor="start" size={11} text={fr ? "pas d’accès direct" : "no direct access"} tone="danger" appear={pop(frame, T.bounce + 2)} />
      <Comet points={probeUp} t={rerouteT} tone="ok" r={4.5} tail={.3} />
    </g> : null}

    {LANES.map((l, i) => {
      const g = lane(i);
      const on = frame >= T.lanes[i]!;
      const active = i === activeLane && frame < T.permissions;
      const done = frame >= laneDoneAt(i);
      const presence = .45 + .55 * easeOut(frame, T.lanes[i]! - 12, T.lanes[i]! + 4);
      return <g key={l.key} {...enter(frame, stagger(i, 16, 6))}>
        <g opacity={presence}>
          <Box x={g.x} y={g.y} w={g.w} h={g.h} tone={on ? l.tone : "muted"} focus={active ? ease(frame, T.lanes[i]!, T.lanes[i]! + 12) : 0} radius={16}>
            <Text x={g.x + 16} y={g.y + 20} size={11} font="mono" weight={600} tone={on ? l.tone : "muted"} caps>{String(i + 1).padStart(2, "0")}</Text>
            <Text x={g.x + 42} y={g.y + 20} size={wide ? 16 : 15} weight={600} tone={on ? "ink" : "muted"}>{l.title[locale]}</Text>
            {wide ? <line x1={g.x + 16} x2={g.x + g.w - 16} y1={g.y + 72} y2={g.y + 72} stroke="var(--scene-hairline)" strokeWidth={1} opacity={.6} /> : null}
            {l.checks.map((check, c) => {
              const p = checkPos(i, c);
              const state = frame >= checkAt(i, c) ? "pass" : "pending";
              return <g key={c} opacity={.6 + .4 * easeOut(frame, T.lanes[i]! + 6 + c * 4, T.lanes[i]! + 20 + c * 4)}>
                <g transform={state === "pass" ? `translate(${p.x} ${p.y}) scale(${.8 + .2 * pop(frame, checkAt(i, c), 220)}) translate(${-p.x} ${-p.y})` : undefined}>
                  <Checkpoint x={p.x} y={p.y} r={8} state={state} />
                </g>
                <Text x={p.x + 16} y={p.y} size={13} font="mono" weight={500} tone={state === "pass" ? "ink" : "muted"}>{check[locale]}</Text>
              </g>;
            })}
          </Box>
        </g>
        {i < LANES.length - 1 && frame >= T.lanes[i + 1]! + 12 ? <Tag x={tokenPos(i).x + (wide ? 0 : tokenW)} y={tokenPos(i).y + 13} anchor={wide ? "start" : "end"} size={11} tone="muted"
          text={fr ? "✓ promue" : "✓ promoted"} appear={easeOut(frame, T.lanes[i + 1]! + 12, T.lanes[i + 1]! + 26)} /> : null}
        {done && i < LANES.length - 1 && wide ? <Text x={g.x + g.w + 10} y={g.y + 51} size={14} font="mono" weight={700} tone="muted" anchor="middle" opacity={easeOut(frame, laneDoneAt(i), laneDoneAt(i) + 12)}>›</Text> : null}
      </g>;
    })}

    {/* The layer feeds the active lane. */}
    {LANES.map((l, i) => l.uses.map((index) => {
      const c = chip(index);
      const g = lane(i);
      const start: [number, number] = [c.x + c.w / 2, c.y];
      const end: [number, number] = wide ? [g.x + g.w / 2, g.y + g.h] : [g.x + 40 + index * 30, g.y + g.h];
      const bend: [number, number] = wide ? [start[0], lerp(start[1], end[1], .5)] : [start[0], start[1] - 12];
      const bend2: [number, number] = wide ? [end[0], lerp(start[1], end[1], .5)] : [end[0], start[1] - 12];
      return <Comet key={`${i}-${index}`} points={[start, bend, bend2, end]} t={ease(frame, T.lanes[i]! + 4, T.lanes[i]! + 20)} tone="ok" r={4} tail={.3} />;
    }))}

    {/* The analysis being promoted. */}
    {activeLane >= 0 ? <g opacity={tokenIn} transform={`translate(${tokenXArc + tokenW / 2} ${tokenY + 13}) scale(${.9 + .1 * tokenIn}) translate(${-tokenXArc - tokenW / 2} ${-tokenY - 13})`}>
      <rect className="scene-card" x={tokenXArc} y={tokenY} width={tokenW} height={26} rx={13} style={{ fill: "var(--scene-card)" }} />
      <rect className="scene-glow" x={tokenXArc} y={tokenY} width={tokenW} height={26} rx={13} style={{ fill: tint(tokenTone, 18), color: TONE[tokenTone] }} stroke={TONE[tokenTone]} strokeOpacity={.7} strokeWidth={1} />
      {LANES.map((l, i) => {
        const shown = i === tokenLane ? (i === 0 ? 1 : easeOut(frame, T.lanes[i]! + 7, T.lanes[i]! + 16)) : i === tokenLane - 1 ? 1 - ease(frame, T.lanes[tokenLane]! + 2, T.lanes[tokenLane]! + 10) : 0;
        return shown > 0 ? <Text key={l.key} x={tokenXArc + tokenW / 2} y={tokenY + 13.5} size={12} font="mono" weight={600} anchor="middle" tone={l.tone} opacity={shown}>{l.token[locale]}</Text> : null;
      })}
    </g> : null}

    <Tag x={width / 2} y={wide ? 384 : 476} size={wide ? 13 : 12} tone="hot" appear={pop(frame, T.permissions)}
      text={fr ? "explorer et publier ne demandent pas les mêmes droits" : "exploring and publishing need different permissions"} />
  </Camera>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 30,
  title: { en: "Three lanes, three sets of controls", fr: "Trois voies, trois niveaux de contrôle" },
  caption: {
    en: "Self-service starts after modelling and controls, not at the raw-table layer. Each promotion adds controls instead of imposing regulatory rigour on every exploration.",
    fr: "Le libre-service commence après la modélisation et les contrôles, pas au niveau des tables brutes. Chaque promotion ajoute des contrôles au lieu d’imposer à toute exploration la rigueur d’un reporting réglementaire.",
  },
  beats: [
    { at: 0, text: { en: "Opening every raw table pushes domain decisions onto whoever writes the query.", fr: "Ouvrir toutes les tables brutes transfère les décisions métier à qui écrit la requête." } },
    { at: T.lanes[0], text: { en: "Exploration: bounded access over governed marts, temporary output, visible assumptions.", fr: "Exploration\u00a0: accès borné aux marts gouvernés, résultat temporaire, hypothèses visibles." } },
    { at: T.lanes[1], text: { en: "Certified metric: a versioned definition in the semantic layer, an owner, tests, a freshness policy.", fr: "Métrique certifiée\u00a0: définition versionnée dans la couche sémantique, responsable, tests, fraîcheur." } },
    { at: T.lanes[2], text: { en: "Decision or publication: provenance shown, access enforced, review proportional to impact.", fr: "Décision ou diffusion\u00a0: provenance affichée, accès contrôlés, revue proportionnée à l’impact." } },
    { at: T.permissions, text: { en: "Exploring and publishing need different permissions; none of the tools replaces the domain contract.", fr: "Explorer et publier ne demandent pas les mêmes droits\u00a0; aucun outil ne remplace le contrat métier." } },
  ],
  Stage,
});
