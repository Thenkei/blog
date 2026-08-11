import type { ReactNode } from "react";
import type { PostVisualId } from "../../features/posts/content";
import type { PostVisualVariant } from "./PostVisual";

type EditorialCopy = {
  title: string;
  description: string;
  caption: string;
  labels: Record<string, string>;
};

type EditorialPostVisualProps = {
  copy: EditorialCopy;
  markerId: string;
  slug: string;
  variant: PostVisualVariant;
  visualId: PostVisualId;
};

type StoryProps = Omit<EditorialPostVisualProps, "visualId">;

export const editorialPostVisualIds = [
  "agent-battle-2026",
  "bounded-ai-loop",
  "ai-force-multiplier",
  "sse-outbound-channel",
  "backend-to-data-engineer-rockfi",
  "claude-code-product-os",
  "trail-endurance-profile",
  "engineering-2026-ai-redefined-our-job",
  "forest-admin-activity-logs-elasticsearch",
  "idempotency-debounce-jobify-bullmq",
  "jobify-workers-queues-nestjs",
  "joining-rockfi",
  "nodejs-stream-backpressure-history-export",
  "polymagine-industry-4-eyewear-2017",
  "postgresql-unique-nulls",
  "redis-memory-exhaustion-post-mortem",
  "scim-user-provisioning-forest-admin",
  "security-authentication-idp-openid-connect",
] as const satisfies readonly PostVisualId[];

export function hasEditorialPostVisual(visualId: PostVisualId): boolean {
  return (editorialPostVisualIds as readonly PostVisualId[]).includes(visualId);
}

function EditorialFrame({
  markerId,
  variant,
  children,
}: {
  markerId: string;
  variant: PostVisualVariant;
  children: ReactNode;
}) {
  return (
    <>
      <defs>
        <linearGradient id={`${markerId}-story-wash`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--visual-surface-strong)" />
          <stop offset="0.62" stopColor="var(--visual-surface)" />
          <stop offset="1" stopColor="var(--visual-surface-strong)" />
        </linearGradient>
        <radialGradient id={`${markerId}-story-glow`} cx="50%" cy="46%" r="58%">
          <stop offset="0" stopColor="var(--visual-line)" stopOpacity="0.16" />
          <stop offset="1" stopColor="var(--visual-line)" stopOpacity="0" />
        </radialGradient>
        <marker
          id={`${markerId}-arrow`}
          markerWidth="12"
          markerHeight="10"
          refX="10"
          refY="5"
          orient="auto"
        >
          <path d="M0 0L12 5L0 10Z" className="visual-arrow-head" />
        </marker>
      </defs>
      <rect width="900" height="480" rx="28" fill={`url(#${markerId}-story-wash)`} />
      <ellipse cx="450" cy="224" rx="430" ry="264" fill={`url(#${markerId}-story-glow)`} />
      <g
        className={`visual-editorial-composition visual-editorial-composition-${variant}`}
        data-composition={variant}
      >
        {children}
      </g>
    </>
  );
}

function InlineLabels({
  labels,
  compact = false,
}: {
  labels: ReadonlyArray<{ x: number; text: string }>;
  compact?: boolean;
}) {
  return labels.map(({ x, text }) => (
    <text
      key={`${x}-${text}`}
      x={x}
      y="390"
      textAnchor="middle"
      className={`visual-editorial-label${compact ? " visual-editorial-label-compact" : ""}`}
    >
      {text}
    </text>
  ));
}

function CheckMark({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <path
      d={`M${x - 34 * scale} ${y}L${x - 8 * scale} ${y + 28 * scale}L${x + 38 * scale} ${y - 34 * scale}`}
      className="visual-editorial-check"
    />
  );
}

function DatabaseGlyph({ x, y, width = 136, height = 162 }: { x: number; y: number; width?: number; height?: number }) {
  const radiusX = width / 2;
  const radiusY = Math.min(24, height * 0.16);
  const bottom = y + height;
  return (
    <g className="visual-editorial-database">
      <ellipse cx={x} cy={y} rx={radiusX} ry={radiusY} />
      <path d={`M${x - radiusX} ${y}V${bottom}C${x - radiusX} ${bottom + 16} ${x - radiusX / 2} ${bottom + 24} ${x} ${bottom + 24}S${x + radiusX} ${bottom + 16} ${x + radiusX} ${bottom}V${y}`} />
      <ellipse cx={x} cy={bottom} rx={radiusX} ry={radiusY} />
    </g>
  );
}

function HumanGate({ x, y, width = 156, height = 164 }: { x: number; y: number; width?: number; height?: number }) {
  return (
    <g className="visual-editorial-human-gate">
      <rect x={x} y={y} width={width} height={height} rx="46" className="visual-editorial-success" />
      <circle cx={x + width / 2} cy={y + height * 0.34} r={height * 0.12} className="visual-editorial-source" />
      <path
        d={`M${x + width * 0.28} ${y + height * 0.72}C${x + width * 0.32} ${y + height * 0.52} ${x + width * 0.68} ${y + height * 0.52} ${x + width * 0.72} ${y + height * 0.72}`}
        className="visual-editorial-detail"
      />
    </g>
  );
}

function AgentChoiceVisual({ copy, markerId, variant }: StoryProps) {
  const arrow = `url(#${markerId}-arrow)`;
  const routes = variant === "header" ? [116, 240, 364] : [132, 240, 348];

  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <path d="M138 240H334" className="visual-editorial-line" />
        <circle cx="138" cy="240" r="42" className="visual-editorial-source" />
        <path d="M334 240L420 154L506 240L420 326Z" className="visual-editorial-panel-hot visual-editorial-selector" />
        {routes.map((y, index) => (
          <g key={y}>
            <path d={`M506 240C586 240 584 ${y} 652 ${y}`} className="visual-editorial-line-muted" />
            <rect x="652" y={y - 32} width={126 + index * 18} height="64" rx="22" className={index === 1 ? "visual-editorial-success" : "visual-editorial-layer-middle"} />
          </g>
        ))}
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        {[142, 240, 338].map((y) => (
          <circle key={y} cx="112" cy={y} r="24" className="visual-editorial-source" />
        ))}
        <path d="M136 142C242 142 242 240 330 240M136 240H330M136 338C242 338 242 240 330 240" className="visual-editorial-line-muted" />
        <path d="M330 240L420 148L510 240L420 332Z" className="visual-editorial-panel-hot visual-editorial-selector" />
        {routes.map((y, index) => (
          <g key={y}>
            <path d={`M510 240C598 240 590 ${y} 660 ${y}`} className="visual-editorial-flow-trace" />
            <rect x="660" y={y - 36} width={132 + index * 18} height="72" rx="24" className={index === 1 ? "visual-editorial-success" : "visual-editorial-layer-middle"} />
          </g>
        ))}
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      {[154, 224, 294].map((y, index) => (
        <g key={y}>
          <circle cx="84" cy={y} r={18 + index * 4} className="visual-editorial-source" />
          <path d={`M108 ${y}C210 ${y} 218 224 314 224`} className="visual-editorial-line-muted" />
        </g>
      ))}
      <path d="M314 224L390 146L466 224L390 302Z" className="visual-editorial-panel-hot visual-editorial-selector" />
      {[126, 224, 322].map((y, index) => (
        <g key={y}>
          <path d={`M466 224C548 224 548 ${y} 620 ${y}`} className="visual-editorial-flow-trace" markerEnd={index === 1 ? arrow : undefined} />
          <rect x="620" y={y - 34} width={174} height="68" rx="24" className={index === 1 ? "visual-editorial-success" : "visual-editorial-layer-middle"} />
          <circle cx={820} cy={y} r={index === 1 ? 16 : 9} className={index === 1 ? "visual-editorial-checkpoint" : "visual-editorial-source"} />
        </g>
      ))}
      <InlineLabels labels={[
        { x: 84, text: copy.labels.a ?? "" },
        { x: 390, text: copy.labels.c ?? "" },
        { x: 707, text: copy.labels.e ?? "" },
      ]} />
    </EditorialFrame>
  );
}

function BoundedAiVisual({ copy, markerId, variant }: StoryProps) {
  const arrow = `url(#${markerId}-arrow)`;

  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <circle cx="214" cy="240" r="52" className="visual-editorial-source" />
        <path d="M266 240H376" className="visual-editorial-flow-trace" />
        <rect x="376" y="126" width="204" height="228" rx="58" className="visual-editorial-cloud-boundary" />
        <circle cx="478" cy="240" r="54" className="visual-editorial-panel-hot visual-editorial-node-breathe" />
        <path d="M580 240H674" className="visual-editorial-line-hot" />
        <HumanGate x={674} y={156} width={134} height={168} />
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <circle cx="116" cy="240" r="42" className="visual-editorial-source" />
        <path d="M158 240H286" className="visual-editorial-flow-trace" />
        <rect x="286" y="102" width="268" height="276" rx="62" className="visual-editorial-cloud-boundary" />
        <circle cx="420" cy="240" r="62" className="visual-editorial-panel-hot visual-editorial-node-breathe" />
        <path d="M554 240H672" className="visual-editorial-flow-trace" />
        <HumanGate x={672} y={142} width={156} height={196} />
        <path d="M746 338C706 408 548 420 466 348" className="visual-editorial-rejected" />
        <path d="M452 334L480 362M480 334L452 362" className="visual-editorial-cross" />
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      <circle cx="78" cy="218" r="34" className="visual-editorial-source" />
      <path d="M112 218H224" className="visual-editorial-flow-trace" markerEnd={arrow} />
      <rect x="224" y="108" width="230" height="220" rx="54" className="visual-editorial-cloud-boundary" />
      <circle cx="339" cy="218" r="52" className="visual-editorial-panel-hot visual-editorial-node-breathe" />
      <path d="M454 218H584" className="visual-editorial-flow-trace" markerEnd={arrow} />
      <HumanGate x={584} y={136} width={144} height={164} />
      <path d="M728 218H814" className="visual-editorial-line-hot" markerEnd={arrow} />
      <circle cx="826" cy="218" r="34" className="visual-editorial-success" />
      <CheckMark x={826} y={218} scale={0.48} />
      <path d="M656 300C622 354 500 354 438 304" className="visual-editorial-rejected" />
      <path d="M424 290L450 316M450 290L424 316" className="visual-editorial-cross" />
      <InlineLabels labels={[
        { x: 78, text: copy.labels.intent ?? "" },
        { x: 339, text: copy.labels.agent ?? "" },
        { x: 656, text: copy.labels.human ?? "" },
        { x: 826, text: copy.labels.action ?? "" },
      ]} />
    </EditorialFrame>
  );
}

