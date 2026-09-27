import { Box, Boundary, Camera, Checkpoint, CodeBlock, Comet, ease, easeOut, enter, lerp, pop, Pulse, stagger, Tag, Text, tint, TONE, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Timeline (30 fps). Act 1: the config change is pushed inbound and bounces off
// the firewall. Act 2: the agent dials out, the answer is held open as a stream.
// Act 3: the very same change rides that open pipe down to the database.
const T = {
  chipIn: 34,
  inbound: 60,
  hit: 82,
  back: 104,
  dial: 150,
  cross: 170,
  docked: 190,
  headers: 200,
  open: 238,
  push: 300,
  arrive: 332,
  toDb: 338,
  applied: 362,
  end: 450,
} as const;

type Pt = readonly [number, number];
type Rect = { x: number; y: number; w: number; h: number };

type Layout = {
  control: Rect;
  agent: Rect;
  db: Rect;
  net: Rect;
  rules: Rect;
  code: { x: number; y: number; w: number; size: number };
  /** Firewall band: along y (vertical) or x (horizontal), `at` is its centre line. */
  wall: { vertical: boolean; at: number; from: number; to: number };
  wallLabel: { x: number; y: number; anchor: "start" | "middle" | "end" };
  /** Lane from the control plane (start) to the agent (end). */
  lane: readonly [Pt, Pt];
  gate: Pt;
  rest: Pt;
  hit: Pt;
  enterAgent: Pt;
  open: { x: number; y: number; anchor: "start" | "middle" };
  getLabel: number;
  aside: Pt;
};

const WIDE_LAYOUT: Layout = {
  control: { x: 40, y: 104, w: 210, h: 84 },
  agent: { x: 528, y: 104, w: 160, h: 84 },
  db: { x: 744, y: 104, w: 148, h: 84 },
  net: { x: 500, y: 64, w: 420, h: 328 },
  rules: { x: 528, y: 222, w: 364, h: 146 },
  code: { x: 40, y: 236, w: 400, size: 15 },
  wall: { vertical: true, at: 478, from: 64, to: 392 },
  wallLabel: { x: 478, y: 44, anchor: "middle" },
  lane: [[250, 146], [528, 146]],
  gate: [478, 146],
  rest: [326, 146],
  hit: [408, 146],
  enterAgent: [566, 146],
  open: { x: 364, y: 180, anchor: "middle" },
  getLabel: 178,
  aside: [0, -36],
};

const COMPACT_LAYOUT: Layout = {
  control: { x: 20, y: 60, w: 250, h: 68 },
  agent: { x: 40, y: 282, w: 210, h: 64 },
  db: { x: 290, y: 282, w: 210, h: 64 },
  net: { x: 20, y: 258, w: 500, h: 246 },
  rules: { x: 40, y: 376, w: 460, h: 116 },
  code: { x: 40, y: 384, w: 460, size: 14 },
  wall: { vertical: false, at: 236, from: 20, to: 520 },
  wallLabel: { x: 516, y: 214, anchor: "end" },
  lane: [[145, 128], [145, 282]],
  gate: [145, 236],
  rest: [145, 160],
  hit: [145, 214],
  enterAgent: [145, 304],
  open: { x: 166, y: 214, anchor: "start" },
  getLabel: 214,
  aside: [84, 0],
};

function Firewall({ vertical, at, from, to, appear }: Layout["wall"] & { appear: number }) {
  if (appear <= 0) return null;
  const length = (to - from) * appear;
  const ticks = Array.from({ length: Math.floor(length / 16) }, (_, index) => from + 8 + index * 16);
  return <g>
    {vertical
      ? <rect x={at - 5} y={from} width={10} height={length} rx={5} style={{ fill: tint("hot", 14) }} stroke={TONE.hot} strokeOpacity={.5} strokeWidth={1} />
      : <rect x={from} y={at - 5} width={length} height={10} rx={5} style={{ fill: tint("hot", 14) }} stroke={TONE.hot} strokeOpacity={.5} strokeWidth={1} />}
    {ticks.map((tick) => vertical
      ? <line key={tick} x1={at - 5} x2={at + 5} y1={tick} y2={tick} stroke={TONE.hot} strokeOpacity={.32} strokeWidth={1} />
      : <line key={tick} x1={tick} x2={tick} y1={at - 5} y2={at + 5} stroke={TONE.hot} strokeOpacity={.32} strokeWidth={1} />)}
  </g>;
}

/** A small card that physically travels: the config change itself. */
function Packet({ x, y, text, tone, opacity = 1, scale = 1 }: { x: number; y: number; text: string; tone: Tone; opacity?: number; scale?: number }) {
  if (opacity <= 0) return null;
  const w = text.length * 13 * .6 + 26;
  const h = 30;
  return <g opacity={opacity} transform={`translate(${x} ${y}) scale(${scale})`}>
    <rect className="scene-card" x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} style={{ fill: "var(--scene-card)" }} />
    <rect className="scene-glow" x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} style={{ fill: tint(tone, 18), color: TONE[tone] }} stroke={TONE[tone]} strokeOpacity={.6} strokeWidth={1} />
    <Text x={0} y={.5} size={13} font="mono" weight={600} tone={tone} anchor="middle">{text}</Text>
  </g>;
}

