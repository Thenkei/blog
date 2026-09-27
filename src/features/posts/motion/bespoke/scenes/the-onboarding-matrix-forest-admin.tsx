import { Box, Camera, CodeBlock, Comet, Counter, ease, easeOut, enter, lerp, pop, Pulse, stagger, Tag, Text, tint, TONE, type CodeLine } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";
import type { PostLocale } from "../../../content/types";

// Same request ("support MongoDB Atlas") under two designs.
// Act 1: the Ember if/else template grows with every combination.
// Act 2: a flow object goes through the step factory; the UI only renders.
const T = {
  template: 40,
  atlas: 134,
  hit: 156,
  weeks: 162,
  act2: 196,
  flow: 206,
  steps: 270,
  renderer: 316,
  stats: 432,
  end: 530,
} as const;

type L10n = Record<PostLocale, string>;
type Dimension = { label: L10n; lines: { prefix?: string; chips: string[] }[] };
const DIMENSIONS: readonly Dimension[] = [
  { label: { en: "architectures", fr: "architectures" }, lines: [{ chips: ["In-App", "Microservice (Forest CLI)"] }] },
  { label: { en: "languages / frameworks", fr: "langages / frameworks" }, lines: [{ chips: ["Express", "NestJS", "Rails", "Django", "Laravel", "Spring Boot"] }] },
  { label: { en: "ORM / databases", fr: "ORM / bases de données" }, lines: [{ prefix: "Sequelize", chips: ["PG", "MySQL", "MariaDB", "SQL Server"] }, { prefix: "Mongoose", chips: ["MongoDB"] }] },
  { label: { en: "environment", fr: "environnement" }, lines: [{ chips: ["Docker", "npm", "yarn"] }] },
];

const TEMPLATE_FULL = [
  "{{#if this.isInAppSequelize}}",
  "  <…::ExpressSequelizeWay />",
  "{{else if this.isInAppMongoose}}",
  "  <…::ExpressMongooseWay />",
  "{{else if this.isForestCLI}}",
  "  <…::ForestCliWay />",
  "{{else if this.isRails}}",
  "  <…::RailsWay />",
] as const;

const FLOW = [
  "const mongoAtlasFlow = {",
  "  ...mongoAtlasDefaultFlow,",
  "  architecture: \"microservice\",",
  "  agent: AgentsEnum.NodeJS,",
  "  steps: createForestCLIIntegrationSteps(",
  "    mongoAtlasDefaultCredentials, false,",
  "    mongoAtlasCredentialsValidator,",
  "    { host: { placeholder:",
  "      \"clustername.mongodb.net\" } }),",
  "};",
] as const;

const STEPS = [
  "createStepInstallCLI()",
  "createStepDatasourceCredentials(…)",
  "createStepGenerateYourApp(false)",
  "createStepStartYourServerMultiple(…)",
] as const;

const INSTALLS = [
  { key: "docker", command: "docker pull forestadmin/toolbelt", at: T.renderer + 16 },
  { key: "yarn", command: "yarn global add forest-cli@latest -s", at: T.renderer + 52 },
  { key: "npm", command: "npm install -g forest-cli@latest -s", at: T.renderer + 88 },
] as const;

const BRANCHES = [
  { count: 25, label: { en: "In-App", fr: "In-App" } },
  { count: 7, label: { en: "Microservice", fr: "Microservice" } },
  { count: 7, label: { en: "Cloud", fr: "Cloud" } },
] as const;

type Pt = readonly [number, number];
type Layout = {
  dims: { x: number; y: number; w: number; rowGap: number; lineGap: number };
  template: { x: number; y: number; w: number; size: number; lines: number; title: boolean };
  request: Pt;
  weeks: { x: number; y: number; anchor: "start" | "end" };
  flow: { x: number; y: number; w: number; size: number };
  flowFadeAt: number | null;
  steps: { x: number; y: number; w: number; h: number; gap: number };
  renderer: { x: number; y: number; w: number; h: number };
  stats: { x: number; y: number; w: number };
};

