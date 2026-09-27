import { Actor, at, ClaimList, inFlight, Label, Lifeline, Message, Orbit, Ping, TokenCard, tr, travel, type Claim, type Point } from "../identityKit";
import { Boundary, Box, during, ease, easeOut, lerp, pop, Tag, Text, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// The agent as resource server, in the series' sequence language. Forest mints
// a narrow token for the frontend; the frontend then presents it three times.
// Each request docks at the agent and walks the claims one by one: fresh token
// (allow), the same token replayed (jti → deny), a genuine token minted for
// another agent (aud → deny). Every verdict flies into the audit trail.
const T = { mint: 14, end: 610 } as const;
const RUNS = [70, 236, 396] as const;
const RUN_LEN = 156;
const RIDE = [8, 34] as const; // token rides from run start + 8, docks at + 34
const SCAN = 42; // first check verdict, relative to run start
const STEP = 10;

type CheckSpec = { key: string; rule: [string, string] };
const CHECKS: readonly CheckSpec[] = [
  { key: "signature", rule: ["Forest public key (kid)", "clé publique Forest (kid)"] },
  { key: "iss", rule: ["= Forest Admin issuer", "= émetteur Forest Admin"] },
  { key: "aud", rule: ["= this agent, no wildcard", "= cet agent, sans joker"] },
  { key: "tenant_id", rule: ["= this agent’s tenant", "= tenant de cet agent"] },
  { key: "nbf · exp", rule: ["narrow lifetime", "durée de vie courte"] },
  { key: "jti", rule: ["never seen before", "jamais vu auparavant"] },
  { key: "scope", rule: ["least privilege", "moindre privilège"] },
];

type Run = {
  /** Index of the failing check, or -1 when every check passes. */
  failAt: number;
  token: string;
  name: [string, string];
  note?: [string, string] | undefined;
  verdict: [string, string];
  audit: string;
};
const RUN_SPECS: readonly Run[] = [
  { failAt: -1, token: "jti j-1", name: ["request 1 · fresh token", "requête 1 · token neuf"], verdict: ["✓ allow", "✓ autorisé"], audit: "allow · sub=bob · tenant-A · jti=j-1" },
  { failAt: 5, token: "jti j-1", name: ["request 2 · replayed", "requête 2 · rejouée"], note: ["j-1 seen", "j-1 déjà vu"], verdict: ["✗ deny · replay", "✗ refus · rejeu"], audit: "deny · reason=replay · jti=j-1" },
  { failAt: 2, token: "aud agent-B", name: ["request 3 · other agent", "requête 3 · autre agent"], note: ["agent-B", "agent-B"], verdict: ["✗ deny · audience", "✗ refus · audience"], audit: "deny · reason=aud_mismatch · aud=agent-B" },
];

const lastRow = (run: Run) => (run.failAt === -1 ? CHECKS.length - 1 : run.failAt);
const decideOf = (index: number) => RUNS[index]! + SCAN + lastRow(RUN_SPECS[index]!) * STEP + 12;
const landOf = (index: number) => decideOf(index) + 36;

function Stage({ frame, compact, locale }: SceneStageProps) {
  const fr = locale === "fr";
  const runIndex = RUNS.reduce((current, start, index) => (frame >= start - 14 ? index : current), 0);
  const run = RUN_SPECS[runIndex]!;
  const start = RUNS[runIndex]!;
  const allowed = run.failAt === -1;
  const decideAt = decideOf(runIndex);
  const landAt = landOf(runIndex);
  const tone: Tone = allowed ? "ok" : "danger";

  const X = compact ? { forest: 92, front: 270 } : { forest: 112, front: 282 };
  const headerY = compact ? 50 : 64;
  const headerH = compact ? 46 : 50;
  const cardW = compact ? 136 : 144;
  const mintY = compact ? 126 : 152;
  const reqY = compact ? 0 : 214;
  const panel = compact ? { x: 20, y: 196, w: 500, h: 226 } : { x: 428, y: 64, w: 492, h: 326 };
  const zone = compact ? { x: 12, y: 186, w: 516, h: 244 } : { x: 404, y: 46, w: 532, h: 360 };
  const audit = compact ? { x: 20, y: 440, w: 500, h: 72 } : { x: 40, y: 272, w: 346, h: 118 };
  const listY = panel.y + (compact ? 30 : 44);
  const rowH = compact ? 22 : 32;
  const lifeBottom = compact ? panel.y : 226;

  // The request lane: frontend → agent. Wide: horizontal into the panel's edge;
  // compact: straight down the frontend lifeline into the panel's top.
  const lane: Point[] = compact ? [[X.front, 140], [X.front, zone.y - 4]] : [[X.front, reqY], [panel.x - 14, reqY]];
  const dock: Point = compact ? [panel.x + panel.w - 74, panel.y + 18] : [panel.x + panel.w - 76, panel.y + 24];
  const rideT = travel(frame, start + RIDE[0], start + RIDE[1]);
  const settleT = ease(frame, start + RIDE[1], start + RIDE[1] + 12);
  const reqPos: Point = frame < start + RIDE[1] ? at(lane, rideT) : [lerp(lane[1]![0], dock[0], settleT), lerp(lane[1]![1], dock[1], settleT)];
  const runOut = runIndex < 2 ? 1 - ease(frame, start + RUN_LEN - 14, start + RUN_LEN) : 1;
  const reqAppear = easeOut(frame, start + 2, start + 12) * runOut;

  const mintT = travel(frame, T.mint + 8, T.mint + 40);
  const pMint: Point[] = [[X.forest, mintY], [X.front - 14, mintY]];

  const claims: Claim[] = CHECKS.map((check, index) => ({
    key: check.key,
    rule: fr ? check.rule[1] : check.rule[0],
    decideAt: start + SCAN + index * STEP,
    result: index === run.failAt ? "fail" : "pass",
    // Never scanned: once an earlier check fails, the rest recede unevaluated.
    skipped: index > lastRow(run) && frame >= start + SCAN + lastRow(run) * STEP,
  }));
  // The list resets between requests: a short dip so each run reads as new.
  const listIn = runIndex === 0 ? easeOut(frame, 20, 40) : .35 + .65 * easeOut(frame, start - 14, start + 4);

  const verdictPop = pop(frame, decideAt);
  const verdictW = (text: string, size: number) => text.length * size * .6 + size * 1.5;
  const verdictText = fr ? run.verdict[1] : run.verdict[0];
  const verdictSize = compact ? 13 : 14;
  // Centre of an end-anchored chip at the panel's bottom-right corner.
  const verdictPos: Point = [panel.x + panel.w - 20 - verdictW(verdictText, verdictSize) / 2, panel.y + panel.h - (compact ? 22 : 30)];
  const failY = run.failAt >= 0 ? listY + run.failAt * rowH + rowH / 2 : 0;

  // Verdict → audit trail: the chip flies to its line and becomes a log entry.
  const lineY = (index: number) => audit.y + (compact ? 32 : 46) + index * (compact ? 16 : 22);
  const lineX = audit.x + 18;
  const flyT = ease(frame, decideAt + 14, landAt, (t) => 1 - (1 - t) ** 3);
  const flying = frame >= decideAt + 14 && frame < landAt;
  const target: Point = [lineX + verdictW(verdictText, compact ? 12 : 13) / 2 - 4, lineY(runIndex)];
  const control: Point = compact ? [verdictPos[0] - 60, lerp(verdictPos[1], target[1], .5) + 10] : [lerp(verdictPos[0], target[0], .5), verdictPos[1] + 40];
  const bez = (a: number, b: number, c: number, t: number) => (1 - t) ** 2 * a + 2 * (1 - t) * t * b + t * t * c;
  const flyPos: Point = [bez(verdictPos[0], control[0], target[0], flyT), bez(verdictPos[1], control[1], target[1], flyT)];

  const focusOf = (windows: readonly (readonly [number, number])[]) => Math.max(0, ...windows.map(([a, b]) => ease(frame, a, a + 10) * (1 - ease(frame, b, b + 14))));
  const panelFocus = frame >= start + RIDE[1] - 4 ? during(frame, start + RIDE[1] - 4, decideAt + 24, 10) : 0;
  const tokenSize = compact ? 11 : 12;

  return <g>
    <Boundary {...zone} tone="hot" label={tr(locale, "customer network", "réseau client")} labelAt="top-end" appear={easeOut(frame, 8, 26)} />

    <Lifeline x={X.forest} top={headerY + headerH} bottom={mintY + (compact ? 30 : 44)} grow={ease(frame, 6, 30)} />
    <Lifeline x={X.front} top={headerY + headerH} bottom={lifeBottom} grow={ease(frame, 10, 34)} />
    <Orbit x={X.forest} y={headerY + headerH / 2} rx={cardW / 2 + 12} ry={32} frame={frame} appear={easeOut(frame, 20, 40)} />
    <Actor x={X.forest} y={headerY} w={cardW} h={headerH} label="Forest" sub={tr(locale, "issuer · IdP", "émetteur · IdP")} size={compact ? 14.5 : 16} appear={pop(frame, 0)}
      focus={focusOf([[T.mint, T.mint + 30]])} />
    <Actor x={X.front} y={headerY} w={cardW} h={headerH} label="Frontend" sub={tr(locale, "bearer", "porteur")} size={compact ? 14.5 : 16} appear={pop(frame, 5)}
      focus={focusOf([[T.mint + 36, RUNS[0] + 10], [start, start + RIDE[0] + 8]])} />

    {/* Forest mints the narrow token once. */}
    <Message points={pMint} progress={mintT} live={during(frame, T.mint, RUNS[0], 12)} tone="ok" />
    <Label x={(X.forest + X.front) / 2} y={mintY - 20} text={tr(locale, "mints a narrow token", "émet un token étroit")} size={compact ? 11.5 : 12.5}
      live={during(frame, T.mint, RUNS[0], 12)} appear={easeOut(frame, T.mint, T.mint + 16)} />
    <TokenCard {...{ x: at(pMint, mintT)[0], y: at(pMint, mintT)[1] }} kind="JWT" text="Forest" tone="ok" size={tokenSize} lift={inFlight(mintT)}
      appear={easeOut(frame, T.mint + 2, T.mint + 12) * (1 - ease(frame, T.mint + 40, T.mint + 52))} />

    {/* The request lane: Authorization header, over TLS. */}
    <Message points={lane} progress={RUNS.reduce((sum, runStart) => Math.max(sum, travel(frame, runStart + RIDE[0], runStart + RIDE[1])), 0)}
      live={during(frame, start, start + RIDE[1] + 10, 8)} />
    {compact
      ? <Label x={X.front + 14} y={162} anchor="start" text="Authorization: Bearer · TLS" size={11.5} appear={easeOut(frame, RUNS[0], RUNS[0] + 16)} live={during(frame, start, start + RIDE[1] + 10, 8)} />
      : <>
        <Label x={(X.front + panel.x) / 2 - 6} y={reqY - 20} text="Bearer · TLS" size={12.5} appear={easeOut(frame, RUNS[0], RUNS[0] + 16)} live={during(frame, start, start + RIDE[1] + 10, 8)} />
        <g opacity={easeOut(frame, RUNS[0] + 10, RUNS[0] + 26)}>
          <Text x={panel.x - 18} y={reqY + 24} size={11.5} font="mono" weight={500} tone="muted" anchor="end">{tr(locale, "header only · never logged", "header seul · jamais loggué")}</Text>
        </g>
      </>}

    {/* The agent: one explicit check per claim. */}
    <Box x={panel.x} y={panel.y} w={panel.w} h={panel.h} tone={frame >= decideAt ? tone : "line"} radius={16} appear={easeOut(frame, 12, 32)}
      focus={panelFocus * .8} fill={.3 * during(frame, decideAt, start + RUN_LEN - 6, 10)}>
      <Text x={panel.x + 20} y={panel.y + (compact ? 18 : 24)} size={11} font="mono" weight={600} tone="muted" caps>{tr(locale, "agent · resource server", "agent · serveur de ressources")}</Text>
    </Box>
    <g opacity={listIn}>
      <ClaimList x={panel.x + 12} y={listY} w={panel.w - 24} rowH={rowH} frame={frame} claims={claims} keyW={compact ? 98 : 112} size={compact ? 13 : 14} ruleSize={compact ? 11.5 : 12.5} />
      {run.note ? <Tag x={panel.x + panel.w - 22} y={failY} anchor="end" text={fr ? run.note[1] : run.note[0]} tone="danger" size={compact ? 11 : 12} appear={pop(frame, decideAt - 4)} /> : null}
    </g>
    <Tag x={verdictPos[0]} y={verdictPos[1]} text={verdictText} tone={tone} size={verdictSize} appear={verdictPop * (1 - ease(frame, decideAt + 14, decideAt + 22))} />
    <g opacity={runOut}>
      <Text x={panel.x + 24} y={panel.y + panel.h - (compact ? 22 : 30)} size={compact ? 11.5 : 12} font="mono" weight={500} tone="muted"
        opacity={easeOut(frame, start - 4, start + 10) * (1 - ease(frame, decideAt - 6, decideAt + 6))}>{fr ? run.name[1] : run.name[0]}</Text>
    </g>
    <TokenCard x={reqPos[0]} y={reqPos[1]} kind="JWT" text={run.token} tone={frame >= decideAt ? tone : "hot"} size={tokenSize}
      lift={frame < start + RIDE[1] ? inFlight(rideT) : 0} appear={reqAppear} strike={allowed ? 0 : ease(frame, decideAt, decideAt + 10)} />

    {/* Audit trail: one line per decision, never overwritten. */}
    <Box x={audit.x} y={audit.y} w={audit.w} h={audit.h} tone="line" radius={14} appear={easeOut(frame, 16, 36)}>
      <Text x={audit.x + 18} y={audit.y + (compact ? 15 : 22)} size={11} font="mono" weight={600} tone="muted" caps>{tr(locale, "audit trail", "piste d’audit")}</Text>
    </Box>
    {RUN_SPECS.map((spec, index) => {
      const landed = landOf(index);
      const ok = spec.failAt === -1;
      return <g key={spec.audit} opacity={easeOut(frame, landed - 8, landed + 6)}>
        <Text x={lineX} y={lineY(index)} size={compact ? 11.5 : 12.5} font="mono" weight={600} tone={ok ? "ok" : "danger"}>{`${ok ? "✓" : "✗"} ${spec.audit}`}</Text>
      </g>;
    })}
    {flying ? <Tag x={flyPos[0]} y={flyPos[1]} text={verdictText} tone={tone} size={compact ? 12 : 13} appear={1 - ease(flyT, .78, 1)} /> : null}
    <Ping x={lineX - 4} y={lineY(runIndex)} frame={frame} at={landAt} r={7} tone={tone} />
  </g>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: RUNS[1] + RUN_LEN - 30,
  title: { en: "The agent checks every claim", fr: "L’agent vérifie chaque claim" },
  caption: {
    en: "The agent validates each claim of the Forest-issued token explicitly: signature, issuer, exact audience, tenant, lifetime, replay, scope. Every allow or deny is observable and auditable.",
    fr: "L’agent valide explicitement chaque claim du token émis par Forest : signature, émetteur, audience exacte, tenant, durée de vie, rejeu, scope. Chaque autorisation ou refus est observable et auditable.",
  },
  beats: [
    { at: 0, text: { en: "Forest mints a narrow token: iss, exact aud, sub, tenant_id, short iat/nbf/exp, jti, least-privilege scope.", fr: "Forest émet un token étroit : iss, aud exact, sub, tenant_id, iat/nbf/exp courts, jti, scope minimal." } },
    { at: RUNS[0], text: { en: "Sent as Authorization: Bearer over TLS, it walks down the agent’s checks, one explicit step at a time.", fr: "Envoyé en Authorization: Bearer sur TLS, il parcourt les contrôles de l’agent, un par un, explicitement." } },
    { at: decideOf(0), text: { en: "Every check passes: the call is allowed, and the decision is written to the audit trail.", fr: "Tout passe : l’appel est autorisé, et la décision est écrite dans la piste d’audit." } },
    { at: RUNS[1], text: { en: "The same token again: its jti was already seen. Replay denied, with a reason code.", fr: "Le même token, rejoué : son jti est déjà connu. Rejeu refusé, avec un code de raison." } },
    { at: RUNS[2], text: { en: "A genuine Forest token minted for another agent: aud is not an exact match. Denied.", fr: "Un vrai token Forest, mais émis pour un autre agent : aud ne correspond pas exactement. Refusé." } },
    { at: landOf(2), text: { en: "Can this request call this agent in this tenant? Only if every check says yes, and the log says why.", fr: "Peut-elle appeler cet agent dans ce tenant ? Seulement si chaque contrôle dit oui ; le log dit pourquoi." } },
  ],
  Stage,
});