function AiSubstrate({ variant }: { variant: PostVisualVariant }) {
  const geometry = variant === "card"
    ? {
        top: "M62 282L422 178L840 282L470 386Z",
        front: "M62 282L470 386V410L62 306Z",
        side: "M470 386L840 282V306L470 410Z",
        core: { x: 466, y: 334 },
        circuits: [
          "M466 334L302 286L168 320",
          "M466 334L616 286L770 318",
          "M466 334L438 218",
          "M466 334L310 364",
          "M466 334L630 364",
        ],
        junctions: [{ x: 302, y: 286 }, { x: 616, y: 286 }, { x: 438, y: 218 }, { x: 310, y: 364 }, { x: 630, y: 364 }],
      }
    : variant === "header"
      ? {
          top: "M34 302L426 168L866 300L472 438Z",
          front: "M34 302L472 438V464L34 328Z",
          side: "M472 438L866 300V326L472 464Z",
          core: { x: 470, y: 372 },
          circuits: [
            "M470 372L284 310L106 344",
            "M470 372L642 306L810 342",
            "M470 372L430 214",
            "M470 372L274 408",
            "M470 372L668 410",
          ],
          junctions: [{ x: 284, y: 310 }, { x: 642, y: 306 }, { x: 430, y: 214 }, { x: 274, y: 408 }, { x: 668, y: 410 }],
        }
      : {
          top: "M50 288L422 176L846 288L468 414Z",
          front: "M50 288L468 414V438L50 312Z",
          side: "M468 414L846 288V312L468 438Z",
          core: { x: 466, y: 352 },
          circuits: [
            "M466 352L292 298L120 332",
            "M466 352L630 296L790 330",
            "M466 352L430 208",
            "M466 352L286 386",
            "M466 352L648 388",
          ],
          junctions: [{ x: 292, y: 298 }, { x: 630, y: 296 }, { x: 430, y: 208 }, { x: 286, y: 386 }, { x: 648, y: 388 }],
        };

  return (
    <g data-ai-layer="substrate">
      <path d={geometry.front} className="visual-editorial-ai-substrate-edge" />
      <path d={geometry.side} className="visual-editorial-ai-substrate-edge visual-editorial-ai-substrate-edge-side" />
      <path d={geometry.top} className="visual-editorial-ai-substrate" />
      {geometry.circuits.map((path) => (
        <path key={path} d={path} className="visual-editorial-ai-circuit" />
      ))}
      {geometry.junctions.map((junction, index) => (
        <circle
          key={`${junction.x}-${junction.y}`}
          cx={junction.x}
          cy={junction.y}
          r={index === 2 ? 7 : 5}
          className="visual-editorial-ai-junction"
        />
      ))}
      <ellipse cx={geometry.core.x} cy={geometry.core.y} rx="82" ry="25" className="visual-editorial-ai-substrate-core-glow" />
      <ellipse cx={geometry.core.x} cy={geometry.core.y} rx="58" ry="18" className="visual-editorial-ai-substrate-core" />
      <ellipse cx={geometry.core.x} cy={geometry.core.y} rx="31" ry="10" className="visual-editorial-ai-substrate-core-ring" />
    </g>
  );
}

function AiModule({
  x,
  y,
  scale = 1,
  hot = false,
}: {
  x: number;
  y: number;
  scale?: number;
  hot?: boolean;
}) {
  return (
    <g className="visual-editorial-ai-module visual-editorial-compute" transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M0 0L16 -12H90L74 0Z" className="visual-editorial-ai-module-top" />
      <path d="M74 0L90 -12V42L74 54Z" className="visual-editorial-ai-module-side" />
      <rect width="74" height="54" rx="13" className={`visual-editorial-ai-module-front${hot ? " visual-editorial-ai-module-front-hot" : ""}`} />
      <path d="M18 20H56M18 34H44" className="visual-editorial-ai-module-detail" />
    </g>
  );
}

function AiHologram({
  x,
  y,
  width,
  height,
  kind,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  kind: "code" | "network";
}) {
  return (
    <g className="visual-editorial-ai-hologram" transform={`translate(${x} ${y})`}>
      <rect width={width} height={height} rx="16" />
      {kind === "code" ? (
        <path
          d={`M20 24H${width - 24}M20 42H${width - 46}M34 60H${width - 18}M20 78H${width - 58}`}
          className="visual-editorial-ai-hologram-detail"
        />
      ) : (
        <g>
          <path
            d={`M24 ${height - 28}L${width * 0.36} 28L${width * 0.58} ${height - 38}L${width - 24} 26M24 ${height - 28}L${width * 0.58} ${height - 38}M${width * 0.36} 28L${width - 24} 26`}
            className="visual-editorial-ai-hologram-detail"
          />
          {[
            { cx: 24, cy: height - 28 },
            { cx: width * 0.36, cy: 28 },
            { cx: width * 0.58, cy: height - 38 },
            { cx: width - 24, cy: 26 },
          ].map((node) => (
            <circle key={`${node.cx}-${node.cy}`} cx={node.cx} cy={node.cy} r="6" className="visual-editorial-ai-hologram-node" />
          ))}
        </g>
      )}
    </g>
  );
}

function AiEngineer({
  x,
  y,
  scale = 1,
  facing = 1,
}: {
  x: number;
  y: number;
  scale?: number;
  facing?: 1 | -1;
}) {
  return (
    <g className="visual-editorial-ai-engineer" transform={`translate(${x} ${y}) scale(${facing * scale} ${scale})`}>
      <circle cx="0" cy="-78" r="11" className="visual-editorial-ai-engineer-body" />
      <path d="M-13 -62Q0 -70 13 -62L18 -22L10 8H-10L-18 -22Z" className="visual-editorial-ai-engineer-body" />
      <path d="M-8 6L-13 54M8 6L15 54M-14 -48L-28 -18L-43 -28M14 -48L25 -20" className="visual-editorial-ai-engineer-limb" />
      <circle cx="-44" cy="-29" r="5" className="visual-editorial-ai-engineer-hand" />
    </g>
  );
}

function ForceMultiplierVisual({ copy, markerId, variant }: StoryProps) {
  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <g data-visual-motif="ai-engineering-substrate">
          <AiSubstrate variant={variant} />
          <path d="M466 334V244M326 308V246M614 306V246" className="visual-editorial-ai-lift" />
          <g data-ai-layer="systems">
            <path d="M154 258L420 176L748 260L456 354Z" className="visual-editorial-ai-platform" />
            <AiHologram x={488} y={92} width={150} height={104} kind="network" />
            <path d="M258 252L380 218L506 248L624 216L704 258" className="visual-editorial-ai-system-link" />
            <AiModule x={238} y={236} scale={0.82} />
            <AiModule x={346} y={202} scale={0.9} hot />
            <AiModule x={466} y={232} scale={0.86} />
            <AiModule x={574} y={200} scale={0.84} />
            <AiModule x={662} y={246} scale={0.76} />
          </g>
          <g data-ai-layer="human-control">
            <AiEngineer x={300} y={304} scale={0.82} facing={-1} />
            <AiEngineer x={476} y={326} scale={0.94} />
            <AiEngineer x={676} y={304} scale={0.8} />
          </g>
        </g>
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <g data-visual-motif="ai-engineering-substrate">
          <AiSubstrate variant={variant} />
          <path d="M470 372V252M284 310V240M642 306V236" className="visual-editorial-ai-lift" />
          <g data-ai-layer="systems">
            <path d="M126 260L418 160L782 258L456 374Z" className="visual-editorial-ai-platform" />
            <AiHologram x={164} y={72} width={144} height={112} kind="code" />
            <AiHologram x={502} y={54} width={176} height={124} kind="network" />
            <AiHologram x={696} y={112} width={122} height={96} kind="code" />
            <path d="M214 260L326 218L440 250L554 210L680 242L754 264" className="visual-editorial-ai-system-link" />
            <AiModule x={196} y={242} scale={0.86} />
            <AiModule x={304} y={202} scale={0.94} hot />
            <AiModule x={420} y={236} scale={0.9} />
            <AiModule x={524} y={190} scale={0.98} />
            <AiModule x={640} y={224} scale={0.9} hot />
            <AiModule x={724} y={266} scale={0.74} />
          </g>
          <g data-ai-layer="human-control">
            <AiEngineer x={250} y={320} scale={0.9} facing={-1} />
            <AiEngineer x={472} y={344} scale={1.04} />
            <AiEngineer x={690} y={318} scale={0.9} />
          </g>
        </g>
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      <g data-visual-motif="ai-engineering-substrate">
        <AiSubstrate variant={variant} />
        <path d="M466 352V240M292 298V236M630 296V234" className="visual-editorial-ai-lift" />
        <g data-ai-layer="systems">
          <path d="M138 252L416 164L770 252L456 360Z" className="visual-editorial-ai-platform" />
          <AiHologram x={180} y={66} width={138} height={106} kind="code" />
          <AiHologram x={512} y={58} width={170} height={118} kind="network" />
          <AiHologram x={702} y={118} width={112} height={88} kind="code" />
          <path d="M224 250L336 212L448 244L560 204L674 236L742 256" className="visual-editorial-ai-system-link" />
          <AiModule x={208} y={232} scale={0.84} />
          <AiModule x={316} y={196} scale={0.92} hot />
          <AiModule x={430} y={228} scale={0.88} />
          <AiModule x={536} y={186} scale={0.94} />
          <AiModule x={648} y={218} scale={0.86} hot />
          <AiModule x={726} y={254} scale={0.72} />
        </g>
        <g data-ai-layer="human-control">
          <AiEngineer x={258} y={308} scale={0.86} facing={-1} />
          <AiEngineer x={470} y={330} scale={1} />
          <AiEngineer x={680} y={306} scale={0.86} />
        </g>
        {[
          { x: 150, text: copy.labels.a ?? "" },
          { x: 450, text: copy.labels.b ?? "" },
          { x: 750, text: copy.labels.c ?? "" },
        ].map((label) => (
          <text key={`${label.x}-${label.text}`} x={label.x} y="466" textAnchor="middle" className="visual-editorial-label visual-editorial-label-compact">
            {label.text}
          </text>
        ))}
      </g>
    </EditorialFrame>
  );
}

