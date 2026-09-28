import { Box, Comet, easeOut, enter, NBSP, pop, Pulse, Tag, Text, tint, TONE, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Two roles send the same read through the engine; the row comes back in clear
// for one and masked for the other. Then the restricted role tries to filter on
// the masked field and is refused before any SQL. Each request appends one line
// to the audit journal: reads and refusals alike.
const T = {
  q1: 36, check1: 62, out1: 76, land1: 98, log1: 100,
  q2: 132, check2: 158, out2: 172, land2: 194, log2: 196,
  filter: 236, q3: 250, refuse: 278, log3: 292,
  close: 340,
  end: 450,
} as const;

type Pt = readonly [number, number];
type Rect = { x: number; y: number; w: number; h: number };

const COPY = {
  en: { engine: "core engine", audit: "audit journal", appendOnly: "append-only", product: "product", assets: "assets", masked: "masked", pass: "✓ access · audit", maskedTag: "✓ 1 field masked", refused: "✗ masked field: refused", read: "READ", refusedAction: "REFUSED", zero: "0 fields masked", one: "1 field masked", filterDetail: "filter on asset_value" },
  fr: { engine: "core engine", audit: "journal d’audit", appendOnly: "append-only", product: "produit", assets: "patrimoine", masked: "masqué", pass: "✓ accès · audit", maskedTag: "✓ 1 champ masqué", refused: "✗ champ masqué\u00a0: refusé", read: "LECTURE", refusedAction: "REFUSÉ", zero: "0 champ masqué", one: "1 champ masqué", filterDetail: "filtre sur asset_value" },
} as const;

/** Redacted value: a hatched bar, then the word, so the state never relies on colour. */
function Masked({ x, y, label, size }: { x: number; y: number; label: string; size: number }) {
  const labelW = label.length * size * .6;
  const barW = 46;
  const left = x - labelW - 10 - barW;
  return <g>
    <rect x={left} y={y - 6} width={barW} height={12} rx={3} style={{ fill: tint("ink", 22) }} />
    {[0, 1, 2, 3, 4].map((k) => <line key={k} x1={left + 4 + k * 9} y1={y + 5} x2={left + 10 + k * 9} y2={y - 5} stroke={TONE.ink} strokeOpacity={.45} strokeWidth={1.5} />)}
    <Text x={x} y={y} size={size} font="mono" weight={600} tone="muted" anchor="end">{label}</Text>
  </g>;
}

function Stage({ frame, compact, locale }: SceneStageProps) {
  const c = COPY[locale];
  const L = compact
    ? {
      roles: [{ x: 20, y: 56, w: 240, h: 64 }, { x: 280, y: 56, w: 240, h: 64 }] as Rect[],
      engine: { x: 20, y: 156, w: 500, h: 100 },
      results: [{ x: 20, y: 290, w: 240, h: 86 }, { x: 280, y: 290, w: 240, h: 86 }] as Rect[],
      audit: { x: 20, y: 398, w: 500, h: 114 },
    }
    : {
      roles: [{ x: 40, y: 74, w: 190, h: 64 }, { x: 40, y: 176, w: 190, h: 64 }] as Rect[],
      engine: { x: 280, y: 60, w: 220, h: 192 },
      results: [{ x: 550, y: 63, w: 370, h: 86 }, { x: 550, y: 165, w: 370, h: 86 }] as Rect[],
      audit: { x: 40, y: 276, w: 880, h: 128 },
    };
  const valueSize = compact ? 14 : 15;

  // Request path per lane: into the engine, a stop at the checks, then out to the result.
  const lane = (i: number) => {
    const role = L.roles[i]!;
    const result = L.results[i]!;
    if (compact) {
      const x = role.x + role.w / 2;
      return { inPath: [[x, role.y + role.h + 2], [x, L.engine.y + 46]] as Pt[], outPath: [[x, L.engine.y + 46], [x, result.y - 2]] as Pt[], tag: [x, L.engine.y + 76] as Pt, line: [[x, role.y + role.h], [x, result.y]] as Pt[] };
    }
    const y = role.y + role.h / 2;
    const mid = L.engine.x + L.engine.w / 2;
    return { inPath: [[role.x + role.w + 2, y], [mid, y]] as Pt[], outPath: [[mid, y], [result.x - 2, y]] as Pt[], tag: [mid, y + 27] as Pt, line: [[role.x + role.w, y], [result.x, y]] as Pt[] };
  };
  const lanes = [lane(0), lane(1)];

  const inT = (q: number) => easeOut(frame, q, q + 26);
  const outT = (from: number, to: number) => easeOut(frame, from, to);
  const refused = frame >= T.refuse;
  const filtering = frame >= T.filter;

  // Engine focus follows whichever request is inside it.
  const engineFocus = Math.max(
    frame >= T.q1 + 20 && frame < T.out1 + 8 ? 1 : 0,
    frame >= T.q2 + 20 && frame < T.out2 + 8 ? 1 : 0,
    frame >= T.q3 + 20 && frame < T.refuse + 30 ? 1 : 0,
  );

  const rows: { at: number; action: string; role: string; entity: string; detail: string; tone: Tone; time: string }[] = [
    { at: T.log1, action: c.read, role: "ops", entity: "crm.contracts/4812", detail: c.zero, tone: "ok", time: "10:42:07" },
    { at: T.log2, action: c.read, role: "support", entity: "crm.contracts/4812", detail: c.one, tone: "hot", time: "10:42:12" },
    { at: T.log3, action: c.refusedAction, role: "support", entity: "crm.contracts", detail: c.filterDetail, tone: "danger", time: "10:42:19" },
  ];
  const cols = compact ? { action: 20, role: 128, detail: 228 } : { time: 20, action: 116, entity: 226, role: 430, detail: 540 };
  const rowY = (k: number) => L.audit.y + (compact ? 44 : 50) + k * (compact ? 23 : 25);
  const rowSize = compact ? 13 : 14;

  return <g>
    {/* Static lanes: hairlines from each role to its result, through the engine. */}
    {lanes.map((l, i) => <line key={i} x1={l.line[0]![0]} y1={l.line[0]![1]} x2={l.line[1]![0]} y2={l.line[1]![1]} style={{ stroke: "var(--scene-hairline)" }} strokeWidth={1.25} opacity={enter(frame, 10).opacity} />)}

    {/* Engine: the only path. */}
    <g {...enter(frame, 4)}>
      <Box x={L.engine.x} y={L.engine.y} w={L.engine.w} h={L.engine.h} tone={refused && frame < T.refuse + 30 ? "danger" : "line"} focus={engineFocus * (refused && frame < T.refuse + 30 ? 0 : 1)} fill={refused && frame < T.refuse + 30 ? easeOut(frame, T.refuse, T.refuse + 6) : 0} radius={18}>
        <Text x={L.engine.x + 18} y={L.engine.y + 22} size={11} font="mono" weight={600} tone="line" caps>{c.engine}</Text>
      </Box>
    </g>

    {/* Roles: same query, then the restricted role filters on the masked field. */}
    {L.roles.map((role, i) => {
      const querying = i === 1 && filtering;
      return <g key={i} {...enter(frame, 2 + i * 6)}>
        <Box x={role.x} y={role.y} w={role.w} h={role.h} tone={querying ? "hot" : "line"} focus={i === 0 ? (frame >= T.q1 && frame < T.q1 + 26 ? 1 : 0) : (frame >= T.q2 && frame < T.q2 + 26) || (frame >= T.q3 && frame < T.q3 + 26) ? 1 : 0}>
          <Text x={role.x + 16} y={role.y + 22} size={11} font="mono" weight={600} tone="muted">role</Text>
          <Text x={role.x + 58} y={role.y + 22} size={16} weight={650}>{i === 0 ? "ops" : "support"}</Text>
          <g {...enter(frame, querying ? T.filter : 0, { dur: 12, distance: 6 })}>
            <Text x={role.x + 16} y={role.y + 45} size={13} font="mono" weight={500} tone={querying ? "hot" : "muted"}>{querying ? "asset_value ≥ 1M" : "contracts.one(4812)"}</Text>
          </g>
        </Box>
      </g>;
    })}

    {/* Requests travelling through the engine. */}
    <Comet points={lanes[0]!.inPath} t={inT(T.q1)} tone="line" />
    <Comet points={lanes[0]!.outPath} t={outT(T.out1, T.land1)} tone="ok" />
    <Comet points={lanes[1]!.inPath} t={inT(T.q2)} tone="line" />
    <Comet points={lanes[1]!.outPath} t={outT(T.out2, T.land2)} tone="hot" />
    <Comet points={lanes[1]!.inPath} t={inT(T.q3)} tone="hot" />

    {/* Engine verdicts per lane. */}
    <Tag x={lanes[0]!.tag[0]} y={lanes[0]!.tag[1]} text={c.pass} tone="ok" size={12.5} appear={frame >= T.check1 ? pop(frame, T.check1) : 0} />
    {!filtering
      ? <Tag x={lanes[1]!.tag[0]} y={lanes[1]!.tag[1]} text={c.maskedTag} tone="hot" size={12.5} appear={frame >= T.check2 ? pop(frame, T.check2) : 0} />
      : <Tag x={lanes[1]!.tag[0]} y={lanes[1]!.tag[1]} text={c.refused} tone="danger" size={12.5} appear={refused ? pop(frame, T.refuse) : 0} />}
    {refused ? <Pulse x={lanes[1]!.tag[0]} y={lanes[1]!.tag[1]} frame={frame} at={T.refuse} period={36} r={16} tone="danger" once /> : null}

    {/* Results: the same row, clear for ops, masked for support. */}
    {L.results.map((result, i) => {
      const land = i === 0 ? T.land1 : T.land2;
      if (frame < land) return null;
      const dimmed = i === 1 && filtering ? .55 : 1;
      return <g key={i} opacity={dimmed}>
        <Box x={result.x} y={result.y} w={result.w} h={result.h} tone={i === 0 ? "ok" : "hot"} appear={easeOut(frame, land, land + 14)} focus={Math.max(0, 1 - easeOut(frame, land + 10, land + 50))}>
          <Text x={result.x + 16} y={result.y + 20} size={12} font="mono" weight={600} tone="muted">crm.contracts/4812</Text>
          <Text x={result.x + 16} y={result.y + 46} size={valueSize} font="mono" weight={500} tone="muted">{c.product}</Text>
          <Text x={result.x + result.w - 16} y={result.y + 46} size={valueSize} font="mono" weight={600} anchor="end">Private equity</Text>
          <Text x={result.x + 16} y={result.y + 68} size={valueSize} font="mono" weight={500} tone="muted">{c.assets}</Text>
          {i === 0
            ? <Text x={result.x + result.w - 16} y={result.y + 68} size={valueSize} font="mono" weight={600} tone="ok" anchor="end">{`1${NBSP}240${NBSP}000${NBSP}€`}</Text>
            : <Masked x={result.x + result.w - 16} y={result.y + 68} label={c.masked} size={valueSize} />}
        </Box>
      </g>;
    })}

    {/* Audit journal: every request appends a line, including the refusal. */}
    <g {...enter(frame, 14)}>
      <Box x={L.audit.x} y={L.audit.y} w={L.audit.w} h={L.audit.h} tone="muted" radius={16}>
        <Text x={L.audit.x + 20} y={L.audit.y + 20} size={11} font="mono" weight={600} tone="muted" caps>{c.audit}</Text>
        <Tag x={L.audit.x + L.audit.w - 16} y={L.audit.y + 20} text={c.appendOnly} tone="muted" size={11} anchor="end" />
        {rows.map((row, k) => {
          if (frame < row.at) return null;
          const fresh = 1 - easeOut(frame, row.at + 10, row.at + 70);
          const y = rowY(k);
          return <g key={k} {...enter(frame, row.at, { dur: 14, distance: 8 })}>
            <rect x={L.audit.x + 10} y={y - 11} width={L.audit.w - 20} height={22} rx={7} style={{ fill: tint(row.tone, 16 * fresh) }} />
            {"time" in cols ? <Text x={L.audit.x + cols.time} y={y} size={rowSize} font="mono" weight={500} tone="muted">{row.time}</Text> : null}
            <Text x={L.audit.x + cols.action} y={y} size={rowSize} font="mono" weight={650} tone={row.tone}>{row.action}</Text>
            {"entity" in cols ? <Text x={L.audit.x + cols.entity} y={y} size={rowSize} font="mono" weight={500}>{row.entity}</Text> : null}
            <Text x={L.audit.x + cols.role} y={y} size={rowSize} font="mono" weight={500}>{row.role}</Text>
            <Text x={L.audit.x + cols.detail} y={y} size={rowSize} font="mono" weight={500} tone={row.tone === "ok" ? "muted" : row.tone}>{row.detail}</Text>
          </g>;
        })}
      </Box>
    </g>

    {/* Theme flourish, decorative only. */}
    <g className="scene-only-rocket" opacity={.4 * enter(frame, 20).opacity}>
      <circle cx={L.engine.x + L.engine.w / 2} cy={L.engine.y + L.engine.h / 2} r={Math.min(L.engine.w, L.engine.h) / 2 + 12} fill="none" style={{ stroke: tint("line", 50) }} strokeWidth={1} strokeDasharray="2 6" strokeDashoffset={-frame * .3} />
    </g>
  </g>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: 420,
  title: { en: "Same query, two roles, one audit", fr: "Même requête, deux rôles, un audit" },
  caption: {
    en: "Field-level permissions live in the engine: the same row comes back masked for a role without the right, filters on a masked field are refused before any SQL, and every access lands in the audit.",
    fr: "Les droits au niveau du champ vivent dans le moteur\u00a0: la même ligne revient masquée pour un rôle sans le droit, un filtre sur un champ masqué est refusé avant tout SQL, et chaque accès est audité.",
  },
  beats: [
    { at: 0, text: { en: "Two roles, ops and support, send the same query for the same contract.", fr: "Deux rôles, ops et support, envoient la même requête sur le même contrat." } },
    { at: T.q1, text: { en: "Ops: identity and access check out, the assets field comes back in clear, and the read is logged.", fr: `Ops${NBSP}: identité et droits validés, le patrimoine revient en clair, la lecture est tracée.` } },
    { at: T.q2, text: { en: "Support gets the same row, but the engine masks the assets field and logs “1 field masked”.", fr: `Support${NBSP}: même ligne, mais le moteur masque le patrimoine et trace «${NBSP}1 champ masqué${NBSP}».` } },
    { at: T.filter, text: { en: "Support now filters on the masked field. The engine refuses before any SQL is generated.", fr: "Le support filtre maintenant sur le champ masqué. Le moteur refuse avant de générer le moindre SQL." } },
    { at: T.close, text: { en: "Reads and refusals all land in the append-only audit. No screen can walk around it.", fr: `Lectures et refus finissent tous dans l’audit append-only. Aucun écran ne peut le contourner.` } },
  ],
  Stage,
});