const WIDE_LAYOUT: Layout = {
  dims: { x: 40, y: 72, w: 420, rowGap: 56, lineGap: 26 },
  template: { x: 500, y: 64, w: 420, size: 14, lines: 8, title: true },
  request: [110, 368],
  weeks: { x: 920, y: 344, anchor: "end" },
  flow: { x: 40, y: 64, w: 432, size: 13 },
  flowFadeAt: null,
  steps: { x: 500, y: 92, w: 420, h: 34, gap: 8 },
  renderer: { x: 500, y: 270, w: 420, h: 122 },
  stats: { x: 40, y: 338, w: 432 },
};

const COMPACT_LAYOUT: Layout = {
  dims: { x: 20, y: 72, w: 500, rowGap: 46, lineGap: 23 },
  template: { x: 20, y: 290, w: 500, size: 12.5, lines: 6, title: false },
  request: [90, 486],
  weeks: { x: 520, y: 486, anchor: "end" },
  flow: { x: 20, y: 56, w: 500, size: 12.5 },
  flowFadeAt: T.renderer - 16,
  steps: { x: 20, y: 322, w: 500, h: 30, gap: 7 },
  renderer: { x: 20, y: 56, w: 500, h: 122 },
  stats: { x: 20, y: 206, w: 500 },
};