function SseChannelVisual({ copy, markerId, variant }: StoryProps) {
  const arrow = `url(#${markerId}-arrow)`;

  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <rect x="94" y="118" width="278" height="244" rx="62" className="visual-editorial-cloud-boundary" />
        <circle cx="224" cy="240" r="48" className="visual-editorial-source" />
        <rect x="406" y="82" width="48" height="316" rx="24" className="visual-editorial-firewall" />
        <path d="M272 240H692" className="visual-editorial-flow-trace" markerEnd={arrow} />
        {[526, 588, 650].map((x, index) => (
          <circle key={x} cx={x} cy="240" r={8 + index * 2} className="visual-editorial-pulse-dot" />
        ))}
        <rect x="692" y="150" width="128" height="180" rx="44" className="visual-editorial-success" />
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <rect x="60" y="92" width="294" height="296" rx="66" className="visual-editorial-cloud-boundary" />
        <circle cx="204" cy="240" r="54" className="visual-editorial-source" />
        <rect x="398" y="62" width="56" height="356" rx="26" className="visual-editorial-firewall" />
        <path d="M258 240H730" className="visual-editorial-flow-trace" markerEnd={arrow} />
        {[510, 584, 658].map((x, index) => (
          <circle key={x} cx={x} cy="240" r={8 + index * 3} className={`visual-editorial-pulse-dot visual-editorial-compute-${index + 1}`} />
        ))}
        <rect x="730" y="132" width="130" height="216" rx="46" className="visual-editorial-success" />
        <path d="M730 306C604 390 430 390 312 316" className="visual-editorial-rejected" />
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      <rect x="42" y="110" width="230" height="228" rx="54" className="visual-editorial-cloud-boundary" />
      <circle cx="156" cy="224" r="44" className="visual-editorial-source" />
      <rect x="312" y="82" width="54" height="284" rx="26" className="visual-editorial-firewall" />
      <path d="M200 224H706" className="visual-editorial-flow-trace" markerEnd={arrow} />
      {[438, 514, 590, 666].map((x, index) => (
        <circle key={x} cx={x} cy="224" r={7 + index * 2} className={`visual-editorial-pulse-dot visual-editorial-compute-${(index % 3) + 1}`} />
      ))}
      <rect x="706" y="130" width="146" height="188" rx="48" className="visual-editorial-success" />
      <path d="M778 318C686 376 500 374 356 306" className="visual-editorial-rejected" />
      <path d="M340 292L370 322M370 292L340 322" className="visual-editorial-cross" />
      <InlineLabels labels={[
        { x: 156, text: copy.labels.agent ?? "" },
        { x: 520, text: copy.labels.channel ?? "" },
        { x: 779, text: copy.labels.control ?? "" },
      ]} />
    </EditorialFrame>
  );
}

function DataFoundationVisual({ copy, markerId, variant }: StoryProps) {
  const arrow = `url(#${markerId}-arrow)`;

  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <g data-visual-motif="partner-medallion-foundation">
          <circle cx="92" cy="126" r="22" className="visual-editorial-source" />
          <rect x="70" y="208" width="48" height="48" rx="10" className="visual-editorial-layer-middle" />
          <path d="M68 342L94 296L120 342Z" className="visual-editorial-panel-hot" />
          <path d="M114 126C220 126 214 168 286 168M118 232C212 232 220 240 286 240M120 328C220 328 214 312 286 312" className="visual-editorial-flow-trace" />

          {[{ x: 286, y: 126, width: 236 }, { x: 314, y: 204, width: 236 }, { x: 342, y: 282, width: 236 }].map((layer, index) => (
            <g key={layer.y} className={`visual-editorial-medallion-layer visual-editorial-compute-${index + 1}`}>
              <rect x={layer.x} y={layer.y} width={layer.width} height="62" rx="26" className={index === 0 ? "visual-editorial-layer-outer" : index === 1 ? "visual-editorial-layer-middle" : "visual-editorial-panel-hot"} />
              {[0, 1, 2, 3].map((slot) => (
                <circle key={slot} cx={layer.x + 42 + slot * 50} cy={layer.y + 31} r={7 + index} className="visual-editorial-checkpoint" />
              ))}
            </g>
          ))}
          <path d="M404 188V204M432 266V282" className="visual-editorial-line-hot" markerEnd={arrow} />
          <path d="M578 313C636 313 634 240 682 240" className="visual-editorial-flow-trace" markerEnd={arrow} />

          <path d="M682 174H824V338H682Z" className="visual-editorial-success" />
          <path d="M664 174H842L812 126H694Z" className="visual-editorial-foundation" />
          {[716, 754, 792].map((x) => (
            <path key={x} d={`M${x} 202V304`} className="visual-editorial-detail" />
          ))}
          <path d="M664 338H842" className="visual-editorial-foundation" />
        </g>
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <g data-visual-motif="partner-medallion-foundation">
          <circle cx="72" cy="104" r="22" className="visual-editorial-source" />
          <rect x="48" y="186" width="50" height="50" rx="10" className="visual-editorial-layer-middle" />
          <path d="M46 318L72 270L100 318Z" className="visual-editorial-panel-hot" />
          <path d="M52 390H96L74 346Z" className="visual-editorial-success" />
          <path d="M94 104C206 104 210 138 278 138M98 212C204 212 212 214 278 214M100 304C204 304 212 290 278 290M96 370C208 370 216 366 278 366" className="visual-editorial-flow-trace" />

          {[{ x: 278, y: 94, width: 276 }, { x: 306, y: 194, width: 276 }, { x: 334, y: 294, width: 276 }].map((layer, index) => (
            <g key={layer.y} className={`visual-editorial-medallion-layer visual-editorial-compute-${index + 1}`}>
              <rect x={layer.x} y={layer.y} width={layer.width} height="72" rx="28" className={index === 0 ? "visual-editorial-layer-outer" : index === 1 ? "visual-editorial-layer-middle" : "visual-editorial-panel-hot"} />
              {[0, 1, 2, 3, 4].map((slot) => (
                <circle key={slot} cx={layer.x + 40 + slot * 48} cy={layer.y + 36} r={7 + index} className="visual-editorial-checkpoint" />
              ))}
            </g>
          ))}
          <path d="M430 166V194M458 266V294" className="visual-editorial-line-hot" markerEnd={arrow} />
          <path d="M610 330C650 330 650 240 686 240" className="visual-editorial-flow-trace" markerEnd={arrow} />
          <path d="M686 156H832V354H686Z" className="visual-editorial-success" />
          <path d="M666 156H852L820 102H698Z" className="visual-editorial-foundation" />
          {[720, 760, 800].map((x) => (
            <path key={x} d={`M${x} 188V320`} className="visual-editorial-detail" />
          ))}
          <path d="M666 354H852" className="visual-editorial-foundation" />
        </g>
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      <g data-visual-motif="partner-medallion-foundation">
        <circle cx="74" cy="126" r="20" className="visual-editorial-source" />
        <rect x="52" y="198" width="46" height="46" rx="9" className="visual-editorial-layer-middle" />
        <path d="M50 318L74 274L98 318Z" className="visual-editorial-panel-hot" />
        <path d="M94 126C188 126 188 150 250 150M98 221C190 221 188 220 250 220M98 306C190 306 188 290 250 290" className="visual-editorial-flow-trace" />

        {[{ x: 250, y: 112, width: 250 }, { x: 276, y: 194, width: 250 }, { x: 302, y: 276, width: 250 }].map((layer, index) => (
          <g key={layer.y} className={`visual-editorial-medallion-layer visual-editorial-compute-${index + 1}`}>
            <rect x={layer.x} y={layer.y} width={layer.width} height="64" rx="26" className={index === 0 ? "visual-editorial-layer-outer" : index === 1 ? "visual-editorial-layer-middle" : "visual-editorial-panel-hot"} />
            {[0, 1, 2, 3].map((slot) => (
              <circle key={slot} cx={layer.x + 42 + slot * 52} cy={layer.y + 32} r={7 + index} className="visual-editorial-checkpoint" />
            ))}
          </g>
        ))}
        <path d="M374 176V194M400 258V276" className="visual-editorial-line-hot" markerEnd={arrow} />
        <path d="M552 308C608 308 606 218 652 218" className="visual-editorial-flow-trace" markerEnd={arrow} />
        <path d="M652 154H810V326H652Z" className="visual-editorial-success" />
        <path d="M632 154H830L798 108H664Z" className="visual-editorial-foundation" />
        {[688, 730, 772].map((x) => (
          <path key={x} d={`M${x} 184V294`} className="visual-editorial-detail" />
        ))}
        <path d="M632 326H830" className="visual-editorial-foundation" />
        <InlineLabels labels={[
          { x: 96, text: copy.labels.a ?? "" },
          { x: 402, text: copy.labels.c ?? "" },
          { x: 732, text: copy.labels.d ?? "" },
        ]} />
      </g>
    </EditorialFrame>
  );
}

