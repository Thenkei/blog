import { Box, ease, easeOut, enter, Flight, lerp, pop, Pulse, stagger, Tag, Text, tint, Wire } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Timeline (30 fps). Act 1: every screen carries its own truth, then a copy
// drifts. Act 2: the rules leave the screens for one engine, screens go thin.
const T = {
  screens: 6,
  sections: 26,
  diffs: 66,
  copy: 118,
  drift: 168,
  merge: 228,
  engine: 244,
  flights: 250,
  landed: 290,
  wires: 300,
  verdict: 336,
  end: 456,
} as const;

type Row = "query" | "access" | "table";
const ROWS: readonly Row[] = ["query", "access", "table"];

type Spec = Record<Row, { en: string; fr: string }>;

// Illustrative: the same notion ("active contract", who sees client assets,
// how a table behaves) redefined per screen, as in the article.
const SCREENS: readonly Spec[] = [
  { query: { en: "closed_at IS NULL", fr: "closed_at IS NULL" }, access: { en: "ops only", fr: "ops uniquement" }, table: { en: "sort · filter · link", fr: "tri · filtre · lien" } },
  { query: { en: "status = 'active'", fr: "status = 'active'" }, access: { en: "no rule", fr: "aucune règle" }, table: { en: "sort · search", fr: "tri · recherche" } },
  { query: { en: "effective_at < now()", fr: "effective_at < now()" }, access: { en: "one team", fr: "une équipe" }, table: { en: "filter · search", fr: "filtre · recherche" } },
];
const DRIFTED: Spec = { query: { en: "closed_at > now()", fr: "closed_at > now()" }, access: { en: "admins only", fr: "admins uniquement" }, table: { en: "sort · filter", fr: "tri · filtre" } };

const ROW_LABEL: Record<Row, { en: string; fr: string }> = {
  query: { en: "active contracts", fr: "contrats actifs" },
  access: { en: "client assets", fr: "patrimoine client" },
  table: { en: "table", fr: "tableau" },
};

const ENGINE_LINES = {
  en: ["status = 'active' → closed_at IS NULL", "client assets → masked unless ops", "every read and write → audit"],
  fr: ["status = 'active' → closed_at IS NULL", "patrimoine → masqué hors ops", "chaque lecture et écriture → audit"],
} as const;

