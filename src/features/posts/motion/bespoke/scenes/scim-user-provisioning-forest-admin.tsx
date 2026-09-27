import { Box, Camera, CodeBlock, Comet, ease, enter, lerp, pop, Pulse, stagger, Tag, Text, tint, TONE, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";
import type { PostLocale } from "../../../content/types";

// The same change ("promote the new hire to Admin") replayed from three IdPs.
// Each run: payload → normalizer branch → canonical change → project → audit row.
const RUN = 84;
const START = 40;
const T = {
  okta: START,
  azure: START + RUN,
  google: START + 2 * RUN,
  audit: START + 3 * RUN + 6,
  end: 420,
} as const;
// Phases inside a run (frames from the run start).
const P = { comet: 4, branch: 22, fly: 32, land: 54, row: 58, rowIn: 76 } as const;

type Run = {
  id: "okta" | "azure_ad" | "google";
  name: string;
  at: number;
  /** Index of the normalizer line that handles this dialect. */
  line: number;
  dialect: Record<PostLocale, string>;
  actor: Record<PostLocale, string>;
  diff: Record<PostLocale, string>;
  rolePassed: boolean;
};

const RUNS: readonly Run[] = [
  {
    id: "okta", name: "Okta", at: T.okta, line: 3,
    dialect: { en: "close to the RFC", fr: "proche de la RFC" },
    actor: { en: "Okta bot", fr: "bot Okta" },
    diff: { en: "role Viewer → Admin · SCIM", fr: "rôle Viewer → Admin · SCIM" }, rolePassed: true,
  },
  {
    id: "azure_ad", name: "Azure AD", at: T.azure, line: 1,
    dialect: { en: "nested “values”", fr: "« values » imbriqués" },
    actor: { en: "Azure AD bot", fr: "bot Azure AD" },
    diff: { en: "role Viewer → Admin · SCIM", fr: "rôle Viewer → Admin · SCIM" }, rolePassed: true,
  },
  {
    id: "google", name: "Google", at: T.google, line: 5,
    dialect: { en: "users only", fr: "utilisateurs seuls" },
    actor: { en: "Google bot", fr: "bot Google" },
    diff: { en: "user synced · role not sent", fr: "synchronisé · rôle non envoyé" }, rolePassed: false,
  },
];

const CODE = [
  "if (provider === \"azure_ad\")",
  "  return extractAzureAdCraziness(payload);",
  "if (provider === \"okta\")",
  "  return safeOktaParse(payload);",
  "// Let's hope for the best.",
  "return standardParsing(payload);",
] as const;

type Pt = readonly [number, number];
type Rect = { x: number; y: number; w: number; h: number };
type Layout = {
  idps: Rect[];
  code: { x: number; y: number; w: number; size: number };
  project: Rect;
  audit: Rect;
  cols: readonly [number, number, number];
  rowY: number;
  rowH: number;
  auditSize: number;
  rfc: Rect | null;
  compact: boolean;
};

const WIDE_LAYOUT: Layout = {
  idps: [0, 1, 2].map((i) => ({ x: 40, y: 64 + i * 76, w: 160, h: 62 })),
  code: { x: 236, y: 64, w: 388, size: 13.5 },
  project: { x: 656, y: 64, w: 264, h: 176 },
  audit: { x: 236, y: 258, w: 684, h: 134 },
  cols: [20, 176, 336],
  rowY: 56,
  rowH: 26,
  auditSize: 14,
  rfc: { x: 40, y: 298, w: 160, h: 94 },
  compact: false,
};

const COMPACT_LAYOUT: Layout = {
  idps: [0, 1, 2].map((i) => ({ x: 20 + i * 170, y: 58, w: 160, h: 58 })),
  code: { x: 20, y: 134, w: 500, size: 13 },
  project: { x: 20, y: 320, w: 500, h: 54 },
  audit: { x: 20, y: 388, w: 500, h: 118 },
  cols: [16, 124, 240],
  rowY: 52,
  rowH: 25,
  auditSize: 12.5,
  rfc: null,
  compact: true,
};

const bezier = (p0: Pt, p1: Pt, p2: Pt, t: number): [number, number] => [
  (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
  (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
];

/** A small card that physically travels (the canonical change, the audit row). */
function Flying({ x, y, w, h, text, tone, opacity = 1, size = 13 }: { x: number; y: number; w: number; h: number; text: string; tone: Tone; opacity?: number; size?: number }) {
  if (opacity <= 0) return null;
  return <g opacity={opacity} transform={`translate(${x} ${y})`}>
    <rect className="scene-card" x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2.4} style={{ fill: "var(--scene-card)" }} />
    <rect className="scene-glow" x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2.4} style={{ fill: tint(tone, 18), color: TONE[tone] }} stroke={TONE[tone]} strokeOpacity={.6} strokeWidth={1} />
    <Text x={0} y={.5} size={size} font="mono" weight={600} tone={tone} anchor="middle">{text}</Text>
  </g>;
}

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const L = compact ? COMPACT_LAYOUT : WIDE_LAYOUT;
  const active = [...RUNS].reverse().find((run) => frame >= run.at);
  const activeIndex = active ? RUNS.indexOf(active) : -1;
  const at = active?.at ?? 0;
  const local = active ? frame - at : -1;
  const inRun = active !== undefined && local < RUN && frame < T.audit;
  const auditOn = ease(frame, T.audit, T.audit + 14);

  // Geometry.
  const C = L.code;
  const lineH = C.size * 1.6;
  const lineY = (index: number) => C.y + 34 + index * lineH + lineH / 2 + 2;
  const lineEnd = (index: number) => C.x + 16 + CODE[index]!.length * C.size * .6;
  const idp = activeIndex >= 0 ? L.idps[activeIndex]! : L.idps[0]!;
  const branch = active?.line ?? 0;
  const cometFrom: Pt = compact ? [idp.x + idp.w / 2, idp.y + idp.h] : [idp.x + idp.w, idp.y + idp.h / 2];
  const cometTo: Pt = compact ? [C.x + 10, lineY(branch)] : [C.x + 6, lineY(branch)];
  const cometMid: Pt = compact ? [cometFrom[0], lineY(branch) - 4] : [lerp(cometFrom[0], cometTo[0], .7), cometFrom[1]];
  const cometPath: Pt[] = Array.from({ length: 12 }, (_, k) => bezier(cometFrom, cometMid, cometTo, k / 11));
  const cometT = inRun ? ease(frame, at + P.comet, at + P.branch, (v) => v) : 0;
  const routed = inRun && local >= P.branch;

  // The canonical change flies from the branch to the project's role row.
  const PR = L.project;
  const roleAt: Pt = compact ? [PR.x + PR.w - 90, PR.y + PR.h / 2] : [PR.x + PR.w - 72, PR.y + 90];
  const chipFrom: Pt = [Math.min(lineEnd(branch) + 60, C.x + C.w - 70), lineY(branch)];
  const chipCtrl: Pt = compact ? [chipFrom[0] + 40, lerp(chipFrom[1], roleAt[1], .6)] : [lerp(chipFrom[0], roleAt[0], .6), Math.min(chipFrom[1], roleAt[1]) - 30];
  const flyT = inRun ? ease(frame, at + P.fly, at + P.land) : 0;
  const flying = inRun && local >= P.fly - 6 && local < P.land + 2;
  const [chipX, chipY] = bezier(chipFrom, chipCtrl, roleAt, flyT);
  const chipText = active?.rolePassed === false ? (fr ? "rôle absent" : "no role") : "role → Admin";
  const chipTone: Tone = active?.rolePassed === false ? "hot" : "ok";
  // The project keeps showing the last landed change once the runs are over.
  const landed = active !== undefined && local >= P.land;
  const roleText = !active || !landed ? "Viewer" : active.rolePassed ? "Admin" : "Viewer";
  const roleTone: Tone = !active || !landed ? "muted" : active.rolePassed ? "ok" : "hot";
  const rolePop = landed ? pop(frame, at + P.land, 190) : 1;

  // The audit row flies from the project into its slot.
  const A = L.audit;
  const rowCentre = (index: number) => A.y + L.rowY + index * L.rowH;
  const rowIn = (index: number) => ease(frame, RUNS[index]!.at + P.row, RUNS[index]!.at + P.rowIn);

  const t = {
    project: fr ? "projet Forest Admin" : "Forest Admin project",
    user: fr ? "utilisateur" : "user",
    hire: fr ? "nouvelle recrue" : "new hire",
    role: fr ? "rôle" : "role",
    source: "source",
    audit: fr ? "piste d’audit" : "audit trail",
    when: fr ? "quand · ms" : "when · ms",
    actor: fr ? "acteur" : "actor",
    diff: "diff",
    canonical: fr ? "≡ canonique" : "≡ canonical",
    notSent: fr ? "rôle non envoyé" : "role not sent",
    standard: fr ? "le « standard »" : "the “standard”",
  };

  const lean = (p: Pt): Pt => [lerp(width / 2, p[0], .18), lerp(height / 2, p[1], .18)];
  const camera = [
    { at: 0 },
    { at: T.okta - 10, zoom: 1.02, focus: lean([C.x + C.w / 2, C.y + 80]) },
    { at: T.audit - 12, zoom: 1.03, focus: lean([A.x + A.w / 2, A.y + A.h / 2]) },
    { at: T.audit + 80, dur: 50, zoom: 1 },
  ];

  const bandTone: Tone = active?.rolePassed === false ? "hot" : "ok";
  const codeLines = CODE.map((text, index) => ({
    text,
    tone: routed && index === branch ? bandTone : undefined,
  }));

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    {/* Identity providers, each with its own reading of RFC 7644. */}
    {RUNS.map((run, i) => {
      const r = L.idps[i]!;
      const focus = activeIndex === i && inRun ? ease(frame, run.at, run.at + 8) * (1 - ease(frame, run.at + P.land, run.at + RUN)) : 0;
      return <g key={run.id} {...enter(frame, stagger(i, 2, 5), { from: compact ? "up" : "right" })}>
        <Box {...r} tone="hot" focus={focus} radius={14}>
          <Text x={r.x + 16} y={r.y + 22} size={compact ? 16 : 17} weight={650}>{run.name}</Text>
          <Text x={r.x + 16} y={r.y + r.h - 18} size={compact ? 11.5 : 12} weight={500} font="mono" tone={focus > .5 ? "hot" : "muted"}>{run.dialect[locale]}</Text>
        </Box>
      </g>;
    })}

    {L.rfc ? <g {...enter(frame, 18)}>
      <Box {...L.rfc} variant="ghost" tone="muted" radius={14}>
        <Text x={L.rfc.x + 16} y={L.rfc.y + 22} size={11} weight={600} font="mono" tone="muted" caps>{t.standard}</Text>
        <Text x={L.rfc.x + 16} y={L.rfc.y + 50} size={16} weight={650} font="mono">RFC 7644</Text>
        <Text x={L.rfc.x + 16} y={L.rfc.y + 74} size={12.5} weight={500} font="mono" tone="muted">/Users · /Groups</Text>
      </Box>
    </g> : null}

    <g {...enter(frame, 8)}>
      <CodeBlock
        x={C.x} y={C.y} w={C.w} frame={frame} size={C.size}
        title={fr ? "handleScimPatch · normaliseur" : "handleScimPatch · normalizer"}
        highlight={routed ? branch : undefined}
        lines={codeLines}
      />
    </g>
    <Comet points={cometPath} t={cometT} tone="hot" r={5} tail={.4} />

    {/* Canonical result in the Forest Admin project. */}
    <g {...enter(frame, 14, { from: compact ? "up" : "left" })}>
      <Box {...PR} tone={landed ? chipTone : "line"} focus={landed && inRun ? (1 - ease(frame, at + P.land + 10, at + RUN)) * .8 : 0} radius={16}>
        <Text x={PR.x + 18} y={compact ? PR.y + PR.h / 2 : PR.y + 24} size={11} weight={600} font="mono" tone="muted" caps>{compact ? `${t.project} · ${t.hire}` : t.project}</Text>
        {!compact ? <>
          <Text x={PR.x + 18} y={PR.y + 58} size={13} weight={500} font="mono" tone="muted">{t.user}</Text>
          <Text x={PR.x + PR.w - 18} y={PR.y + 58} size={16} weight={650} anchor="end">{t.hire}</Text>
          <line x1={PR.x + 14} x2={PR.x + PR.w - 14} y1={PR.y + 74} y2={PR.y + 74} stroke="var(--scene-hairline)" strokeWidth={1} />
          <Text x={PR.x + 18} y={PR.y + 90} size={13} weight={500} font="mono" tone="muted">{t.role}</Text>
          <line x1={PR.x + 14} x2={PR.x + PR.w - 14} y1={PR.y + 106} y2={PR.y + 106} stroke="var(--scene-hairline)" strokeWidth={1} />
          <Text x={PR.x + 18} y={PR.y + 122} size={13} weight={500} font="mono" tone="muted">{t.source}</Text>
          <Text x={PR.x + PR.w - 18} y={PR.y + 122} size={14} weight={600} font="mono" anchor="end" tone={landed ? "ink" : "muted"}>{landed && active ? `SCIM · ${active.name}` : "—"}</Text>
          <Tag x={PR.x + PR.w / 2} y={PR.y + PR.h - 24} text={active?.rolePassed === false ? t.notSent : t.canonical} tone={chipTone} size={12} appear={landed ? pop(frame, at + P.land + 6) : 0} />
        </> : null}
      </Box>
      <g transform={`translate(${roleAt[0]} ${roleAt[1]}) scale(${.7 + .3 * rolePop}) translate(${-roleAt[0]} ${-roleAt[1]})`}>
        <Tag x={roleAt[0]} y={roleAt[1]} text={roleText} tone={roleTone} size={compact ? 13 : 14} anchor="middle" />
      </g>
      {landed && active?.rolePassed ? <Pulse x={roleAt[0]} y={roleAt[1]} frame={frame} at={at + P.land} period={40} r={16} tone="ok" /> : null}
    </g>

    {flying ? <Flying x={chipX} y={chipY} w={chipText.length * 7.2 + 22} h={26} size={12} text={chipText} tone={chipTone} opacity={ease(frame, at + P.fly - 6, at + P.fly + 2)} /> : null}

    {/* Audit trail: one row per SCIM operation, flown in from the project. */}
    <g {...enter(frame, 20)}>
      <Box {...A} tone="hot" focus={auditOn * .9} radius={16}>
        {[t.when, t.actor, t.diff].map((label, index) => <Text
          key={label} x={A.x + L.cols[index]!} y={A.y + 22} size={11} weight={600} font="mono" caps
          tone={auditOn > .5 && index < 2 ? "hot" : "muted"}
        >{label}</Text>)}
        {!compact ? <Tag x={A.x + A.w - 16} y={A.y + 22} text={t.audit} tone="muted" size={11} anchor="end" /> : null}
        <line x1={A.x + 14} x2={A.x + A.w - 14} y1={A.y + 36} y2={A.y + 36} stroke="var(--scene-hairline)" strokeWidth={1} />
      </Box>
    </g>
    {RUNS.map((run, index) => {
      const k = rowIn(index);
      if (k <= 0) return null;
      const target: Pt = [A.x + A.w / 2, rowCentre(index)];
      const origin: Pt = compact ? [roleAt[0], roleAt[1] + 14] : [PR.x + PR.w / 2, PR.y + PR.h + 4];
      const ctrl: Pt = compact ? [origin[0], target[1]] : [origin[0], target[1]];
      const [fx, fy] = bezier(origin, ctrl, target, k);
      const rowW = lerp(compact ? 220 : 240, A.w - 24, k ** 3);
      const tone: Tone = run.rolePassed ? "ok" : "hot";
      const settled = k >= 1;
      const glow = settled ? 1 - ease(frame, run.at + P.rowIn, run.at + P.rowIn + 24) : 1;
      const y = rowCentre(index);
      return <g key={run.id}>
        {settled ? <g>
          <rect x={A.x + 10} y={y - L.rowH / 2 + 1} width={A.w - 20} height={L.rowH - 2} rx={7} style={{ fill: tint(tone, 14 * glow + (auditOn * 5)) }} />
          <Text x={A.x + L.cols[0]} y={y} size={L.auditSize} weight={500} font="mono" tone="muted">
            hh:mm:ss.<tspan fill={auditOn > .5 ? TONE.hot : TONE.muted}>SSS</tspan>
          </Text>
          <Text x={A.x + L.cols[1]} y={y} size={L.auditSize} weight={600} font="mono" tone={auditOn > .5 ? "hot" : "ink"}>{run.actor[locale]}</Text>
          <Text x={A.x + L.cols[2]} y={y} size={L.auditSize} weight={600} font="mono" tone={tone}>{run.diff[locale]}</Text>
        </g> : <g transform={`translate(${fx} ${fy})`} opacity={.4 + .6 * Math.min(1, k * 3)}>
          <rect className="scene-card" x={-rowW / 2} y={-L.rowH / 2 + 1} width={rowW} height={L.rowH - 2} rx={7} style={{ fill: "var(--scene-card)" }} />
          <rect className="scene-glow" x={-rowW / 2} y={-L.rowH / 2 + 1} width={rowW} height={L.rowH - 2} rx={7} style={{ fill: tint(tone, 20), color: TONE[tone] }} stroke={TONE[tone]} strokeOpacity={.6} />
          <Text x={0} y={.5} size={L.auditSize - .5} font="mono" weight={600} tone={tone} anchor="middle">{`${run.actor[locale]} · ${run.rolePassed ? "Viewer → Admin" : fr ? "rôle absent" : "no role"}`}</Text>
        </g>}
      </g>;
    })}
  </Camera>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.audit + 50,
  title: { en: "One change, three dialects", fr: "Un changement, trois dialectes" },
  caption: {
    en: "RFC 7644 defines the contract; each IdP implements the parts it likes. The normalizer turns every dialect into one canonical change, and the audit trail records which machine made it.",
    fr: "La RFC 7644 définit le contrat ; chaque IdP n’en implémente que ce qui l’arrange. Le normaliseur ramène chaque dialecte à un seul changement canonique, et la piste d’audit enregistre quelle machine l’a fait.",
  },
  beats: [
    { at: 0, text: { en: "SCIM’s promise: change a user once in the IdP and Forest Admin follows, with the right role.", fr: "La promesse de SCIM : on modifie un utilisateur une fois dans l’IdP, Forest Admin suit avec le bon rôle." } },
    { at: T.okta, text: { en: "Okta sends the promotion close to RFC 7644. We still don’t trust it: safeOktaParse.", fr: "Okta envoie la promotion au plus près de la RFC 7644. On s’en méfie quand même : safeOktaParse." } },
    { at: T.azure, text: { en: "Azure AD nests the same change in an array of “values”: extractAzureAdCraziness. Same canonical result.", fr: "Azure AD imbrique le même changement dans des « values » : extractAzureAdCraziness. Même résultat." } },
    { at: T.google, text: { en: "Google only syncs the user; the role never arrives. standardParsing, and hope for the best.", fr: "Google ne synchronise que l’utilisateur ; le rôle n’arrive pas. standardParsing, et on croise les doigts." } },
    { at: T.audit, text: { en: "Every SCIM operation lands in the audit trail: millisecond timestamp, which machine did it, the exact diff.", fr: "Chaque opération SCIM entre dans la piste d’audit : horodatage à la ms, quelle machine, le diff exact." } },
  ],
  Stage,
});