function ProductOsVisual({ copy, markerId, variant }: StoryProps) {
  const nodes = variant === "header"
    ? [{ x: 450, y: 76 }, { x: 716, y: 176 }, { x: 650, y: 372 }, { x: 250, y: 372 }, { x: 184, y: 176 }]
    : [{ x: 450, y: 100 }, { x: 680, y: 190 }, { x: 604, y: 342 }, { x: 296, y: 342 }, { x: 220, y: 190 }];

  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <path d="M450 94C630 94 728 184 728 240S630 386 450 386S172 296 172 240S270 94 450 94Z" className="visual-editorial-loop" />
        {[{ x: 450, y: 94 }, { x: 728, y: 240 }, { x: 450, y: 386 }, { x: 172, y: 240 }].map((node, index) => (
          <circle key={`${node.x}-${node.y}`} cx={node.x} cy={node.y} r={index === 1 ? 34 : 22} className={index === 1 ? "visual-editorial-checkpoint" : "visual-editorial-source"} />
        ))}
        <circle cx="450" cy="240" r="72" className="visual-editorial-panel-hot" />
        <CheckMark x={450} y={240} scale={0.7} />
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      <path
        d={`M${nodes.map((node) => `${node.x} ${node.y}`).join("L")}Z`}
        className="visual-editorial-loop"
      />
      {nodes.map((node, index) => (
        <g key={`${node.x}-${node.y}`}>
          <circle cx={node.x} cy={node.y} r={variant === "header" ? 28 : 24} className={index === 3 ? "visual-editorial-checkpoint" : "visual-editorial-source"} />
          {index < nodes.length - 1 ? (
            <circle cx={(node.x + nodes[index + 1]!.x) / 2} cy={(node.y + nodes[index + 1]!.y) / 2} r="7" className="visual-editorial-pulse-dot" />
          ) : null}
        </g>
      ))}
      <circle cx="450" cy="232" r={variant === "header" ? 92 : 76} className="visual-editorial-panel-hot" />
      <CheckMark x={450} y={232} scale={variant === "header" ? 0.86 : 0.7} />
      {variant === "inline" ? (
        <InlineLabels labels={[
          { x: 220, text: copy.labels.a ?? "" },
          { x: 450, text: copy.labels.c ?? "" },
          { x: 680, text: copy.labels.e ?? "" },
        ]} />
      ) : null}
    </EditorialFrame>
  );
}

function EngineeringShiftVisual({ copy, markerId, variant }: StoryProps) {
  const arrow = `url(#${markerId}-arrow)`;

  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <rect x="124" y="170" width="226" height="140" rx="42" className="visual-editorial-layer-middle" />
        {[162, 210, 258, 306].map((x) => (
          <path key={x} d={`M${x} 208V272`} className="visual-editorial-detail" />
        ))}
        <path d="M350 240H526" className="visual-editorial-flow-trace" />
        <circle cx="620" cy="240" r="104" className="visual-editorial-panel-hot" />
        {[0, 90, 180, 270].map((angle) => (
          <circle key={angle} cx={620 + Math.cos((angle * Math.PI) / 180) * 148} cy={240 + Math.sin((angle * Math.PI) / 180) * 148} r="17" className="visual-editorial-source" />
        ))}
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <rect x="72" y="158" width="230" height="164" rx="46" className="visual-editorial-layer-middle" />
        {[112, 156, 200, 244].map((x) => (
          <path key={x} d={`M${x} 198V282`} className="visual-editorial-detail" />
        ))}
        <path d="M302 240H424" className="visual-editorial-flow-trace" markerEnd={arrow} />
        <circle cx="570" cy="240" r="112" className="visual-editorial-panel-hot" />
        {[{ x: 570, y: 76 }, { x: 744, y: 158 }, { x: 752, y: 324 }, { x: 570, y: 404 }].map((node, index) => (
          <g key={`${node.x}-${node.y}`}>
            <path d={`M570 240L${node.x} ${node.y}`} className="visual-editorial-line-muted" />
            <circle cx={node.x} cy={node.y} r={index === 2 ? 24 : 17} className={index === 2 ? "visual-editorial-checkpoint" : "visual-editorial-source"} />
          </g>
        ))}
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      <rect x="54" y="154" width="194" height="140" rx="42" className="visual-editorial-layer-middle" />
      {[90, 126, 162, 198].map((x) => (
        <path key={x} d={`M${x} 190V258`} className="visual-editorial-detail" />
      ))}
      <path d="M248 224H360" className="visual-editorial-flow-trace" markerEnd={arrow} />
      <circle cx="516" cy="224" r="102" className="visual-editorial-panel-hot" />
      {[{ x: 516, y: 76 }, { x: 694, y: 142 }, { x: 718, y: 300 }, { x: 516, y: 354 }].map((node, index) => (
        <g key={`${node.x}-${node.y}`}>
          <path d={`M516 224L${node.x} ${node.y}`} className="visual-editorial-line-muted" />
          <circle cx={node.x} cy={node.y} r={index === 2 ? 23 : 16} className={index === 2 ? "visual-editorial-checkpoint" : "visual-editorial-source"} />
        </g>
      ))}
      <InlineLabels labels={[
        { x: 151, text: copy.labels.a ?? "" },
        { x: 516, text: copy.labels.c ?? "" },
        { x: 718, text: copy.labels.e ?? "" },
      ]} />
    </EditorialFrame>
  );
}

function ActivityLogVisual({ copy, markerId, variant }: StoryProps) {
  const arrow = `url(#${markerId}-arrow)`;

  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <g data-visual-motif="hybrid-log-search">
          <DatabaseGlyph x={228} y={154} width={144} height={166} />
          <g className="visual-editorial-search-index">
            <rect x="620" y="128" width="174" height="214" rx="46" className="visual-editorial-layer-outer" />
            <rect x="640" y="148" width="174" height="214" rx="46" className="visual-editorial-layer-middle" />
            <rect x="660" y="168" width="174" height="214" rx="46" className="visual-editorial-panel-hot" />
            {[212, 254, 296, 338].map((y, index) => (
              <path key={y} d={`M704 ${y}H${770 + index * 6}`} className="visual-editorial-detail" />
            ))}
          </g>
          <path d="M300 196C410 116 548 116 660 196" className="visual-editorial-line-hot" markerEnd={arrow} />
          <path d="M660 316C548 396 410 396 300 316" className="visual-editorial-flow-trace" markerEnd={arrow} />
          {[408, 470, 532].map((x, index) => (
            <circle key={x} cx={x} cy={154 - index * 5} r={7 + index} className="visual-editorial-checkpoint" />
          ))}
          <circle cx="744" cy="244" r="46" className="visual-editorial-ring" />
          <path d="M776 276L814 314" className="visual-editorial-line-hot" />
        </g>
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <g data-visual-motif="hybrid-log-search">
          <circle cx="50" cy="240" r="26" className="visual-editorial-source" />
          <path d="M76 240H126" className="visual-editorial-flow-trace" markerEnd={arrow} />
          <DatabaseGlyph x={206} y={132} width={158} height={204} />
          <g className="visual-editorial-search-index">
            <rect x="594" y="88" width="186" height="236" rx="50" className="visual-editorial-layer-outer" />
            <rect x="616" y="110" width="186" height="236" rx="50" className="visual-editorial-layer-middle" />
            <rect x="638" y="132" width="186" height="236" rx="50" className="visual-editorial-panel-hot" />
            {[180, 228, 276, 324].map((y, index) => (
              <path key={y} d={`M684 ${y}H${766 + index * 5}`} className="visual-editorial-detail" />
            ))}
          </g>
          <path d="M286 180C396 76 538 76 638 172" className="visual-editorial-line-hot" markerEnd={arrow} />
          <path d="M638 330C534 430 394 430 286 318" className="visual-editorial-flow-trace" markerEnd={arrow} />
          {[390, 456, 522].map((x, index) => (
            <circle key={x} cx={x} cy={132 - index * 4} r={7 + index} className="visual-editorial-checkpoint" />
          ))}
          <circle cx="730" cy="232" r="50" className="visual-editorial-ring" />
          <path d="M764 266L810 312" className="visual-editorial-line-hot" />
          <path d="M286 240H844" className="visual-editorial-line-muted" />
          <circle cx="856" cy="240" r="24" className="visual-editorial-success" />
          <CheckMark x={856} y={240} scale={0.3} />
        </g>
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      <g data-visual-motif="hybrid-log-search">
        <circle cx="42" cy="216" r="22" className="visual-editorial-source" />
        <path d="M64 216H100" className="visual-editorial-flow-trace" markerEnd={arrow} />
        <DatabaseGlyph x={176} y={126} width={140} height={178} />
        <g className="visual-editorial-search-index">
          <rect x="516" y="104" width="174" height="198" rx="46" className="visual-editorial-layer-outer" />
          <rect x="538" y="126" width="174" height="198" rx="46" className="visual-editorial-layer-middle" />
          <rect x="560" y="148" width="174" height="198" rx="46" className="visual-editorial-panel-hot" />
          {[190, 230, 270, 310].map((y, index) => (
            <path key={y} d={`M604 ${y}H${678 + index * 4}`} className="visual-editorial-detail" />
          ))}
        </g>
        <path d="M246 172C340 84 470 84 560 180" className="visual-editorial-line-hot" markerEnd={arrow} />
        <path d="M560 314C468 398 338 398 246 306" className="visual-editorial-flow-trace" markerEnd={arrow} />
        {[342, 404, 466].map((x, index) => (
          <circle key={x} cx={x} cy={130 - index * 4} r={7 + index} className="visual-editorial-checkpoint" />
        ))}
        <circle cx="646" cy="230" r="44" className="visual-editorial-ring" />
        <path d="M676 260L710 294" className="visual-editorial-line-hot" />
        <path d="M246 216H794" className="visual-editorial-line-muted" markerEnd={arrow} />
        <circle cx="824" cy="216" r="30" className="visual-editorial-success" />
        <CheckMark x={824} y={216} scale={0.38} />
        <InlineLabels compact labels={[
          { x: 176, text: copy.labels.a ?? "" },
          { x: 612, text: copy.labels.c ?? "" },
          { x: 812, text: copy.labels.e ?? "" },
        ]} />
      </g>
    </EditorialFrame>
  );
}

