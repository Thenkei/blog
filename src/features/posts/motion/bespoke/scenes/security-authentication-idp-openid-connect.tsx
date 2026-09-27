import { Actor, gapsAt, Ping, inFlight, Label, Lifeline, Message, Orbit, spanOf, Step, SummitFlag, TokenCard, tr, travel, Gate, at, type Point, type Span } from "../identityKit";
import { Boundary, Camera, Dot, during, ease, easeOut, lerp, pop, Text, Wire, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Opening map of the article, drawn as the series' sequence diagram: three
// lifelines, three boundaries, three proofs, each a token that physically
// crosses its boundary and is checked on arrival. Then the firewall: Forest's
// own call is stopped at the customer network edge, so the agent dials out
// (SSE) and Forest pushes down the pipe the agent opened.
const T = {
  actors: 0,
  m1: 50,
  m2: 150,
  m3: 256,
  fw: 350,
  sse: 440,
  end: 590,
} as const;

// Per message: token shows at +4, rides from +12, docks at `arrive`.
const RIDE = { m1: [62, 100], m2: [162, 216], m3: [268, 306], fw: [362, 392], sse: [452, 488] } as const;

type Col = "user" | "forest" | "agent";

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const X: Record<Col, number> = compact ? { user: 90, forest: 270, agent: 450 } : { user: 140, forest: 440, agent: 822 };
  const cardW = compact ? 138 : 200;
  const agentW = compact ? 138 : 184;
  const headerY = compact ? 62 : 66;
  const lifeTop = headerY + 50;
  const rows = compact ? [164, 254, 344, 434] : [164, 231, 298, 362];
  const lifeBottom = compact ? 496 : 394;
  const zone = compact ? { x: 362, y: 48, w: 168, h: 462 } : { x: 684, y: 48, w: 252, h: 356 };
  const edge = zone.x;
  const labelSize = compact ? 12 : 12.5;
  const quoteSize = compact ? 13 : 13.5;

  const live = (start: number, end: number) => during(frame, start, end, 12);
  const liveM1 = live(T.m1, T.m2);
  const liveM2 = live(T.m2, T.m3);
  const liveM3 = live(T.m3, T.fw);
  const liveFw = live(T.fw, T.sse + 10);
  const liveSse = ease(frame, T.sse, T.sse + 12);

  // Rows: where each label and quote sits. Compact stacks text on a left or
  // right column; wide centres it on the stretch between two lifelines.
  const left = (x: number) => (compact ? { x: 20, anchor: "start" as const } : { x, anchor: "middle" as const });
  const right = (x: number) => (compact ? { x: edge - 10, anchor: "end" as const } : { x, anchor: "middle" as const });
  const R = [
    { y: rows[0]!, pos: left((X.user + X.forest) / 2), label: tr(locale, "SAML · OAuth · password + 2FA", "SAML · OAuth · mot de passe + 2FA"), quote: tr(locale, "“Are you really Bob from Accounting?”", "« Es-tu vraiment Bob de la compta ? »") },
    { y: rows[1]!, pos: left((X.user + X.forest) / 2), label: tr(locale, "Forest-issued token", "token émis par Forest"), quote: tr(locale, "“Forest Server vouches for me”", "« Forest se porte garant de moi »") },
    { y: rows[2]!, pos: right((X.forest + 24 + edge) / 2), label: tr(locale, "environment secret", "secret d’environnement"), quote: tr(locale, "“I am the legitimate agent”", "« Je suis l’agent légitime »") },
  ];
  const fwLabel = tr(locale, "inbound call ✗ firewall", "appel entrant ✗ pare-feu");
  const sseLabel = tr(locale, "SSE · opened by the agent", "SSE · ouverte par l’agent");
  const pushLabel = tr(locale, "Forest pushes down the pipe", "Forest pousse dans le tuyau");
  const row4 = rows[3]!;
  const row4Pos = right((X.forest + 24 + edge) / 2);

  // Lifelines break wherever a label crosses them.
  const spans: Span[] = [
    ...R.flatMap((row) => [spanOf(row.pos.x, row.y - 20, row.label, labelSize, row.pos.anchor), spanOf(row.pos.x, row.y + 21, row.quote, quoteSize, row.pos.anchor, false)]),
    spanOf(row4Pos.x, row4 - 20, fwLabel.length > sseLabel.length ? fwLabel : sseLabel, labelSize, row4Pos.anchor),
    spanOf(row4Pos.x, row4 + 21, pushLabel, quoteSize, row4Pos.anchor, false),
  ];

  // Message geometry: from the sender's lifeline to just before the receiver's gate.
  const line = (from: number, to: number, y: number): Point[] => [[from, y], [to - Math.sign(to - from) * 17, y]];
  const p1 = line(X.user, X.forest, rows[0]!);
  const p2 = line(X.user, X.agent, rows[1]!);
  const p3 = line(X.agent, X.forest, rows[2]!);
  const pFw: Point[] = [[X.forest, row4], [edge - (compact ? 34 : 38), row4]];
  const pSse = line(X.agent, X.forest, row4);

  const t1 = travel(frame, ...RIDE.m1);
  const t2 = travel(frame, ...RIDE.m2);
  const t3 = travel(frame, ...RIDE.m3);
  const tFw = travel(frame, ...RIDE.fw);
  const tSse = travel(frame, ...RIDE.sse);

  // A token appears at its sender, rides, and is absorbed by the receiver's gate.
  const token = (points: Point[], t: number, start: number, arrive: number, kind: string, text: string, tone: Tone) => {
    const appear = easeOut(frame, start + 4, start + 14) * (1 - ease(frame, arrive, arrive + 12));
    const [x, y] = at(points, t);
    return <TokenCard x={x} y={y} kind={kind} text={text} tone={tone} appear={appear} lift={inFlight(t)} size={compact ? 11.5 : 12.5} />;
  };

  // The blocked call bounces off the boundary and dissolves.
  const blocked = frame >= RIDE.fw[1];
  const bounce = ease(frame, RIDE.fw[1], RIDE.fw[1] + 16);
  const fwTip = at(pFw, tFw);
  const fwX = blocked ? fwTip[0] - 26 * bounce : fwTip[0];
  const fwAppear = easeOut(frame, T.fw + 4, T.fw + 14) * (1 - ease(frame, RIDE.fw[1] + 10, RIDE.fw[1] + 30));

  const sseOpen = frame >= RIDE.sse[1];
  const flowOn = ease(frame, RIDE.sse[1], RIDE.sse[1] + 14);
  const fwFade = 1 - ease(frame, T.sse, T.sse + 14);

  const focusOf = (windows: readonly (readonly [number, number])[]) => Math.max(0, ...windows.map(([a, b]) => ease(frame, a, a + 10) * (1 - ease(frame, b, b + 14))));
  const focus = {
    user: focusOf([[T.m1, RIDE.m1[0] + 6], [T.m2, RIDE.m2[0] + 6]]),
    forest: focusOf([[RIDE.m1[1] - 8, T.m2], [RIDE.m3[1] - 8, T.fw], [T.fw, RIDE.fw[0] + 6], [RIDE.sse[1] - 8, T.end]]),
    agent: focusOf([[RIDE.m2[1] - 8, T.m3], [T.m3, RIDE.m3[0] + 6], [T.sse, RIDE.sse[0] + 6]]),
  };

  const lean = (x: number, y: number): Point => [lerp(width / 2, x, .25), lerp(height / 2, y, .25)];
  // A breath, not a pan: the map must stay whole.
  const camera = [
    { at: 0 },
    { at: T.m1, dur: 90, zoom: 1.015, focus: lean(width / 2, rows[1]!) },
    { at: T.fw, dur: 60, zoom: 1.02, focus: lean(edge, row4) },
    { at: T.end - 90, dur: 70, zoom: 1 },
  ];

  const rideLabel = (index: number, liveness: number, start: number) => {
    const row = R[index]!;
    return <>
      <Label x={row.pos.x} y={row.y - 20} text={row.label} anchor={row.pos.anchor} size={labelSize} live={liveness} appear={easeOut(frame, start, start + 16)} />
      <g opacity={easeOut(frame, start + 58, start + 76) * (.62 + .38 * liveness)}>
        <Text x={row.pos.x} y={row.y + 21} size={quoteSize} weight={500} tone="muted" anchor={row.pos.anchor}>{row.quote}</Text>
      </g>
    </>;
  };

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    <Boundary x={zone.x} y={zone.y} w={zone.w} h={zone.h} tone="hot" labelAt={compact ? "top-end" : "top-start"}
      label={tr(locale, compact ? "customer" : "customer network", compact ? "client" : "réseau client")}
      appear={easeOut(frame, 14, 34)} />

    {(["user", "forest", "agent"] as const).map((col, index) => <Lifeline key={col} x={X[col]} top={lifeTop} bottom={lifeBottom}
      grow={ease(frame, 16 + index * 5, 48 + index * 5)} gaps={gapsAt(X[col], spans)} />)}

    <Orbit x={X.forest} y={headerY + 25} rx={cardW / 2 + 28} ry={44} frame={frame} appear={easeOut(frame, 20, 40)} />
    <Actor x={X.user} y={headerY} w={cardW} label={compact ? tr(locale, "User", "Utilisateur") : tr(locale, "User · frontend", "Utilisateur · frontend")} sub={compact ? "frontend" : tr(locale, "browser", "navigateur")}
      size={compact ? 14.5 : 16} appear={pop(frame, T.actors)} focus={focus.user} />
    <Actor x={X.forest} y={headerY} w={cardW} label={compact ? "Forest Admin" : "Forest Admin Server"} sub="SaaS"
      size={compact ? 14.5 : 16} appear={pop(frame, T.actors + 6)} focus={focus.forest} />
    <Actor x={X.agent} y={headerY} w={agentW} label="Agent" sub={tr(locale, compact ? "self-hosted" : "customer-hosted", compact ? "chez le client" : "hébergé chez le client")}
      size={compact ? 14.5 : 16} appear={pop(frame, T.actors + 12)} focus={focus.agent} />

    {/* ① user → Forest */}
    <Message points={p1} progress={t1} live={liveM1} />
    <Step x={X.user} y={rows[0]!} n="1" appear={pop(frame, T.m1)} live={liveM1} />
    {rideLabel(0, liveM1, T.m1)}
    <Gate x={X.forest} y={rows[0]!} frame={frame} decideAt={RIDE.m1[1] + 2} result="pass" appear={easeOut(frame, RIDE.m1[0], RIDE.m1[0] + 14)} />
    <Ping x={X.forest} y={rows[0]!} frame={frame} at={RIDE.m1[1] + 2} r={11} />
    {token(p1, t1, T.m1, RIDE.m1[1], "ID", "Bob", "hot")}

    {/* ② frontend → agent: straight past Forest, into the customer network */}
    <Message points={p2} progress={t2} live={liveM2} />
    <Step x={X.user} y={rows[1]!} n="2" appear={pop(frame, T.m2)} live={liveM2} />
    {rideLabel(1, liveM2, T.m2)}
    <Gate x={X.agent} y={rows[1]!} frame={frame} decideAt={RIDE.m2[1] + 2} result="pass" appear={easeOut(frame, RIDE.m2[0], RIDE.m2[0] + 14)} />
    <Ping x={X.agent} y={rows[1]!} frame={frame} at={RIDE.m2[1] + 2} r={11} />
    {token(p2, t2, T.m2, RIDE.m2[1], "JWT", "Forest", "ok")}

    {/* ③ agent → Forest: outbound, so the firewall lets it through */}
    <Message points={p3} progress={t3} live={liveM3} />
    <Step x={X.agent} y={rows[2]!} n="3" appear={pop(frame, T.m3)} live={liveM3} />
    {rideLabel(2, liveM3, T.m3)}
    <Gate x={X.forest} y={rows[2]!} frame={frame} decideAt={RIDE.m3[1] + 2} result="pass" appear={easeOut(frame, RIDE.m3[0], RIDE.m3[0] + 14)} />
    <Ping x={X.forest} y={rows[2]!} frame={frame} at={RIDE.m3[1] + 2} r={11} />
    {token(p3, t3, T.m3, RIDE.m3[1], "ENV", tr(locale, "secret", "secret"), "hot")}

    {/* Firewall: Forest's own call stops at the boundary edge. */}
    <Message points={pFw} progress={tFw} live={liveFw} tone="danger" dashed opacity={fwFade} head={false} />
    <Label x={row4Pos.x} y={row4 - 20} text={fwLabel} anchor={row4Pos.anchor} size={labelSize} tone="danger" live={1} appear={easeOut(frame, T.fw, T.fw + 16) * fwFade} />
    <Gate x={edge} y={row4} frame={frame} decideAt={RIDE.fw[1]} result="fail" appear={easeOut(frame, RIDE.fw[0], RIDE.fw[0] + 12) * (1 - ease(frame, RIDE.sse[0], RIDE.sse[0] + 12))} />
    <TokenCard x={fwX} y={row4} kind="CALL" tone="danger" appear={fwAppear} lift={inFlight(tFw)} strike={ease(frame, RIDE.fw[1], RIDE.fw[1] + 10)} size={compact ? 11.5 : 12.5} />

    {/* SSE: the agent dials out; Forest pushes down that pipe. */}
    <Message points={pSse} progress={tSse} live={liveSse * (1 - flowOn)} tone="ok" />
    {sseOpen ? <Wire d={`M${X.forest + 12} ${row4}L${X.agent - 12} ${row4}`} tone="ok" width={2} flow={frame - RIDE.sse[1]} opacity={flowOn} /> : null}
    {token(pSse, tSse, T.sse, RIDE.sse[1], "SSE", tr(locale, "open", "ouvre"), "ok")}
    <Label x={row4Pos.x} y={row4 - 20} text={sseLabel} anchor={row4Pos.anchor} size={labelSize} tone="ok" live={1} appear={easeOut(frame, T.sse + 6, T.sse + 22)} />
    <g opacity={easeOut(frame, RIDE.sse[1] + 8, RIDE.sse[1] + 26)}>
      <Text x={row4Pos.x} y={row4 + 21} size={quoteSize} weight={500} tone="muted" anchor={row4Pos.anchor}>{pushLabel}</Text>
    </g>
    <Ping x={X.forest} y={row4} frame={frame} at={RIDE.sse[1]} r={9} />
    {sseOpen ? <Dot x={X.forest} y={row4} r={5} tone="ok" opacity={flowOn} /> : null}
    <SummitFlag x={X.agent + 16} y={row4 - 8} appear={easeOut(frame, RIDE.sse[1] + 20, RIDE.sse[1] + 40)} />
  </Camera>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 40,
  title: { en: "Three boundaries, three proofs", fr: "Trois frontières, trois preuves" },
  caption: {
    en: "Forest sits between users and agents it does not host. Each boundary asks a different question and accepts a different proof, and the firewall forces the agent to dial out.",
    fr: "Forest se tient entre des utilisateurs et des agents qu’il n’héberge pas. Chaque frontière pose sa propre question et accepte sa propre preuve ; le pare-feu oblige l’agent à ouvrir la connexion.",
  },
  beats: [
    { at: 0, text: { en: "Forest sits between the user and an agent it does not host: three boundaries, three different proofs.", fr: "Forest se tient entre l’utilisateur et un agent qu’il n’héberge pas : trois frontières, trois preuves." } },
    { at: T.m1, text: { en: "① User → Forest Admin Server, via SAML, OAuth or password + 2FA: “Are you really Bob from Accounting?”", fr: "① Utilisateur → Forest Admin, via SAML, OAuth ou mot de passe + 2FA : « Es-tu vraiment Bob ? »" } },
    { at: T.m2, text: { en: "② The frontend presents a Forest-issued token directly to the customer-hosted agent.", fr: "② Le frontend présente directement à l’agent, hébergé chez le client, un token émis par Forest." } },
    { at: T.m3, text: { en: "③ Agent → Forest: the agent proves it is the legitimate one with its environment secret.", fr: "③ Agent → Forest : l’agent prouve qu’il est légitime avec son secret d’environnement." } },
    { at: T.fw, text: { en: "The agents live behind customer firewalls: Forest can’t call them.", fr: "Les agents vivent derrière le pare-feu du client : Forest ne peut pas les appeler." } },
    { at: T.sse, text: { en: "So the agent opens an outbound SSE connection, and Forest pushes data down that pipe.", fr: "L’agent ouvre donc une connexion SSE sortante, et Forest pousse les données dans ce tuyau." } },
  ],
  Stage,
});
