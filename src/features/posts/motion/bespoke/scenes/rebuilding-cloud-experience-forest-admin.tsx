import { Box, Camera, Checkpoint, dim, ease, easeOut, enter, lerp, pop, stagger, Tag, Text, tint, TONE } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";
import type { PostLocale } from "../../../content/types";

// Three hosting options tested against the four requirements the intro lists.
// Only the verdicts the article states are drawn: K8s and EC2 each fail on one
// named requirement; Lambda passes all four, each with the mechanism that pays
// for it. Then the bill hangs under the requirement that incurred it.
const T = {
  k8s: 34,
  ec2: 104,
  lambda: 172,
  cellStep: 26,
  bill: 300,
  end: 440,
} as const;

type L10n = Record<PostLocale, string>;
const REQUIREMENTS: readonly L10n[] = [
  { en: "scales seamlessly", fr: "scale sans effort" },
  { en: "static IP", fr: "IP statique" },
  { en: "custom code", fr: "code client" },
  { en: "≈ $0 marginal cost", fr: "coût marginal ≈ 0" },
];

type Cell = { col: number; pass: boolean; note: L10n; at: number };
type Option = { name: string; sub: L10n; at: number; cells: Cell[] };

const OPTIONS: readonly Option[] = [
  {
    name: "Kubernetes", sub: { en: "clusters + namespaces", fr: "clusters + namespaces" }, at: T.k8s,
    cells: [{ col: 0, pass: false, note: { en: "needs an SRE team", fr: "exige une équipe SRE" }, at: T.k8s + 24 }],
  },
  {
    name: "EC2", sub: { en: "one instance per client", fr: "une instance par client" }, at: T.ec2,
    cells: [{ col: 3, pass: false, note: { en: "financially ruinous", fr: "financièrement ruineux" }, at: T.ec2 + 32 }],
  },
  {
    name: "Lambda", sub: { en: "+ Layers + NAT", fr: "+ Layers + NAT" }, at: T.lambda,
    cells: [
      { col: 0, pass: true, note: { en: "AWS Lambda", fr: "AWS Lambda" }, at: T.lambda + 16 },
      { col: 1, pass: true, note: { en: "NAT + Elastic IP", fr: "NAT + Elastic IP" }, at: T.lambda + 16 + T.cellStep },
      { col: 2, pass: true, note: { en: "Lambda Layers", fr: "Lambda Layers" }, at: T.lambda + 16 + 2 * T.cellStep },
      { col: 3, pass: true, note: { en: "≈ $200 / month", fr: "≈ 200 $ / mois" }, at: T.lambda + 16 + 3 * T.cellStep },
    ],
  },
];

// The price of each passing cell, hung under the requirement that incurs it.
const BILL: readonly { col: number; text: L10n; shift?: number }[] = [
  { col: 0, shift: 50, text: { en: "connection pool exhaustion", fr: "épuisement du pool" } },
  { col: 1, text: { en: "cold starts", fr: "cold starts" } },
  { col: 1, text: { en: "NAT tax · per hour + per GB", fr: "taxe NAT · à l’heure + au Go" } },
];

const lastAt = (option: Option) => option.cells.at(-1)!.at;
const failedAt = (option: Option) => (option.cells.some((cell) => !cell.pass) ? lastAt(option) + 14 : 1e6);

/** Where the scanning probe sits for an option at `frame` (column index, fractional while moving). */
function probeCol(option: Option, frame: number) {
  const cols = option.cells.map((cell) => cell.col);
  const starts = option.cells.map((cell) => cell.at - 16);
  const from = starts.reduce((col, start, index) => (frame >= start ? cols[index]! : col), -1);
  const index = starts.findIndex((start) => frame < start + 12 && frame >= start);
  if (index < 0) return from < 0 ? -.6 : from;
  const previous = index === 0 ? -.6 : cols[index - 1]!;
  return lerp(previous, cols[index]!, ease(frame, starts[index]!, starts[index]! + 12));
}

