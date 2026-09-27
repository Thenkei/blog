import type { ReactNode } from "react";
import { along, Box, Checkpoint, CodeBlock, Comet, dim, ease, easeOut, enter, lerp, pop, Pulse, stagger, Tag, Text, tint, TONE, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Timeline (30 fps). The runbook carries the article's six fields. A pull
// request that changes a contract lists the runbook among affected docs: that
// entry travels to the page and lands on its Trigger, so the page leaves
// "active" at once. AI prepares a diff, the owner checks the meaning, and the
// page is published again: verified with the change, not merely updated.
const T = {
  fields: 6,
  pr: 40,
  launch: 72,
  land: 100,
  ai: 140,
  owner: 200,
  approved: 236,
  publish: 256,
  published: 290,
  end: 430,
} as const;

const COPY = {
  en: {
    kind: "RUNBOOK",
    status: { active: "ACTIVE ✓", review: "IN REVIEW ◐" },
    verified: ["last verified · before the change", "last verified · with the PR ✓"],
    notAuthority: "⚠ not authoritative",
    fields: ["STATUS", "OWNER", "EVIDENCE", "TRIGGER", "EXPIRY", "SUCCESSOR"],
    values: { status: ["active", "in review"], owner: "named team", evidence: "contract test", trigger: "PR changing the contract", expiry: "when the contract is replaced", successor: "none yet" },
    pr: ["PULL REQUEST", "changes a contract"],
    affected: "affected docs:",
    doc: "runbook",
    ai: ["AI", "finds the page, prepares a diff"],
    diffTitle: "AI · runbook.md",
    diff: ["- describes the old contract", "+ describes the new contract"],
    owner: ["OWNER", "checks the meaning"],
    published: ["PUBLISHED", "active again, evidence at hand"],
  },
  fr: {
    kind: "RUNBOOK",
    status: { active: "ACTIF ✓", review: "EN REVUE ◐" },
    verified: ["dernière vérification · avant le changement", "dernière vérification · avec la PR ✓"],
    notAuthority: "⚠ ne fait plus autorité",
    fields: ["STATUT", "RESPONSABLE", "PREUVE", "DÉCLENCHEUR", "EXPIRATION", "SUCCESSEUR"],
    values: { status: ["actif", "en revue"], owner: "équipe nommée", evidence: "test de contrat", trigger: "PR qui modifie le contrat", expiry: "au remplacement du contrat", successor: "aucun pour l’instant" },
    pr: ["PULL REQUEST", "modifie un contrat"],
    affected: "documents concernés :",
    doc: "runbook",
    ai: ["IA", "retrouve la page, prépare un diff"],
    diffTitle: "IA · runbook.md",
    diff: ["- décrit l’ancien contrat", "+ décrit le nouveau contrat"],
    owner: ["RESPONSABLE", "vérifie le sens"],
    published: ["PUBLIÉ", "de nouveau actif, preuves en main"],
  },
} as const;

type Pt = readonly [number, number];
function Stage({ frame, compact, locale }: SceneStageProps) {
  const c = COPY[locale];
  const inReview = frame >= T.land && frame < T.published;
  const published = frame >= T.published;
  const reviewFlip = pop(frame, T.land);
  const publishFlip = pop(frame, T.published);

  // ── The page and its six-field contract ──
  const doc = compact ? { x: 20, y: 50, w: 500, h: 252 } : { x: 40, y: 60, w: 380, h: 300 };
  const rowTop = doc.y + (compact ? 84 : 96);
  const rowH = compact ? 27 : 34;
  const valueX = doc.x + (compact ? 150 : 140);
  const rowY = (i: number) => rowTop + i * rowH;
  const triggerY = rowY(3);
  const values = [
    inReview ? c.values.status[1] : c.values.status[0],
    c.values.owner, c.values.evidence, c.values.trigger, c.values.expiry, c.values.successor,
  ];
  const triggerLit = ease(frame, T.land, T.land + 8) * (1 - ease(frame, T.published, T.published + 20));
  const reviewWash = inReview ? Math.min(1, reviewFlip) : 0;

  // ── Review happens where reality changed: a rail of four steps ──
  const railX = compact ? 32 : 452;
  const cardX = compact ? 50 : 476;
  const cardW = compact ? 470 : 444;
  const nodeY: readonly number[] = compact ? [334, 382, 430, 478] : [100, 204, 290, 356];
  const stepAt = [T.pr, T.ai, T.owner, T.publish] as const;
  const current = stepAt.reduce((index, at, i) => frame >= at ? i : index, -1);
  const hop = (i: number) => ease(frame, stepAt[i + 1]! - 16, stepAt[i + 1]!);
  const railFill = nodeY.slice(1).reduce((y, next, i) => frame >= stepAt[i + 1]! - 16 ? lerp(nodeY[i]!, next, hop(i)) : y, nodeY[0]!);
  const past = (i: number, floor = .55) => current > i ? dim(ease(frame, stepAt[i + 1]!, stepAt[i + 1]! + 16), floor) : 1;

  // The PR's affected-docs entry travels to the page and lands on its Trigger.
  const chipFrom: Pt = compact ? [cardX + cardW - 50, nodeY[0]!] : [cardX, nodeY[0]! + 23];
  const chipPath: Pt[] = compact
    ? [chipFrom, [cardX + cardW - 50, triggerY]]
    : [chipFrom, [436, nodeY[0]! + 23], [436, triggerY], [doc.x + doc.w - 52, triggerY]];
  const chipT = ease(frame, T.launch, T.land);
  const [chipX, chipY] = along(chipPath, chipT);
  const chipOn = frame >= T.launch - 8 && frame < T.land + 10;

  // Publishing sends the verified state back to the page's header.
  const backPath: Pt[] = [[railX, nodeY[3]!], [436, nodeY[3]!], [436, doc.y + 24], [doc.x + doc.w - 8, doc.y + 24]];
  const backT = compact ? 0 : ease(frame, T.publish + 8, T.published);

  const statusText = inReview ? c.status.review : c.status.active;
  const statusTone: Tone = inReview ? "hot" : "ok";
  const statusScale = inReview ? .75 + .25 * reviewFlip : published ? .75 + .25 * publishFlip : 1;
  const statusX = doc.x + doc.w - 16;

  const step = (i: number, [kind, text]: readonly [string, string], tone: Tone, extra?: ReactNode) => {
    const y = nodeY[i]!;
    const h = compact ? 40 : i === 0 ? 78 : 56;
    const top = y - h / 2;
    return <g key={kind} opacity={past(i)}>
      <g {...enter(frame, stepAt[i]!, { from: "right", distance: 18 })}>
        <Box x={cardX} y={top} w={cardW} h={h} tone={tone} radius={12} focus={current === i ? ease(frame, stepAt[i]!, stepAt[i]! + 12) * .8 : 0}>
          <Text x={cardX + 16} y={compact ? y - 8 : top + 18} size={11} font="mono" weight={600} tone={tone} caps>{kind}</Text>
          <Text x={cardX + 16} y={compact ? y + 9 : top + (i === 0 ? 40 : 38)} size={compact ? 13.5 : 15.5} weight={600}>{text}</Text>
          {extra}
        </Box>
      </g>
    </g>;
  };

  return <g>
    {/* The page. */}
    <g {...enter(frame, 0)}>
      <Box x={doc.x} y={doc.y} w={doc.w} h={doc.h} tone={inReview ? "hot" : published ? "ok" : "line"} radius={16} focus={reviewWash * (1 - ease(frame, T.land + 30, T.land + 60)) + (published ? publishFlip * (1 - ease(frame, T.published + 24, T.published + 60)) : 0)} fill={published ? .6 * (1 - ease(frame, T.published + 6, T.published + 40)) : 0}>
        <Text x={doc.x + 18} y={doc.y + 24} size={11} font="mono" weight={600} tone="muted" caps>{c.kind}</Text>
        <g transform={`translate(${statusX} ${doc.y + 24}) scale(${statusScale}) translate(${-statusX} ${-(doc.y + 24)})`}>
          <Tag x={statusX} y={doc.y + 24} anchor="end" text={statusText} tone={statusTone} size={12} />
        </g>
        <Text x={doc.x + 18} y={doc.y + (compact ? 46 : 50)} size={compact ? 12.5 : 13} font="mono" weight={600} tone={published ? "ok" : inReview ? "hot" : "muted"}>
          {published ? c.verified[1] : inReview ? c.notAuthority : c.verified[0]}
        </Text>
        <line x1={doc.x + 16} x2={doc.x + doc.w - 16} y1={rowTop - rowH / 2 - 6} y2={rowTop - rowH / 2 - 6} stroke="var(--scene-hairline)" strokeWidth={1} />
        {c.fields.map((field, i) => {
          const y = rowY(i);
          const isTrigger = i === 3;
          const lit = isTrigger ? triggerLit : 0;
          const evidenceOk = i === 2 && published;
          const tone: Tone = i === 0 && inReview ? "hot" : lit > .5 ? "hot" : evidenceOk ? "ok" : "ink";
          return <g key={field} {...enter(frame, stagger(i, T.fields, 4), { distance: 8 })}>
            {i > 0 ? <line x1={doc.x + 18} x2={doc.x + doc.w - 18} y1={y - rowH / 2} y2={y - rowH / 2} stroke="var(--scene-hairline)" strokeOpacity={.5} strokeWidth={1} /> : null}
            <rect x={doc.x + 10} y={y - rowH / 2 + 2} width={doc.w - 20} height={rowH - 4} rx={8} style={{ fill: tint("hot", 16 * lit) }} />
            <rect x={doc.x + 10} y={y - rowH / 2 + 2} width={3} height={rowH - 4} rx={1.5} fill={TONE.hot} opacity={lit} />
            <Text x={doc.x + 20} y={y} size={11} font="mono" weight={600} tone="muted" caps>{field}</Text>
            <Text x={valueX} y={y} size={compact ? 13.5 : 15} weight={600} tone={tone}>{values[i]}{evidenceOk ? " ✓" : ""}</Text>
          </g>;
        })}
      </Box>
      {frame >= T.land && frame < T.land + 40 ? <Pulse x={doc.x + 12} y={triggerY} frame={frame} at={T.land} period={40} r={10} tone="hot" /> : null}
    </g>

    {/* The rail: one direction, top to bottom. */}
    <g opacity={easeOut(frame, T.pr, T.pr + 20)}>
      <line x1={railX} x2={railX} y1={nodeY[0]} y2={nodeY[3]} stroke="var(--scene-hairline)" strokeWidth={1} />
      <line x1={railX} x2={railX} y1={nodeY[0]} y2={railFill} stroke={TONE.line} strokeWidth={1.5} strokeOpacity={.7} />
      {nodeY.map((y, i) => {
        const reached = frame >= stepAt[i]!;
        const tone: Tone = i === 3 ? "ok" : i === 2 ? "hot" : "line";
        return <g key={y}>
          <circle cx={railX} cy={y} r={5} style={{ fill: reached ? TONE[tone] : "var(--scene-card)" }} stroke={reached ? TONE[tone] : "var(--scene-hairline)"} strokeWidth={1} />
          {reached && frame < stepAt[i]! + 36 ? <Pulse x={railX} y={y} frame={frame} at={stepAt[i]} period={36} r={6} tone={tone} /> : null}
        </g>;
      })}
    </g>
    {[0, 1, 2].map((i) => <Comet key={i} points={[[railX, nodeY[i]!], [railX, nodeY[i + 1]!]]} t={hop(i)} tone="line" r={4.5} tail={.3} />)}

    {step(0, c.pr, "hot", <>
      {!compact ? <>
        <Text x={cardX + 16} y={nodeY[0]! + 23} size={12.5} font="mono" weight={500} tone="muted">{c.affected}</Text>
        <Tag x={cardX + 16 + (c.affected.length + 1) * 7.5} y={nodeY[0]! + 23} anchor="start" text={c.doc} tone="hot" size={11.5} />
      </> : <Tag x={cardX + cardW - 16} y={nodeY[0]!} anchor="end" text={c.doc} tone="hot" size={11.5} />}
    </>)}
    {compact ? step(1, c.ai, "line", <g opacity={easeOut(frame, T.ai + 14, T.ai + 26)}>
      <Text x={cardX + cardW - 56} y={nodeY[1]!} size={13} font="mono" weight={700} tone="danger" anchor="end">−1</Text>
      <Text x={cardX + cardW - 16} y={nodeY[1]!} size={13} font="mono" weight={700} tone="ok" anchor="end">+1</Text>
    </g>) : <g opacity={past(1, .8)}>
      <g {...enter(frame, T.ai, { from: "right", distance: 18 })}>
        <CodeBlock
          x={cardX} y={nodeY[1]! - 44} w={cardW} frame={frame} title={c.diffTitle} size={13.5}
          lines={[
            { text: c.diff[0], tone: "danger", appearAt: T.ai + 12 },
            { text: c.diff[1], tone: "ok", appearAt: T.ai + 30 },
          ]}
        />
      </g>
    </g>}
    {step(2, c.owner, "hot", <Checkpoint x={cardX + cardW - 26} y={nodeY[2]!} r={compact ? 11 : 13} state={frame >= T.approved ? "pass" : "pending"} />)}
    {step(3, c.published, "ok")}

    {/* The affected-docs entry in flight. */}
    {chipOn ? <g opacity={easeOut(frame, T.launch - 8, T.launch) * (1 - ease(frame, T.land, T.land + 10))}>
      <g transform={`translate(${chipX} ${chipY}) scale(${1 + .08 * Math.sin(Math.PI * chipT)})`}>
        <rect className="scene-card" x={-38} y={-13} width={76} height={26} rx={13} style={{ fill: "var(--scene-card)" }} />
        <rect className="scene-glow" x={-38} y={-13} width={76} height={26} rx={13} style={{ fill: tint("hot", 22), color: TONE.hot }} stroke={TONE.hot} strokeOpacity={.6} />
        <Text x={0} y={.5} size={12} font="mono" weight={600} tone="hot" anchor="middle">{c.doc}</Text>
      </g>
    </g> : null}
    <Comet points={backPath} t={backT} tone="ok" r={5} tail={.18} />
  </g>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 30,
  title: { en: "Review where reality changed", fr: "Réviser là où la réalité a bougé" },
  caption: {
    en: "A document becomes trustworthy when the event that can make it wrong also triggers its review.",
    fr: "Un document devient fiable lorsque l’événement qui peut le rendre faux déclenche aussi sa revue.",
  },
  beats: [
    { at: 0, text: { en: "The runbook now answers six questions: status, owner, evidence, trigger, expiry, successor.", fr: "Le runbook répond à six questions : statut, responsable, preuve, déclencheur, expiration, successeur." } },
    { at: T.pr, text: { en: "A pull request changes a contract and lists the documents it affects.", fr: "Une pull request modifie un contrat et liste les documents concernés." } },
    { at: T.land, text: { en: "It matches the page’s trigger: the page goes into review and stops claiming authority.", fr: "Elle correspond au déclencheur de la page : la page passe en revue et cesse de faire autorité." } },
    { at: T.ai, text: { en: "AI finds the affected page and prepares a diff.", fr: "L’IA retrouve la page concernée et prépare un diff." } },
    { at: T.owner, text: { en: "The owner checks the meaning before publishing.", fr: "Le responsable vérifie le sens avant publication." } },
    { at: T.published, text: { en: "Published while the evidence is still at hand: active again, and last verified, not just last updated.", fr: "Publié pendant que les preuves sont disponibles : de nouveau actif, et vérifié, pas seulement mis à jour." } },
  ],
  Stage,
});