function DebounceVisual({ copy, markerId, variant }: StoryProps) {
  const arrow = `url(#${markerId}-arrow)`;

  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        {[134, 196, 258, 320].map((y, index) => (
          <circle key={y} cx={128 + index * 28} cy={y} r="15" className="visual-editorial-source" />
        ))}
        <path d="M148 134C286 134 270 240 380 240M176 196C286 196 284 240 380 240M204 258C292 258 292 240 380 240M232 320C302 320 304 240 380 240" className="visual-editorial-line-muted" />
        <rect x="380" y="144" width="174" height="192" rx="52" className="visual-editorial-panel-hot" />
        <circle cx="467" cy="240" r="34" className="visual-editorial-checkpoint" />
        <path d="M554 240H692" className="visual-editorial-flow-trace" />
        <rect x="692" y="172" width="122" height="136" rx="42" className="visual-editorial-success" />
        <CheckMark x={753} y={240} scale={0.52} />
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        {[104, 174, 244, 314, 384].map((y, index) => (
          <g key={y}>
            <circle cx={92 + index * 18} cy={y} r="15" className="visual-editorial-source" />
            <path d={`M${110 + index * 18} ${y}C268 ${y} 272 240 368 240`} className="visual-editorial-line-muted" />
          </g>
        ))}
        <rect x="368" y="116" width="214" height="248" rx="58" className="visual-editorial-panel-hot" />
        <circle cx="475" cy="240" r="44" className="visual-editorial-checkpoint visual-editorial-node-breathe" />
        <path d="M582 240H700" className="visual-editorial-flow-trace" />
        <rect x="700" y="150" width="132" height="180" rx="46" className="visual-editorial-success" />
        <CheckMark x={766} y={240} scale={0.62} />
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      {[128, 184, 240, 296].map((y, index) => (
        <g key={y}>
          <circle cx={76 + index * 20} cy={y} r="14" className="visual-editorial-source" />
          <path d={`M${94 + index * 20} ${y}C238 ${y} 242 218 334 218`} className="visual-editorial-line-muted" />
        </g>
      ))}
      <rect x="334" y="118" width="192" height="200" rx="54" className="visual-editorial-panel-hot" />
      <circle cx="430" cy="218" r="38" className="visual-editorial-checkpoint visual-editorial-node-breathe" />
      <path d="M526 218H658" className="visual-editorial-flow-trace" markerEnd={arrow} />
      <rect x="658" y="142" width="150" height="152" rx="46" className="visual-editorial-success" />
      <CheckMark x={733} y={218} scale={0.58} />
      <path d="M430 318V346H704" className="visual-editorial-detail" />
      <InlineLabels labels={[
        { x: 92, text: copy.labels.a ?? "" },
        { x: 430, text: `${copy.labels.b ?? ""} / ${copy.labels.c ?? ""}` },
        { x: 733, text: copy.labels.d ?? "" },
      ]} />
    </EditorialFrame>
  );
}

function JobContractVisual({ copy, markerId, variant }: StoryProps) {
  const arrow = `url(#${markerId}-arrow)`;
  const jobs = variant === "header" ? [122, 194, 266, 338] : [132, 194, 256, 318];

  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <circle cx="110" cy="240" r="38" className="visual-editorial-source" />
        <path d="M148 240H260" className="visual-editorial-flow-trace" />
        <g className="visual-editorial-queue-stack">
          {jobs.map((y, index) => (
            <rect key={y} x={260 + index * 8} y={y} width="132" height="42" rx="14" className="visual-editorial-layer-middle" />
          ))}
        </g>
        <path d="M424 240H518" className="visual-editorial-flow-trace" />
        <rect x="518" y="116" width="194" height="248" rx="58" className="visual-editorial-cloud-boundary" />
        <rect x="558" y="160" width="114" height="160" rx="40" className="visual-editorial-panel-hot" />
        <path d="M712 240H788" className="visual-editorial-line-hot" />
        <circle cx="806" cy="240" r="30" className="visual-editorial-success" />
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <circle cx="80" cy="240" r="40" className="visual-editorial-source" />
        <path d="M120 240H224" className="visual-editorial-flow-trace" />
        {jobs.map((y, index) => (
          <rect key={y} x={224 + index * 10} y={y} width="150" height="48" rx="15" className="visual-editorial-layer-middle" />
        ))}
        <path d="M414 240H496" className="visual-editorial-flow-trace" />
        <rect x="496" y="88" width="244" height="304" rx="64" className="visual-editorial-cloud-boundary" />
        <rect x="546" y="140" width="144" height="200" rx="46" className="visual-editorial-panel-hot" />
        <path d="M740 240H812" className="visual-editorial-line-hot" />
        <circle cx="832" cy="240" r="32" className="visual-editorial-success" />
        <CheckMark x={832} y={240} scale={0.42} />
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      <circle cx="68" cy="218" r="32" className="visual-editorial-source" />
      <path d="M100 218H190" className="visual-editorial-flow-trace" markerEnd={arrow} />
      {[126, 182, 238, 294].map((y, index) => (
        <rect key={y} x={190 + index * 8} y={y} width="130" height="44" rx="14" className="visual-editorial-layer-middle" />
      ))}
      <path d="M352 218H438" className="visual-editorial-flow-trace" markerEnd={arrow} />
      <rect x="438" y="104" width="230" height="228" rx="58" className="visual-editorial-cloud-boundary" />
      <rect x="486" y="144" width="134" height="148" rx="44" className="visual-editorial-panel-hot" />
      <path d="M668 218H752" className="visual-editorial-line-hot" markerEnd={arrow} />
      <circle cx="790" cy="218" r="42" className="visual-editorial-success" />
      <CheckMark x={790} y={218} scale={0.52} />
      <InlineLabels labels={[
        { x: 68, text: copy.labels.a ?? "" },
        { x: 270, text: copy.labels.b ?? "" },
        { x: 553, text: `${copy.labels.c ?? ""} / ${copy.labels.d ?? ""}` },
        { x: 790, text: copy.labels.e ?? "" },
      ]} />
    </EditorialFrame>
  );
}

function JoiningRockfiVisual({ copy, markerId, variant }: StoryProps) {
  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <g data-visual-motif="new-chapter-foundation">
          <path d="M92 128C214 96 324 108 450 170V366C324 312 210 308 92 344Z" className="visual-editorial-book-page" />
          <path d="M450 170C574 108 690 96 812 128V344C690 308 576 312 450 366Z" className="visual-editorial-book-page visual-editorial-book-page-current" />
          <path d="M450 170V366" className="visual-editorial-book-spine" />
          {[{ x: 166, y: 178 }, { x: 266, y: 216 }, { x: 364, y: 264 }].map((point, index) => (
            <g key={`${point.x}-${point.y}`}>
              {index > 0 ? <path d={`M${point.x - 100} ${point.y - 38}L${point.x} ${point.y}`} className="visual-editorial-line-muted" /> : null}
              <circle cx={point.x} cy={point.y} r={12 + index * 2} className="visual-editorial-source" />
            </g>
          ))}
          <path d="M500 300V246H558V214H616V178H674V142H742" className="visual-editorial-foundation" />
          {[532, 590, 648, 706].map((x, index) => (
            <rect key={x} x={x} y={276 - index * 34} width="54" height={48 + index * 34} rx="12" className={index === 3 ? "visual-editorial-panel-hot" : "visual-editorial-layer-middle"} />
          ))}
          <circle cx="742" cy="142" r="18" className="visual-editorial-checkpoint" />
        </g>
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <g data-visual-motif="new-chapter-foundation">
          <path d="M52 102C190 66 318 82 450 154V396C318 330 188 326 52 370Z" className="visual-editorial-book-page" />
          <path d="M450 154C582 82 710 66 848 102V370C712 326 582 330 450 396Z" className="visual-editorial-book-page visual-editorial-book-page-current" />
          <path d="M450 154V396" className="visual-editorial-book-spine" />
          {[{ x: 128, y: 158 }, { x: 244, y: 206 }, { x: 364, y: 270 }].map((point, index) => (
            <g key={`${point.x}-${point.y}`}>
              {index > 0 ? <path d={`M${point.x - 116} ${point.y - 48}L${point.x} ${point.y}`} className="visual-editorial-line-muted" /> : null}
              <circle cx={point.x} cy={point.y} r={13 + index * 2} className="visual-editorial-source" />
            </g>
          ))}
          <path d="M494 326V276H556V234H618V190H680V146H760" className="visual-editorial-foundation" />
          {[526, 588, 650, 712].map((x, index) => (
            <rect key={x} x={x} y={300 - index * 42} width="58" height={54 + index * 42} rx="13" className={index === 3 ? "visual-editorial-panel-hot" : "visual-editorial-layer-middle"} />
          ))}
          <circle cx="760" cy="146" r="20" className="visual-editorial-checkpoint visual-editorial-node-breathe" />
          {[{ x: 788, y: 212 }, { x: 814, y: 270 }, { x: 770, y: 318 }].map((partner) => (
            <g key={`${partner.x}-${partner.y}`}>
              <path d={`M760 166L${partner.x} ${partner.y}`} className="visual-editorial-line-muted" />
              <circle cx={partner.x} cy={partner.y} r="9" className="visual-editorial-success" />
            </g>
          ))}
        </g>
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      <g data-visual-motif="new-chapter-foundation">
        <path d="M54 106C184 76 304 88 430 154V342C304 292 184 290 54 322Z" className="visual-editorial-book-page" />
        <path d="M430 154C556 88 676 76 846 106V322C676 290 556 292 430 342Z" className="visual-editorial-book-page visual-editorial-book-page-current" />
        <path d="M430 154V342" className="visual-editorial-book-spine" />
        {[{ x: 124, y: 158 }, { x: 240, y: 204 }, { x: 356, y: 256 }].map((point, index) => (
          <g key={`${point.x}-${point.y}`}>
            {index > 0 ? <path d={`M${point.x - 116} ${point.y - 46}L${point.x} ${point.y}`} className="visual-editorial-line-muted" /> : null}
            <circle cx={point.x} cy={point.y} r={12 + index * 2} className="visual-editorial-source" />
          </g>
        ))}
        <path d="M478 296V254H536V216H594V178H652V140H730" className="visual-editorial-foundation" />
        {[508, 566, 624, 682].map((x, index) => (
          <rect key={x} x={x} y={276 - index * 38} width="54" height={48 + index * 38} rx="12" className={index === 3 ? "visual-editorial-panel-hot" : "visual-editorial-layer-middle"} />
        ))}
        <circle cx="730" cy="140" r="18" className="visual-editorial-checkpoint" />
        {[
          { x: 124, text: copy.labels.a ?? "" },
          { x: 240, text: copy.labels.b ?? "" },
          { x: 356, text: copy.labels.c ?? "" },
          { x: 714, text: copy.labels.e ?? "" },
        ].map((label) => (
          <text key={`${label.x}-${label.text}`} x={label.x} y="388" textAnchor="middle" className="visual-editorial-label visual-editorial-label-compact">
            {label.text}
          </text>
        ))}
      </g>
    </EditorialFrame>
  );
}

