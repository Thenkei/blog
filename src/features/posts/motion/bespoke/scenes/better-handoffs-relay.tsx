import { Box, Camera, Checkpoint, Comet, ease, easeOut, enter, lerp, pop, Pulse, stagger, Tag, Text, tint, TONE, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// One hand-off card, relayed twice to the next agent. Act 1 carries only the
// last answer: the other fields of the card are empty, so the receiver's log
// re-checks what was already ruled out and starts over. Act 2 replays the same
// relay with the investigation state filled in: each log line now comes from a
// field (ruled out → skipped, not yet checked → runs alone, next → pause).
const T = {
  fact: 16,
  packetA: [44, 70] as const,
  redo: [80, 104, 128] as const,
  restart: 156,
  wipe: 196,
  state: 212,
  packetB: [292, 318] as const,
  links: [318, 336, 360, 408] as const,
  rowsB: [330, 348, 372, 420] as const,
  autoPass: 402,
  decide: 440,
  end: 530,
} as const;

type Pt = readonly [number, number];
type RowState = "redo" | "skip" | "pending" | "running" | "pass" | "pause";

const FACT = {
  en: "The error rate increased at 14:03.",
  fr: "Le taux d'erreur a augmenté à 14 h 03.",
} as const;

// The article's structured hand-off, condensed to one line per field.
const FIELDS = {
  en: [
    ["objective", "error rate ↑ · checkout"],
    ["hypothesis", "payment retry path"],
    ["confidence", "medium"],
    ["evidence", "after checkout deploy · retries"],
    ["ruled out", "provider outage · DB saturation"],
    ["unchecked", "retry config in every region"],
    ["next", "compare regions → escalate"],
  ],
  fr: [
    ["objectif", "taux d'erreur ↑ · checkout"],
    ["hypothèse", "retry du paiement"],
    ["confiance", "moyenne"],
    ["preuves", "après le déploiement · retries"],
    ["écartées", "panne fournisseur · base saturée"],
    ["à vérifier", "config retry de chaque région"],
    ["suite", "comparer les régions → escalader"],
  ],
} as const;
const RULED_OUT = 4;
// Act 2: the field each log line comes from.
const SOURCE = [4, 4, 5, 6] as const;

const LOG_A = {
  en: [["provider outage?", "checked again"], ["database saturation?", "checked again"], ["what changed recently?", "checked again"]],
  fr: [["panne du fournisseur ?", "revérifiée"], ["saturation de la base ?", "revérifiée"], ["qu'est-ce qui a changé ?", "revérifié"]],
} as const;
const LOG_B = {
  en: [["provider outage", "ruled out · skipped"], ["database saturation", "ruled out · skipped"], ["compare config across regions", "low risk · runs alone"], ["change production config", "costly if wrong · pause"]],
  fr: [["panne du fournisseur", "écartée · sautée"], ["saturation de la base", "écartée · sautée"], ["comparer la config des régions", "peu risqué · part seul"], ["modifier la config de prod", "erreur coûteuse · pause"]],
} as const;

const typed = (text: string, frame: number, at: number, speed = 1.8) => text.slice(0, Math.max(0, Math.floor((frame - at) * speed)));

const cubic = (a: Pt, b: Pt, steps = 16): Pt[] => Array.from({ length: steps + 1 }, (_, i) => {
  const t = i / steps;
  const c1: Pt = [lerp(a[0], b[0], .55), a[1]];
  const c2: Pt = [lerp(a[0], b[0], .45), b[1]];
  const u = 1 - t;
  return [
    u ** 3 * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t ** 3 * b[0],
    u ** 3 * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t ** 3 * b[1],
  ] as const;
});

function RowGlyph({ x, y, state, r, frame, at }: { x: number; y: number; state: RowState; r: number; frame: number; at: number }) {
  if (state === "pass") return <Checkpoint x={x} y={y} state="pass" r={r} />;
  if (state === "pending" || state === "pause") return <Checkpoint x={x} y={y} state="pending" r={r} />;
  if (state === "running") {
    const turn = (frame - at) * 9;
    return <g>
      <circle cx={x} cy={y} r={r - 1} fill="none" style={{ stroke: "var(--scene-hairline)" }} strokeWidth={1.5} />
      <path d={`M${x} ${y - r + 1}A${r - 1} ${r - 1} 0 0 1 ${x + r - 1} ${y}`} fill="none" stroke={TONE.line} strokeWidth={2} strokeLinecap="round" transform={`rotate(${turn} ${x} ${y})`} />
    </g>;
  }
  const tone: Tone = state === "redo" ? "danger" : "muted";
  // ↻ turns once when the line appears: the same work, done again.
  const spin = state === "redo" ? -360 * easeOut(frame, at, at + 22) : 0;
  return <g>
    <circle cx={x} cy={y} r={r} style={{ fill: tint(tone, 14) }} stroke={TONE[tone]} strokeOpacity={.5} strokeWidth={1} />
    <g transform={`rotate(${spin} ${x} ${y})`}>
      <Text x={x} y={y + 1} size={r * 1.2} font="mono" weight={700} tone={tone} anchor="middle">{state === "redo" ? "↻" : "−"}</Text>
    </g>
  </g>;
}

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const actB = frame >= T.wipe;
  const fields = FIELDS[locale];

  // ── Geometry ──────────────────────────────────────────────────────────────
  const G = compact
    ? { card: { x: 20, y: 60, w: 500 }, row0: 50, step: 24, keyW: 104, valueSize: 14, log: { x: 20, y: 318, w: 500, h: 40, step: 46 }, eyebrowY: 302 }
    : { card: { x: 40, y: 92, w: 404 }, row0: 54, step: 28, keyW: 102, valueSize: 13.5, log: { x: 536, y: 92, w: 384, h: 54, step: 64 }, eyebrowY: 66 };
  const { card, log } = G;
  const cardH = G.row0 + (fields.length - 1) * G.step + 26;
  const fieldY = (i: number) => card.y + G.row0 + i * G.step;
  const rowTop = (i: number) => log.y + i * log.step;
  const rowMid = (i: number) => rowTop(i) + log.h / 2;

  // ── Hand-off card ─────────────────────────────────────────────────────────
  const headerTagA = 1 - ease(frame, T.wipe, T.wipe + 10);
  const headerTagB = frame >= T.wipe + 8 ? pop(frame, T.wipe + 8) : 0;
  const fieldIn = (i: number) => stagger(i, T.state, 9);
  // Act 1: the empty "ruled out" field is what sends the receiver back.
  const emptyAlarm = !actB ? easeOut(frame, T.redo[0] - 6, T.redo[0] + 8) * (1 - ease(frame, T.wipe - 16, T.wipe)) : 0;
  const linkIndex = actB ? T.links.findIndex((at, i) => frame >= at && frame < T.rowsB[i]! + 24) : -1;
  const activeField = linkIndex >= 0 ? SOURCE[linkIndex]! : -1;
  const linkTone = (i: number): Tone => i === 3 ? "hot" : i === 2 ? "line" : "ok";

  const fieldRows = fields.map(([key, value], i) => {
    const y = fieldY(i);
    const keyX = card.x + 18;
    const valueX = keyX + G.keyW;
    const band = i === RULED_OUT && emptyAlarm > 0 ? { tone: "danger" as Tone, t: emptyAlarm }
      : i === activeField ? { tone: linkTone(linkIndex), t: during(frame, T.links[linkIndex]! - 2, T.rowsB[linkIndex]! + 24) }
        : undefined;
    const bandEl = band ? <g opacity={band.t}>
      <rect x={card.x + 8} y={y - G.step / 2 + 1} width={card.w - 16} height={G.step - 2} rx={6} style={{ fill: tint(band.tone, 13) }} />
      <rect x={card.x + 8} y={y - G.step / 2 + 5} width={2.5} height={G.step - 10} rx={1.25} fill={TONE[band.tone]} />
    </g> : null;

    // Act 1: row 0 is the lone fact; the others are empty slots.
    if (!actB) {
      if (i === 0) {
        return <g key={i}>
          <Text x={keyX} y={y} size={G.valueSize + 1} font="mono" weight={600} tone="ink">{typed(FACT[locale], frame, T.fact)}</Text>
          {frame >= T.fact && typed(FACT[locale], frame, T.fact).length < FACT[locale].length ? <rect x={keyX + typed(FACT[locale], frame, T.fact).length * (G.valueSize + 1) * .6 + 2} y={y - 9} width={2} height={18} fill={TONE.ink} /> : null}
        </g>;
      }
      const empty = enter(frame, stagger(i, 34, 3), { distance: 6 });
      return <g key={i} {...empty}>
        {bandEl}
        <Text x={keyX} y={y} size={13} font="mono" weight={500} tone={band ? "danger" : "muted"} opacity={band ? 1 : .6}>{key}</Text>
        <line x1={valueX} x2={card.x + card.w - 24} y1={y + 1} y2={y + 1} style={{ stroke: band ? TONE.danger : "var(--scene-hairline)" }} strokeWidth={1} strokeDasharray="3 5" opacity={band ? .8 : .7} />
      </g>;
    }
    const at = fieldIn(i);
    const out = frame < at ? 1 - ease(frame, T.wipe, T.wipe + 10) : 0;
    const shown = typed(value, frame, at + 4, 2);
    const valueTone: Tone = i === 6 ? "hot" : i === RULED_OUT ? "muted" : "ink";
    return <g key={i}>
      {bandEl}
      {/* Act 1 residue fades while this field is being written. */}
      {out > 0 && i > 0 ? <line x1={valueX} x2={card.x + card.w - 24} y1={y + 1} y2={y + 1} style={{ stroke: "var(--scene-hairline)" }} strokeWidth={1} strokeDasharray="3 5" opacity={.7 * out} /> : null}
      {out > 0 && i === 0 ? <Text x={keyX} y={y} size={G.valueSize + 1} font="mono" weight={600} opacity={out}>{FACT[locale]}</Text> : null}
      {frame >= at ? <g {...enter(frame, at, { dur: 12, distance: 4, from: "left" })}>
        <Text x={keyX} y={y} size={13} font="mono" weight={500} tone="muted">{key}</Text>
        <Text x={valueX} y={y} size={G.valueSize} font="mono" weight={600} tone={valueTone}>{shown}</Text>
      </g> : frame < T.wipe + 10 && i > 0 ? <Text x={keyX} y={y} size={13} font="mono" weight={500} tone="muted" opacity={.6}>{key}</Text> : null}
    </g>;
  });

  // ── Relay (sender → receiver) ─────────────────────────────────────────────
  const packet = actB ? T.packetB : T.packetA;
  const packetT = ease(frame, packet[0], packet[1]);
  const received = frame >= packet[1];
  const relayPath: Pt[] = compact
    ? [[card.x + card.w / 2, card.y + cardH + 2], [card.x + card.w / 2, G.eyebrowY - 10]]
    : [[228, G.eyebrowY], [log.x - 16, G.eyebrowY]];
  const receiverGlow = during(frame, packet[1] - 4, packet[1] + 16);

  // ── Receiver log ──────────────────────────────────────────────────────────
  const logA = LOG_A[locale];
  const logB = LOG_B[locale];
  const rowStateB = (i: number): RowState => i < 2 ? "skip" : i === 2 ? (frame >= T.autoPass ? "pass" : frame >= T.rowsB[2] + 4 ? "running" : "pending") : "pause";
  const rowsOutA = 1 - ease(frame, T.wipe - 12, T.wipe + 4);

  const logRows = (actB ? logB : logA).map(([label, sub], i) => {
    const at = actB ? T.rowsB[i]! : T.redo[i]!;
    const state: RowState = actB ? rowStateB(i) : "redo";
    const appear = easeOut(frame, at, at + 16) * (actB ? 1 : rowsOutA);
    if (appear <= 0) return null;
    const y = rowTop(i);
    const tone: Tone = state === "redo" ? "danger" : state === "skip" ? "muted" : state === "pass" ? "ok" : state === "pause" ? "hot" : "line";
    const labelSize = compact ? 15 : 16;
    const labelY = y + log.h * (compact ? .34 : .36);
    const subY = y + log.h * (compact ? .74 : .72);
    const gx = log.x + (compact ? 20 : 24);
    const tx = log.x + (compact ? 40 : 48);
    const focus = state === "pause" ? easeOut(frame, at + 8, at + 20) : 0;
    const progress = state === "running" || state === "pass" ? easeOut(frame, T.rowsB[2] + 4, T.autoPass) : 0;
    return <g key={`${actB ? "b" : "a"}${i}`} opacity={appear} transform={`translate(${(1 - appear) * (compact ? 0 : 18)} ${(1 - appear) * (compact ? 10 : 0)})`}>
      <Box x={log.x} y={y} w={log.w} h={log.h} tone={tone} radius={12} focus={focus} fill={state === "pass" ? .5 * ease(frame, T.autoPass, T.autoPass + 10) : 0}>
        <RowGlyph x={gx} y={y + log.h / 2} state={state} r={compact ? 10 : 12} frame={frame} at={at} />
        <Text x={tx} y={labelY} size={labelSize} weight={600} tone={state === "skip" ? "muted" : "ink"}>{label}</Text>
        {state === "skip" ? <line x1={tx - 2} x2={tx + (label.length * labelSize * .44 + 2) * easeOut(frame, at + 6, at + 18)} y1={labelY + 1} y2={labelY + 1} stroke={TONE.muted} strokeWidth={1.25} /> : null}
        <Text x={tx} y={subY} size={12.5} font="mono" weight={600} tone={tone === "line" ? "muted" : tone}>{sub}</Text>
        {progress > 0 ? <line x1={log.x + 12} x2={log.x + 12 + (log.w - 24) * progress} y1={y + log.h - 1} y2={y + log.h - 1} stroke={TONE[state === "pass" ? "ok" : "line"]} strokeWidth={2} strokeLinecap="round" /> : null}
      </Box>
    </g>;
  });

  // Act 2: each log line is fed by a field of the hand-off (wide: a packet travels).
  const comets = actB && !compact ? T.links.map((at, i) => {
    const from: Pt = [card.x + card.w - 6, fieldY(SOURCE[i]!)];
    const to: Pt = [log.x + 2, rowMid(i)];
    return <Comet key={i} points={cubic(from, to)} t={ease(frame, at, T.rowsB[i]!)} tone={linkTone(i)} r={5} tail={.3} />;
  }) : null;

  const restartIn = pop(frame, T.restart) * rowsOutA;
  const decideIn = frame >= T.decide ? pop(frame, T.decide) : 0;
  const decideAt: Pt = compact ? [log.x + log.w - 12, rowMid(3)] : [log.x + log.w / 2, rowTop(3) + log.h + 26];
  const decideText = fr ? (compact ? "l'astreinte décide" : "la personne d'astreinte décide") : compact ? "on duty decides" : "the person on duty decides";

  const lean = (point: Pt, k = .22): Pt => [lerp(width / 2, point[0], k), lerp(height / 2, point[1], k)];
  const camera = compact ? [{ at: 0 }] : [
    { at: 0 },
    { at: T.redo[0] - 8, zoom: 1.025, focus: lean([log.x + log.w / 2, rowMid(1)]) },
    { at: T.wipe - 6, zoom: 1 },
    { at: T.rowsB[3] - 16, zoom: 1.025, focus: lean([log.x + log.w / 2, rowMid(3)], .14) },
  ];

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    {/* Sender and receiver. */}
    <g {...enter(frame, 2)}>
      {compact ? null : <>
        <circle cx={card.x + 4} cy={G.eyebrowY} r={3.5} fill={TONE.line} />
        <Text x={card.x + 14} y={G.eyebrowY} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "agent de collecte" : "evidence agent"}</Text>
        <line x1={relayPath[0]![0]} x2={relayPath[1]![0]} y1={G.eyebrowY} y2={G.eyebrowY} style={{ stroke: "var(--scene-hairline)" }} strokeWidth={1} />
      </>}
      <circle cx={log.x + 4} cy={G.eyebrowY} r={3.5} fill={TONE[received ? (actB ? "ok" : "danger") : "line"]} />
      {receiverGlow > 0 ? <circle cx={log.x + 4} cy={G.eyebrowY} r={3.5 + 8 * receiverGlow} fill="none" stroke={TONE[actB ? "ok" : "danger"]} strokeWidth={1.25} opacity={1 - receiverGlow} /> : null}
      <Text x={log.x + 14} y={G.eyebrowY} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "journal de l'agent suivant" : "next agent's log"}</Text>
    </g>
    <Comet points={relayPath} t={packetT} tone={actB ? "ok" : "danger"} r={5.5} tail={.25} />

    <g {...enter(frame, 6, { distance: 16 })}>
      <Box x={card.x} y={card.y} w={card.w} h={cardH} tone={actB ? "ok" : "line"} radius={16} focus={during(frame, packet[0] - 10, packet[0] + 14) * .6}>
        <Text x={card.x + 18} y={card.y + 24} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "relais" : "hand-off"}</Text>
        <Tag x={card.x + card.w - 14} y={card.y + 24} anchor="end" size={11.5} text={fr ? "dernière réponse" : "last answer"} tone="danger" appear={headerTagA * enter(frame, 10).opacity} />
        <Tag x={card.x + card.w - 14} y={card.y + 24} anchor="end" size={11.5} text={fr ? "état de l'investigation" : "investigation state"} tone="ok" appear={headerTagB} />
        <line x1={card.x + 16} x2={card.x + card.w - 16} y1={card.y + 40} y2={card.y + 40} style={{ stroke: "var(--scene-hairline)" }} strokeWidth={1} opacity={.7} />
        {fieldRows}
      </Box>
    </g>

    {comets}
    {logRows}

    <Tag x={log.x + log.w / 2} y={rowMid(3)} text={fr ? "recommence à zéro" : "starts over"} tone="danger" appear={restartIn} size={13} />
    {actB ? <>
      <Tag x={decideAt[0]} y={decideAt[1]} anchor={compact ? "end" : "middle"} text={decideText} tone="hot" appear={decideIn} size={compact ? 12 : 13} />
      {frame >= T.rowsB[3] + 12 ? <Pulse x={log.x + (compact ? 20 : 24)} y={rowMid(3)} frame={frame} at={T.rowsB[3] + 12} period={44} r={12} tone="hot" /> : null}
    </> : null}
  </Camera>;
}