function Wide({ frame, locale }: { frame: number; locale: PostLocale }) {
  const fr = locale === "fr";
  const table = { x: 40, y: 60, w: 880, h: 250 };
  const labelW = 214;
  const colW = (table.w - labelW - 16) / 4;
  const colX = (c: number) => table.x + labelW + colW * (c + .5);
  const headY = table.y + 30;
  const rowY = (r: number) => table.y + 82 + r * 62;

  return <g>
    <g {...enter(frame, 0)}>
      <Box {...table} tone="line" radius={18} />
    </g>
    {REQUIREMENTS.map((req, c) => <g key={c} {...enter(frame, stagger(c, 8, 4), { distance: 8 })}>
      <Text x={colX(c)} y={headY} size={11} weight={600} font="mono" tone="muted" anchor="middle" caps>{req[locale]}</Text>
    </g>)}
    <line x1={table.x + 16} x2={table.x + table.w - 16} y1={headY + 20} y2={headY + 20} stroke="var(--scene-hairline)" strokeWidth={1} opacity={easeOut(frame, 10, 24)} />

    {OPTIONS.map((opt, r) => {
      const y = rowY(r);
      const out = ease(frame, failedAt(opt), failedAt(opt) + 16);
      const chosen = opt.cells.every((cell) => cell.pass) ? ease(frame, lastAt(opt) + 6, lastAt(opt) + 18) : 0;
      const scanning = frame >= opt.at && frame < lastAt(opt) + 10;
      const probe = probeCol(opt, frame);
      const nameW = opt.name.length * 9.3;
      return <g key={opt.name} {...enter(frame, stagger(r, 14, 6), { from: "right" })}>
        <g opacity={dim(out, .45)}>
          {r > 0 ? <line x1={table.x + 16} x2={table.x + table.w - 16} y1={y - 31} y2={y - 31} stroke="var(--scene-hairline)" strokeWidth={1} opacity={.6} /> : null}
          {chosen > 0 ? <rect x={table.x + 8} y={y - 27} width={table.w - 16} height={54} rx={12} style={{ fill: tint("ok", 10 * chosen) }} /> : null}
          {chosen > 0 ? <rect x={table.x + 8} y={y - 16} width={3} height={32} rx={1.5} fill={TONE.ok} opacity={chosen} /> : null}
          <Text x={table.x + 24} y={y - 9} size={17} weight={650} tone={scanning ? "hot" : "ink"}>{opt.name}</Text>
          <Text x={table.x + 24} y={y + 13} size={12} weight={500} font="mono" tone="muted">{opt.sub[locale]}</Text>
          {out > 0 ? <line x1={table.x + 22} x2={table.x + 22 + (nameW + 4) * out} y1={y - 9} y2={y - 9} stroke={TONE.danger} strokeWidth={1.5} /> : null}
          {scanning ? <rect x={colX(0) + probe * colW - colW / 2 + 8} y={y - 25} width={colW - 16} height={50} rx={10} style={{ fill: tint("hot", 10) }} stroke={TONE.hot} strokeOpacity={.45} strokeWidth={1} opacity={ease(frame, opt.at, opt.at + 8)} /> : null}
          {opt.cells.map((cell) => {
            const verdict = pop(frame, cell.at);
            return <g key={cell.col} opacity={easeOut(frame, cell.at - 10, cell.at)}>
              <g transform={`translate(${colX(cell.col)} ${y - 8}) scale(${frame >= cell.at ? .6 + .4 * verdict : 1}) translate(${-colX(cell.col)} ${-(y - 8)})`}>
                <Checkpoint x={colX(cell.col)} y={y - 8} state={frame >= cell.at ? (cell.pass ? "pass" : "fail") : "pending"} r={10} />
              </g>
              <Text x={colX(cell.col)} y={y + 15} size={12.5} weight={600} font="mono" tone={cell.pass ? "ok" : "danger"} anchor="middle" opacity={easeOut(frame, cell.at + 2, cell.at + 12)}>{cell.note[locale]}</Text>
            </g>;
          })}
        </g>
      </g>;
    })}

    {/* The bill, hung under the requirement that incurs it. */}
    <g opacity={easeOut(frame, T.bill, T.bill + 14)}>
      <Text x={table.x + 24} y={346} size={11} weight={600} font="mono" tone="hot" caps>{fr ? "le prix" : "the price"}</Text>
    </g>
    {BILL.map((item, i) => {
      const at = T.bill + 8 + i * 12;
      const x = colX(item.col);
      const stackIndex = BILL.slice(0, i).filter((other) => other.col === item.col).length;
      const y = 346 + stackIndex * 36;
      const drop = easeOut(frame, at, at + 16);
      if (drop <= 0) return null;
      return <g key={i}>
        {stackIndex === 0 ? <line x1={x} x2={x} y1={rowY(2) + 28} y2={lerp(rowY(2) + 28, y - 14, drop)} stroke={TONE.hot} strokeOpacity={.6} strokeWidth={1} strokeDasharray="2 3" /> : null}
        <g transform={`translate(0 ${(1 - drop) * -14})`}>
          <Tag x={item.shift ? x + item.shift : x} y={y} anchor={item.shift ? "end" : "middle"} text={item.text[locale]} tone="hot" size={12} appear={pop(frame, at)} />
        </g>
      </g>;
    })}
  </g>;
}

