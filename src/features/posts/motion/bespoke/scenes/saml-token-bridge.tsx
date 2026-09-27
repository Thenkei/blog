import { Actor, Gate, Label, Lifeline, Message, Orbit, Ping, SummitFlag, TokenCard, partial, pathOf, tr, travel, inFlight, type Point } from "../identityKit";
import { Boundary, Box, ease, easeOut, lerp, pop, Tag, Text, tint, TONE } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// RFC 7522 bridge in the series' sequence language, replayed twice with the
// same SAML assertion a-17. Act 1 is the failure mode the article warns about:
// the assertion hops over Forest's pipeline and lands as a broad bearer. Act 2
// rides the article's six-step trust pipeline station by station: validated,
// mapped, authorized, minted into narrow token j-9, replay/TTL bound, audited.
const T = {
  assertion: 8,
  ride1: [26, 56],
  hop: [58, 112],
  out1: [114, 140],
  broad: 146,
  reset: 206,
  ride2: [226, 256],
  step0: 262,
  step: 30,
  end: 600,
} as const;

const stepAt = (index: number) => T.step0 + index * T.step;
const OUT2 = [stepAt(5) + 10, stepAt(5) + 38] as const;
const FILL2 = OUT2[1] + 6;

type Step = { name: [string, string]; detail: [string, string] };
const PIPELINE: readonly Step[] = [
  { name: ["validate assertion", "valider l’assertion"], detail: ["cryptographically", "cryptographiquement"] },
  { name: ["tenant + principal", "tenant + principal"], detail: ["deterministic mapping", "mapping déterministe"] },
  { name: ["authorization policy", "politique d’autorisation"], detail: ["at the Forest boundary", "à la frontière Forest"] },
  { name: ["mint a narrow token", "émettre un token étroit"], detail: ["one agent audience", "une seule audience agent"] },
  { name: ["replay · TTL", "anti-rejeu · TTL"], detail: ["constraints enforced", "contraintes appliquées"] },
  { name: ["audit event", "événement d’audit"], detail: ["a-17 → j-9", "a-17 → j-9"] },
];

type ClaimRow = { key: string; broad: string | null; narrow: string };
const CLAIMS: readonly ClaimRow[] = [
  { key: "aud", broad: "*", narrow: "agent-A" },
  { key: "scope", broad: "*", narrow: "read" },
  { key: "tenant_id", broad: "?", narrow: "tenant-A" },
  { key: "exp", broad: null, narrow: "short" },
  { key: "jti", broad: null, narrow: "j-9" },
];


