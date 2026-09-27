import { Actor, at, Gate, gapsAt, inFlight, Label, Lifeline, Message, Orbit, Ping, spanOf, SummitFlag, TokenCard, tr, travel, type Point, type Span } from "../identityKit";
import { Boundary, during, ease, easeOut, lerp, pop, Tag, Text, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Forest's split brain as a sequence diagram: one Forest card, two lifelines
// (its SP face and its IdP face). Act 1 runs the federated path: upstream
// artifacts are consumed by the SP face, only identity + tenant context crosses
// to the IdP face, which mints Forest's own token for the frontend and agent.
// Act 2 merges the two lifelines into one "generic auth" layer and replays the
// same Google ID token straight through: the agent can't answer anything.
// Act 3 splits them again.
const T = {
  m1: 44,
  m2: 70,
  ctx: 134,
  mint: 196,
  flat: 322,
  flatToken: 352,
  flatFail: 424,
  restore: 506,
  motto: 534,
  end: 650,
} as const;

const RIDE = {
  m1: [54, 90],
  m2: [80, 116],
  ctx: [144, 178],
  jwt: [208, 276],
  flat: [362, 422],
} as const;

type Col = "idp" | "sp" | "fidp" | "front" | "agent";

function Stage({ frame, compact, locale, width }: SceneStageProps) {
  const base: Record<Col, number> = compact
    ? { idp: 62, sp: 172, fidp: 270, front: 380, agent: 484 }
    : { idp: 104, sp: 300, fidp: 456, front: 644, agent: 842 };
  const headerY = compact ? 60 : 64;
  const headerH = compact ? 46 : 50;
  const faceY = headerY + headerH + (compact ? 20 : 22);
  const rows = compact ? [172, 218, 266, 314, 362] : [174, 212, 254, 296, 338];
  const lifeTop = faceY + 14;
  const lifeBottom = compact ? 380 : 356;
  const zoneBottom = compact ? 392 : 368;
  const labelSize = compact ? 11.5 : 12.5;
  const tokenSize = compact ? 11 : 12;

  // Merge: the two Forest faces collapse into one lifeline during act 2.
  const merge = ease(frame, T.flat, T.flat + 28) * (1 - ease(frame, T.restore, T.restore + 28));
  const mid = (base.sp + base.fidp) / 2;
  const X: Record<Col, number> = { ...base, sp: lerp(base.sp, mid, merge), fidp: lerp(base.fidp, mid, merge) };
  const inFlat = frame >= T.flat && frame < T.restore;
  const actOne = 1 - ease(frame, T.flat, T.flat + 16) * (1 - ease(frame, T.restore + 10, T.restore + 34));

  const live = (start: number, end: number) => during(frame, start, end, 12) * actOne;
  const L = {
    m1: live(T.m1, T.ctx),
    m2: live(T.m2, T.ctx),
    ctx: live(T.ctx, T.mint),
    jwt: live(T.mint, T.flat),
    flat: during(frame, T.flatToken, T.restore, 12),
  };

  const t1 = travel(frame, ...RIDE.m1);
  const t2 = travel(frame, ...RIDE.m2);
  const tCtx = travel(frame, ...RIDE.ctx);
  const tJwt = travel(frame, ...RIDE.jwt);
  const tFlat = travel(frame, ...RIDE.flat);

  const tip = (from: number, to: number, y: number, pad = 17): Point[] => [[from, y], [to - Math.sign(to - from) * pad, y]];
  const p1 = tip(X.idp, X.sp, rows[0]!);
  const p2 = tip(X.idp, X.sp, rows[1]!);
  const pCtx = tip(X.sp, X.fidp, rows[2]!, 8);
  // Forest's token rides to the frontend, slides down its lifeline, then on to the agent.
  const pJwt: Point[] = [[X.fidp, rows[3]!], [X.front, rows[3]!], [X.front, rows[4]!], [X.agent - 17, rows[4]!]];
  const jwtLen = [X.front - X.fidp, rows[4]! - rows[3]!, X.agent - 17 - X.front];
  const jwtTotal = jwtLen[0]! + jwtLen[1]! + jwtLen[2]!;
  const jwtA = Math.min(1, tJwt * jwtTotal / jwtLen[0]!);
  const jwtB = Math.max(0, (tJwt * jwtTotal - jwtLen[0]! - jwtLen[1]!) / jwtLen[2]!);
  const pFlat = tip(X.idp, X.agent, rows[1]!);

  const text = {
    m1: compact ? "SAML" : tr(locale, "SAML · Okta, Azure AD", "SAML · Okta, Azure AD"),
    m2: compact ? "OIDC" : "OIDC · Google",
    ctx: compact ? tr(locale, "context", "contexte") : tr(locale, "identity · tenant", "identité · tenant"),
    jwt: compact ? tr(locale, "Forest token", "token Forest") : tr(locale, "Forest-issued token", "token émis par Forest"),
    bearer: compact ? tr(locale, "presents it", "le présente") : tr(locale, "presents it to the agent", "le présente à l’agent"),
    flat: tr(locale, "same ID token, as is", "même ID token, tel quel"),
  };
  const midOf = (a: number, b: number) => (a + b) / 2;
  const labels = {
    m1: [midOf(base.idp, base.sp), rows[0]! - 20] as const,
    m2: [midOf(base.idp, base.sp), rows[1]! - 20] as const,
    ctx: [midOf(base.sp, base.fidp), rows[2]! - 20] as const,
    jwt: [midOf(base.fidp, base.front), rows[3]! - 20] as const,
    bearer: [midOf(base.front, base.agent), rows[4]! - 20] as const,
    flat: [compact ? midOf(base.fidp, base.front) : midOf(base.fidp, base.front), rows[1]! - 20] as const,
  };
  const spans: Span[] = (Object.keys(labels) as (keyof typeof labels)[])
    .filter((key) => key !== "flat")
    .map((key) => spanOf(labels[key][0], labels[key][1], text[key], labelSize));

  const tokenAt = (points: Point[], t: number, start: number, arrive: number, kind: string, body: string | undefined, tone: Tone) => {
    const appear = easeOut(frame, start + 4, start + 14) * (1 - ease(frame, arrive, arrive + 12));
    const [x, y] = at(points, t);
    return <TokenCard x={x} y={y} kind={kind} text={body} tone={tone} appear={appear} lift={inFlight(t)} size={tokenSize} />;
  };

  const questions = [
    tr(locale, "audience?", "audience ?"),
    tr(locale, "replay?", "rejeu ?"),
    tr(locale, "provenance?", "provenance ?"),
    tr(locale, "tenant?", "tenant ?"),
    tr(locale, "3 AM debug?", "debug à 3 h ?"),
  ];
  const questionAt = (index: number): readonly [number, number, "middle" | "start"] => compact
    ? [index < 3 ? 95 + index * 175 : 182 + (index - 3) * 175, index < 3 ? 426 : 464, "middle"]
    : [X.agent, rows[1]! + 34 + index * 26, "middle"];
  const questionsOut = 1 - ease(frame, T.restore, T.restore + 16);

  const focusOf = (windows: readonly (readonly [number, number])[]) => Math.max(0, ...windows.map(([a, b]) => ease(frame, a, a + 10) * (1 - ease(frame, b, b + 14))));
  const focus = {
    idp: focusOf([[T.m1, RIDE.m2[0] + 8], [T.flatToken, RIDE.flat[0] + 8]]),
    forest: focusOf([[RIDE.m1[1] - 8, T.mint + 16]]),
    front: focusOf([[RIDE.jwt[0] + 20, RIDE.jwt[0] + 44]]),
    agent: focusOf([[RIDE.jwt[1] - 8, T.flat], [RIDE.flat[1] - 6, T.restore]]),
  };

  const forestZone = compact ? { x: 118, y: 46, w: 206, h: zoneBottom - 46 } : { x: 212, y: 46, w: 332, h: zoneBottom - 46 };
  const upZone = compact ? { x: 12, y: 46, w: 100, h: zoneBottom - 46 } : { x: 24, y: 46, w: 160, h: zoneBottom - 46 };
  const custZone = compact ? { x: 434, y: 46, w: 98, h: zoneBottom - 46 } : { x: 744, y: 46, w: 192, h: zoneBottom - 46 };

  const motto = tr(locale, "upstream authentication ≠ downstream authorization", "authentification amont ≠ autorisation aval");

  return <g>
    <Boundary {...upZone} labelAt="bottom-start" label={compact ? tr(locale, "upstream", "amont") : tr(locale, "upstream IdPs", "IdP amont")} appear={easeOut(frame, 8, 26)} />
    <Boundary {...forestZone} tone={merge > .5 ? "danger" : "line"} label="Forest" labelAt="top-end" appear={easeOut(frame, 12, 30)} />
    <Boundary {...custZone} tone="hot" label={compact ? tr(locale, "customer", "client") : tr(locale, "customer network", "réseau client")} labelAt="top-end" appear={easeOut(frame, 16, 34)} />

    {(["idp", "sp", "fidp", "front", "agent"] as const).map((col, index) => <Lifeline key={col} x={X[col]} top={col === "sp" || col === "fidp" ? lifeTop : headerY + headerH} bottom={lifeBottom}
      grow={ease(frame, 18 + index * 4, 50 + index * 4)} gaps={actOne > .5 ? gapsAt(X[col], spans) : []} tone={merge > .02 && (col === "sp" || col === "fidp") ? "danger" : undefined} />)}

    <Actor x={base.idp} y={headerY} w={compact ? 86 : 140} h={headerH} label={compact ? "IdP" : "Upstream IdP"} {...(compact ? {} : { sub: "SAML · OIDC" })} size={compact ? 14 : 16} appear={pop(frame, 0)} focus={focus.idp} />
    <Orbit x={mid} y={headerY + headerH / 2} rx={(compact ? 96 : 150) + 14} ry={34} frame={frame} appear={easeOut(frame, 24, 44)} />
    <Actor x={mid} y={headerY} w={compact ? 192 : 300} h={headerH} label={compact ? "Forest Admin" : "Forest Admin Server"} sub={compact ? (merge > .5 ? tr(locale, "one layer", "une couche") : tr(locale, "two roles", "deux rôles")) : merge > .5 ? tr(locale, "one generic auth layer", "une couche auth générique") : tr(locale, "one platform, two roles", "une plateforme, deux rôles")}
      tone={merge > .5 ? "danger" : "line"} fill={merge * .6} size={compact ? 14.5 : 16} appear={pop(frame, 4)} focus={focus.forest} />
    <Actor x={base.front} y={headerY} w={compact ? 88 : 150} h={headerH} label="Frontend" {...(compact ? {} : { sub: tr(locale, "browser", "navigateur") })} size={compact ? 13.5 : 16} appear={pop(frame, 8)} focus={focus.front} />
    <Actor x={base.agent} y={headerY} w={compact ? 80 : 166} h={headerH} label="Agent" {...(compact ? {} : { sub: tr(locale, "trusts Forest only", "ne croit que Forest") })}
      tone={inFlat && frame >= T.flatFail ? "danger" : "line"} size={compact ? 14 : 16} appear={pop(frame, 12)} focus={focus.agent} />

    {/* The two faces: SP toward upstream IdPs, IdP toward agents. */}
    <g opacity={(1 - merge) * easeOut(frame, 26, 42)}>
      <Tag x={X.sp} y={faceY} text={compact ? "SP" : "SP · RP"} tone="line" size={compact ? 11.5 : 12} />
      <Tag x={X.fidp} y={faceY} text="IdP" tone="ok" size={compact ? 11.5 : 12} />
    </g>
    <Tag x={mid} y={faceY} text={tr(locale, "generic auth", "auth générique")} tone="danger" size={compact ? 11.5 : 12} appear={merge} />

    {/* Act 1 · the federated path. */}
    <g opacity={actOne}>
      <Message points={p1} progress={t1} live={L.m1} tone="hot" />
      <Label x={labels.m1[0]} y={labels.m1[1]} text={text.m1} live={L.m1} size={labelSize} appear={easeOut(frame, T.m1, T.m1 + 16)} />
      <Gate x={X.sp} y={rows[0]!} frame={frame} decideAt={RIDE.m1[1] + 2} result="pass" r={10} appear={easeOut(frame, RIDE.m1[0], RIDE.m1[0] + 14)} />
      <Message points={p2} progress={t2} live={L.m2} tone="hot" />
      <Label x={labels.m2[0]} y={labels.m2[1]} text={text.m2} live={L.m2} size={labelSize} appear={easeOut(frame, T.m2, T.m2 + 16)} />
      <Gate x={X.sp} y={rows[1]!} frame={frame} decideAt={RIDE.m2[1] + 2} result="pass" r={10} appear={easeOut(frame, RIDE.m2[0], RIDE.m2[0] + 14)} />
      <Message points={pCtx} progress={tCtx} live={L.ctx} />
      <Label x={labels.ctx[0]} y={labels.ctx[1]} text={text.ctx} live={L.ctx} size={labelSize} appear={easeOut(frame, T.ctx, T.ctx + 16)} />
      <Message points={pJwt.slice(0, 2)} progress={jwtA} live={L.jwt} tone="ok" />
      <Label x={labels.jwt[0]} y={labels.jwt[1]} text={text.jwt} live={L.jwt} size={labelSize} appear={easeOut(frame, T.mint, T.mint + 16)} />
      <Message points={pJwt.slice(2)} progress={jwtB} live={L.jwt} tone="ok" />
      <Label x={labels.bearer[0]} y={labels.bearer[1]} text={text.bearer} live={L.jwt} size={labelSize} appear={easeOut(frame, RIDE.jwt[0] + 30, RIDE.jwt[0] + 46)} />
      <Gate x={X.agent} y={rows[4]!} frame={frame} decideAt={RIDE.jwt[1] + 2} result="pass" r={10} appear={easeOut(frame, RIDE.jwt[0] + 20, RIDE.jwt[0] + 36)} />
    </g>
    <Ping x={X.sp} y={rows[1]!} frame={frame} at={RIDE.m2[1] + 2} />
    <Ping x={X.agent} y={rows[4]!} frame={frame} at={RIDE.jwt[1] + 2} />
    <SummitFlag x={X.agent + 14} y={rows[4]! - 8} appear={easeOut(frame, RIDE.jwt[1] + 10, RIDE.jwt[1] + 30) * actOne} />
    {tokenAt(p1, t1, T.m1, RIDE.m1[1], "SAML", compact ? undefined : tr(locale, "assertion", "assertion"), "hot")}
    {tokenAt(p2, t2, T.m2, RIDE.m2[1], "JWT", compact ? "ID" : "ID token", "hot")}
    {tokenAt(pCtx, tCtx, T.ctx, RIDE.ctx[1], "CTX", compact ? undefined : "sub · tenant", "line")}
    {tokenAt(pJwt, tJwt, T.mint, RIDE.jwt[1], "JWT", "Forest", "ok")}

    {/* Act 2 · one flattened layer: the upstream token goes straight through. */}
    <Message points={pFlat} progress={tFlat} live={L.flat} tone="danger" dashed opacity={1 - ease(frame, T.restore, T.restore + 16)} />
    <Label x={labels.flat[0]} y={labels.flat[1]} text={text.flat} tone="danger" live={1} size={labelSize}
      appear={easeOut(frame, T.flatToken + 20, T.flatToken + 36) * (1 - ease(frame, T.restore, T.restore + 16))} />
    {tokenAt(pFlat, tFlat, T.flatToken, RIDE.flat[1] + 16, "JWT", compact ? "ID" : "ID token · Google", frame >= RIDE.flat[1] ? "danger" : "hot")}
    <Gate x={X.agent} y={rows[1]!} frame={frame} decideAt={T.flatFail} result="fail" r={10}
      appear={easeOut(frame, RIDE.flat[0] + 30, RIDE.flat[0] + 44) * (1 - ease(frame, T.restore, T.restore + 16))} />
    {questions.map((question, index) => {
      const [qx, qy, anchor] = questionAt(index);
      return <Tag key={question} x={qx} y={qy} text={`✗ ${question}`} tone="danger" size={compact ? 11.5 : 12} anchor={anchor}
        appear={pop(frame, T.flatFail + 8 + index * 7) * questionsOut} />;
    })}

    {/* Act 3 · the rule. */}
    <g opacity={easeOut(frame, T.motto, T.motto + 20)}>
      {compact
        ? <>
          <Text x={width / 2} y={432} size={14.5} font="mono" weight={600} tone="hot" anchor="middle">{tr(locale, "upstream authentication", "authentification amont")}</Text>
          <Text x={width / 2} y={458} size={14.5} font="mono" weight={600} tone="hot" anchor="middle">{tr(locale, "≠ downstream authorization", "≠ autorisation aval")}</Text>
        </>
        : <Tag x={width / 2} y={392} text={motto} tone="hot" size={13} />}
    </g>
  </g>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 30,
  title: { en: "One platform, two roles", fr: "Une plateforme, deux rôles" },
  caption: {
    en: "Upstream, Forest is a Service Provider that consumes IdP artifacts; downstream, it is the Identity Provider that issues the token agents trust. Flatten the two and the agent loses audience, replay, provenance and tenant control.",
    fr: "En amont, Forest est un Service Provider qui consomme les artefacts des IdP ; en aval, c’est l’Identity Provider qui émet le token auquel les agents se fient. Aplatir les deux fait perdre à l’agent l’audience, l’anti-rejeu, la provenance et le tenant.",
  },
  beats: [
    { at: 0, text: { en: "Upstream, Forest is a Service Provider: Okta or Azure AD (SAML) and Google (OIDC) authenticate the user.", fr: "En amont, Forest est Service Provider : Okta, Azure AD (SAML) ou Google (OIDC) authentifient l’utilisateur." } },
    { at: T.ctx - 6, text: { en: "Forest consumes their signed artifacts; only identity and tenant context cross to its issuer side.", fr: "Forest consomme leurs artefacts signés ; seuls l’identité et le tenant passent côté émetteur." } },
    { at: T.mint, text: { en: "Downstream, Forest is the Identity Provider: it mints its own token, which the frontend presents to the agent.", fr: "En aval, Forest est Identity Provider : il émet son propre token, que le frontend présente à l’agent." } },
    { at: T.flat, text: { en: "Flatten both roles into one “generic auth” layer, and the upstream token reaches the agent as is.", fr: "Aplatir les deux rôles en une couche « auth » générique : le token amont arrive tel quel à l’agent." } },
    { at: T.flatFail, text: { en: "The agent loses audience isolation, replay protection, provenance, tenant policy, and 3 AM debugging.", fr: "L’agent perd l’isolation d’audience, l’anti-rejeu, la provenance, la politique tenant et le debug à 3 h." } },
    { at: T.restore, text: { en: "Keep the two roles apart: upstream authentication is NOT downstream authorization.", fr: "Garder les deux rôles séparés : l’authentification en amont n’est PAS l’autorisation en aval." } },
  ],
  Stage,
});