function Compact({ frame, locale }: { frame: number; locale: PostLocale }) {
  const fr = locale === "fr";
  const blocks = [
    { y: 56, h: 60 },
    { y: 126, h: 60 },
    { y: 196, h: 184 },
  ];
  return <g>
    {OPTIONS.map((opt, r) => {
      const b = blocks[r]!;
      const out = ease(frame, failedAt(opt), failedAt(opt) + 16);
      const chosen = opt.cells.every((cell) => cell.pass) ? ease(frame, lastAt(opt) + 6, lastAt(opt) + 18) : 0;
      const scanning = frame >= opt.at && frame < lastAt(opt) + 10;
      const single = opt.cells.length === 1;
      const nameW = opt.name.length * 8.8;
      return <g key={opt.name} {...enter(frame, stagger(r, 4, 6))}>
        <g opacity={dim(out, .45)}>
          <Box x={20} y={b.y} w={500} h={b.h} tone={chosen > 0 ? "ok" : scanning ? "hot" : "line"} focus={scanning ? ease(frame, opt.at, opt.at + 8) : chosen * .6} radius={14}>
            <Text x={36} y={b.y + (single ? 21 : 22)} size={16} weight={650}>{opt.name}</Text>
            <Text x={single ? 36 : 36 + opt.name.length * 10 + 12} y={single ? b.y + 42 : b.y + 23} size={12} weight={500} font="mono" tone="muted">{opt.sub[locale]}</Text>
            {out > 0 ? <line x1={34} x2={34 + (nameW + 4) * out} y1={b.y + 21} y2={b.y + 21} stroke={TONE.danger} strokeWidth={1.5} /> : null}
          </Box>
          {opt.cells.map((cell, i) => {
            const verdict = frame >= cell.at ? "pass" : "pending";
            const on = easeOut(frame, cell.at - 12, cell.at - 2);
            if (single) {
              const y = b.y + b.h / 2;
              return <g key={cell.col} opacity={on}>
                <Text x={492} y={y - 9} size={11} weight={600} font="mono" tone="muted" anchor="end" caps>{REQUIREMENTS[cell.col]![locale]}</Text>
                <Text x={492} y={y + 11} size={13} weight={600} font="mono" tone="danger" anchor="end" opacity={easeOut(frame, cell.at, cell.at + 10)}>{`${cell.note[locale]} ✗`}</Text>
              </g>;
            }
            const y = b.y + 58 + i * 34;
            return <g key={cell.col} opacity={on}>
              {i > 0 ? <line x1={36} x2={504} y1={y - 17} y2={y - 17} stroke="var(--scene-hairline)" strokeWidth={1} opacity={.6} /> : null}
              <g transform={`translate(48 ${y}) scale(${frame >= cell.at ? .6 + .4 * pop(frame, cell.at) : 1}) translate(-48 ${-y})`}>
                <Checkpoint x={48} y={y} state={cell.pass ? verdict : frame >= cell.at ? "fail" : "pending"} r={10} />
              </g>
              <Text x={68} y={y} size={13.5} weight={600} font="mono">{REQUIREMENTS[cell.col]![locale]}</Text>
              <Text x={504} y={y} size={13} weight={600} font="mono" tone="ok" anchor="end" opacity={easeOut(frame, cell.at + 2, cell.at + 12)}>{cell.note[locale]}</Text>
            </g>;
          })}
        </g>
      </g>;
    })}
    <Text x={20} y={404} size={11} weight={600} font="mono" tone="hot" caps opacity={easeOut(frame, T.bill, T.bill + 14)}>{fr ? "le prix" : "the price"}</Text>
    {BILL.map((item, i) => {
      const at = T.bill + 8 + i * 12;
      const first = BILL[0]!.text[locale].length * 12 * .6 + 18;
      const pos: [number, number] = i === 0 ? [20, 436] : i === 1 ? [20, 474] : [20 + first + 10, 436];
      const drop = easeOut(frame, at, at + 16);
      return <g key={i} transform={`translate(0 ${(1 - drop) * -12})`}>
        <Tag x={pos[0]} y={pos[1]} anchor="start" text={item.text[locale]} tone="hot" size={12} appear={pop(frame, at)} />
      </g>;
    })}
  </g>;
}

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const camera = [
    { at: 0 },
    { at: T.lambda - 8, zoom: 1.025, focus: [width / 2, lerp(height / 2, compact ? 290 : 260, .2)] as const },
    { at: T.bill + 60, dur: 60, zoom: 1 },
  ];
  return <Camera frame={frame} keys={camera} width={width} height={height}>
    {compact ? <Compact frame={frame} locale={locale} /> : <Wide frame={frame} locale={locale} />}
  </Camera>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.bill + 80,
  title: { en: "Why serverless, and at what price", fr: "Pourquoi le serverless, et à quel prix" },
  caption: {
    en: "Kubernetes needed an SRE team and EC2 per client was financially ruinous. Lambda met all four requirements for about $200/month, and the rest of the article is the bill: NAT tax, cold starts, connection pool exhaustion.",
    fr: "Kubernetes exigeait une équipe SRE et un EC2 par client était financièrement ruineux. Lambda cochait les quatre exigences pour environ 200 $ par mois ; la suite de l’article détaille la facture : taxe NAT, cold starts, épuisement du pool.",
  },
  beats: [
    { at: 0, text: { en: "The Cloud had to scale seamlessly, give a static IP, run custom code and cost practically nothing.", fr: "Le Cloud devait scaler sans effort, offrir une IP statique, exécuter du code client et ne presque rien coûter." } },
    { at: T.k8s, text: { en: "Kubernetes for thousands of micro-deployments needs an internal SRE team we didn’t want to dedicate.", fr: "Kubernetes pour des milliers de micro-déploiements exige une équipe SRE que nous refusions d’y consacrer." } },
    { at: T.ec2, text: { en: "One EC2 instance per client? Financially ruinous.", fr: "Une instance EC2 par client ? Financièrement ruineux." } },
    { at: T.lambda, text: { en: "Lambda + Layers + NAT Gateway + Elastic IP meets all four: thousands of projects for about $200/month.", fr: "Lambda + Layers + NAT Gateway + Elastic IP cochent les quatre : des milliers de projets pour ~200 $/mois." } },
    { at: T.bill, text: { en: "But serverless is no silver bullet. The rest is the bill: NAT tax, cold starts, connection pool exhaustion.", fr: "Mais le serverless n’est pas miraculeux. La suite est la facture : taxe NAT, cold starts, épuisement du pool." } },
  ],
  Stage,
});