function BackpressureVisual({ copy, markerId, variant }: StoryProps) {
  const arrow = `url(#${markerId}-arrow)`;

  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <g data-visual-motif="backpressure-return">
          <circle cx="86" cy="196" r="34" className="visual-editorial-source" />
          <path d="M120 196H238" className="visual-editorial-flow-trace" markerEnd={arrow} />
          {[148, 176, 204, 232, 260].map((x, index) => (
            <circle key={x} cx={x} cy="196" r="8" className={`visual-editorial-data-packet visual-editorial-compute-${(index % 4) + 1}`} />
          ))}
          <rect x="270" y="112" width="190" height="168" rx="44" className="visual-editorial-layer-middle" />
          {[0, 1, 2, 3, 4].map((slot) => (
            <rect key={slot} x={298 + slot * 30} y="146" width="20" height="98" rx="10" className={slot < 4 ? "visual-editorial-buffer-slot-full" : "visual-editorial-buffer-slot"} />
          ))}
          <path d="M460 196H566" className="visual-editorial-flow-trace" markerEnd={arrow} />
          <rect x="566" y="128" width="112" height="136" rx="38" className="visual-editorial-panel-hot" />
          <path d="M594 164H650M594 198H638M594 232H622" className="visual-editorial-detail" />
          <path d="M678 196H744" className="visual-editorial-flow-trace" markerEnd={arrow} />
          <path d="M744 126H832V282H744Z" className="visual-editorial-success" />
          <path d="M766 164H810M766 202H810M766 240H810" className="visual-editorial-detail" />

          <path d="M806 326C650 382 320 382 126 326" className="visual-editorial-pressure-return" />
          <path d="M126 326L160 304M126 326L162 344" className="visual-editorial-pressure-return" />
        </g>
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <g data-visual-motif="backpressure-return">
          <circle cx="58" cy="188" r="36" className="visual-editorial-source" />
          <path d="M94 188H226" className="visual-editorial-flow-trace" markerEnd={arrow} />
          {[126, 158, 190, 222, 254].map((x, index) => (
            <circle key={x} cx={x} cy="188" r="8" className={`visual-editorial-data-packet visual-editorial-compute-${(index % 4) + 1}`} />
          ))}
          <rect x="258" y="86" width="216" height="204" rx="50" className="visual-editorial-layer-middle" />
          {[0, 1, 2, 3, 4, 5].map((slot) => (
            <rect key={slot} x={288 + slot * 30} y="126" width="20" height="124" rx="10" className={slot < 5 ? "visual-editorial-buffer-slot-full" : "visual-editorial-buffer-slot"} />
          ))}
          <path d="M474 188H580" className="visual-editorial-flow-trace" markerEnd={arrow} />
          <rect x="580" y="104" width="122" height="168" rx="42" className="visual-editorial-panel-hot" />
          <path d="M610 146H672M610 188H660M610 230H644" className="visual-editorial-detail" />
          <path d="M702 188H766" className="visual-editorial-flow-trace" markerEnd={arrow} />
          <path d="M766 94H856V282H766Z" className="visual-editorial-success" />
          <path d="M788 140H834M788 188H834M788 236H834" className="visual-editorial-detail" />
          <path d="M824 340C654 420 286 420 102 340" className="visual-editorial-pressure-return" />
          <path d="M102 340L138 316M102 340L140 360" className="visual-editorial-pressure-return" />
        </g>
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      <g data-visual-motif="backpressure-return">
        <circle cx="60" cy="188" r="30" className="visual-editorial-source" />
        <path d="M90 188H216" className="visual-editorial-flow-trace" markerEnd={arrow} />
        {[118, 148, 178, 208].map((x, index) => (
          <circle key={x} cx={x} cy="188" r="7" className={`visual-editorial-data-packet visual-editorial-compute-${index + 1}`} />
        ))}
        <rect x="226" y="104" width="212" height="168" rx="46" className="visual-editorial-layer-middle" />
        {[0, 1, 2, 3, 4, 5].map((slot) => (
          <rect key={slot} x={254 + slot * 28} y="138" width="18" height="100" rx="9" className={slot < 5 ? "visual-editorial-buffer-slot-full" : "visual-editorial-buffer-slot"} />
        ))}
        <path d="M438 188H538" className="visual-editorial-flow-trace" markerEnd={arrow} />
        <rect x="538" y="120" width="112" height="136" rx="38" className="visual-editorial-panel-hot" />
        <path d="M566 154H622M566 188H612M566 222H600" className="visual-editorial-detail" />
        <path d="M650 188H726" className="visual-editorial-flow-trace" markerEnd={arrow} />
        <path d="M726 104H818V272H726Z" className="visual-editorial-success" />
        <path d="M748 146H796M748 188H796M748 230H796" className="visual-editorial-detail" />
        <path d="M786 304C632 366 278 366 106 304" className="visual-editorial-pressure-return" />
        <path d="M106 304L138 282M106 304L140 324" className="visual-editorial-pressure-return" />
        <text x="452" y="340" textAnchor="middle" className="visual-editorial-label visual-editorial-label-hot visual-editorial-label-compact">
          {copy.labels.c ?? ""}
        </text>
        {[
          { x: 90, text: copy.labels.a ?? "" },
          { x: 332, text: copy.labels.b ?? "" },
          { x: 772, text: copy.labels.e ?? "" },
        ].map((label) => (
          <text key={`${label.x}-${label.text}`} x={label.x} y="390" textAnchor="middle" className="visual-editorial-label visual-editorial-label-compact">
            {label.text}
          </text>
        ))}
      </g>
    </EditorialFrame>
  );
}

function PolymagineVisual({ copy, markerId, variant }: StoryProps) {
  const arrow = `url(#${markerId}-arrow)`;

  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <path d="M154 116C104 144 96 216 120 280S196 372 246 326C280 294 274 242 248 210C218 174 220 110 154 116Z" className="visual-editorial-face" />
        <path d="M104 226H278" className="visual-editorial-scan-line" />
        <path d="M278 240H386" className="visual-editorial-flow-trace" />
        <path d="M404 142L518 112L610 180L590 304L462 330L392 246Z" className="visual-editorial-mesh" />
        <path d="M610 240H686" className="visual-editorial-flow-trace" />
        <circle cx="728" cy="226" r="44" className="visual-editorial-success" />
        <circle cx="808" cy="226" r="44" className="visual-editorial-success" />
        <path d="M772 222H764M684 214L658 196M852 214L872 196" className="visual-editorial-detail" />
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <path d="M122 86C58 122 54 220 88 300S190 408 252 348C294 306 286 238 252 198C212 152 216 78 122 86Z" className="visual-editorial-face" />
        <path d="M54 220H288" className="visual-editorial-scan-line" />
        <path d="M288 240H370" className="visual-editorial-flow-trace" markerEnd={arrow} />
        <path d="M388 112L520 78L632 164L608 330L460 362L374 246Z" className="visual-editorial-mesh" />
        <path d="M632 240H692" className="visual-editorial-flow-trace" />
        <circle cx="740" cy="222" r="50" className="visual-editorial-success" />
        <circle cx="830" cy="222" r="50" className="visual-editorial-success" />
        <path d="M790 218H780M690 208L660 184M880 208L894 184" className="visual-editorial-detail" />
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      <path d="M116 108C68 134 62 206 88 270S164 356 214 312C248 282 242 232 216 202C186 166 190 102 116 108Z" className="visual-editorial-face" />
      <path d="M62 210H250" className="visual-editorial-scan-line" />
      <path d="M250 218H348" className="visual-editorial-flow-trace" markerEnd={arrow} />
      <path d="M366 132L476 100L574 166L554 294L430 322L352 226Z" className="visual-editorial-mesh" />
      <path d="M574 218H652" className="visual-editorial-flow-trace" markerEnd={arrow} />
      <circle cx="706" cy="208" r="42" className="visual-editorial-success" />
      <circle cx="786" cy="208" r="42" className="visual-editorial-success" />
      <path d="M748 204H744M650 196L626 180M828 196L848 180" className="visual-editorial-detail" />
      <InlineLabels labels={[
        { x: 144, text: copy.labels.a ?? "" },
        { x: 463, text: copy.labels.c ?? "" },
        { x: 746, text: `${copy.labels.d ?? ""} / ${copy.labels.e ?? ""}` },
      ]} />
    </EditorialFrame>
  );
}