/** Ring that fires once at `at`. */
const Once = ({ x, y, frame, at, tone }: { x: number; y: number; frame: number; at: number; tone: Tone }) =>
  frame >= at && frame < at + 36 ? <Pulse x={x} y={y} frame={frame} at={at} period={36} r={16} tone={tone} /> : null;

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const L = compact ? COMPACT_LAYOUT : WIDE_LAYOUT;
  const { control: cp, agent, db, net, rules, lane, gate } = L;
  const t = {
    control: fr ? "Plan de contrôle" : "Control plane",
    agentSub: fr ? "serveur du client" : "customer server",
    db: fr ? "Base" : "Database",
    dbSub: fr ? "du client" : "customer",
    network: fr ? "réseau client" : "customer network",
    firewall: fr ? "pare-feu" : "firewall",
    rules: fr ? "règles du pare-feu" : "firewall rules",
    inbound: fr ? "← entrant" : "← inbound",
    inboundWhat: fr ? "internet → client" : "internet → customer",
    outbound: fr ? "→ sortant" : "→ outbound",
    deny: fr ? "REFUSÉ ✗" : "DENY ✗",
    allow: fr ? "AUTORISÉ ✓" : "ALLOW ✓",
    change: fr ? "nouvelle config" : "config change",
    received: fr ? "reçu ✓" : "received ✓",
    never: fr ? "// … jamais fermée" : "// … never closed",
    response: fr ? "réponse du serveur" : "server response",
  };

  // Act 1: the change is pushed inbound, bumps into the wall and slides back.
  const approach = ease(frame, T.inbound, T.hit, (x) => x * x * x);
  const bump = frame >= T.hit ? Math.sin(Math.min(1, (frame - T.hit) / 12) * Math.PI) * 9 : 0;
  const retreat = ease(frame, T.back, T.back + 26);
  const denied = frame >= T.hit && frame < T.back + 22;
  const along1 = (from: Pt, to: Pt, k: number): [number, number] => [lerp(from[0], to[0], k), lerp(from[1], to[1], k)];
  const [hx, hy] = along1(L.rest, L.hit, approach * (1 - retreat));
  const recoil = L.wall.vertical ? [hx - bump, hy] : [hx, hy - bump];

  // Act 3: the same card rides the open pipe into the agent.
  const ride = ease(frame, T.push, T.arrive);
  const [rx, ry] = along1(L.rest, L.enterAgent, ride);
  const riding = frame >= T.push;
  // While the GET travels the lane, the waiting change steps aside, then returns.
  const aside = ease(frame, T.dial - 14, T.dial + 4) * (1 - ease(frame, T.open, T.open + 22));
  const chipPos = riding ? [rx, ry] : [recoil[0]! + aside * L.aside[0], recoil[1]! + aside * L.aside[1]];
  const chipOpacity = easeOut(frame, T.chipIn, T.chipIn + 16) * (1 - ease(frame, T.arrive - 8, T.arrive + 2));
  const chipTone: Tone = denied ? "danger" : riding ? "ok" : "hot";

  // Act 2: the agent dials out; the GET travels agent → control plane.
  const dialT = ease(frame, T.dial, T.docked);
  const dialPath: Pt[] = [lane[1], lane[0]];
  const [gx, gy] = along1(lane[1], lane[0], dialT);
  const crossed = frame >= T.cross;
  const openOn = easeOut(frame, T.open, T.open + 20);
  const openSeconds = Math.max(0, Math.floor((frame - T.docked) / 30));

  const gateState = crossed ? "pass" : frame >= T.hit ? "fail" : "pending";
  const denyRow = frame >= T.hit ? ease(frame, T.hit, T.hit + 8) * (1 - ease(frame, T.dial - 10, T.dial + 6)) : 0;
  const allowRow = ease(frame, T.cross, T.cross + 8);

  const toDb: Pt[] = [[agent.x + agent.w, agent.y + agent.h / 2], [db.x, db.y + db.h / 2]];
  const dbT = ease(frame, T.toDb, T.applied);
  const applied = pop(frame, T.applied);

  const laneD = `M${lane[0][0]} ${lane[0][1]}L${lane[1][0]} ${lane[1][1]}`;
  const dialD = `M${lane[1][0]} ${lane[1][1]}L${lane[1][0] + (lane[0][0] - lane[1][0]) * dialT} ${lane[1][1] + (lane[0][1] - lane[1][1]) * dialT}`;

  // Lean a fifth of the way toward whatever decides; never crop.
  const lean = (p: Pt): Pt => [lerp(width / 2, p[0], .2), lerp(height / 2, p[1], .2)];
  const camera = [
    { at: 0 },
    { at: T.inbound - 10, zoom: 1.035, focus: lean(gate) },
    { at: T.headers - 6, zoom: 1.02, focus: lean([L.code.x + L.code.w / 2, L.code.y + 50]) },
    { at: T.push - 6, zoom: 1.035, focus: lean([db.x, db.y + db.h / 2]) },
    { at: T.applied + 30, dur: 60, zoom: 1 },
  ];

  const rowH = compact ? 34 : 36;
  const ruleRows = [
    { dir: t.inbound, what: t.inboundWhat, verdict: t.deny, tone: "danger" as Tone, on: denyRow },
    { dir: t.outbound, what: "HTTPS", verdict: t.allow, tone: "ok" as Tone, on: allowRow },
  ];
  const rowY = (index: number) => rules.y + (compact ? 54 : 62) + index * (rowH + 8);

  // Compact: the response editor takes the slot under the agent once headers arrive.
  const codeAppear = easeOut(frame, T.headers - 6, T.headers + 10);

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    <Boundary x={net.x} y={net.y} w={net.w} h={net.h} label={t.network} labelAt="top-end" appear={easeOut(frame, 0, 18)} />
    <Firewall {...L.wall} appear={easeOut(frame, 4, 30)} />
    <g opacity={easeOut(frame, 14, 30)}>
      <Tag x={L.wallLabel.x} y={L.wallLabel.y} text={t.firewall} tone="hot" size={11} anchor={L.wallLabel.anchor} />
    </g>

    {/* The lane: faint until a connection actually exists on it. */}
    <path d={laneD} fill="none" stroke="var(--scene-hairline)" strokeWidth={1} strokeDasharray="2 6" opacity={easeOut(frame, 20, 36) * (1 - openOn)} />
    {frame >= T.dial && frame < T.open + 20 ? <path d={dialD} fill="none" stroke={TONE.line} strokeWidth={1.5} strokeLinecap="round" opacity={.8 * (1 - openOn)} /> : null}
    {openOn > 0 ? <g opacity={openOn}>
      <path d={laneD} fill="none" style={{ stroke: tint("ok", 12) }} strokeWidth={16} strokeLinecap="round" />
      <path d={laneD} fill="none" stroke={TONE.ok} strokeWidth={1.5} strokeOpacity={.45} />
      <path className="scene-glow" d={laneD} fill="none" stroke={TONE.ok} strokeWidth={2.5} strokeLinecap="round" strokeDasharray="1.5 13" strokeDashoffset={-frame * 1.1} style={{ color: TONE.ok }} />
    </g> : null}

    <g {...enter(frame, stagger(0, 8, 6), { from: "right" })}>
      <Box x={cp.x} y={cp.y} w={cp.w} h={cp.h} label={t.control} sub="Forest Admin" labelSize={compact ? 18 : 19} focus={frame >= T.inbound && frame < T.hit ? 1 : ease(frame, T.docked - 6, T.docked) * (1 - ease(frame, T.headers + 20, T.headers + 36))} />
    </g>
    <g {...enter(frame, stagger(1, 8, 6), { from: "left" })}>
      <Box
        x={agent.x} y={agent.y} w={agent.w} h={agent.h} label="Agent" sub={t.agentSub} labelSize={compact ? 18 : 19}
        tone={frame >= T.arrive - 4 ? "ok" : "line"}
        focus={frame >= T.dial - 6 && frame < T.cross ? ease(frame, T.dial - 6, T.dial + 4) : frame >= T.arrive - 4 ? ease(frame, T.arrive - 4, T.arrive + 4) * (1 - ease(frame, T.applied, T.applied + 16)) : 0}
      />
    </g>
    <g {...enter(frame, stagger(2, 8, 6), { from: "left" })}>
      <Box x={db.x} y={db.y} w={db.w} h={db.h} label={t.db} sub={t.dbSub} labelSize={compact ? 18 : 19} tone={frame >= T.applied ? "ok" : "line"} fill={applied * .8} focus={applied * (1 - ease(frame, T.applied + 40, T.applied + 70))} />
      <line x1={toDb[0]![0]} y1={toDb[0]![1]} x2={toDb[1]![0]} y2={toDb[1]![1]} stroke="var(--scene-hairline)" strokeWidth={1} />
    </g>
    <Comet points={toDb} t={dbT} tone="ok" r={5} tail={.5} />
    <Tag x={db.x + db.w / 2} y={db.y + db.h + (compact ? 16 : 18)} text={t.received} tone="ok" size={12} appear={applied} />
    <Once x={db.x + db.w / 2} y={db.y + db.h / 2} frame={frame} at={T.applied} tone="ok" />

    {/* The rule the firewall actually applies: who opened the connection. */}
    {/* Compact: the rules yield their slot to the response editor. */}
    <g {...enter(frame, stagger(3, 8, 6))} opacity={enter(frame, stagger(3, 8, 6)).opacity * (compact ? 1 - ease(frame, T.headers - 14, T.headers) : 1)}>
      <Box x={rules.x} y={rules.y} w={rules.w} h={rules.h} tone="hot" radius={14}>
        <Text x={rules.x + 18} y={rules.y + 24} size={11} weight={600} font="mono" tone="muted" caps>{t.rules}</Text>
        {ruleRows.map((row, index) => {
          const y = rowY(index);
          return <g key={row.dir} {...enter(frame, stagger(index, 36, 6), { distance: 8 })}>
            <rect x={rules.x + 10} y={y - rowH / 2} width={rules.w - 20} height={rowH} rx={9} style={{ fill: row.on > 0 ? tint(row.tone, 16 * row.on) : tint("ink", 4) }} />
            {row.on > 0 ? <rect x={rules.x + 10} y={y - rowH / 2 + 6} width={3} height={rowH - 12} rx={1.5} fill={TONE[row.tone]} opacity={row.on} /> : null}
            <Text x={rules.x + 22} y={y} size={compact ? 14.5 : 15} weight={600} font="mono">{row.dir}</Text>
            <Text x={rules.x + (compact ? 140 : 128)} y={y} size={13} weight={500} font="mono" tone="muted">{row.what}</Text>
            <Text x={rules.x + rules.w - 22} y={y} size={13} weight={700} font="mono" tone={row.on > .5 ? row.tone : "muted"} anchor="end">{row.verdict}</Text>
          </g>;
        })}
      </Box>
    </g>

    <CodeBlock
      x={L.code.x} y={L.code.y} w={L.code.w} frame={frame} size={L.code.size} title={t.response}
      appear={codeAppear}
      highlight={frame >= T.headers + 40 ? 1 : undefined}
      lines={[
        { text: "HTTP/1.1 200 OK", appearAt: T.headers },
        { text: "Content-Type: text/event-stream", tone: frame >= T.headers + 40 ? "ok" : undefined, appearAt: T.headers + 18 },
        { text: t.never, appearAt: T.open + 8 },
      ]}
    />

    <Checkpoint x={gate[0]} y={gate[1]} state={gateState} appear={easeOut(frame, 22, 36)} r={13} />
    <Once x={gate[0]} y={gate[1]} frame={frame} at={T.hit} tone="danger" />
    <Once x={gate[0]} y={gate[1]} frame={frame} at={T.cross} tone="ok" />

    {/* The outbound GET: a packet leaving the agent, drawing the lane behind it. */}
    <Comet points={dialPath} t={dialT} tone="line" r={6} tail={.3} />
    {dialT > 0 && dialT < 1 ? <g opacity={Math.min(1, dialT * 5) * (1 - ease(frame, T.docked - 8, T.docked))}>
      <Tag x={compact ? gx - 18 : gx} y={compact ? gy : L.getLabel} text="HTTPS GET" tone="line" size={12} anchor={compact ? "end" : "middle"} />
    </g> : null}

    <Tag
      x={L.open.x} y={L.open.y} anchor={L.open.anchor} tone="ok" size={12}
      text={fr ? `connexion ouverte · ${openSeconds} s` : `connection open · ${openSeconds} s`}
      appear={openOn * (compact ? 1 - ease(frame, T.push - 10, T.push) + ease(frame, T.arrive, T.arrive + 10) : 1)}
    />

    <Packet x={chipPos[0]!} y={chipPos[1]!} text={t.change} tone={chipTone} opacity={chipOpacity} scale={1 - .15 * ease(frame, T.arrive - 10, T.arrive)} />
  </Camera>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.applied + 40,
  title: { en: "Who dials through the firewall", fr: "Qui appelle à travers le pare-feu" },
  caption: {
    en: "The firewall judges who opens the connection, not which way data flows. An outbound HTTPS GET held open as an SSE stream lets the control plane push without a single inbound port.",
    fr: "Le pare-feu juge qui ouvre la connexion, pas le sens des données. Une requête HTTPS GET sortante maintenue ouverte en flux SSE permet au plan de contrôle de pousser sans aucun port entrant.",
  },
  beats: [
    { at: 0, text: { en: "The control plane must push a config change to a customer’s database.", fr: "Le plan de contrôle doit pousser un changement de config jusqu’à la base du client." } },
    { at: T.inbound, text: { en: "Naive answer: call an endpoint on the customer’s side. That needs an inbound port: denied.", fr: "Réponse naïve : appeler une API côté client. Il faut un port entrant : refusé." } },
    { at: T.dial, text: { en: "Flip who dials: the agent sends a standard outbound HTTPS GET. Firewalls love outbound HTTPS.", fr: "On inverse l’appelant : l’agent envoie un HTTPS GET sortant. Les pare-feu adorent le HTTPS sortant." } },
    { at: T.headers, text: { en: "The server answers Content-Type: text/event-stream and simply never closes the connection.", fr: "Le serveur répond Content-Type: text/event-stream et ne ferme tout simplement jamais la connexion." } },
    { at: T.push, text: { en: "The same change now rides the already-open pipe: the connection came from inside the house.", fr: "Le même changement emprunte le tuyau déjà ouvert : la connexion vient de l’intérieur." } },
  ],
  Stage,
});
