import { Box, Comet, ease, easeOut, enter, lerp, pop, Tag, Text, TONE } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Act 1 accelerates the interruptions. Act 2 follows one draft through review.
// Counts describe the article's roles, not measured productivity.
const ROLES = [
  { en: "Engineer", fr: "Ingénieur", task: { en: "Fix the bug", fr: "Corriger le bug" }, mark: "</>" },
  { en: "Marketing", fr: "Marketing", task: { en: "Draft the release", fr: "Rédiger l'annonce" }, mark: "↗" },
  { en: "PM", fr: "PM", task: { en: "Plan the milestone", fr: "Préparer le jalon" }, mark: "→" },
  { en: "Data analyst", fr: "Data analyst", task: { en: "Query the warehouse", fr: "Interroger le warehouse" }, mark: "Σ" },
  { en: "Community", fr: "Communauté", task: { en: "Answer feedback", fr: "Répondre aux retours" }, mark: "…" },
  { en: "Designer", fr: "Designer", task: { en: "Move the button", fr: "Déplacer le bouton" }, mark: "↔" },
  { en: "Tech writer", fr: "Docs", task: { en: "Update the README", fr: "Mettre à jour le README" }, mark: "¶" },
  { en: "Video editor", fr: "Vidéo", task: { en: "Cut the demo", fr: "Monter la démo" }, mark: "▷" },
] as const;
const ARRIVALS = [12, 54, 90, 120, 146, 168, 186, 202] as const;
const T = { pause: 250, select: 290, review: 340, check: 400, publish: 446, end: 540 } as const;