function PostgresNullVisual({ copy, markerId, variant }: StoryProps) {
  const arrow = `url(#${markerId}-arrow)`;

  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        {[170, 310].map((y) => (
          <g key={y}>
            <rect x="104" y={y - 42} width="206" height="84" rx="26" className="visual-editorial-layer-middle" />
            <circle cx="252" cy={y} r="18" className="visual-editorial-null" />
          </g>
        ))}
        <path d="M310 170C400 170 390 240 450 240M310 310C400 310 390 240 450 240" className="visual-editorial-line-muted" />
        <rect x="450" y="126" width="180" height="228" rx="56" className="visual-editorial-panel-hot" />
        <path d="M500 240H580" className="visual-editorial-null-bridge" />
        <path d="M630 240H718" className="visual-editorial-line-hot" />
        <rect x="718" y="174" width="104" height="132" rx="40" className="visual-editorial-success" />
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        {[148, 332].map((y) => (
          <g key={y}>
            <rect x="72" y={y - 48} width="238" height="96" rx="28" className="visual-editorial-layer-middle" />
            <circle cx="248" cy={y} r="20" className="visual-editorial-null" />
          </g>
        ))}
        <path d="M310 148C414 148 400 240 458 240M310 332C414 332 400 240 458 240" className="visual-editorial-line-muted" />
        <rect x="458" y="102" width="206" height="276" rx="62" className="visual-editorial-panel-hot" />
        <path d="M510 240H612" className="visual-editorial-null-bridge" />
        <path d="M664 240H748" className="visual-editorial-line-hot" />
        <rect x="748" y="150" width="112" height="180" rx="44" className="visual-editorial-success" />
        <CheckMark x={804} y={240} scale={0.52} />
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      {[146, 286].map((y) => (
        <g key={y}>
          <rect x="54" y={y - 40} width="210" height="80" rx="24" className="visual-editorial-layer-middle" />
          <circle cx="214" cy={y} r="17" className="visual-editorial-null" />
        </g>
      ))}
      <path d="M264 146C352 146 346 216 408 216M264 286C352 286 346 216 408 216" className="visual-editorial-line-muted" />
      <rect x="408" y="112" width="194" height="208" rx="56" className="visual-editorial-panel-hot" />
      <path d="M460 216H550" className="visual-editorial-null-bridge" />
      <path d="M602 216H706" className="visual-editorial-line-hot" markerEnd={arrow} />
      <rect x="706" y="140" width="132" height="152" rx="44" className="visual-editorial-success" />
      <CheckMark x={772} y={216} scale={0.54} />
      <InlineLabels labels={[
        { x: 158, text: `${copy.labels.a ?? ""} + ${copy.labels.b ?? ""}` },
        { x: 505, text: copy.labels.c ?? "" },
        { x: 772, text: copy.labels.d ?? "" },
      ]} />
    </EditorialFrame>
  );
}

function RedisFailureDomainVisual({ copy, markerId, variant }: StoryProps) {
  const tankX = variant === "header" ? 390 : 376;
  const tankWidth = variant === "header" ? 220 : 198;

  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        {[142, 240, 338].map((y, index) => (
          <g key={y}>
            <circle cx="114" cy={y} r={18 + index * 2} className="visual-editorial-source" />
            <path d={`M136 ${y}C258 ${y} 260 240 376 240`} className="visual-editorial-line-muted" />
          </g>
        ))}
        <rect x="376" y="86" width="198" height="308" rx="58" className="visual-editorial-memory-tank" />
        <rect x="394" y="142" width="162" height="234" rx="40" className="visual-editorial-memory-fill" />
        <path d="M390 136H560" className="visual-editorial-memory-limit" />
        <path d="M574 240H650" className="visual-editorial-rejected" />
        {[134, 240, 346].map((y) => (
          <rect key={y} x="680" y={y - 36} width="132" height="72" rx="24" className="visual-editorial-success" />
        ))}
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        {[112, 198, 284, 370].map((y, index) => (
          <g key={y}>
            <circle cx="88" cy={y} r={16 + index * 2} className="visual-editorial-source" />
            <path d={`M110 ${y}C264 ${y} 270 240 390 240`} className="visual-editorial-line-muted" />
          </g>
        ))}
        <rect x={tankX} y="58" width={tankWidth} height="364" rx="64" className="visual-editorial-memory-tank" />
        <rect x="410" y="116" width="180" height="286" rx="44" className="visual-editorial-memory-fill" />
        <path d="M404 108H596" className="visual-editorial-memory-limit" />
        <path d="M610 240H680" className="visual-editorial-rejected" />
        {[112, 240, 368].map((y) => (
          <rect key={y} x="706" y={y - 42} width="144" height="84" rx="26" className="visual-editorial-success" />
        ))}
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      {[132, 214, 296].map((y, index) => (
        <g key={y}>
          <circle cx="72" cy={y} r={16 + index * 2} className="visual-editorial-source" />
          <path d={`M94 ${y}C224 ${y} 232 214 342 214`} className="visual-editorial-line-muted" />
        </g>
      ))}
      <rect x="342" y="76" width="202" height="290" rx="60" className="visual-editorial-memory-tank" />
      <rect x="360" y="128" width="166" height="220" rx="42" className="visual-editorial-memory-fill" />
      <path d="M356 120H530" className="visual-editorial-memory-limit" />
      <path d="M544 214H620" className="visual-editorial-rejected" />
      {[118, 214, 310].map((y, index) => (
        <rect key={y} x="650" y={y - 34} width="166" height="68" rx="24" className={index === 1 ? "visual-editorial-success" : "visual-editorial-layer-middle"} />
      ))}
      <InlineLabels labels={[
        { x: 94, text: copy.labels.workloads ?? "" },
        { x: 443, text: copy.labels.d ?? "" },
        { x: 733, text: copy.labels.e ?? "" },
      ]} />
    </EditorialFrame>
  );
}

function ScimRealityVisual({ copy, markerId, variant }: StoryProps) {
  const arrow = `url(#${markerId}-arrow)`;

  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        {[130, 240, 350].map((y, index) => (
          <g key={y}>
            <path d={`M92 ${y}L128 ${y - 26}L164 ${y}L164 ${y + 52}L128 ${y + 78}L92 ${y + 52}Z`} className="visual-editorial-layer-middle" />
            <path d={`M164 ${y + 26}C274 ${y + 26} 276 240 360 240`} className={index === 1 ? "visual-editorial-line-hot" : "visual-editorial-line-muted"} />
          </g>
        ))}
        <rect x="360" y="118" width="194" height="244" rx="58" className="visual-editorial-panel-hot" />
        <path d="M404 180H510M422 240H492M440 300H474" className="visual-editorial-detail" />
        <path d="M554 240H646" className="visual-editorial-flow-trace" />
        {[142, 240, 338].map((y, index) => (
          <rect key={y} x="674" y={y - 34} width="144" height="68" rx="24" className={index === 1 ? "visual-editorial-success" : "visual-editorial-layer-middle"} />
        ))}
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        {[102, 220, 338].map((y, index) => (
          <g key={y}>
            <path d={`M58 ${y}L102 ${y - 28}L146 ${y}L146 ${y + 56}L102 ${y + 84}L58 ${y + 56}Z`} className="visual-editorial-layer-middle" />
            <path d={`M146 ${y + 28}C278 ${y + 28} 284 240 370 240`} className={index === 1 ? "visual-editorial-line-hot" : "visual-editorial-line-muted"} />
          </g>
        ))}
        <rect x="370" y="90" width="220" height="300" rx="62" className="visual-editorial-panel-hot" />
        <path d="M420 158H540M438 240H522M458 322H502" className="visual-editorial-detail" />
        <path d="M590 240H666" className="visual-editorial-flow-trace" />
        {[112, 240, 368].map((y, index) => (
          <rect key={y} x="694" y={y - 42} width="156" height="84" rx="26" className={index === 1 ? "visual-editorial-success" : "visual-editorial-layer-middle"} />
        ))}
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      {[114, 210, 306].map((y, index) => (
        <g key={y}>
          <path d={`M42 ${y}L78 ${y - 22}L114 ${y}L114 ${y + 44}L78 ${y + 66}L42 ${y + 44}Z`} className="visual-editorial-layer-middle" />
          <path d={`M114 ${y + 22}C224 ${y + 22} 232 210 320 210`} className={index === 1 ? "visual-editorial-line-hot" : "visual-editorial-line-muted"} />
        </g>
      ))}
      <rect x="320" y="98" width="210" height="224" rx="58" className="visual-editorial-panel-hot" />
      <path d="M368 152H482M386 210H464M404 268H446" className="visual-editorial-detail" />
      <path d="M530 210H616" className="visual-editorial-flow-trace" markerEnd={arrow} />
      {[112, 210, 308].map((y, index) => (
        <g key={y}>
          <rect x="646" y={y - 34} width="158" height="68" rx="24" className={index === 1 ? "visual-editorial-success" : "visual-editorial-layer-middle"} />
          <circle cx="830" cy={y} r={index === 1 ? 13 : 8} className={index === 1 ? "visual-editorial-checkpoint" : "visual-editorial-source"} />
        </g>
      ))}
      <path d="M830 112V308" className="visual-editorial-audit-line" />
      <InlineLabels labels={[
        { x: 78, text: copy.labels.a ?? "" },
        { x: 425, text: `${copy.labels.b ?? ""} / ${copy.labels.c ?? ""}` },
        { x: 725, text: copy.labels.e ?? "" },
      ]} />
    </EditorialFrame>
  );
}

