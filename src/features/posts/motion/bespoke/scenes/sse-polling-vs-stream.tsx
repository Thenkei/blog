import { Axis, Box, Camera, Comet, Dot, ease, easeOut, enter, hash, lerp, pop, Pulse, Tag, Text, tint, TONE, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// One shared clock drives both lanes: 25 simulated seconds swept in 300 frames.
const SIM = { start: 24, fps: 12, seconds: 25 } as const;
const POLL_EVERY = 5;
const CHANGE_AT = 10.5;
/** Seconds a request or a response takes to cross the lane (sequence-diagram slant). */
const HOP = .7;
const POLLS = Array.from({ length: SIM.seconds / POLL_EVERY + 1 }, (_, i) => i * POLL_EVERY);
const CAUGHT = POLLS.find((s) => s >= CHANGE_AT)!;
const simFrame = (seconds: number) => SIM.start + seconds * SIM.fps;

const T = {
  change: simFrame(CHANGE_AT),
  caught: simFrame(CAUGHT),
  sweepEnd: simFrame(SIM.seconds),
  fleet: 340,
  end: 470,
} as const;

// "Thousands of agents": a deterministic rain of requests on the polling server.
const FLEET = Array.from({ length: 70 }, (_, i) => ({ at: hash(i + 3), phase: hash(i + 71), speed: 22 + 14 * hash(i + 151) }));

type Lane = { x: number; y: number; w: number; h: number };
type Layout = { poll: Lane; sse: Lane; x0: number; x1: number; server: number; agent: number; axisY: number; changeY: number; fleetTag: { x: number; y: number; anchor: "middle" | "end" } };

// Rows are offsets inside each lane card, so both lanes share one geometry.
const WIDE_LAYOUT: Layout = {
  poll: { x: 40, y: 64, w: 880, h: 146 },
  sse: { x: 40, y: 220, w: 880, h: 146 },
  x0: 164, x1: 862, server: 58, agent: 112, axisY: 388, changeY: 44,
  fleetTag: { x: 920, y: 44, anchor: "end" },
};

const COMPACT_LAYOUT: Layout = {
  poll: { x: 20, y: 78, w: 500, h: 156 },
  sse: { x: 20, y: 248, w: 500, h: 156 },
  x0: 116, x1: 470, server: 64, agent: 118, axisY: 428, changeY: 56,
  fleetTag: { x: 270, y: 478, anchor: "middle" },
};

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const L = compact ? COMPACT_LAYOUT : WIDE_LAYOUT;
  const x = (seconds: number) => lerp(L.x0, L.x1, seconds / SIM.seconds);
  const now = Math.max(0, Math.min(SIM.seconds, (frame - SIM.start) / SIM.fps));
  const playX = x(now);
  const fleet = ease(frame, T.fleet, T.fleet + 36);

  const t = {
    server: fr ? "serveur" : "server",
    agent: "agent",
    every: fr ? "toutes les 5 s" : "every 5 s",
    stream: fr ? "une connexion ouverte" : "one open connection",
    no: fr ? "non" : "no",
    yes: "config ✓",
    change: fr ? "changement de config" : "config change",
    stale: fr ? "jusqu’à 5 s de retard" : "up to 5 s late",
    instant: fr ? "poussé · immédiat" : "pushed · instant",
    quiet: fr ? "silence tant que rien ne change" : "quiet until something changes",
    fleetTag: fr ? "«\u00a0non\u00a0» 99,9\u00a0% du temps" : "“No” 99.9% of the time",
  };

  const pollsDone = POLLS.filter((s) => frame >= simFrame(s)).length;
  const noCount = POLLS.filter((s) => s !== CAUGHT && frame >= simFrame(s + HOP)).length;
  const pollCounter = frame >= T.fleet
    ? (fr ? "× des milliers d’agents" : "× thousands of agents")
    : fr ? `${pollsDone} requête${pollsDone > 1 ? "s" : ""} · ${noCount} × «\u00a0non\u00a0»` : `${pollsDone} request${pollsDone === 1 ? "" : "s"} · ${noCount} × “no”`;
  const sseEvents = frame >= T.change ? 1 : 0;
  const sseCounter = frame >= T.fleet
    ? (fr ? "1 connexion par agent" : "1 connection per agent")
    : fr ? `1 requête · ${sseEvents} événement` : `1 request · ${sseEvents} event${sseEvents === 1 ? "" : "s"}`;

  // Lane chrome: title, row hairlines, running counter.
  const lane = (box: Lane, title: string, sub: string, counter: string, counterTone: Tone, index: number, tone: Tone, focus: number) => {
    const rowX0 = L.x0 - 10;
    return <g {...enter(frame, 4 + index * 7)}>
      <Box x={box.x} y={box.y} w={box.w} h={box.h} tone={tone} focus={focus} radius={16} />
      <Text x={box.x + 20} y={box.y + 24} size={17} weight={650}>{title}</Text>
      <Text x={box.x + 20 + title.length * 10.5 + 10} y={box.y + 25} size={12} font="mono" tone="muted">{sub}</Text>
      <Tag x={box.x + box.w - 16} y={box.y + 24} text={counter} tone={counterTone} anchor="end" size={11} />
      {[{ y: L.server, label: t.server }, { y: L.agent, label: t.agent }].map((row) => <g key={row.label}>
        <Text x={box.x + 20} y={box.y + row.y} size={11} font="mono" weight={600} tone="muted" caps>{row.label}</Text>
        <line x1={rowX0} x2={L.x1 + 30} y1={box.y + row.y} y2={box.y + row.y} stroke="var(--scene-hairline)" strokeWidth={1} />
      </g>)}
    </g>;
  };

  const P = L.poll;
  const S = L.sse;
  const pS = P.y + L.server;
  const pA = P.y + L.agent;
  const sS = S.y + L.server;
  const sA = S.y + L.agent;

  // SSE: one GET at 0 s, then the connection stays open as long as the clock runs.
  const getT = ease(frame, simFrame(0), simFrame(HOP), (v) => v);
  const openFrom = x(HOP);
  const openTo = Math.max(openFrom, playX);
  const openOn = easeOut(frame, simFrame(HOP), simFrame(HOP) + 12);
  const pushT = ease(frame, T.change, T.change + 5, (v) => v);
  const pushed = pop(frame, T.change + 5);

  // Polling latency: the change waits for the next request.
  const bracket = easeOut(frame, T.caught + 10, T.caught + 26);

  const lean = (px: number, py: number): [number, number] => [lerp(width / 2, px, .2), lerp(height / 2, py, .2)];
  const camera = [
    { at: 0 },
    { at: T.change - 12, zoom: 1.02, focus: lean(x(CHANGE_AT), (pA + sS) / 2) },
    { at: T.caught + 6, zoom: 1.03, focus: lean(x(CHANGE_AT + 2), pA) },
    { at: T.fleet - 10, dur: 48, zoom: 1 },
  ];

  const midP = (pS + pA) / 2;

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    {lane(P, "Polling", t.every, `${pollCounter}`, frame >= T.fleet ? "danger" : "line", 0, frame >= T.fleet ? "danger" : "line", fleet * .7)}
    {lane(S, "SSE", t.stream, `${sseCounter}`, "ok", 1, "line", 0)}

    <Axis x={L.x0} y={L.axisY} w={L.x1 - L.x0} ticks={POLLS} format={(s) => `${s} s`} appear={easeOut(frame, 16, 32)} />
    {/* Playhead: the shared clock. */}
    {frame >= SIM.start && frame <= T.sweepEnd + 16 ? <g opacity={ease(frame, SIM.start, SIM.start + 8) * (1 - ease(frame, T.sweepEnd, T.sweepEnd + 16))}>
      <line x1={playX} x2={playX} y1={P.y + 40} y2={L.axisY} stroke="var(--scene-ink)" strokeOpacity={.22} strokeWidth={1} />
      <circle cx={playX} cy={L.axisY} r={3.5} fill={TONE.ink} />
    </g> : null}

    {/* The config change, on the shared clock, for both lanes. */}
    <g opacity={easeOut(frame, T.change - 4, T.change + 8)}>
      <line x1={x(CHANGE_AT)} x2={x(CHANGE_AT)} y1={L.changeY + 12} y2={L.axisY} stroke={TONE.hot} strokeWidth={1.25} strokeDasharray="3 5" />
      <Tag x={x(CHANGE_AT)} y={L.changeY} text={t.change} tone="hot" size={12} appear={pop(frame, T.change - 2)} />
    </g>
    <Pulse x={x(CHANGE_AT)} y={pS} frame={frame} at={T.change} period={40} r={7} tone="hot" />

    {/* Polling lane: request up, answer down, a trace left behind, almost always "no". */}
    {POLLS.map((s) => {
      const at = simFrame(s);
      if (frame < at) return null;
      const carries = s === CAUGHT;
      const up = ease(frame, at, simFrame(s + HOP), (v) => v);
      const down = ease(frame, simFrame(s + HOP), simFrame(s + 2 * HOP), (v) => v);
      const a: [number, number] = [x(s), pA];
      const b: [number, number] = [x(s + HOP), pS];
      const c: [number, number] = [x(s + 2 * HOP), pA];
      const reply = pop(frame, simFrame(s + HOP) + 2);
      const settle = carries ? 1 : lerp(1, .55, ease(frame, simFrame(s + 2 * HOP) + 10, simFrame(s + 2 * HOP) + 24));
      const trace = `M${a[0]} ${a[1]}L${lerp(a[0], b[0], up)} ${lerp(a[1], b[1], up)}${down > 0 ? `L${lerp(b[0], c[0], down)} ${lerp(b[1], c[1], down)}` : ""}`;
      return <g key={s} opacity={carries ? 1 : 1 - .55 * fleet}>
        <path d={trace} fill="none" stroke={carries && down > 0 ? TONE.ok : TONE.line} strokeOpacity={.55} strokeWidth={1.25} strokeLinejoin="round" />
        <Comet points={[a, b]} t={up} tone="line" r={4.5} tail={.45} />
        <Comet points={[b, c]} t={down} tone={carries ? "ok" : "muted"} r={4.5} tail={.45} />
        <g opacity={settle}>
          <Tag x={x(s + HOP)} y={midP} text={carries ? t.yes : t.no} tone={carries ? "ok" : "muted"} size={12} appear={reply} />
        </g>
        {carries ? <Pulse x={c[0]} y={c[1]} frame={frame} at={simFrame(s + 2 * HOP)} period={40} r={7} tone="ok" /> : null}
      </g>;
    })}

    {/* Interval → latency: the change sat on the server until the next poll. */}
    {bracket > 0 ? <g opacity={bracket}>
      <path d={`M${x(CHANGE_AT)} ${pA + 10}v6H${lerp(x(CHANGE_AT), x(CAUGHT + 2 * HOP), bracket)}v-6`} fill="none" stroke={TONE.danger} strokeWidth={1.5} strokeLinejoin="round" />
      <Tag x={compact ? x(CHANGE_AT) - 8 : x(CAUGHT + 2 * HOP) + 10} y={pA + 17} text={t.stale} tone="danger" anchor={compact ? "end" : "start"} size={11} appear={pop(frame, T.caught + 18)} />
    </g> : null}

    {/* Thousands of other agents polling the same server. */}
    {fleet > 0 ? <g opacity={fleet}>
      <line x1={L.x0 - 10} x2={L.x1 + 30} y1={pS} y2={pS} stroke={TONE.danger} strokeWidth={1.75} strokeOpacity={.8} />
      {FLEET.map((drop, i) => {
        const k = (((frame - T.fleet) / drop.speed) + drop.phase) % 1;
        const dx = lerp(L.x0, L.x1, drop.at);
        return <circle key={i} cx={dx + k * 8} cy={lerp(pA, pS, k)} r={2.2} fill={TONE.danger} opacity={.25 + .55 * Math.sin(Math.PI * k)} />;
      })}
    </g> : null}
    <Tag x={L.fleetTag.x} y={L.fleetTag.y} anchor={L.fleetTag.anchor} text={t.fleetTag} tone="danger" size={compact ? 13 : 12} appear={pop(frame, T.fleet + 24)} />

    {/* SSE lane: one GET, then an open pipe the change is pushed down. */}
    <Comet points={[[x(0), sA], [x(HOP), sS]]} t={getT} tone="line" r={4.5} tail={.45} />
    {getT > 0 ? <path d={`M${x(0)} ${sA}L${lerp(x(0), x(HOP), getT)} ${lerp(sA, sS, getT)}`} fill="none" stroke={TONE.line} strokeOpacity={.55} strokeWidth={1.25} /> : null}
    {getT > 0 ? <Text x={x(0) + 2} y={sA + 16} size={11} font="mono" weight={600} tone="muted" opacity={easeOut(frame, simFrame(0), simFrame(0) + 10)}>GET</Text> : null}
    {openOn > 0 ? <g opacity={openOn}>
      <rect x={openFrom} y={sS + 1} width={openTo - openFrom} height={sA - sS - 2} style={{ fill: tint("ok", 9) }} />
      <line x1={openFrom} x2={openTo} y1={sS + .5} y2={sS + .5} stroke={TONE.ok} strokeOpacity={.55} strokeWidth={1.25} />
      <line x1={openFrom} x2={openTo} y1={sA - .5} y2={sA - .5} stroke={TONE.ok} strokeOpacity={.55} strokeWidth={1.25} />
      <path className="scene-glow" d={`M${openFrom} ${(sS + sA) / 2}H${openTo}`} fill="none" stroke={TONE.ok} strokeWidth={2} strokeLinecap="round" strokeDasharray="1.5 12" strokeDashoffset={-frame * .9} strokeOpacity={.6} style={{ color: TONE.ok }} />
      <Text x={openFrom + 12} y={sS - 13} size={11} font="mono" weight={600} tone="ok" opacity={easeOut(frame, simFrame(1), simFrame(1) + 14)}>text/event-stream</Text>
    </g> : null}
    <Comet points={[[x(CHANGE_AT), sS], [x(CHANGE_AT), sA]]} t={pushT} tone="ok" r={5} tail={.6} />
    {frame >= T.change + 5 ? <Dot x={x(CHANGE_AT)} y={sA} r={4.5} tone="ok" /> : null}
    <Pulse x={x(CHANGE_AT)} y={sA} frame={frame} at={T.change + 5} period={40} r={7} tone="ok" />
    <Tag x={x(CHANGE_AT) + 14} y={(sS + sA) / 2} anchor="start" text={t.instant} tone="ok" size={12} appear={pushed * (1 - ease(frame, T.fleet + 6, T.fleet + 18))} />
    <Tag x={x(CHANGE_AT) + 14} y={(sS + sA) / 2} anchor="start" text={t.quiet} tone="muted" size={12} appear={pop(frame, T.fleet + 22)} />
  </Camera>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.fleet + 90,
  title: { en: "Polling vs one open stream", fr: "Polling contre un flux ouvert" },
  caption: {
    en: "On the same clock, polling spends a request every 5 seconds to hear “No” and still delivers the change late; the SSE stream stays open and delivers it the moment it happens.",
    fr: "Sur la même horloge, le polling dépense une requête toutes les 5 secondes pour entendre « non » et livre quand même le changement en retard ; le flux SSE reste ouvert et le livre dès qu’il se produit.",
  },
  beats: [
    { at: 0, text: { en: "Polling: every 5 seconds the agent asks “Got any new config updates?” and the server says “No.”", fr: "Polling : toutes les 5 secondes, l’agent demande « Du nouveau ? » et le serveur répond « Non. »" } },
    { at: T.change, text: { en: "A config change lands. The SSE agent gets it instantly, down the connection it already holds open.", fr: "Un changement de config arrive. L’agent SSE le reçoit aussitôt, par la connexion qu’il garde ouverte." } },
    { at: T.caught, text: { en: "The polling agent only learns at its next request: the 5-second interval becomes UI latency.", fr: "L’agent en polling ne l’apprend qu’à sa requête suivante : l’intervalle de 5 s devient de la latence." } },
    { at: T.fleet, text: { en: "Multiply by thousands of agents: a self-inflicted DDoS just to say “No” 99.9% of the time.", fr: "Multiplié par des milliers d’agents : un DDoS auto-infligé pour répondre « non » 99,9 % du temps." } },
  ],
  Stage,
});