function Stage({ frame, compact, locale }: SceneStageProps) {
  const fr = locale === "fr";
  const act2 = frame >= T.reset;
  const act1 = 1 - ease(frame, T.reset, T.reset + 18);
  const pick = (pair: readonly [string, string]) => (fr ? pair[1] : pair[0]);

  // ── Geometry: a vertical run of six stations inside Forest ──
  const idp: Point = compact ? [100, 54] : [110, 64];
  const spineX = compact ? 100 : 262;
  const stations: Point[] = PIPELINE.map((_, index) => [spineX, compact ? 164 + index * 40 : 150 + index * 42]);
  const first = stations[0]!;
  const last = stations.at(-1)!;
  const agentX = 844;
  const agentBox = compact ? { x: 20, y: 420, w: 500, h: 90 } : { x: 760, y: 128, w: 168, h: 236 };
  const outY = 386;
  // The card waits just above each station, so its checkpoint stays visible.
  const wait = compact ? 20 : 22;
  const top: Point = [spineX, first[1] - wait];
  const entry: Point = compact ? [100, 100] : [idp[0], top[1]];
  const inPath: Point[] = [entry, top];
  const lastWait: Point = [spineX, last[1] - wait];
  const outPath: Point[] = compact ? [lastWait, [100, agentBox.y - 14]] : [lastWait, [spineX, outY], [agentX, outY], [agentX, agentBox.y + agentBox.h + 12]];
  // Act 1 · the bypass: a lane beside the stations that never meets one.
  const lane = compact ? 456 : 226;
  const bypass: Point[] = compact
    ? [[100, 100], [100, 138], [lane, 138], [lane, agentBox.y - 14]]
    : [entry, [lane, entry[1]], [lane, outY], [agentX, outY], [agentX, agentBox.y + agentBox.h + 12]];
  const bypassTag: Point = compact ? [522, 276] : [520, outY];

  // ── Act 1 motion: one ride down the bypass, converted on the way ──
  const b1 = ease(frame, T.ride1[0], T.out1[1]);
  // Converted inside Forest, on the bypass lane: bottom of the lane (wide), mid-lane (compact).
  const morphed1 = b1 >= (compact ? .7 : .36);
  const act1Card = at(bypass, b1);
  const act1Appear = easeOut(frame, T.assertion, T.assertion + 12) * (1 - ease(frame, T.out1[1], T.out1[1] + 12)) * act1;
  const broadOn = act1 * (1 - ease(frame, T.reset, T.reset + 12));

  // ── Act 2 motion: station by station ──
  const r2 = travel(frame, ...T.ride2);
  const drop = stations.slice(1).reduce((sum, station, index) => sum + (station[1] - stations[index]![1]) * ease(frame, stepAt(index) + 6, stepAt(index + 1) - 4), 0);
  const o2 = travel(frame, ...OUT2);
  const act2Card: Point = frame < T.step0
    ? at(inPath, r2)
    : frame < OUT2[0] ? [spineX, top[1] + drop] : at(outPath, o2);
  const minted = frame >= stepAt(3);
  const act2Appear = act2 ? easeOut(frame, T.reset + 10, T.reset + 22) * (1 - ease(frame, OUT2[1], OUT2[1] + 12)) : 0;
  const moving = frame < T.step0 ? inFlight(r2) : frame >= OUT2[0] ? inFlight(o2) : 0;
  // The trace behind the card: the stretch it has already travelled.
  const trace: Point[] = frame < T.step0
    ? partial(inPath, r2)
    : frame < OUT2[0] ? [entry, top, act2Card] : [entry, top, ...partial(outPath, o2)];

  const narrowOn = ease(frame, FILL2 - 4, FILL2 + 8);
  const current = PIPELINE.findIndex((_, index) => frame >= stepAt(index) - 16 && frame < stepAt(index) + 14);
  const tokenSize = compact ? 11 : 11.5;

  // Verdict chip: wide replaces the card's eyebrow; compact sits at the end of row 2.
  const broadVerdict = pop(frame, T.broad + 10) * broadOn;
  const narrowVerdict = pop(frame, FILL2 + 30);
  const verdictOn = act2 ? narrowVerdict : broadVerdict;
  const verdictAt: Point = compact ? [agentBox.x + agentBox.w - 12, agentBox.y + 72] : [agentBox.x + agentBox.w / 2, agentBox.y + 20];

  const focusOf = (windows: readonly (readonly [number, number])[]) => Math.max(0, ...windows.map(([a, b]) => ease(frame, a, a + 10) * (1 - ease(frame, b, b + 14))));
  const spineAppear = easeOut(frame, 16, 36);

  return <g>
    {/* Zones */}
    <Boundary x={compact ? 12 : 24} y={46} w={compact ? 516 : 172} h={compact ? 64 : 354} label={tr(locale, "upstream IdP", "IdP amont")} labelAt={compact ? "bottom-end" : "bottom-start"} appear={easeOut(frame, 4, 22)} />
    <Boundary x={compact ? 12 : 206} y={compact ? 124 : 46} w={compact ? 516 : 534} h={compact ? 280 : 354} tone="hot" label={tr(locale, "Forest · token exchange", "Forest · échange de token")} labelAt={compact ? "bottom-end" : "top-end"} appear={easeOut(frame, 8, 26)} />
    {compact ? null : <Boundary x={752} y={46} w={184} h={354} tone="hot" label={tr(locale, "customer", "client")} labelAt="top-end" appear={easeOut(frame, 12, 30)} />}

    {/* Actors */}
    <Orbit x={idp[0]} y={idp[1] + 23} rx={82} ry={32} frame={frame} appear={easeOut(frame, 20, 40)} />
    <Actor x={idp[0]} y={idp[1]} w={compact ? 160 : 140} h={compact ? 46 : 50} label="IdP" sub="Okta · Azure AD" size={16} appear={pop(frame, 0)} focus={focusOf([[T.assertion, T.ride1[0] + 6], [T.reset + 10, T.ride2[0] + 6]])} />
    {compact ? null : <>
      <Lifeline x={idp[0]} top={114} bottom={first[1] + 18} grow={ease(frame, 10, 30)} />
      <Actor x={agentX} y={64} w={156} label="Agent" sub={tr(locale, "one audience", "une audience")} size={16} appear={pop(frame, 8)}
        tone={frame >= T.broad && !act2 ? "danger" : "line"} focus={focusOf([[T.out1[1] - 6, T.reset], [OUT2[1] - 6, T.end]])} />
    </>}

    {/* RFC 7522 grant: how the assertion is presented. */}
    <g opacity={easeOut(frame, 20, 38)}>
      {compact
        ? <>
          <Text x={206} y={66} size={11} font="mono" weight={600} tone="muted" caps>{tr(locale, "RFC 7522 · authorization grant", "RFC 7522 · authorization grant")}</Text>
          <Text x={206} y={88} size={12.5} font="mono" weight={500}>grant_type=…saml2-bearer</Text>
        </>
        : <>
          <Text x={42} y={268} size={11} font="mono" weight={600} tone="muted" caps>RFC 7522</Text>
          <Text x={42} y={290} size={12.5} font="mono" weight={600}>saml2-bearer</Text>
          <Text x={42} y={310} size={12} font="mono" weight={500} tone="muted">authorization grant</Text>
          <Text x={42} y={330} size={12} font="mono" weight={500} tone="muted">assertion=&lt;SAML&gt;</Text>
        </>}
    </g>

    {/* The spine: in, six stations, out. */}
    <path d={pathOf([entry, top, ...outPath.slice(1)])} fill="none" stroke="var(--scene-hairline)" strokeWidth={1.1} opacity={spineAppear} />
    {act2 && frame >= T.ride2[0] ? <path d={pathOf(trace)} fill="none" stroke={TONE.ok} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" /> : null}

    {/* Stations */}
    {PIPELINE.map((step, index) => {
      const [sx, sy] = stations[index]!;
      const passed = act2 && frame >= stepAt(index);
      const active = act2 && current === index;
      // Labels start clear of the card riding the spine.
      const nameX = sx + (compact ? 52 : 56);
      const nameY = compact ? sy - 8 : sy;
      const detailX = compact ? nameX : 512;
      const detailY = compact ? sy + 10 : sy;
      const band = active ? ease(frame, stepAt(index) - 16, stepAt(index) - 10) * (1 - ease(frame, stepAt(index) + 4, stepAt(index) + 14)) : 0;
      const recede = act2 ? 1 : lerp(1, .38, ease(frame, T.hop[0] - 16, T.hop[0]));
      return <g key={index} opacity={easeOut(frame, 18 + index * 4, 34 + index * 4) * recede}>
        {band > 0 ? <rect x={nameX - 14} y={sy - (compact ? 19 : 15)} width={compact ? 300 : 408} height={compact ? 38 : 30} rx={compact ? 12 : 15} style={{ fill: tint("hot", 12 * band) }} /> : null}
        {act2 && frame >= stepAt(index) - 16
          ? <Gate x={sx} y={sy} frame={frame} decideAt={stepAt(index)} result="pass" r={10} />
          : <circle cx={sx} cy={sy} r={8} style={{ fill: "var(--scene-card)" }} stroke="var(--scene-hairline)" strokeWidth={1.2} />}
        <Label x={nameX} y={nameY} text={pick(step.name)} anchor="start" size={compact ? 13 : 13.5} live={active || passed ? 1 : 0}
          tone={passed ? "ok" : active ? "ink" : act2 ? "muted" : "ink"} />
        {index === 5
          ? <Tag x={detailX} y={detailY + (compact ? 1 : 0)} anchor="start" text="a-17 → j-9" tone={passed ? "hot" : "muted"} size={11} appear={passed ? pop(frame, stepAt(5)) : .75} />
          : <Label x={detailX} y={detailY} text={pick(step.detail)} anchor="start" size={compact ? 11.5 : 12} tone="muted" />}
      </g>;
    })}
    <Ping x={stations[3]![0]} y={stations[3]![1]} frame={frame} at={stepAt(3)} r={14} tone="ok" />
    <Ping x={stations[5]![0]} y={stations[5]![1]} frame={frame} at={stepAt(5)} r={12} tone="hot" />

    {/* Act 1 · the bypass: straight past the pipeline. */}
    <g opacity={act1}>
      <Message points={bypass} progress={b1} live={1} tone="danger" dashed />
      <Tag x={bypassTag[0]} y={bypassTag[1]} anchor={compact ? "end" : "middle"} text={tr(locale, "convert as-is", "conversion telle quelle")} tone="danger" size={12} appear={pop(frame, T.hop[0] + 10)} />
    </g>

    {/* Agent: what it actually receives. */}
    <Box x={agentBox.x} y={agentBox.y} w={agentBox.w} h={agentBox.h} radius={14}
      tone={act2 ? (narrowOn > .5 ? "ok" : "line") : frame >= T.broad ? "danger" : "line"} fill={act2 ? .3 * narrowOn : .3 * ease(frame, T.broad, T.broad + 12) * broadOn}
      appear={easeOut(frame, 16, 36)}>
      <Text x={agentBox.x + 14} y={agentBox.y + 20} size={10.5} font="mono" weight={600} tone="muted" caps opacity={compact ? 1 : 1 - Math.min(1, verdictOn)}>{compact ? tr(locale, "agent · downstream token", "agent · token aval") : tr(locale, "downstream token", "token aval")}</Text>
    </Box>
    {CLAIMS.map((claim, index) => {
      const pos: Point = compact
        ? [agentBox.x + 14 + (index < 3 ? [0, 150, 290][index]! : [0, 150][index - 3]!), agentBox.y + (index < 3 ? 44 : 72)]
        : [agentBox.x + 12, agentBox.y + 60 + index * 36];
      const value = act2 ? claim.narrow : claim.broad;
      const on = act2 ? pop(frame, FILL2 + index * 5) * narrowOn : claim.broad === null ? 0 : pop(frame, T.out1[1] + 2 + index * 6) * broadOn;
      const tone = act2 ? "ok" : "danger";
      return <g key={claim.key}>
        {compact
          ? <Tag x={pos[0]} y={pos[1]} anchor="start" text={`${claim.key} ${value ?? ""}`} tone={tone} size={11} appear={on} />
          : <>
            <Text x={pos[0]} y={pos[1]} size={11.5} font="mono" weight={500} tone="muted" opacity={.55 + .45 * Math.min(1, on)}>{claim.key}</Text>
            {value !== null ? <Tag x={agentBox.x + agentBox.w - 10} y={pos[1]} anchor="end" text={value} tone={tone} size={11} appear={on} />
              : <Text x={agentBox.x + agentBox.w - 16} y={pos[1]} size={12} font="mono" weight={500} tone="muted" anchor="end" opacity={.5}>—</Text>}
          </>}
      </g>;
    })}
    <Tag x={verdictAt[0]} y={verdictAt[1]} anchor={compact ? "end" : "middle"} text={tr(locale, "✗ broad-scope bearer", "✗ bearer trop large")} tone="danger" size={11} appear={broadVerdict} />
    <Tag x={verdictAt[0]} y={verdictAt[1]} anchor={compact ? "end" : "middle"} text={tr(locale, "✓ one agent, one tenant", "✓ un agent, un tenant")} tone="ok" size={11} appear={narrowVerdict} />
    <SummitFlag x={agentBox.x + agentBox.w - 18} y={agentBox.y + (compact ? 12 : 40)} appear={easeOut(frame, FILL2 + 36, FILL2 + 56)} />

    {/* The artifact itself: a-17, then (act 2, at station 4) j-9. */}
    <TokenCard x={act1Card[0]} y={act1Card[1]} kind={morphed1 ? "JWT" : "SAML"} text={morphed1 ? "aud * · scope *" : "a-17"} tone={morphed1 ? "danger" : "hot"} size={tokenSize}
      appear={act1Appear} lift={inFlight(b1)} />
    {act2 ? <TokenCard x={act2Card[0]} y={act2Card[1]} kind={minted ? "JWT" : "SAML"} text={minted ? "j-9" : "a-17"} tone={minted ? "ok" : "hot"} size={tokenSize}
      appear={act2Appear * (minted && frame < stepAt(3) + 10 ? .6 + .4 * pop(frame, stepAt(3)) : 1)} lift={moving} /> : null}
  </g>;
}

const at = (points: readonly Point[], t: number): Point => {
  const drawn = partial(points, t);
  return drawn.at(-1)!;
};

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 30,
  title: { en: "SAML → OAuth2 bridge (RFC 7522)", fr: "Pont SAML → OAuth2 (RFC 7522)" },
  caption: {
    en: "The same SAML assertion, exchanged twice. Converted as-is it becomes a broad bearer token; under strict policy it is validated, mapped, authorized and minted into a narrow token for one agent, with an audit link back to the assertion.",
    fr: "La même assertion SAML, échangée deux fois. Convertie telle quelle, elle devient un bearer trop large ; sous politique stricte, elle est validée, mappée, autorisée puis transformée en token étroit pour un seul agent, avec un lien d’audit vers l’assertion.",
  },
  beats: [
    { at: 0, text: { en: "RFC 7522: an upstream SAML assertion is presented to Forest as an OAuth2 authorization grant.", fr: "RFC 7522 : une assertion SAML amont est présentée à Forest comme authorization grant OAuth2." } },
    { at: T.hop[0] - 4, text: { en: "Failure mode: blindly convert it into a broad bearer token, without re-checking audience, tenant or authz.", fr: "Mode d’échec : conversion aveugle en bearer trop large, sans réévaluer audience, tenant ni autorisation." } },
    { at: T.reset, text: { en: "Same assertion, strict policy: validate it cryptographically, then resolve tenant and principal.", fr: "Même assertion, politique stricte : validation cryptographique, puis tenant et principal résolus." } },
    { at: stepAt(2) - 10, text: { en: "Apply authorization policy at the Forest boundary, then mint a narrow token for one agent audience.", fr: "Appliquer l’autorisation à la frontière Forest, puis émettre un token étroit pour une seule audience agent." } },
    { at: stepAt(4) - 10, text: { en: "Enforce replay and TTL, then emit an audit event: assertion a-17 produced token j-9.", fr: "Appliquer anti-rejeu et TTL, puis émettre un événement d’audit : l’assertion a-17 a produit le token j-9." } },
  ],
  Stage,
});
