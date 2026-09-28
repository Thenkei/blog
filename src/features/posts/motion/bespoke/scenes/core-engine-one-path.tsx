import { Boundary, Box, Comet, ease, easeOut, enter, lerp, pop, Pulse, Tag, Text, textWidth, tint, Wire, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// One route to the data. Act 1: a read crosses authentication, access control
// and audit, reaches a read-only replica, and the record rides back through the
// same gates, where access control masks client assets. Act 2: a write takes the
// same gates and goes to the owning service's API, never to SQL. The audit
// journal grows with each request.
const T = {
  req: [40, 60, 72, 92, 104, 124, 136, 150, 166] as const,
  audit1: 126,
  resp: [176, 190, 204, 222, 238, 254, 270] as const,
  redact: [226, 236] as const,
  reset: [284, 296] as const,
  write: [300, 320, 332, 352, 364, 384, 396, 410, 426] as const,
  audit2: 386,
  ack: [436, 450, 490] as const,
  end: 580,
} as const;

type Pt = readonly [number, number];

/** Eased position along time-keyed points: holds between equal points. */
function keyed(frame: number, keys: readonly (readonly [number, Pt])[]): [number, number] {
  const first = keys[0]!;
  if (frame <= first[0]) return [first[1][0], first[1][1]];
  for (let i = 1; i < keys.length; i += 1) {
    const [t0, p0] = keys[i - 1]!;
    const [t1, p1] = keys[i]!;
    if (frame <= t1) {
      const k = ease(frame, t0, t1);
      return [lerp(p0[0], p1[0], k), lerp(p0[1], p1[1], k)];
    }
  }
  const last = keys.at(-1)!;
  return [last[1][0], last[1][1]];
}

/** Samples a cubic Bézier so a Comet can ride it. */
function cubicPoints(a: Pt, c1: Pt, c2: Pt, b: Pt, steps = 14): Pt[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const u = 1 - t;
    return [
      u ** 3 * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t ** 3 * b[0],
      u ** 3 * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t ** 3 * b[1],
    ] as const;
  });
}

const COPY = {
  en: {
    screen: "screen", role: "role ops", engine: "core engine",
    gates: [["Authentication", "who is asking?"], ["Access control", "what is allowed?"], ["Audit", "all recorded"]],
    read: ["read-only", "PostgreSQL", "read replica"], write: ["write", "Service API", "owning service"],
    status: [["✓ session", "✓ session"], ["✓ contracts.read", "✓ contracts.update"], ["✓ event #48213", "✓ event #48214"]],
    journal: "audit journal", journalSub: "every read, every write",
    READ: "READ", WRITE: "WRITE", masked: "1 field masked", viaApi: "via service API",
    field: "assets", status2: "status", active: "active", hidden: "masked", saved: "✓ saved",
    lineRead: "read", lineWrite: "write", noSql: "no direct SQL",
  },
  fr: {
    screen: "écran", role: "rôle ops", engine: "core engine",
    gates: [["Authentification", "qui demande ?"], ["Contrôle d'accès", "quels droits ?"], ["Audit", "tout est tracé"]],
    read: ["lecture seule", "PostgreSQL", "read replica"], write: ["écriture", "API du service", "service propriétaire"],
    status: [["✓ session", "✓ session"], ["✓ contracts.read", "✓ contracts.update"], ["✓ événement #48213", "✓ événement #48214"]],
    journal: "journal d'audit", journalSub: "chaque lecture, chaque écriture",
    READ: "LECTURE", WRITE: "ÉCRITURE", masked: "1 champ masqué", viaApi: "via l'API du service",
    field: "patrimoine", status2: "statut", active: "actif", hidden: "masqué", saved: "✓ enregistré",
    lineRead: "lecture", lineWrite: "écriture", noSql: "pas de SQL direct",
  },
} as const;

