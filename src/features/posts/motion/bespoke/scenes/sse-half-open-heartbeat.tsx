import { Axis, Box, Camera, Comet, ease, easeOut, enter, lerp, Meter, pop, Pulse, stagger, Tag, Text, TONE, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Two replays of the same idle connection, on a simulated clock (2 frames per second).
// Act 1: no traffic, the middlebox drops it at 60 s idle. Act 2: a ping every 30 s,
// then the server vanishes and the missing ping becomes the signal.
const RATE = 2;
const IDLE_LIMIT = 60;
const PING_EVERY = 30;
const VANISH_AT = 70;
const DEAD_AT = 60 + PING_EVERY;
const SPAN = 100;

const T = {
  sim1: 20,
  stop1: 20 + 72 * RATE,
  reset: 200,
  sim2: 228,
  stop2: 228 + 96 * RATE,
  end: 500,
} as const;
const drop1 = T.sim1 + IDLE_LIMIT * RATE;
const vanish = T.sim2 + VANISH_AT * RATE;
const dead = T.sim2 + DEAD_AT * RATE;
const PINGS = [PING_EVERY, 2 * PING_EVERY] as const;
/** Frames a ping takes to travel control plane → proxy → agent. */
const PING_TRAVEL = 10;

type Rect = { x: number; y: number; w: number; h: number };
type Pt = readonly [number, number];
type Layout = {
  agent: Rect;
  proxy: Rect;
  server: Rect;
  labelSize: number;
  statusY: number;
  meterY: number;
  meterInset: number;
  silentY: number;
  monitor: Rect;
  baseline: number;
  axisY: number;
  x0: number;
  x1: number;
  compact: boolean;
};

const WIDE_LAYOUT: Layout = {
  agent: { x: 40, y: 72, w: 200, h: 72 },
  proxy: { x: 380, y: 72, w: 200, h: 72 },
  server: { x: 720, y: 72, w: 200, h: 72 },
  labelSize: 19,
  statusY: 162,
  meterY: 210,
  meterInset: 14,
  silentY: 208,
  monitor: { x: 40, y: 250, w: 880, h: 142 },
  baseline: 330,
  axisY: 364,
  x0: 76, x1: 884,
  compact: false,
};

const COMPACT_LAYOUT: Layout = {
  agent: { x: 20, y: 60, w: 152, h: 64 },
  proxy: { x: 194, y: 60, w: 152, h: 64 },
  server: { x: 368, y: 60, w: 152, h: 64 },
  labelSize: 16,
  statusY: 146,
  meterY: 204,
  meterInset: 6,
  silentY: 250,
  monitor: { x: 20, y: 282, w: 500, h: 208 },
  baseline: 404,
  axisY: 460,
  x0: 44, x1: 496,
  compact: true,
};

/** ECG-style blip for a ping at `p`: sharp rise, undershoot, settle. */
function blip(s: number, p: number) {
  const d = s - p;
  if (d < 0 || d > 1.6) return 0;
  if (d < .35) return d / .35;
  if (d < .7) return 1 - 1.45 * (d - .35) / .35;
  return -.45 * (1 - (d - .7) / .9);
}

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const L = compact ? COMPACT_LAYOUT : WIDE_LAYOUT;
  const act2 = frame >= T.reset;
  const clear = act2 ? easeOut(frame, T.reset, T.reset + 18) : 1 - ease(frame, T.reset - 18, T.reset);
  const simStart = act2 ? T.sim2 : T.sim1;
  const simStop = act2 ? T.stop2 : T.stop1;
  const sim = Math.max(0, (Math.min(frame, simStop) - simStart) / RATE);

  const dropped = !act2 && frame >= drop1;
  const vanished = act2 && frame >= vanish;
  const declaredDead = act2 && frame >= dead;
  // Timers reset as the ping passes: the travel is drawn slower than real time,
  // so the watchdog is keyed to the ping's send time, not to the drawn arrival.
  const pingPassedProxy = (p: number) => frame >= T.sim2 + p * RATE + PING_TRAVEL / 2;
  const lastAtProxy = act2 ? Math.max(0, ...PINGS.filter(pingPassedProxy)) : 0;
  const lastAtAgent = act2 ? Math.max(0, ...PINGS.filter((p) => sim >= p)) : 0;
  const idle = act2 ? Math.max(0, sim - lastAtProxy) : Math.min(sim, IDLE_LIMIT);
  const sincePing = Math.max(0, sim - lastAtAgent);

  const t = {
    proxy: "Proxy / LB",
    proxySub: fr ? "sur le trajet" : "in the middle",
    server: fr ? "Plan de contrôle" : "Control plane",
    open: fr ? "ouverte ✓" : "open ✓",
    thinks: fr ? "croit\u00a0: ouverte" : "thinks: open",
    idle: fr ? "inactivité" : "idle",
    watchdog: compact ? (fr ? "sans ping" : "since ping") : (fr ? "depuis le dernier ping" : "since last ping"),
    silent: fr ? "coupée en silence · ni FIN ni RST" : "dropped silently · no FIN, no RST",
    vanished: fr ? "disparu" : "vanished",
    dead: fr ? "morte → reconnexion" : "dead → reconnect",
    wire: fr ? "trafic sur la connexion" : "traffic on the wire",
    drop: fr ? "coupure à 60 s" : "dropped at 60 s",
    noPing: fr ? "30 s sans ping → morte" : "30 s without ping → dead",
  };

  const A = L.agent;
  const P = L.proxy;
  const S = L.server;
  const seg1: [Pt, Pt] = [[A.x + A.w, A.y + A.h / 2], [P.x, P.y + P.h / 2]];
  const seg2: [Pt, Pt] = [[P.x + P.w, P.y + P.h / 2], [S.x, S.y + S.h / 2]];
  const seg1Broken = dropped || declaredDead;
  const seg2Broken = dropped || vanished;
  const segment = ([from, to]: [Pt, Pt], broken: boolean, key: string) => <line
    key={key} x1={from[0] + 4} y1={from[1]} x2={to[0] - 4} y2={to[1]}
    stroke={TONE[broken ? "danger" : "ok"]} strokeWidth={broken ? 1.5 : 1.75} strokeLinecap="round"
    strokeDasharray={broken ? "2 6" : undefined} strokeOpacity={broken ? .8 : .7}
  />;

  // Ping packets: control plane → proxy → agent.
  const pingPath: Pt[] = [seg2[1], seg2[0], seg1[1], seg1[0]];
  const pings = act2 ? PINGS.map((p) => {
    const at = T.sim2 + p * RATE;
    return <Comet key={p} points={pingPath} t={ease(frame, at, at + PING_TRAVEL, (v) => v)} tone="ok" r={5.5} tail={.18} />;
  }) : null;

  // Monitor: a heartbeat trace of what actually crosses the wire.
  const mx = (s: number) => lerp(L.x0, L.x1, s / SPAN);
  const amp = compact ? 30 : 26;
  const cut = act2 ? VANISH_AT : IDLE_LIMIT;
  const traceY = (s: number) => L.baseline - (act2 ? PINGS.reduce((sum, p) => sum + blip(s, p), 0) * amp : 0);
  const trace = (from: number, to: number) => {
    if (to <= from) return "";
    const steps = Math.max(1, Math.ceil((to - from) / .1));
    return Array.from({ length: steps + 1 }, (_, k) => {
      const s = from + (to - from) * k / steps;
      return `${k === 0 ? "M" : "L"}${mx(s).toFixed(1)} ${traceY(s).toFixed(1)}`;
    }).join("");
  };
  const liveEnd = Math.min(sim, cut);
  const headTone: Tone = sim > cut ? "danger" : "ok";

  const statusFor = (side: "agent" | "server") => {
    const lost = side === "server" ? vanished : declaredDead;
    const believes = dropped && frame >= drop1 + 24;
    const text = lost ? (side === "server" ? t.vanished : t.dead) : believes ? t.thinks : t.open;
    const tone: Tone = lost ? "danger" : believes ? "hot" : "ok";
    const key = `${side}-${text}`;
    const since = lost ? (side === "server" ? vanish : dead) : believes ? drop1 + 24 : act2 ? T.reset : 14;
    return { text, tone, key, appear: pop(frame, since) * clear };
  };
  const agentStatus = statusFor("agent");
  const serverStatus = statusFor("server");

  const lean = (p: Pt): Pt => [lerp(width / 2, p[0], .2), lerp(height / 2, p[1], .2)];
  const camera = [
    { at: 0 },
    { at: drop1 - 20, zoom: 1.03, focus: lean([P.x + P.w / 2, P.y + P.h]) },
    { at: T.reset - 10, zoom: 1 },
    { at: vanish - 10, zoom: 1.03, focus: lean([S.x + S.w / 2, L.statusY]) },
    { at: dead - 10, zoom: 1.03, focus: lean([A.x + A.w / 2, L.statusY]) },
  ];

  const meterW = P.w - 2 * L.meterInset;
  const proxyMeterX = P.x + L.meterInset;
  const agentMeterX = A.x + L.meterInset;

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    <g opacity={clear * easeOut(frame, 20, 36)}>
      {segment(seg1, seg1Broken, "a")}
      {segment(seg2, seg2Broken, "b")}
    </g>
    {pings}

    <g {...enter(frame, stagger(0, 2, 6), { from: "left" })}>
      <Box {...A} label="Agent" labelSize={L.labelSize} tone={declaredDead ? "danger" : "line"} focus={declaredDead ? ease(frame, dead, dead + 8) : 0} />
    </g>
    <g {...enter(frame, stagger(1, 2, 6))}>
      <Box {...P} label={t.proxy} sub={t.proxySub} labelSize={L.labelSize} tone={dropped ? "danger" : "hot"} fill={dropped ? pop(frame, drop1) * clear : 0} focus={!act2 && sim > 45 && !dropped ? ease(frame, T.sim1 + 45 * RATE, T.sim1 + 50 * RATE) : 0} />
    </g>
    <g {...enter(frame, stagger(2, 2, 6), { from: "right" })} opacity={enter(frame, stagger(2, 2, 6)).opacity * (vanished ? lerp(1, .45, ease(frame, vanish, vanish + 16)) : 1)}>
      <Box {...S} label={t.server} labelSize={L.labelSize} tone={vanished ? "danger" : "line"} />
    </g>
    {dropped ? <Pulse x={P.x + P.w / 2} y={P.y + P.h / 2} frame={frame} at={drop1} period={40} r={30} tone="danger" /> : null}

    <Tag key={agentStatus.key} x={A.x + A.w / 2} y={L.statusY} text={agentStatus.text} tone={agentStatus.tone} size={12} appear={agentStatus.appear} />
    <Tag key={serverStatus.key} x={S.x + S.w / 2} y={L.statusY} text={serverStatus.text} tone={serverStatus.tone} size={12} appear={serverStatus.appear} />

    {/* The proxy's idle timer, and (act 2) the agent's ping watchdog. */}
    <g opacity={easeOut(frame, 24, 40) * clear * (dropped ? 1 - ease(frame, drop1 + 4, drop1 + 14) : 1)}>
      <Meter
        x={proxyMeterX} y={L.meterY} w={meterW} h={10} value={idle / 70} limit={IDLE_LIMIT / 70}
        tone={act2 ? "ok" : idle > 45 ? "hot" : "line"} label={t.idle} valueLabel={`${Math.floor(idle)} s`} limitLabel="60 s"
      />
    </g>
    {act2 ? <g opacity={easeOut(frame, T.reset + 12, T.reset + 30)}>
      <Meter
        x={agentMeterX} y={L.meterY} w={A.w - 2 * L.meterInset} h={10} value={Math.min(35, sincePing) / 35} limit={PING_EVERY / 35}
        tone={sincePing > 22 ? "hot" : "ok"} label={t.watchdog} valueLabel={`${Math.floor(sincePing)} s`} limitLabel="30 s"
      />
    </g> : null}
    <Tag x={P.x + P.w / 2} y={L.silentY} text={t.silent} tone="danger" size={compact ? 12 : 12.5} appear={dropped ? pop(frame, drop1 + 14) * clear : 0} />

    {/* Monitor: what actually crosses the wire, on the shared clock. */}
    <g {...enter(frame, 12)}>
      <Box {...L.monitor} tone="line" radius={16} />
      <Text x={L.monitor.x + 20} y={L.monitor.y + 24} size={11} weight={600} font="mono" tone="muted" caps>{t.wire}</Text>
    </g>
    <g opacity={clear * easeOut(frame, 16, 30)}>
      <Tag x={L.monitor.x + L.monitor.w - 16} y={L.monitor.y + 24} text={`t = ${Math.floor(sim)} s`} tone="muted" anchor="end" size={11} />
    </g>
    <Axis
      x={L.x0} y={L.axisY} w={L.x1 - L.x0} ticks={Array.from({ length: SPAN / 10 + 1 }, (_, k) => k * 10)}
      format={(s) => (Number(s) % 30 === 0 ? `${s} s` : "")} appear={easeOut(frame, 18, 34)}
    />
    {/* Limits on the clock: the proxy's 60 s idle cut, and the ping period. */}
    <g opacity={easeOut(frame, 24, 40)}>
      <line x1={mx(IDLE_LIMIT)} x2={mx(IDLE_LIMIT)} y1={L.baseline - amp - 10} y2={L.axisY} stroke={TONE.hot} strokeOpacity={.55} strokeWidth={1} strokeDasharray="3 4" />
    </g>
    <g opacity={clear}>
      <path d={trace(0, liveEnd)} fill="none" stroke={TONE.ok} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
      {sim > cut ? <path d={trace(cut, sim)} fill="none" stroke={TONE.danger} strokeWidth={1.5} strokeDasharray="2 5" strokeLinecap="round" /> : null}
      {frame >= simStart ? <circle className="scene-glow" cx={mx(sim)} cy={traceY(sim)} r={4} fill={TONE[headTone]} style={{ color: TONE[headTone] }} /> : null}

      {act2 ? PINGS.map((p) => <Tag key={p} x={mx(p + .35)} y={L.baseline - amp - 16} text="ping" tone="ok" size={11} appear={pop(frame, T.sim2 + p * RATE + 2)} />) : null}
      {!act2 ? <Tag x={mx(IDLE_LIMIT) + 10} y={L.baseline - 22} anchor="start" text={t.drop} tone="danger" size={11} appear={pop(frame, drop1 + 4)} /> : null}
      {act2 ? <>
        <Tag x={mx(VANISH_AT) + 4} y={L.baseline + (compact ? -24 : 18)} anchor="start" text={t.vanished} tone="danger" size={11} appear={pop(frame, vanish + 2)} />
        <Tag x={mx(DEAD_AT) + (compact ? 6 : 0)} y={L.baseline + (compact ? 24 : -24)} anchor={compact ? "end" : "middle"} text={t.noPing} tone="danger" size={11} appear={pop(frame, dead + 2)} />
      </> : null}
    </g>
  </Camera>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.stop2 + 30,
  title: { en: "The silent killer", fr: "Le tueur silencieux" },
  caption: {
    en: "Middleboxes drop idle connections without telling either side. A ping every 30 seconds keeps traffic flowing under the 60-second idle limit and turns silence into a failure the agent can detect.",
    fr: "Les proxys coupent les connexions inactives sans prévenir personne. Un ping toutes les 30 secondes maintient du trafic sous la limite de 60 secondes et transforme le silence en panne détectable par l’agent.",
  },
  beats: [
    { at: 0, text: { en: "An idle SSE connection: nothing to push, so no data crosses the wire. The proxy counts the silence.", fr: "Une connexion SSE inactive : rien à pousser, aucune donnée ne passe. Le proxy compte le silence." } },
    { at: drop1, text: { en: "After 60 seconds of silence, the proxy silently drops the connection. No FIN, no RST reaches either side.", fr: "Après 60 secondes de silence, le proxy coupe sans bruit. Ni FIN ni RST n’arrive d’aucun côté." } },
    { at: drop1 + 24, text: { en: "We think it is open. The agent thinks it is open. Both sides stare at a dead phone line.", fr: "Nous la croyons ouverte. L’agent aussi. Les deux fixent une ligne téléphonique morte." } },
    { at: T.reset, text: { en: "The fix: an application-level ping every 30 seconds. The idle timer never reaches 60.", fr: "La solution : un ping applicatif toutes les 30 secondes. Le minuteur d’inactivité n’atteint jamais 60." } },
    { at: vanish, text: { en: "If the server vanishes, the missing ping is the signal: 30 seconds without ping means dead. Reconnect.", fr: "Si le serveur disparaît, le ping manquant est le signal : 30 s sans ping, c’est mort. On se reconnecte." } },
  ],
  Stage,
});