function FederatedTrustVisual({ copy, markerId, variant }: StoryProps) {
  const arrow = `url(#${markerId}-arrow)`;

  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <rect x="78" y="132" width="226" height="216" rx="58" className="visual-editorial-cloud-boundary" />
        <circle cx="190" cy="240" r="50" className="visual-editorial-source" />
        <circle cx="450" cy="240" r="84" className="visual-editorial-panel-hot" />
        <path d="M240 210C324 124 368 142 404 188M496 188C532 142 576 124 660 210" className="visual-editorial-flow-trace" />
        <path d="M660 270C576 356 532 338 496 292M404 292C368 338 324 356 240 270" className="visual-editorial-line-hot" />
        <rect x="660" y="132" width="162" height="216" rx="58" className="visual-editorial-success" />
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <rect x="46" y="102" width="246" height="276" rx="62" className="visual-editorial-cloud-boundary" />
        <circle cx="168" cy="240" r="56" className="visual-editorial-source" />
        <circle cx="450" cy="240" r="96" className="visual-editorial-panel-hot" />
        <circle cx="450" cy="240" r="42" className="visual-editorial-checkpoint" />
        <path d="M224 202C320 98 368 126 402 176M498 176C532 126 580 98 676 202" className="visual-editorial-flow-trace" />
        <path d="M676 278C580 382 532 354 498 304M402 304C368 354 320 382 224 278" className="visual-editorial-line-hot" />
        <rect x="676" y="102" width="178" height="276" rx="62" className="visual-editorial-success" />
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      <rect x="40" y="112" width="214" height="224" rx="56" className="visual-editorial-cloud-boundary" />
      <circle cx="146" cy="224" r="48" className="visual-editorial-source" />
      <circle cx="450" cy="224" r="90" className="visual-editorial-panel-hot" />
      <circle cx="450" cy="224" r="38" className="visual-editorial-checkpoint" />
      <path d="M194 190C300 94 364 118 402 164M498 164C536 118 600 94 706 190" className="visual-editorial-flow-trace" markerEnd={arrow} />
      <path d="M706 258C600 354 536 330 498 284M402 284C364 330 300 354 194 258" className="visual-editorial-line-hot" markerEnd={arrow} />
      <rect x="706" y="112" width="154" height="224" rx="56" className="visual-editorial-success" />
      <InlineLabels labels={[
        { x: 146, text: copy.labels.b ?? "" },
        { x: 450, text: copy.labels.d ?? "" },
        { x: 783, text: copy.labels.c ?? "" },
      ]} />
    </EditorialFrame>
  );
}

const TRAIL_SAINT_JACQUES_PROFILE = "M40 350L62 302L76 247L92 236L105 206L122 213L138 264L150 273L170 337L182 310L199 285L214 255L223 206L234 188L244 236L251 193L262 201L285 225L295 256L312 283L334 321L353 295L363 262L374 244L388 248L403 244L415 199L441 160L470 144L486 160L504 153L525 159L547 134L573 181L603 123L627 126L640 161L654 199L676 234L696 250L714 259L741 285L755 260L768 255L783 275L796 289L807 300L815 296L834 301L849 340L860 343";

function RaceJourneyVisual({ copy, markerId, variant }: StoryProps) {
  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <g data-visual-motif="saint-jacques-course-profile">
          <path d={`${TRAIL_SAINT_JACQUES_PROFILE}L860 372H40Z`} className="visual-editorial-course-area" />
          <path d={TRAIL_SAINT_JACQUES_PROFILE} className="visual-editorial-course-profile" />
          <circle cx="40" cy="350" r="10" className="visual-editorial-source" />
          <circle cx="676" cy="234" r="20" className="visual-editorial-checkpoint visual-editorial-node-breathe" />
          <path d="M676 214V150" className="visual-editorial-course-marker" />
          <circle cx="842" cy="328" r="13" className="visual-editorial-success" />
          <circle cx="860" cy="343" r="13" className="visual-editorial-success" />
        </g>
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <g data-visual-motif="saint-jacques-course-profile">
          <path d={`${TRAIL_SAINT_JACQUES_PROFILE}L860 394H40Z`} className="visual-editorial-course-area" />
          <path d={TRAIL_SAINT_JACQUES_PROFILE} className="visual-editorial-course-profile" />
          <circle cx="40" cy="350" r="11" className="visual-editorial-source" />
          <path d="M170 337V382" className="visual-editorial-course-marker visual-editorial-course-marker-danger" />
          <circle cx="170" cy="337" r="12" className="visual-editorial-panel-hot" />
          <circle cx="676" cy="234" r="22" className="visual-editorial-checkpoint visual-editorial-node-breathe" />
          <path d="M676 212V112" className="visual-editorial-course-marker" />
          <circle cx="842" cy="328" r="14" className="visual-editorial-success" />
          <circle cx="860" cy="343" r="14" className="visual-editorial-success" />
        </g>
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      <g data-visual-motif="saint-jacques-course-profile">
        <path d={`${TRAIL_SAINT_JACQUES_PROFILE}L860 366H40Z`} className="visual-editorial-course-area" />
        <path d={TRAIL_SAINT_JACQUES_PROFILE} className="visual-editorial-course-profile" />
        <circle cx="40" cy="350" r="10" className="visual-editorial-source" />
        <path d="M170 337V366" className="visual-editorial-course-marker visual-editorial-course-marker-danger" />
        <circle cx="170" cy="337" r="11" className="visual-editorial-panel-hot" />
        <circle cx="676" cy="234" r="20" className="visual-editorial-checkpoint visual-editorial-node-breathe" />
        <path d="M676 214V158" className="visual-editorial-course-marker" />
        <circle cx="842" cy="328" r="13" className="visual-editorial-success" />
        <circle cx="860" cy="343" r="13" className="visual-editorial-success" />
        {[
          { x: 82, text: copy.labels.start ?? "" },
          { x: 262, text: copy.labels.four ?? "" },
          { x: 650, text: copy.labels.checkpoint ?? "" },
          { x: 814, text: copy.labels.sport ?? "" },
        ].map((label) => (
          <text key={`${label.x}-${label.text}`} x={label.x} y="404" textAnchor="middle" className="visual-editorial-label visual-editorial-label-compact">
            {label.text}
          </text>
        ))}
      </g>
    </EditorialFrame>
  );
}

function EnduranceWatchVisual({ copy, markerId, variant }: StoryProps) {
  const centerX = variant === "header" ? 286 : 300;
  const radius = variant === "header" ? 140 : 122;

  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <circle cx="310" cy="240" r="132" className="visual-editorial-watch-ring" />
        <circle cx="310" cy="240" r="82" className="visual-editorial-panel-hot" />
        <path d="M310 240L310 156M310 240L380 240" className="visual-editorial-detail" />
        <path d="M522 304V210H580V304M626 304V118H684V304M730 304V88H788V304" className="visual-editorial-battery-bars" />
        <path d="M514 322H804" className="visual-editorial-foundation" />
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <circle cx={centerX} cy="240" r={radius} className="visual-editorial-watch-ring" />
        <circle cx={centerX} cy="240" r="92" className="visual-editorial-panel-hot" />
        <path d={`M${centerX} 240V132M${centerX} 240L${centerX + 78} 240`} className="visual-editorial-detail" />
        <path d="M530 326V232H596V326M638 326V128H704V326M746 326V84H812V326" className="visual-editorial-battery-bars" />
        <path d="M516 348H830" className="visual-editorial-foundation" />
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      <circle cx="266" cy="218" r="116" className="visual-editorial-watch-ring" />
      <circle cx="266" cy="218" r="76" className="visual-editorial-panel-hot" />
      <path d="M266 218V132M266 218L332 218" className="visual-editorial-detail" />
      <path d="M484 304V220H548V304M596 304V134H660V304M708 304V88H772V304" className="visual-editorial-battery-bars" />
      <path d="M468 322H790" className="visual-editorial-foundation" />
      <InlineLabels labels={[
        { x: 266, text: copy.labels.objective ?? "" },
        { x: 516, text: copy.labels.smartShort ?? "" },
        { x: 740, text: copy.labels.sportShort ?? "" },
      ]} />
    </EditorialFrame>
  );
}

function TrailVisual(props: StoryProps) {
  return props.slug === "trail-saint-jacques-100k-2026"
    ? <RaceJourneyVisual {...props} />
    : <EnduranceWatchVisual {...props} />;
}

export function EditorialPostVisual({
  copy,
  markerId,
  slug,
  variant,
  visualId,
}: EditorialPostVisualProps) {
  switch (visualId) {
    case "agent-battle-2026":
      return <AgentChoiceVisual copy={copy} markerId={markerId} slug={slug} variant={variant} />;
    case "bounded-ai-loop":
      return <BoundedAiVisual copy={copy} markerId={markerId} slug={slug} variant={variant} />;
    case "ai-force-multiplier":
      return <ForceMultiplierVisual copy={copy} markerId={markerId} slug={slug} variant={variant} />;
    case "sse-outbound-channel":
      return <SseChannelVisual copy={copy} markerId={markerId} slug={slug} variant={variant} />;
    case "backend-to-data-engineer-rockfi":
      return <DataFoundationVisual copy={copy} markerId={markerId} slug={slug} variant={variant} />;
    case "claude-code-product-os":
      return <ProductOsVisual copy={copy} markerId={markerId} slug={slug} variant={variant} />;
    case "engineering-2026-ai-redefined-our-job":
      return <EngineeringShiftVisual copy={copy} markerId={markerId} slug={slug} variant={variant} />;
    case "forest-admin-activity-logs-elasticsearch":
      return <ActivityLogVisual copy={copy} markerId={markerId} slug={slug} variant={variant} />;
    case "idempotency-debounce-jobify-bullmq":
      return <DebounceVisual copy={copy} markerId={markerId} slug={slug} variant={variant} />;
    case "jobify-workers-queues-nestjs":
      return <JobContractVisual copy={copy} markerId={markerId} slug={slug} variant={variant} />;
    case "joining-rockfi":
      return <JoiningRockfiVisual copy={copy} markerId={markerId} slug={slug} variant={variant} />;
    case "nodejs-stream-backpressure-history-export":
      return <BackpressureVisual copy={copy} markerId={markerId} slug={slug} variant={variant} />;
    case "polymagine-industry-4-eyewear-2017":
      return <PolymagineVisual copy={copy} markerId={markerId} slug={slug} variant={variant} />;
    case "postgresql-unique-nulls":
      return <PostgresNullVisual copy={copy} markerId={markerId} slug={slug} variant={variant} />;
    case "redis-memory-exhaustion-post-mortem":
      return <RedisFailureDomainVisual copy={copy} markerId={markerId} slug={slug} variant={variant} />;
    case "scim-user-provisioning-forest-admin":
      return <ScimRealityVisual copy={copy} markerId={markerId} slug={slug} variant={variant} />;
    case "security-authentication-idp-openid-connect":
      return <FederatedTrustVisual copy={copy} markerId={markerId} slug={slug} variant={variant} />;
    case "trail-endurance-profile":
      return <TrailVisual copy={copy} markerId={markerId} slug={slug} variant={variant} />;
    default:
      return null;
  }
}