function Stage({ frame, compact, locale }: SceneStageProps) {
  const fr = locale === "fr";
  const lang = fr ? "fr" : "en";
  const merge = ease(frame, T.merge, T.merge + 30);
  const body = 1 - ease(frame, T.merge, T.merge + 14);
  const drifted = frame >= T.drift;

  // Card geometry: act 1 (full cards) → act 2 (thin declarations).
  // Compact re-flows from a 2×2 grid to one row, so every wire drops straight down.
  const W = compact ? lerp(240, 116, merge) : 205;
  const H1 = compact ? 170 : 232;
  const H2 = compact ? 48 : 62;
  const h = lerp(H1, H2, merge);
  const cardX = (i: number) => compact ? lerp(20 + (i % 2) * 260, 20 + i * 128, merge) : 40 + i * (W + 20);
  const cardY = (i: number) => compact ? lerp(i < 2 ? 56 : 236, 56, merge) : 64;
  const rowAt = compact
    ? { title: 18, label: [50, 94, 138], value: [68, 112, 156] }
    : { title: 22, label: [62, 120, 178], value: [84, 142, 200] };

  const specOf = (i: number): Spec => i < 3 ? SCREENS[i]! : drifted ? DRIFTED : SCREENS[0]!;
  const title = (i: number) => i < 3 || (compact && merge > .5)
    ? `${fr ? "Écran" : "Screen"} ${"ABCD"[i]}`
    : fr ? "Écran D · copie de A" : "Screen D · copy of A";

  // Disagreement per row, then the copy's own drift.
  const diff = ROWS.map((_, r) => ease(frame, T.diffs + r * 8, T.diffs + r * 8 + 14));
  const drift = ease(frame, T.drift, T.drift + 14);
  // The copy's values blink as they mutate, so the change reads as an event.
  const glitch = frame >= T.drift - 6 && frame < T.drift + 8 ? .35 : 1;

  const eng = compact ? { x: 20, y: 190, w: 500, h: 170 } : { x: 250, y: 190, w: 460, h: 160 };
  const lineY = (k: number) => eng.y + (compact ? 68 : 64) + k * (compact ? 34 : 32);
  const count = drifted ? 4 : 3;
  const countPop = drifted ? pop(frame, T.drift) : 1;

  // Which neighbour pairs to compare: all adjacent screens wide, row pairs compact.
  const pairs: ReadonlyArray<readonly [number, number]> = compact ? [[0, 1], [2, 3]] : [[0, 1], [1, 2], [2, 3]];

  return <g>
    {[0, 1, 2, 3].map((i) => {
      const x = cardX(i);
      const y = cardY(i);
      const isCopy = i === 3;
      const inAt = isCopy ? T.copy : stagger(i, T.screens, 8);
      const spec = specOf(i);
      const props = enter(frame, inAt, isCopy ? { from: "right", distance: 60, dur: 24 } : { distance: 22 });
      return <g key={i} {...props}>
        <Box x={x} y={y} w={W} h={h} tone={merge > .5 ? "ok" : isCopy ? "danger" : "line"} variant={isCopy && merge < .5 ? "ghost" : "card"} radius={14} focus={isCopy ? drift * body * .6 : 0}>
          {isCopy && merge < .5 ? <rect x={x + .5} y={y + .5} width={W - 1} height={h - 1} rx={13.5} fill="none" stroke="var(--visual-danger)" strokeOpacity={.7} strokeWidth={1.25} strokeDasharray="6 5" /> : null}
          <Text x={x + 14} y={y + lerp(rowAt.title, compact ? 15 : 20, merge)} size={compact ? 13.5 : 14} weight={600} tone={isCopy && merge < .5 ? "danger" : "ink"}>{title(i)}</Text>
          {body > 0 ? <g opacity={body}>
            <line x1={x + 12} x2={x + W - 12} y1={y + rowAt.title + 16} y2={y + rowAt.title + 16} stroke="var(--scene-hairline)" strokeWidth={1} />
            {ROWS.map((row, r) => {
              const at = stagger(r, T.sections, 10) + (isCopy ? T.copy - T.screens + 8 : i * 4);
              const wash = isCopy ? drift : diff[r]!;
              return <g key={row} {...enter(frame, at, { dur: 14, distance: 8 })}>
                <rect x={x + 8} y={y + rowAt.label[r]! - 11} width={W - 16} height={rowAt.value[r]! - rowAt.label[r]! + 24} rx={8} style={{ fill: tint("danger", 9 * wash) }} />
                <Text x={x + 14} y={y + rowAt.label[r]!} size={11} font="mono" weight={600} tone="muted" caps>{ROW_LABEL[row][lang]}</Text>
                <Text x={x + 14} y={y + rowAt.value[r]!} size={13} font="mono" weight={500} tone={isCopy && drifted ? "danger" : "ink"} opacity={isCopy ? glitch : 1}>{spec[row][lang]}</Text>
              </g>;
            })}
          </g> : null}
          {merge > .5 ? <Tag
            x={x + (compact ? 10 : 14)} y={y + (compact ? 34 : 44)} anchor="start" size={11}
            text={compact ? (fr ? "✓ hérite" : "✓ inherits") : fr ? "✓ hérite du moteur" : "✓ inherits the engine"} tone="ok"
            appear={pop(frame, stagger(i, T.verdict - 18, 5))}
          /> : null}
        </Box>
      </g>;
    })}

    {/* ≠ between neighbours on every row that disagrees; the copy's gap lights up once it drifts. */}
    {body > 0 ? pairs.map(([a, b]) => ROWS.map((row, r) => {
      const shown = (b === 3 ? drift : diff[r]!) * body;
      if (shown <= 0) return null;
      const x = cardX(a) + W + 10;
      const y = cardY(a) + rowAt.value[r]!;
      return <Tag key={`${a}-${b}-${row}`} x={x} y={y} text="≠" tone="danger" size={13} appear={shown} />;
    })) : null}

    {/* The count of versions: 3, then 4 once the copy drifts. */}
    {body > 0 ? <g {...enter(frame, T.diffs + 30, { opacity: body })}>
      {compact
        ? <Text x={20} y={440} size={15} font="display" weight={600} tone={drifted ? "danger" : "ink"}>
          {fr ? `${count} définitions de « actif » · ${count} règles d’accès` : `${count} definitions of “active” · ${count} access rules`}
        </Text>
        : (fr
          ? ["définitions de « contrat actif »", "règles d’accès au patrimoine", "comportements de tableau"]
          : ["definitions of “active contract”", "access rules for client assets", "table behaviours"]
        ).map((label, k) => <g key={label}>
          <g transform={`translate(${56 + k * 300} 346) scale(${.7 + .3 * countPop})`}>
            <Text x={0} y={0} size={34} font="display" weight={600} anchor="middle" tone={drifted ? "danger" : "ink"}>{String(count)}</Text>
          </g>
          <Text x={84 + k * 300} y={346} size={15} font="display" weight={500} tone="muted">{label}</Text>
        </g>)}
      {drifted ? <Pulse x={compact ? 30 : 56} y={compact ? 440 : 346} frame={frame} at={T.drift} period={30} r={14} tone="danger" once /> : null}
    </g> : null}

    {/* Act 2: the engine and the one definition. */}
    <g {...enter(frame, T.engine, { distance: 18, dur: 22 })}>
      <Box x={eng.x} y={eng.y} w={eng.w} h={eng.h} tone="hot" radius={18} focus={ease(frame, T.landed, T.landed + 12) * (1 - ease(frame, T.verdict + 20, T.verdict + 50))}>
        <Text x={eng.x + 20} y={eng.y + 26} size={11} font="mono" weight={600} tone="hot" caps>{fr ? "moteur · une seule définition" : "engine · one definition"}</Text>
        {ENGINE_LINES[lang].map((line, k) => {
          const at = T.landed + k * 14;
          return <g key={line} {...enter(frame, at, { dur: 14, distance: 8 })}>
            <rect x={eng.x + 12} y={lineY(k) - 14} width={eng.w - 24} height={28} rx={8} style={{ fill: tint("ok", 10 * easeOut(frame, at, at + 20)) }} />
            <Text x={eng.x + 24} y={lineY(k)} size={compact ? 13.5 : 14} font="mono" weight={500}>{line}</Text>
            <Text x={eng.x + eng.w - 24} y={lineY(k)} size={14} font="mono" weight={700} anchor="end" tone="ok">✓</Text>
          </g>;
        })}
      </Box>
    </g>

    {/* The four query definitions fly into the engine and collapse into one line. */}
    {[0, 1, 2, 3].map((i) => {
      const start = T.flights + i * 6;
      const t = (frame - start) / 34;
      const from: [number, number] = [cardX(i) + W / 2, (compact ? (i < 2 ? 56 : 236) : 64) + rowAt.value[0]!];
      return <Flight key={i} from={from} to={[eng.x + eng.w / 2, lineY(0)]} bend={compact ? [i % 2 ? 60 : -60, -20] : [0, -40]} t={t} label={specOf(i).query[lang]} tone="danger" />;
    })}

    {/* Thin screens now read from the engine. */}
    {[0, 1, 2, 3].map((i) => {
      const x = cardX(i) + W / 2;
      const y = cardY(i) + H2;
      const tx = eng.x + eng.w * (.2 + i * .2);
      return <Wire key={i} d={`M${x} ${y}C${x} ${y + 36} ${tx} ${eng.y - 36} ${tx} ${eng.y}`} draw={ease(frame, stagger(i, T.wires, 4), stagger(i, T.wires, 4) + 22)} tone="ok" width={1.5} flow={frame} />;
    })}

    {([[0, 1], [1, 2], [2, 3]] as const).map(([a]) => <Tag key={`eq-${a}`} x={cardX(a) + W + (compact ? 6 : 10)} y={cardY(a) + H2 / 2} text="≡" tone="ok" size={13} appear={merge > .9 ? pop(frame, T.verdict) : 0} />)}

    <Tag
      x={compact ? 270 : 480} y={compact ? 398 : 384}
      text={fr ? "1 définition · chaque écran en hérite" : "1 definition · every screen inherits it"}
      tone="ok" size={14} appear={pop(frame, T.verdict + 6)}
    />
  </g>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.verdict + 40,
  title: { en: "Move the truth out of the screens", fr: "Sortir la vérité des écrans" },
  caption: {
    en: "When every screen redefines the rules, each copy adds a version that drifts. An engine that owns the definitions turns screens into thin declarations that inherit them.",
    fr: "Quand chaque écran redéfinit les règles, chaque copie ajoute une version qui dérive. Un moteur qui porte les définitions transforme les écrans en déclarations fines qui en héritent.",
  },
  beats: [
    { at: 0, text: { en: "Three screens need the same notions: active contracts, who sees client assets, how tables behave.", fr: "Trois écrans utilisent les mêmes notions : contrats actifs, accès au patrimoine, comportement des tableaux." } },
    { at: T.diffs, text: { en: "Each screen wrote its own version. They disagree on all three, and nobody notices.", fr: "Chaque écran a écrit sa propre version. Elles divergent sur les trois points, sans que personne le voie." } },
    { at: T.copy, text: { en: "A new process starts as a copy of screen A. It drifts on day one: four versions now.", fr: "Un nouveau processus part d’une copie de l’écran A. Elle dérive dès le premier jour : quatre versions." } },
    { at: T.merge, text: { en: "Move the rules out of the screens and into one engine, declared once.", fr: "Sortir les règles des écrans pour les déclarer une seule fois, dans un moteur." } },
    { at: T.verdict, text: { en: "Screens become thin declarations. Every one inherits the same rules, access and audit.", fr: "Les écrans deviennent des déclarations fines. Tous héritent des mêmes règles, droits et audit." } },
  ],
  Stage,
});