function Stage({ frame, compact, locale }: SceneStageProps) {
  const fr = locale === "fr";
  const L = compact
    ? { cardW: 116, cardH: 60, stepX: 128, stepY: 72, cols: 4, gridX: 20, gridY: 62,
      terminalX: 20, terminalY: 230, terminalW: 244, terminalH: 198,
      reviewX: 286, reviewY: 230, reviewW: 234, reviewH: 198, bottomY: 477 }
    : { cardW: 156, cardH: 60, stepX: 172, stepY: 72, cols: 2, gridX: 40, gridY: 72,
      terminalX: 402, terminalY: 116, terminalW: 228, terminalH: 194,
      reviewX: 672, reviewY: 116, reviewW: 248, reviewH: 194, bottomY: 377 };
  const arrived = ARRIVALS.filter(at => frame >= at).length;
  const activeIndex = Math.max(0, arrived - 1);
  const paused = frame >= T.pause;
  const selected = frame >= T.select;
  const checked = frame >= T.check;
  const published = frame >= T.publish;
  const role = ROLES[selected ? 1 : activeIndex]!;
  const tx = L.terminalX;
  const ty = L.terminalY;
  const cx = tx + L.terminalW / 2;
  const cy = ty + L.terminalH / 2;
  const terminalTone = selected ? "hot" : "line";
  const taskText = role.task[locale];
  const taskAt = selected ? T.select : ARRIVALS[activeIndex]!;
  const typed = Math.floor(taskText.length * easeOut(frame, taskAt + 5, taskAt + 30));
  const attention = ease(frame, T.pause, T.pause + 18);

  return <>
    {/* Task cards fly out of the same terminal, then hold as unfinished work. */}
    {ROLES.map((item, index) => {
      const x = L.gridX + (index % L.cols) * L.stepX;
      const y = L.gridY + Math.floor(index / L.cols) * L.stepY;
      const travel = easeOut(frame, ARRIVALS[index]!, ARRIVALS[index]! + 23);
      const focus = selected ? index === 1 : !paused && index === activeIndex;
      const settling = selected && index !== 1 ? .6 : 1;
      return <g key={item.en} opacity={travel * settling}
        transform={`translate(${lerp(cx - x - L.cardW / 2, 0, travel)} ${lerp(cy - y - L.cardH / 2, 0, travel)})`}>
        <Box x={x} y={y} w={L.cardW} h={L.cardH} tone={focus ? terminalTone : "muted"} focus={focus ? 1 : 0} radius={12}>
          <Text x={x + 12} y={y + 20} size={15} weight={650}>{item[locale]}</Text>
          <Text x={x + 12} y={y + 43} size={13} font="mono" tone={focus ? terminalTone : "muted"}>
            {focus ? (published ? (fr ? "✓ publiée" : "✓ published") : selected ? (fr ? "en relecture" : "in review") : item.mark) : (fr ? "en attente" : "pending")}
          </Text>
          {!compact && focus ? <Text x={x + L.cardW - 14} y={y + 22} anchor="end" size={18} tone={terminalTone}>{item.mark}</Text> : null}
        </Box>
      </g>;
    })}

    {/* Each interruption visibly pulls the same attention token to a new card. */}
    {!paused ? ROLES.map((item, index) => {
      const x = L.gridX + (index % L.cols) * L.stepX + L.cardW / 2;
      const y = L.gridY + Math.floor(index / L.cols) * L.stepY + L.cardH / 2;
      return <Comet key={item.en} points={[[cx, cy], [x, y]]}
        t={ease(frame, ARRIVALS[index]!, ARRIVALS[index]! + 22)} tone="line" tail={.32} r={5} />;
    }) : null}

    <g>
      <Box x={tx} y={ty} w={L.terminalW} h={L.terminalH} tone={terminalTone} focus={1} radius={18}>
        <Text x={tx + 18} y={ty + 23} size={13} font="mono" tone="muted">terminal</Text>
        <Tag x={tx + L.terminalW - 14} y={ty + 23} anchor="end" size={13}
          text={checked ? (fr ? "VÉRIFIÉ" : "CHECKED") : selected ? (fr ? "RELECTURE" : "REVIEW") : "AUTO"} tone={terminalTone} />
        <line x1={tx + 14} x2={tx + L.terminalW - 14} y1={ty + 44} y2={ty + 44} stroke="var(--scene-hairline)" />
        <Text x={tx + 18} y={ty + 73} size={23} weight={700} tone={terminalTone}>{role[locale]}</Text>
        <Text x={tx + 18} y={ty + 110} size={13.5} font="mono" weight={500}>
          {taskText.slice(0, typed)}{Math.floor(frame / 12) % 2 === 0 ? "▌" : ""}
        </Text>
        <Text x={tx + 18} y={ty + 151} size={13} font="mono" tone="muted">
          {selected ? (fr ? "Vérifier avant d'envoyer" : "Check before sending") : (fr ? "Encore une tâche…" : "One more task…")}
        </Text>
        <rect x={tx + 18} y={ty + L.terminalH - 20} width={L.terminalW - 36} height={3} rx={1.5} fill="var(--scene-hairline)" />
        <rect x={tx + 18} y={ty + L.terminalH - 20}
          width={(L.terminalW - 36) * (selected ? ease(frame, T.select, T.check) : ease(frame, taskAt, taskAt + 36))}
          height={3} rx={1.5} fill={TONE[terminalTone]} />
      </Box>
    </g>

    <g {...enter(frame, 18)}>
      <Box x={L.reviewX} y={L.reviewY} w={L.reviewW} h={L.reviewH} tone={checked ? "ok" : "muted"}
        focus={checked ? 1 : 0} radius={18}>
        <Text x={L.reviewX + 18} y={L.reviewY + 25} size={13} font="mono" tone="muted">
          {fr ? "AVANT PUBLICATION" : "BEFORE PUBLISHING"}
        </Text>
        {frame < T.review ? <>
          <Text x={L.reviewX + L.reviewW / 2} y={L.reviewY + 84} size={62} anchor="middle" weight={700}
            tone={paused ? "hot" : "muted"}>{arrived}</Text>
          <Text x={L.reviewX + L.reviewW / 2} y={L.reviewY + 134} size={17} anchor="middle">
            {fr ? "tâches ouvertes" : "open tasks"}
          </Text>
          <Text x={L.reviewX + L.reviewW / 2} y={L.reviewY + 164} size={14} anchor="middle" tone="muted">
            {fr ? "Aucune vérification" : "Nothing checked yet"}
          </Text>
        </> : <g {...enter(frame, T.review, { distance: 12 })}>
          <Text x={L.reviewX + 18} y={L.reviewY + 67} size={21} weight={700}>{fr ? "L'annonce" : "The announcement"}</Text>
          <Text x={L.reviewX + 18} y={L.reviewY + 105} size={15} tone={checked ? "ok" : "hot"}>
            {checked ? "✓" : "□"} {fr ? "Promesses vérifiées" : "Claims checked"}
          </Text>
          <Text x={L.reviewX + 18} y={L.reviewY + 133} size={15} tone={checked ? "ok" : "hot"}>
            {checked ? "✓" : "□"} {fr ? "Fonctionnalité utilisable" : "Feature available"}
          </Text>
          <Tag x={L.reviewX + 18} y={L.reviewY + 171} size={14} anchor="start"
            text={published ? (fr ? "✓ PUBLIÉE" : "✓ PUBLISHED") : (fr ? "EN RELECTURE" : "IN REVIEW")}
            tone={published ? "ok" : "hot"} appear={published ? pop(frame, T.publish) : 1} />
        </g>}
      </Box>
    </g>

    {/* A draft must actually travel through review before it can be published. */}
    {frame >= T.select && frame < T.review ? <Comet
      points={[[L.gridX + L.stepX + L.cardW / 2, L.gridY + L.cardH / 2], [cx, cy], [L.reviewX + 22, L.reviewY + 67]]}
      t={ease(frame, T.select, T.review)} tone="hot" r={7} tail={.24} /> : null}

    <g {...enter(frame, 16)}>
      <Text x={compact ? 270 : 480} y={L.bottomY - 7} size={compact ? 29 : 33} anchor="middle" weight={750}
        tone={paused ? "hot" : "ink"}>
        {fr ? "8 casquettes. 1 attention." : "8 hats. 1 attention span."}
      </Text>
      <g opacity={attention}>
        <Text x={compact ? 270 : 480} y={L.bottomY + 25} size={compact ? 17 : 19} anchor="middle" tone={published ? "ok" : "hot"}>
          {published ? (fr ? "Ingénieur consciencieux, quand même." : "Still a conscientious engineer.")
            : (fr ? "Un brouillon ≠ un travail terminé." : "A draft ≠ a finished task.")}
        </Text>
      </g>
    </g>
  </>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: 478,
  title: { en: "The terminal can multitask. I can't.", fr: "Le terminal est multitâche. Pas moi." },
  caption: {
    en: "Eight roles, one attention span. The agent prepares the work; I still check what I send.",
    fr: "Huit casquettes, une seule attention. L'agent prépare le travail ; je vérifie toujours ce que j'envoie.",
  },
  beats: [
    { at: 0, text: { en: "First, fix the bug. Familiar territory.", fr: "D'abord, corriger le bug. Terrain connu." } },
    { at: 90, text: { en: "An announcement, a milestone, warehouse numbers: the requests speed up.", fr: "Une annonce, un jalon, les chiffres du warehouse : les demandes accélèrent." } },
    { at: 186, text: { en: "Now the README and the demo too. Each switch interrupts the previous task.", fr: "Le README et la démo aussi. Chaque changement interrompt la tâche précédente." } },
    { at: T.pause, text: { en: "Eight roles share one terminal. The unfinished work is still there.", fr: "Huit rôles partagent un terminal. Le travail inachevé est toujours là." } },
    { at: T.select, text: { en: "Follow one announcement through review: check its claims against the available feature.", fr: "Relire une annonce : confronter ses promesses à la fonctionnalité disponible." } },
    { at: T.publish, text: { en: "Publish after checking. The other tasks wait their turn.", fr: "Publier après vérification. Les autres tâches attendent leur tour." } },
  ],
  Stage,
});