const chipW = (text: string, size: number) => text.length * size * .6 + size * 1.5;

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const L = compact ? COMPACT_LAYOUT : WIDE_LAYOUT;
  const act1 = 1 - ease(frame, T.act2 - 16, T.act2);
  const act2 = easeOut(frame, T.act2, T.act2 + 16);

  // ── Act 1: the matrix ─────────────────────────────────────────────────────
  const D = L.dims;
  const rowTops = DIMENSIONS.map((_, i) => D.y + DIMENSIONS.slice(0, i).reduce((sum, d) => sum + D.rowGap + (d.lines.length - 1) * D.lineGap, 0));
  const chipSize = 11;
  const dimRows = DIMENSIONS.map((dim, i) => {
    const y = rowTops[i]!;
    const rowAt = stagger(i, 6, 10);
    return <g key={i} {...enter(frame, rowAt, { from: "left", distance: 10 })}>
      {i > 0 ? <Text x={D.x} y={y - 12} size={15} weight={700} font="mono" tone="hot">×</Text> : null}
      <Text x={D.x + 22} y={y} size={11} weight={600} font="mono" tone="muted" caps>{dim.label[locale]}</Text>
      {dim.lines.map((line, j) => {
        const prefixW = line.prefix ? line.prefix.length * 7.2 + 10 : 0;
        const offsets = line.chips.map((_, k) => line.chips.slice(0, k).reduce((sum, chip) => sum + chipW(chip, chipSize) + 6, 0));
        const ly = y + 22 + j * D.lineGap;
        return <g key={j}>
          {line.prefix ? <Text x={D.x + 22} y={ly} size={12} weight={500} font="mono" tone="muted">{line.prefix}</Text> : null}
          {line.chips.map((chip, k) => <Tag
            key={chip} x={D.x + 22 + prefixW + offsets[k]!} y={ly} anchor="start" text={chip} tone="line" size={chipSize}
            appear={pop(frame, rowAt + 6 + (j * 4 + k) * 3)}
          />)}
        </g>;
      })}
    </g>;
  });

  const templateLines: CodeLine[] = [
    ...TEMPLATE_FULL.slice(0, L.template.lines).map((text, i) => ({ text, appearAt: T.template + i * 10 })),
    {
      text: fr ? "{{!-- ... Et ainsi de suite, pour toujours --}}" : "{{!-- ... And it went on forever --}}",
      tone: frame >= T.hit ? "danger" as const : undefined,
      appearAt: T.template + L.template.lines * 10,
    },
  ];
  const TL = L.template;
  const tLineH = TL.size * 1.6;
  const tTop = TL.title ? 34 : 14;
  const forever: Pt = [TL.x + 20, TL.y + tTop + L.template.lines * tLineH + tLineH / 2 + 2];

  // The request physically flies into the template, which has to be ripped open.
  const reqFly = ease(frame, T.atlas + 8, T.hit);
  const reqCtrl: Pt = compact ? [L.request[0] + 40, forever[1] - 30] : [lerp(L.request[0], forever[0], .6), L.request[1] + 10];
  const bez = (p0: Pt, p1: Pt, p2: Pt, t: number): [number, number] => [
    (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
    (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
  ];
  const [reqX, reqY] = bez(L.request, reqCtrl, [forever[0] + 60, forever[1]], reqFly);
  const reqOpacity = pop(frame, T.atlas) * (1 - ease(frame, T.hit - 4, T.hit + 4));
  const shake = frame >= T.hit && frame < T.hit + 14 ? Math.sin((frame - T.hit) * 2.2) * 3 * (1 - (frame - T.hit) / 14) : 0;

  // ── Act 2: the flow factory ───────────────────────────────────────────────
  const flowLines: CodeLine[] = FLOW.map((text, i) => ({ text, appearAt: T.flow + i * 5, tone: i === 4 && frame >= T.steps - 10 ? "hot" as const : undefined }));
  const FL = L.flow;
  const fLineH = FL.size * 1.6;
  const fTop = compact ? 14 : 34;
  const stepsLine: Pt = [FL.x + 16 + FLOW[4].length * FL.size * .6 + 6, FL.y + fTop + 4 * fLineH + fLineH / 2 + 2];
  const S = L.steps;
  const factoryIn: Pt = compact ? [S.x + 40, S.y - 4] : [S.x - 6, S.y - 14];
  const factoryPath: Pt[] = compact
    ? [stepsLine, [stepsLine[0], lerp(stepsLine[1], factoryIn[1], .5)], [factoryIn[0], lerp(stepsLine[1], factoryIn[1], .5)], factoryIn]
    : [stepsLine, [lerp(stepsLine[0], factoryIn[0], .5), stepsLine[1]], [lerp(stepsLine[0], factoryIn[0], .5), factoryIn[1]], factoryIn];
  const factoryT = ease(frame, T.steps - 20, T.steps, (v) => v);
  const flowAppear = act2 * (L.flowFadeAt === null ? 1 : 1 - ease(frame, L.flowFadeAt, L.flowFadeAt + 14));

  const R = L.renderer;
  const rendererOn = easeOut(frame, T.renderer, T.renderer + 16);
  const installIndex = INSTALLS.reduce((current, item, index) => (frame >= item.at ? index : current), 0);
  const install = INSTALLS[installIndex]!;
  const chipX = (i: number) => R.x + 118 + i * 84;
  const pillFrom = installIndex === 0 ? 0 : installIndex - 1;
  const pillX = lerp(chipX(pillFrom), chipX(installIndex), ease(frame, install.at - 10, install.at));

  const statsOn = easeOut(frame, T.stats, T.stats + 16);
  const total = BRANCHES.reduce((sum, b) => sum + b.count, 0);
  const barW = L.stats.w;
  const segStart = BRANCHES.map((_, i) => BRANCHES.slice(0, i).reduce((sum, b) => sum + b.count, 0) / total * barW);

  const lean = (p: Pt): Pt => [lerp(width / 2, p[0], .18), lerp(height / 2, p[1], .18)];
  const camera = [
    { at: 0 },
    { at: T.atlas - 10, zoom: 1.03, focus: lean(forever) },
    { at: T.act2 - 14, zoom: 1 },
    { at: T.renderer - 6, zoom: 1.025, focus: lean([R.x + R.w / 2, R.y + R.h / 2]) },
    { at: T.stats - 10, dur: 50, zoom: 1 },
  ];

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    {/* ACT 1: the matrix */}
    {act1 > 0 ? <g opacity={act1}>
      {dimRows}
      <g transform={`translate(${shake} 0)`}>
        <CodeBlock
          x={TL.x} y={TL.y} w={TL.w} frame={frame} size={TL.size}
          title={TL.title ? (fr ? "composant d’onboarding · Ember" : "onboarding component · Ember") : undefined}
          appear={easeOut(frame, T.template - 12, T.template)}
          highlight={frame >= T.hit ? L.template.lines : undefined}
          lines={templateLines}
        />
      </g>
      {frame >= T.hit ? <Pulse x={forever[0]} y={forever[1]} frame={frame} at={T.hit} period={40} r={10} tone="danger" /> : null}
      {reqOpacity > 0 ? <g opacity={reqOpacity} transform={`translate(${reqX} ${reqY}) scale(${1 - .2 * reqFly}) translate(${-reqX} ${-reqY})`}>
        <Tag x={reqX} y={reqY} text="+ MongoDB Atlas" tone="hot" size={13} />
      </g> : null}
      <Tag x={L.weeks.x} y={L.weeks.y} anchor={L.weeks.anchor} text={fr ? "rouvrir les templates · des semaines" : "rip open the templates · weeks"} tone="danger" size={12} appear={pop(frame, T.weeks)} />
    </g> : null}

    {/* ACT 2: the flow factory */}
    {act2 > 0 ? <g opacity={act2}>
      <g {...enter(frame, T.act2, { from: "left" })}>
        <CodeBlock
          x={FL.x} y={FL.y} w={FL.w} frame={frame} size={FL.size} appear={flowAppear} lines={flowLines}
          title={compact ? undefined : fr ? "nouvelle base = un objet de 10 lignes" : "new database = a 10-line object"}
          highlight={frame >= T.steps - 10 && frame < T.renderer ? 4 : undefined}
        />
      </g>
      {flowAppear > .5 ? <Comet points={factoryPath} t={factoryT} tone="hot" r={5} tail={.3} /> : null}

      <Text x={S.x} y={S.y - 14} size={12} weight={600} font="mono" tone="hot" opacity={easeOut(frame, T.steps - 4, T.steps + 8)}>buildStepsFromArray([</Text>
      {STEPS.map((step, i) => {
        const y = S.y + i * (S.h + S.gap);
        const at = stagger(i, T.steps + 2, 7);
        const current = frame >= T.renderer && i === 0;
        const nonRelational = i === 2 && frame >= T.steps + 30;
        return <g key={step} {...enter(frame, at, { from: "left", distance: 18 })}>
          <Box x={S.x} y={y} w={S.w} h={S.h} radius={10} tone={current ? "hot" : "line"} focus={current ? ease(frame, T.renderer, T.renderer + 10) : 0}>
            <Text x={S.x + 14} y={y + S.h / 2} size={12} weight={600} font="mono" tone={current ? "hot" : "muted"}>{`${i + 1}`}</Text>
            <Text x={S.x + 32} y={y + S.h / 2} size={compact ? 12.5 : 13.5} weight={600} font="mono">{step}</Text>
            <Tag x={S.x + S.w - 10} y={y + S.h / 2} text={fr ? "non relationnel" : "non-relational"} tone="ok" anchor="end" size={10.5} appear={nonRelational ? pop(frame, T.steps + 30) : 0} />
          </Box>
        </g>;
      })}

      {/* The dumb renderer: current step + a pure function's command. */}
      {rendererOn > 0 ? <g {...enter(frame, T.renderer, { from: compact ? "down" : "up" })}>
        <Box x={R.x} y={R.y} w={R.w} h={R.h} tone="hot" radius={16}>
          <Text x={R.x + 18} y={R.y + 22} size={11} weight={600} font="mono" tone="muted" caps>{fr ? "UI · simple afficheur" : "UI · dumb renderer"}</Text>
          <Tag x={R.x + R.w - 14} y={R.y + 22} text={fr ? "étape 1 / 4" : "step 1 / 4"} tone="hot" anchor="end" size={11} />
          <Text x={R.x + 18} y={R.y + 50} size={12} weight={500} font="mono" tone="muted">installation</Text>
          <rect x={pillX - 4} y={R.y + 38} width={chipW(install.key, 12) + 8} height={24} rx={12} style={{ fill: tint("hot", 22) }} stroke={TONE.hot} strokeOpacity={.6} />
          {INSTALLS.map((item, i) => <Text key={item.key} x={chipX(i) + chipW(item.key, 12) / 2} y={R.y + 50.5} size={12} weight={600} font="mono" tone={i === installIndex ? "hot" : "muted"} anchor="middle">{item.key}</Text>)}
        </Box>
        <CodeBlock
          x={R.x + 12} y={R.y + 70} w={R.w - 24} frame={frame} size={compact ? 12.5 : 13}
          lines={[{ text: `$ ${install.command}`, tone: "ok", appearAt: install.at }]}
        />
      </g> : null}

      {/* 39 branches, one pattern. */}
      {statsOn > 0 ? <g opacity={statsOn}>
        <Text x={L.stats.x} y={L.stats.y} size={11} weight={600} font="mono" tone="muted" caps>{fr ? "branches d’onboarding" : "onboarding branches"}</Text>
        <Counter x={L.stats.x + L.stats.w} y={L.stats.y} frame={frame} from={0} to={total} start={T.stats} end={T.stats + 30} size={15} weight={700} font="mono" tone="ok" anchor="end" />
        {BRANCHES.map((branch, i) => {
          const segW = branch.count / total * barW - 4;
          const fill = easeOut(frame, stagger(i, T.stats + 4, 8), stagger(i, T.stats + 4, 8) + 22);
          const x = L.stats.x + segStart[i]!;
          const labelX = L.stats.x + BRANCHES.slice(0, i).reduce((sum, b) => sum + `${b.count} ${b.label[locale]}`.length * 7.2 + 34, 0);
          return <g key={i}>
            <rect x={x} y={L.stats.y + 16} width={segW} height={10} rx={5} style={{ fill: tint("ink", 8) }} />
            <rect x={x} y={L.stats.y + 16} width={Math.max(10, segW * fill)} height={10} rx={5} fill={TONE.ok} opacity={(.35 + .5 * fill) * (1 - i * .22)} />
            <g opacity={fill}>
              <circle cx={labelX + 4} cy={L.stats.y + 42} r={4} fill={TONE.ok} opacity={1 - i * .22} />
              <Text x={labelX + 14} y={L.stats.y + 42} size={12} weight={600} font="mono" tone="ink">{`${branch.count} ${branch.label[locale]}`}</Text>
            </g>
          </g>;
        })}
      </g> : null}
    </g> : null}
  </Camera>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.stats + 50,
  title: { en: "Adding a database, before and after", fr: "Ajouter une base, avant et après" },
  caption: {
    en: "In the if/else matrix, every new stack meant another template branch. With flow factories, a new database is a small config object: the factory composes the steps, pure functions pick the commands, and the UI only renders.",
    fr: "Dans la matrice if/else, chaque nouvelle stack imposait une branche de template de plus. Avec les factories, une nouvelle base est un petit objet de configuration : la factory compose les étapes, des fonctions pures choisissent les commandes, l’UI ne fait qu’afficher.",
  },
  beats: [
    { at: 0, text: { en: "Supporting the user’s stack meant multiplying architectures, frameworks, ORMs and environments.", fr: "Prendre en charge la stack de l’utilisateur : multiplier architectures, frameworks, ORM et environnements." } },
    { at: T.template, text: { en: "Our Ember onboarding became a war zone of if/else: one template branch per combination.", fr: "Notre onboarding Ember devient une zone de guerre de if/else : une branche de template par combinaison." } },
    { at: T.atlas, text: { en: "Adding a database like MongoDB Atlas meant ripping open the templates again: weeks instead of hours.", fr: "Ajouter une base comme MongoDB Atlas oblige à rouvrir les templates : des semaines au lieu d’heures." } },
    { at: T.act2, text: { en: "Same request, factory way: MongoDB Atlas is a flow object passed to createForestCLIIntegrationSteps.", fr: "Même demande, version factory : MongoDB Atlas devient un objet passé à createForestCLIIntegrationSteps." } },
    { at: T.steps, text: { en: "The factory composes the steps; the UI renders one; a pure function picks the docker, yarn or npm command.", fr: "La factory compose les étapes, l’UI en affiche une, une fonction pure choisit la commande docker, yarn ou npm." } },
    { at: T.stats, text: { en: "The same pattern powers 39 onboarding branches: 25 In-App, 7 Microservice, 7 Fully Hosted Cloud.", fr: "Le même pattern gère 39 branches d’onboarding : 25 In-App, 7 Microservice, 7 flux cloud managés." } },
  ],
  Stage,
});
