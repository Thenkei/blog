import { Activation, Actor, at, ClaimList, Gate, gapsAt, inFlight, Label, Lifeline, Message, Orbit, Ping, spanOf, SummitFlag, TokenCard, tr, travel, type Claim, type Point, type Span } from "../identityKit";
import { Boundary, Box, during, ease, easeOut, lerp, pop, Tag, Text, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Authorization Code flow in the series' sequence language (IdP | browser |
// Forest). The redirect parameters and then the code physically ride the
// front channel through the browser; the code goes back to the IdP off the
// browser and returns as an ID token, which flies into Forest's checklist and
// is trusted only once every check the article lists has passed.
const T = {
  m2: 30,
  auth: 122,
  m4: 158,
  state: 226,
  m6: 244,
  m7: 290,
  dock: 330,
  checks: 366,
  step: 16,
  verdict: 470,
  end: 590,
} as const;

const RIDE = {
  m2: [40, 100],
  m4: [168, 222],
  m6: [252, 282],
  m7: [296, 326],
  fly: [328, 356],
} as const;

type RowSpec = { key: string; rule: [string, string]; decideAt: number };
const ROWS: readonly RowSpec[] = [
  { key: "state", rule: ["= the one Forest sent", "= celui envoyé par Forest"], decideAt: T.state + 4 },
  { key: "signature", rule: ["IdP key from metadata", "clé IdP (métadonnées)"], decideAt: T.checks },
  { key: "iss", rule: ["allowed upstream issuer", "émetteur amont autorisé"], decideAt: T.checks + T.step },
  { key: "aud", rule: ["exactly Forest’s client", "exactement le client Forest"], decideAt: T.checks + T.step * 2 },
  { key: "exp · nbf", rule: ["within clock-skew policy", "dans la dérive tolérée"], decideAt: T.checks + T.step * 3 },
  { key: "nonce", rule: ["= the login nonce", "= nonce de la connexion"], decideAt: T.checks + T.step * 4 },
  { key: "tenant", rule: ["from trusted claims only", "via claims approuvés"], decideAt: T.checks + T.step * 5 },
];

function Stage({ frame, compact, locale }: SceneStageProps) {
  const X = compact ? { idp: 82, browser: 270, forest: 458 } : { idp: 104, browser: 294, forest: 484 };
  const headerY = compact ? 58 : 64;
  const headerH = compact ? 44 : 50;
  const cardW = compact ? 132 : 150;
  // Six messages; a wider gap after /authorize while the user signs in.
  const rows = compact ? [138, 170, 234, 266, 298, 330] : [150, 186, 260, 296, 332, 368];
  const authMid = rows[1]! + (compact ? 30 : 35);
  const lifeBottom = compact ? 340 : 380;
  const labelSize = compact ? 11.5 : 12.5;
  const tokenSize = compact ? 10.5 : 11.5;
  const lift = compact ? 16 : 18;

  const panel = compact ? { x: 20, y: 366, w: 500, h: 142 } : { x: 586, y: 76, w: 334, h: 314 };
  const zone = compact ? { x: 372, y: 44, w: 160, h: 306 } : { x: 408, y: 46, w: 528, h: 358 };

  const live = (start: number, end: number) => during(frame, start, end, 10);
  const L = {
    m2: live(T.m2, T.auth),
    auth: live(T.auth, T.m4 + 10),
    m4: live(T.m4, T.m6),
    m6: live(T.m6, T.m7),
    m7: live(T.m7, T.checks),
  };

  const tip = (from: number, to: number, y: number, pad = 12): Point[] => [[from, y], [to - Math.sign(to - from) * pad, y]];
  // Front channel: the browser carries the parameters from one redirect to the next.
  const pState: Point[] = [[X.forest, rows[0]!], [X.browser, rows[0]!], [X.browser, rows[1]!], [X.idp + 12, rows[1]!]];
  const pCode: Point[] = [[X.idp, rows[2]!], [X.browser, rows[2]!], [X.browser, rows[3]!], [X.forest - 17, rows[3]!]];
  const p6 = tip(X.forest, X.idp, rows[4]!);
  const p7 = tip(X.idp, X.forest, rows[5]!, 17);

  const tState = travel(frame, ...RIDE.m2);
  const tCode = travel(frame, ...RIDE.m4);
  const t6 = travel(frame, ...RIDE.m6);
  const t7 = travel(frame, ...RIDE.m7);
  // Split a two-hop ride into its two message segments (hop, drop, hop).
  const hops = (t: number, a: number, drop: number, b: number) => {
    const total = a + drop + b;
    return [Math.min(1, t * total / a), Math.max(0, (t * total - a - drop) / b)] as const;
  };
  const [s2, s3] = hops(tState, X.forest - X.browser, rows[1]! - rows[0]!, X.browser - X.idp - 12);
  const [s4, s5] = hops(tCode, X.browser - X.idp, rows[3]! - rows[2]!, X.forest - 17 - X.browser);

  const text = {
    m2: tr(locale, "redirect · state, nonce", "redirection · state, nonce"),
    m3: "/authorize · state, nonce",
    m4: tr(locale, "redirect · code, state", "redirection · code, state"),
    m5: "callback · code, state",
    m6: compact ? tr(locale, "exchange code", "échange du code") : tr(locale, "code exchange, off the browser", "échange du code, hors navigateur"),
    m7: "ID token + access token",
  };
  const between = (a: number, b: number) => (a + b) / 2;
  const labelPos: Record<keyof typeof text, readonly [number, number]> = {
    m2: [between(X.browser, X.forest), rows[0]! - lift],
    m3: [between(X.idp, X.browser), rows[1]! - lift],
    m4: [between(X.idp, X.browser), rows[2]! - lift],
    m5: [between(X.browser, X.forest), rows[3]! - lift],
    m6: [compact ? between(X.browser, X.forest) : between(X.idp, X.forest), rows[4]! - lift],
    m7: [between(X.browser, X.forest), rows[5]! - lift],
  };
  const authTag = tr(locale, "user signs in", "l’utilisateur se connecte");
  const spans: Span[] = [
    ...(Object.keys(text) as (keyof typeof text)[]).map((key) => spanOf(labelPos[key][0], labelPos[key][1], text[key], labelSize)),
  ];

  const tokenAt = (points: readonly Point[], t: number, start: number, arrive: number, kind: string, body: string | undefined, tone: Tone) => {
    const appear = easeOut(frame, start + 4, start + 14) * (1 - ease(frame, arrive, arrive + 12));
    const [x, y] = at(points, t);
    return <TokenCard x={x} y={y} kind={kind} text={body} tone={tone} appear={appear} lift={inFlight(t)} size={tokenSize} />;
  };

  // The ID token lifts off Forest's lifeline and docks in the checklist header.
  const dock: Point = compact ? [panel.x + 66, panel.y + 20] : [panel.x + 70, panel.y + 24];
  const flyT = ease(frame, ...RIDE.fly, (t) => 1 - (1 - t) ** 3);
  const from: Point = [X.forest - 17, rows[5]!];
  // Arc up Forest's lifeline, then across into the panel header: never over the rows.
  const control: Point = compact ? [from[0] + 40, lerp(from[1], dock[1], .7)] : [from[0] + 10, panel.y + 10];
  const bez = (a: number, b: number, c: number, t: number) => (1 - t) ** 2 * a + 2 * (1 - t) * t * b + t * t * c;
  const flying = frame >= RIDE.fly[0];
  const jwtPos: Point = flying ? [bez(from[0], control[0], dock[0], flyT), bez(from[1], control[1], dock[1], flyT)] : at(p7, t7);
  const jwtAppear = easeOut(frame, T.m7 + 4, T.m7 + 14);
  const jwtLift = flying ? inFlight(flyT) : inFlight(t7);

  const claims: Claim[] = ROWS.map((row) => ({ key: row.key, ...(compact ? {} : { rule: locale === "fr" ? row.rule[1] : row.rule[0] }), decideAt: row.decideAt, result: "pass" }));
  const verdict = pop(frame, T.verdict);
  const allPassed = frame >= T.verdict;

  const focusOf = (windows: readonly (readonly [number, number])[]) => Math.max(0, ...windows.map(([a, b]) => ease(frame, a, a + 10) * (1 - ease(frame, b, b + 14))));
  const focus = {
    idp: focusOf([[T.auth, T.m4 + 8], [RIDE.m6[1] - 6, T.m7 + 10]]),
    browser: focusOf([[RIDE.m2[0] + 18, RIDE.m2[0] + 34], [RIDE.m4[0] + 18, RIDE.m4[0] + 34]]),
    forest: focusOf([[T.m2, RIDE.m2[0] + 6], [RIDE.m4[1] - 6, T.m6], [RIDE.m7[1] - 6, T.dock]]),
  };

  return <g>
    <Boundary x={compact ? 12 : 24} y={46} w={compact ? 140 : 160} h={compact ? 304 : lifeBottom - 30} label={tr(locale, "upstream", "amont")} labelAt="bottom-start" appear={easeOut(frame, 6, 24)} />
    <Boundary {...zone} tone="hot" label="Forest · RP" labelAt="top-end" appear={easeOut(frame, 10, 28)} />

    {(["idp", "browser", "forest"] as const).map((col, index) => <Lifeline key={col} x={X[col]} top={headerY + headerH} bottom={lifeBottom}
      grow={ease(frame, 8 + index * 4, 40 + index * 4)} gaps={gapsAt(X[col], spans)} />)}
    <Orbit x={X.idp} y={headerY + headerH / 2} rx={cardW / 2 + 10} ry={32} frame={frame} appear={easeOut(frame, 20, 40)} />
    <Actor x={X.idp} y={headerY} w={cardW} h={headerH} label="OIDC IdP" sub={tr(locale, "e.g. Google", "ex. Google")} size={compact ? 14.5 : 16} appear={pop(frame, 0)} focus={focus.idp} />
    <Actor x={X.browser} y={headerY} w={cardW} h={headerH} label={tr(locale, "Browser", "Navigateur")} sub={tr(locale, "user", "utilisateur")} size={compact ? 14.5 : 16} appear={pop(frame, 4)} focus={focus.browser} />
    <Actor x={X.forest} y={headerY} w={cardW} h={headerH} label="Forest" sub={tr(locale, "OAuth client", "client OAuth")} size={compact ? 14.5 : 16} appear={pop(frame, 8)} focus={focus.forest} />

    {/* 1–2 · front-channel redirect carrying state + nonce */}
    <Message points={pState.slice(0, 2)} progress={s2} live={L.m2} dashed />
    <Label x={labelPos.m2[0]} y={labelPos.m2[1]} text={text.m2} live={L.m2} size={labelSize} appear={easeOut(frame, T.m2, T.m2 + 14)} />
    <Message points={pState.slice(2)} progress={s3} live={L.m2} dashed />
    <Label x={labelPos.m3[0]} y={labelPos.m3[1]} text={text.m3} live={L.m2} size={labelSize} appear={easeOut(frame, RIDE.m2[0] + 24, RIDE.m2[0] + 38)} />

    {/* The IdP authenticates the user between the two redirects. */}
    <Activation x={X.idp} y0={rows[1]! + 8} y1={rows[2]! - 8} t={easeOut(frame, T.auth, T.auth + 24)} />
    <Tag x={between(X.idp, X.browser)} y={authMid} text={authTag} tone="hot" size={compact ? 11 : 12} appear={pop(frame, T.auth + 8) * (.55 + .45 * L.auth)} />

    {/* 3–4 · code + state back through the browser to Forest's callback */}
    <Message points={pCode.slice(0, 2)} progress={s4} live={L.m4} tone="hot" dashed />
    <Label x={labelPos.m4[0]} y={labelPos.m4[1]} text={text.m4} live={L.m4} size={labelSize} appear={easeOut(frame, T.m4, T.m4 + 14)} />
    <Message points={pCode.slice(2)} progress={s5} live={L.m4} tone="hot" />
    <Label x={labelPos.m5[0]} y={labelPos.m5[1]} text={text.m5} live={L.m4} size={labelSize} appear={easeOut(frame, RIDE.m4[0] + 26, RIDE.m4[0] + 40)} />
    <Gate x={X.forest} y={rows[3]!} frame={frame} decideAt={T.state} result="pass" r={10} appear={easeOut(frame, RIDE.m4[0] + 30, RIDE.m4[0] + 44)} />
    <Ping x={X.forest} y={rows[3]!} frame={frame} at={T.state} r={10} />

    {/* 5 · back channel: the code goes to the IdP, 6 · tokens come back */}
    <Message points={p6} progress={t6} live={L.m6} tone="hot" />
    <Label x={labelPos.m6[0]} y={labelPos.m6[1]} text={text.m6} live={L.m6} size={labelSize} appear={easeOut(frame, T.m6, T.m6 + 14)} />
    <Message points={p7} progress={t7} live={L.m7} tone="ok" />
    <Label x={labelPos.m7[0]} y={labelPos.m7[1]} text={text.m7} live={L.m7} size={labelSize} appear={easeOut(frame, T.m7, T.m7 + 14)} />
    <Gate x={X.forest} y={rows[5]!} frame={frame} decideAt={ROWS.at(-1)!.decideAt} result="pass" r={10} appear={easeOut(frame, RIDE.m7[1], RIDE.m7[1] + 12)} />

    {tokenAt(pState, tState, T.m2, RIDE.m2[1], "STATE", "nonce", "line")}
    {tokenAt(pCode, tCode, T.m4, RIDE.m4[1], "CODE", compact ? undefined : "state", "hot")}
    {tokenAt(p6, t6, T.m6, RIDE.m6[1], "CODE", undefined, "hot")}

    {/* Forest opens the ID token and runs every check. */}
    <Box x={panel.x} y={panel.y} w={panel.w} h={panel.h} tone={allPassed ? "ok" : "line"} radius={16}
      appear={easeOut(frame, 16, 36)} focus={during(frame, T.dock - 6, T.verdict + 30, 12) * .8} fill={.35 * ease(frame, T.verdict, T.verdict + 16)}>
      <Text x={panel.x + panel.w - 20} y={panel.y + (compact ? 20 : 24)} size={11} font="mono" weight={600} tone="muted" caps anchor="end">{tr(locale, "Forest checks", "contrôles Forest")}</Text>
    </Box>
    {compact
      ? <g opacity={easeOut(frame, 20, 40)}>
        <ClaimList x={panel.x + 10} y={panel.y + 36} w={236} rowH={26} frame={frame} claims={claims.slice(0, 4)} keyW={0} size={13.5} />
        <ClaimList x={panel.x + 254} y={panel.y + 36} w={236} rowH={26} frame={frame} claims={claims.slice(4)} keyW={0} size={13.5} />
      </g>
      : <ClaimList x={panel.x + 12} y={panel.y + 46} w={panel.w - 24} rowH={32} frame={frame} claims={claims} keyW={96} size={14} appear={easeOut(frame, 20, 40)} />}
    {compact
      ? <Tag x={panel.x + 262} y={panel.y + 36 + 3 * 26 + 13} anchor="start" text={tr(locale, "✓ authenticated upstream", "✓ authentifié en amont")} tone="ok" size={12.5} appear={verdict} />
      : <Tag x={panel.x + panel.w / 2} y={panel.y + panel.h - 30} text={tr(locale, "✓ authenticated by an allowed IdP", "✓ authentifié par un IdP autorisé")} tone="ok" size={13} appear={verdict} />}
    <SummitFlag x={X.forest + 14} y={rows[5]! - 9} appear={easeOut(frame, T.verdict + 10, T.verdict + 30)} />

    <TokenCard x={jwtPos[0]} y={jwtPos[1]} kind="JWT" text="ID token" tone="ok" size={tokenSize} lift={jwtLift}
      appear={jwtAppear} />
  </g>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 30,
  title: { en: "OIDC Authorization Code flow", fr: "Flux OIDC Authorization Code" },
  caption: {
    en: "Forest redirects to the upstream IdP, receives an authorization code on its callback, exchanges it for tokens, and trusts the ID token only after signature, issuer, audience, lifetime, nonce/state and tenant checks.",
    fr: "Forest redirige vers l’IdP amont, reçoit un code d’autorisation sur son callback, l’échange contre des tokens, et ne croit l’ID token qu’après signature, émetteur, audience, durée de vie, nonce/state et tenant.",
  },
  beats: [
    { at: 0, text: { en: "Forest initiates login: it redirects the browser to the upstream OIDC provider with a state and a nonce.", fr: "Forest initie la connexion : il redirige le navigateur vers l’IdP OIDC amont avec un state et un nonce." } },
    { at: T.auth - 4, text: { en: "The user authenticates at the IdP, which redirects back to Forest’s callback with an authorization code.", fr: "L’utilisateur s’authentifie chez l’IdP, qui redirige vers le callback Forest avec un code d’autorisation." } },
    { at: T.state - 6, text: { en: "At the callback, Forest checks that the returned state matches the one it sent.", fr: "Au callback, Forest vérifie que le state reçu correspond à celui qu’il a envoyé." } },
    { at: T.m6 - 2, text: { en: "Forest exchanges the code with the IdP, off the browser, and receives an ID token + access token.", fr: "Forest échange le code auprès de l’IdP, hors navigateur, et reçoit ID token + access token." } },
    { at: T.checks - 10, text: { en: "Before trusting it: signature, iss, aud, exp/nbf with clock skew, nonce, tenant from trusted claims only.", fr: "Avant d’y croire : signature, iss, aud, exp/nbf (dérive horaire), nonce, tenant issu de claims approuvés." } },
    { at: T.verdict, text: { en: "Only then is the answer yes: this user is authenticated by an allowed upstream authority.", fr: "Alors seulement la réponse est oui : cet utilisateur est authentifié par une autorité amont autorisée." } },
  ],
  Stage,
});