function Stage({ frame, compact, locale }: SceneStageProps) {
  const c = COPY[locale];
  const actB = frame >= T.reset[1];

  // ── Geometry ──────────────────────────────────────────────────────────────
  const L = compact
    ? {
      screen: { x: 20, y: 56, w: 160, h: 60 },
      engine: { x: 16, y: 134, w: 508, h: 198 },
      gate: (i: number) => ({ x: 30, y: 150 + i * 60, w: 480, h: 50 }),
      gateAt: (i: number): Pt => [120, 175 + i * 60],
      trackStart: [120, 116] as Pt,
      trackEnd: [120, 332] as Pt,
      read: { x: 20, y: 352, w: 240, h: 66 },
      write: { x: 280, y: 352, w: 240, h: 66 },
      readIn: [140, 352] as Pt,
      writeIn: [400, 352] as Pt,
      audit: { x: 20, y: 428, w: 500, h: 86 },
      screenAt: [120, 86] as Pt,
    }
    : {
      screen: { x: 40, y: 150, w: 124, h: 84 },
      engine: { x: 184, y: 78, w: 524, h: 214 },
      gate: (i: number) => ({ x: 200 + i * 168, y: 102, w: 156, h: 172 }),
      gateAt: (i: number): Pt => [278 + i * 168, 192],
      trackStart: [164, 192] as Pt,
      trackEnd: [708, 192] as Pt,
      read: { x: 752, y: 92, w: 168, h: 86 },
      write: { x: 752, y: 206, w: 168, h: 86 },
      readIn: [752, 135] as Pt,
      writeIn: [752, 249] as Pt,
      audit: { x: 40, y: 312, w: 880, h: 98 },
      screenAt: [102, 192] as Pt,
    };
  const { screen, engine, read, write, audit, trackStart, trackEnd, readIn, writeIn } = L;
  const G = [0, 1, 2].map(L.gateAt);

  const branch = (to: Pt): Pt[] => compact
    ? cubicPoints(trackEnd, [trackEnd[0], trackEnd[1] + 12], [to[0], to[1] - 12], to)
    : cubicPoints(trackEnd, [trackEnd[0] + 24, trackEnd[1]], [to[0] - 24, to[1]], to);
  const branchD = (to: Pt) => `M${branch(to).map((p) => `${p[0]} ${p[1]}`).join("L")}`;
  const readPath = branch(readIn);
  const writePath = branch(writeIn);

  // ── Request packets ───────────────────────────────────────────────────────
  const R = actB ? T.write : T.req;
  const trackKeys = [
    [R[0], trackStart], [R[1], G[0]!], [R[2], G[0]!], [R[3], G[1]!], [R[4], G[1]!], [R[5], G[2]!], [R[6], G[2]!], [R[7], trackEnd],
  ] as const;
  const onTrack = frame >= R[0] && frame < R[7];
  const [px, py] = keyed(frame, trackKeys);
  const branchT = ease(frame, R[7], R[8]);
  const flowTone: Tone = actB ? "hot" : "line";

  // Which gate is holding the request right now.
  const gateHit = (i: number) => {
    const arrive = R[1 + i * 2]!;
    const leave = R[2 + i * 2]!;
    const request = easeOut(frame, arrive - 8, arrive) * (1 - ease(frame, leave, leave + 14));
    const redaction = i === 1 && !actB ? ease(frame, T.redact[0] - 6, T.redact[0]) * (1 - ease(frame, T.redact[1], T.redact[1] + 14)) : 0;
    return Math.max(request, redaction);
  };
  const gatePassed = (i: number) => {
    const arrive = R[1 + i * 2]!;
    const fade = actB ? 1 : 1 - ease(frame, T.reset[0], T.reset[1]);
    return frame >= arrive ? pop(frame, arrive) * fade : 0;
  };

  // ── Responses ─────────────────────────────────────────────────────────────
  const readCentre: Pt = [read.x + read.w / 2, read.y + read.h / 2];
  const writeCentre: Pt = [write.x + write.w / 2, write.y + write.h / 2];
  const [rx, ry] = keyed(frame, [
    [T.resp[0], readCentre], [T.resp[1], trackEnd], [T.resp[2], G[2]!], [T.resp[3], G[1]!], [T.resp[4], G[1]!], [T.resp[5], G[0]!], [T.resp[6], L.screenAt],
  ]);
  const recordOpacity = easeOut(frame, T.resp[0] - 6, T.resp[0] + 4) * (1 - ease(frame, T.resp[6] - 10, T.resp[6]));
  const redact = ease(frame, T.redact[0], T.redact[1]);
  const [ax, ay] = keyed(frame, [[T.ack[0], writeCentre], [T.ack[1], trackEnd], [T.ack[2], L.screenAt]]);
  const ackOpacity = easeOut(frame, T.ack[0] - 6, T.ack[0] + 4) * (1 - ease(frame, T.ack[2] - 10, T.ack[2]));
  const screenTagA = frame >= T.resp[6] && frame < T.reset[1] ? pop(frame, T.resp[6]) * (1 - ease(frame, T.reset[0], T.reset[1])) : 0;
  const screenTagB = frame >= T.ack[2] ? pop(frame, T.ack[2]) : 0;
  const readGlow = easeOut(frame, T.req[8] - 4, T.req[8]) * (1 - ease(frame, T.resp[0] + 4, T.resp[0] + 26));
  const writeGlow = easeOut(frame, T.write[8] - 4, T.write[8]) * (1 - ease(frame, T.ack[0] + 4, T.ack[0] + 26));

  // ── Audit journal ─────────────────────────────────────────────────────────
  const rows = [
    { time: "10:41:55", action: c.WRITE, entity: "operations/77", detail: c.viaApi, at: -1 },
    ...(frame >= T.audit1 ? [{ time: "10:42:07", action: c.READ, entity: "contracts/4812", detail: c.masked, at: T.audit1 }] : []),
    ...(frame >= T.audit2 ? [{ time: "10:42:15", action: c.WRITE, entity: "contracts/4812", detail: c.viaApi, at: T.audit2 }] : []),
  ].reverse();
  const newest = rows[0]!;
  const slide = newest.at >= 0 ? easeOut(frame, newest.at, newest.at + 16) : 1;
  const flash = newest.at >= 0 ? 1 - ease(frame, newest.at + 10, newest.at + 70) : 0;
  const rowStep = compact ? 17 : 20;
  const rowY0 = audit.y + (compact ? 42 : 46);
  const cols = compact ? [audit.x + 14, audit.x + 92, audit.x + 186, audit.x + 330] : [audit.x + 20, audit.x + 130, audit.x + 250, audit.x + 420, audit.x + 520];

  const drawIn = easeOut(frame, 16, 40);

  return <g>
    {/* Screen */}
    <g {...enter(frame, 0)}>
      <Box x={screen.x} y={screen.y} w={screen.w} h={screen.h} tone="line" focus={Math.max(screenTagA, screenTagB) * (1 - ease(frame, T.ack[2] + 30, T.ack[2] + 60))} radius={14}>
        <Text x={screen.x + 16} y={screen.y + (compact ? 20 : 24)} size={11} font="mono" weight={600} tone="muted" caps>{c.screen}</Text>
        <Text x={screen.x + 16} y={screen.y + (compact ? 42 : 50)} size={compact ? 17 : 19}>Nexus</Text>
        <Text x={screen.x + (compact ? 84 : 16)} y={screen.y + (compact ? 42 : 70)} size={12.5} font="mono" weight={500} tone="muted">{c.role}</Text>
      </Box>
    </g>
    {screenTagA > 0 ? <Tag x={compact ? screen.x + screen.w + 12 : screen.x + screen.w / 2} y={compact ? screen.y + screen.h / 2 : screen.y + screen.h + 22} anchor={compact ? "start" : "middle"} text={c.masked} tone="hot" appear={screenTagA} size={12} /> : null}
    {screenTagB > 0 ? <Tag x={compact ? screen.x + screen.w + 12 : screen.x + screen.w / 2} y={compact ? screen.y + screen.h / 2 : screen.y + screen.h + 22} anchor={compact ? "start" : "middle"} text={c.saved} tone="ok" appear={screenTagB} size={12} /> : null}

    {/* Engine and gates */}
    <Boundary x={engine.x} y={engine.y} w={engine.w} h={engine.h} label={c.engine} tone="line" appear={easeOut(frame, 6, 24)} />
    <Wire d={`M${trackStart[0]} ${trackStart[1]}L${trackEnd[0]} ${trackEnd[1]}`} draw={drawIn} tone="muted" width={1.25} />
    <Wire d={branchD(readIn)} draw={easeOut(frame, 28, 50)} tone="muted" width={1.25} />
    <Wire d={branchD(writeIn)} draw={easeOut(frame, 32, 54)} tone="muted" width={1.25} />

    {[0, 1, 2].map((i) => {
      const g = L.gate(i);
      const [title, question] = c.gates[i]!;
      const hit = gateHit(i);
      const passed = gatePassed(i);
      const status = c.status[i]![actB ? 1 : 0];
      return <g key={i} {...enter(frame, 10 + i * 6)}>
        <Box x={g.x} y={g.y} w={g.w} h={g.h} tone="hot" focus={hit} radius={compact ? 12 : 16}>
          {compact ? <>
            <Text x={g.x + 16} y={g.y + g.h / 2} size={11} font="mono" weight={600} tone="muted">0{i + 1}</Text>
            <Text x={g.x + 104} y={g.y + 17} size={15}>{title}</Text>
            <Text x={g.x + 104} y={g.y + 35} size={12.5} font="main" weight={500} tone="muted">{question}</Text>
          </> : <>
            <Text x={g.x + 14} y={g.y + 20} size={11} font="mono" weight={600} tone="muted">0{i + 1}</Text>
            <Text x={g.x + 14} y={g.y + 44} size={14.5}>{title}</Text>
            <Text x={g.x + 14} y={g.y + 64} size={13} font="main" weight={500} tone="muted">{question}</Text>
          </>}
        </Box>
        {passed > 0 ? <Tag
          x={compact ? g.x + g.w - 12 : g.x + g.w / 2} y={compact ? g.y + g.h / 2 : g.y + g.h - 24}
          anchor={compact ? "end" : "middle"} text={status} tone="ok" appear={passed} size={11.5}
        /> : null}
      </g>;
    })}

    {/* Targets */}
    {([["read", read, c.read, readGlow], ["write", write, c.write, writeGlow]] as const).map(([key, box, [tag, title, sub], glow], i) => (
      <g key={key} {...enter(frame, 22 + i * 6, { from: "right", distance: 18 })}>
        <Box x={box.x} y={box.y} w={box.w} h={box.h} tone={key === "read" ? "line" : "hot"} focus={glow} radius={14}>
          <Text x={box.x + 16} y={box.y + (compact ? 18 : 22)} size={11} font="mono" weight={600} tone="muted" caps>{tag}</Text>
          <Text x={box.x + 16} y={box.y + (compact ? 36 : 46)} size={compact ? 15.5 : 17}>{title}</Text>
          <Text x={box.x + 16} y={box.y + (compact ? 53 : 68)} size={compact ? 11.5 : 12} font="mono" weight={500} tone="muted">{sub}</Text>
        </Box>
      </g>
    ))}
    {/* Act 2: the replica refuses writes; the only write path is the service. */}
    {actB ? <Tag
      x={read.x + read.w / 2} y={compact ? read.y - 10 : read.y - 12}
      text={`✗ ${c.noSql}`} tone="danger" appear={pop(frame, T.write[7] - 6)} size={11}
    /> : null}

    {/* Request in flight */}
    {onTrack ? <>
      <Comet points={[trackStart, trackEnd]} t={(compact ? py - trackStart[1] : px - trackStart[0]) / (compact ? trackEnd[1] - trackStart[1] : trackEnd[0] - trackStart[0])} tone={flowTone} tail={.08} />
      {!compact ? <Tag x={px} y={py + 26} text={`${actB ? c.lineWrite : c.lineRead} · contracts/4812`} tone={flowTone} size={11} appear={easeOut(frame, R[0], R[0] + 8)} /> : null}
    </> : null}
    <Comet points={actB ? writePath : readPath} t={branchT} tone={flowTone} tail={.25} />
    {!actB && frame >= T.req[8] ? <Pulse x={readIn[0]} y={readIn[1]} frame={frame} at={T.req[8]} period={36} r={8} tone="line" once /> : null}
    {actB && frame >= T.write[8] ? <Pulse x={writeIn[0]} y={writeIn[1]} frame={frame} at={T.write[8]} period={36} r={8} tone="hot" once /> : null}

    {/* Record riding back: access control masks the sensitive field. */}
    {recordOpacity > 0 ? <g opacity={recordOpacity} transform={`translate(${rx} ${ry})`}>
      <rect className="scene-card" x={-98} y={-36} width={196} height={72} rx={10} style={{ fill: "var(--scene-card)" }} />
      <rect x={-98} y={-36} width={196} height={72} rx={10} fill="none" stroke="var(--scene-hairline)" />
      <rect x={-98} y={-36} width={196} height={22} rx={10} style={{ fill: tint("line", 18) }} />
      <Text x={-86} y={-25} size={12} font="mono" weight={600} tone="line">contracts/4812</Text>
      <Text x={-86} y={-1} size={12.5} font="mono" weight={500} tone="muted">{c.status2}</Text>
      <Text x={86} y={-1} size={12.5} font="mono" weight={600} anchor="end">{c.active}</Text>
      <Text x={-86} y={20} size={12.5} font="mono" weight={500} tone="muted">{c.field}</Text>
      <Text x={86} y={20} size={12.5} font="mono" weight={600} anchor="end" opacity={1 - redact}>1 240 000 €</Text>
      {redact > 0 ? <g opacity={redact}>
        <rect x={86 - textWidth(c.hidden, 12.5) - 40} y={14} width={34} height={12} rx={3} style={{ fill: tint("hot", 55) }} />
        <Text x={86} y={20} size={12.5} font="mono" weight={600} anchor="end" tone="hot">{c.hidden}</Text>
      </g> : null}
    </g> : null}
    {ackOpacity > 0 ? <Tag x={ax} y={ay} text={c.saved} tone="ok" appear={ackOpacity} size={12} /> : null}

    {/* Audit journal */}
    <g {...enter(frame, 30)}>
      <Box x={audit.x} y={audit.y} w={audit.w} h={audit.h} tone="hot" radius={14} focus={flash * .6}>
        <Text x={audit.x + (compact ? 14 : 20)} y={audit.y + 20} size={11} font="mono" weight={600} tone="hot" caps>{c.journal}</Text>
        <Text x={audit.x + audit.w - (compact ? 14 : 20)} y={audit.y + 20} size={11.5} font="mono" weight={500} tone="muted" anchor="end">{c.journalSub}</Text>
        <line x1={audit.x + 12} x2={audit.x + audit.w - 12} y1={audit.y + 32} y2={audit.y + 32} stroke="var(--scene-hairline)" strokeWidth={1} />
        {rows.slice(0, 3).map((row, j) => {
          const y = rowY0 + (j - 1 + slide) * rowStep;
          const top = j === 0;
          const opacity = top ? slide : 1;
          const tone: Tone = top && newest.at >= 0 ? "ink" : "muted";
          return <g key={`${row.time}-${row.entity}`} opacity={opacity}>
            {top && flash > 0 ? <rect x={audit.x + 8} y={y - 9} width={audit.w - 16} height={18} rx={5} style={{ fill: tint("hot", 16 * flash) }} /> : null}
            <Text x={cols[0]!} y={y} size={compact ? 12 : 13} font="mono" weight={500} tone="muted">{row.time}</Text>
            <Text x={cols[1]!} y={y} size={compact ? 12 : 13} font="mono" weight={600} tone={top && newest.at >= 0 ? "hot" : "muted"}>{row.action}</Text>
            <Text x={cols[2]!} y={y} size={compact ? 12 : 13} font="mono" weight={500} tone={tone}>{row.entity}</Text>
            {compact ? null : <Text x={cols[3]!} y={y} size={13} font="mono" weight={500} tone={tone}>{c.role}</Text>}
            <Text x={cols[compact ? 3 : 4]!} y={y} size={compact ? 12 : 13} font="mono" weight={500} tone={tone}>{row.detail}</Text>
          </g>;
        })}
      </Box>
    </g>
  </g>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.resp[6] + 8,
  title: { en: "One path to the data", fr: "Un seul chemin vers la donnée" },
  caption: {
    en: "Every read and every write crosses authentication, access control and audit. Reads hit a read-only replica, writes go through the owning service, and sensitive fields are masked on the way back.",
    fr: "Chaque lecture et chaque écriture traverse authentification, contrôle d'accès et audit. Les lectures vont sur un replica en lecture seule, les écritures passent par le service propriétaire, et les champs sensibles sont masqués au retour.",
  },
  beats: [
    { at: 0, text: { en: "A screen asks for contracts/4812. The request enters the engine, never the database.", fr: "Un écran demande contracts/4812. La requête entre dans le moteur, jamais directement en base." } },
    { at: T.req[1] - 4, text: { en: "Three gates, in order: who is asking, what is allowed, and a line in the audit journal.", fr: "Trois contrôles, dans l'ordre : qui demande, quels droits, et une ligne au journal d'audit." } },
    { at: T.req[7] - 4, text: { en: "Reads go to a PostgreSQL read replica with a read-only role. Production primaries never feel it.", fr: "Les lectures vont sur un replica PostgreSQL en lecture seule. Les primaires de production ne sentent rien." } },
    { at: T.resp[2], text: { en: "On the way back, access control masks client assets. The screen never receives the value.", fr: "Au retour, le contrôle d'accès masque le patrimoine. L'écran ne reçoit jamais la valeur." } },
    { at: T.write[0] - 4, text: { en: "A write crosses the same gates, then goes to the owning service's API. Never to SQL.", fr: "Une écriture traverse les mêmes contrôles, puis l'API du service propriétaire. Jamais de SQL." } },
    { at: T.ack[2] - 20, text: { en: "Every read and every write is in the journal. There is no other path to the data.", fr: "Chaque lecture et chaque écriture est au journal. Il n'y a pas d'autre chemin vers la donnée." } },
  ],
  Stage,
});