function during(frame: number, start: number, end: number) {
  return Math.min(ease(frame, start, start + 8), 1 - ease(frame, end - 8, end));
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: 490,
  title: { en: "What crosses the hand-off", fr: "Ce que transmet le relais" },
  caption: {
    en: "A hand-off that carries only the last answer makes the next participant start over. Passing the investigation state lets them skip ruled-out paths, run the bounded diagnostic and stop where a human decision is needed.",
    fr: "Un relais qui ne transmet que la dernière réponse fait tout recommencer au participant suivant. Transmettre l'état de l'investigation lui permet de sauter les pistes écartées, de lancer le diagnostic borné et de s'arrêter là où une décision humaine est nécessaire.",
  },
  beats: [
    { at: 0, text: { en: "Agent to agent, the hand-off carries only the last answer: “The error rate increased at 14:03.”", fr: "Le relais ne transmet que la dernière réponse : « Le taux d'erreur a augmenté à 14 h 03. »" } },
    { at: T.redo[0], text: { en: "Nothing says which paths were ruled out, so the next agent checks the provider and the database again.", fr: "Rien ne dit quelles pistes sont écartées : l'agent suivant revérifie le fournisseur et la base." } },
    { at: T.restart, text: { en: "An isolated fact makes the next participant start over. The chain moves forward and loses the thread.", fr: "Un fait isolé fait tout recommencer au participant suivant. La chaîne avance en perdant le fil." } },
    { at: T.wipe, text: { en: "Same relay, but the hand-off carries its state: objective, hypothesis, evidence, ruled-out paths.", fr: "Même relais, mais il transmet son état : objectif, hypothèse, preuves, pistes écartées." } },
    { at: T.rowsB[0], text: { en: "Ruled-out paths are skipped. The low-risk diagnostic, comparing regions, runs on its own.", fr: "Les pistes écartées sont sautées. Le diagnostic peu risqué, comparer les régions, part seul." } },
    { at: T.rowsB[3], text: { en: "Changing production config is costly if wrong: the chain pauses and the person on duty decides.", fr: "Modifier la config de production coûte cher en cas d'erreur : la chaîne s'arrête, l'astreinte décide." } },
  ],
  Stage,
});
