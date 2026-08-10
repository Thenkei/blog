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
}: {
  labels: ReadonlyArray<{ x: number; text: string }>;
}) {
  return labels.map(({ x, text }) => (
    <text key={`${x}-${text}`} x={x} y="390" textAnchor="middle" className="visual-editorial-label">
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

function ForceMultiplierVisual({ copy, markerId, variant }: StoryProps) {
  const pivotX = variant === "header" ? 462 : 450;

  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <path d="M154 292L716 184" className="visual-editorial-lever" />
        <path d="M416 292L484 292L450 222Z" className="visual-editorial-panel-hot" />
        <circle cx="170" cy="288" r="42" className="visual-editorial-source" />
        {[650, 708, 766].map((x, index) => (
          <circle key={x} cx={x} cy={196 - index * 11} r={24 + index * 5} className={index === 2 ? "visual-editorial-checkpoint" : "visual-editorial-success"} />
        ))}
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        {[122, 184, 246, 308].map((y) => (
          <circle key={y} cx="110" cy={y} r="18" className="visual-editorial-source" />
        ))}
        <path d="M128 122C244 122 264 240 382 240M128 184C248 184 266 240 382 240M128 246H382M128 308C248 308 266 240 382 240" className="visual-editorial-line-muted" />
        <path d="M222 314L762 162" className="visual-editorial-lever" />
        <path d={`M${pivotX - 42} 306H${pivotX + 42}L${pivotX} 222Z`} className="visual-editorial-panel-hot" />
        <circle cx="764" cy="160" r="56" className="visual-editorial-success visual-editorial-node-breathe" />
        <CheckMark x={764} y={160} scale={0.6} />
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      {[132, 190, 248, 306].map((y) => (
        <g key={y}>
          <circle cx="82" cy={y} r="15" className="visual-editorial-source" />
          <path d={`M97 ${y}C198 ${y} 218 224 320 224`} className="visual-editorial-line-muted" />
        </g>
      ))}
      <path d="M190 310L720 150" className="visual-editorial-lever" />
      <path d="M402 306H488L445 220Z" className="visual-editorial-panel-hot" />
      <circle cx="738" cy="144" r="58" className="visual-editorial-success visual-editorial-node-breathe" />
      <CheckMark x={738} y={144} scale={0.62} />
      <path d="M445 220V112H620" className="visual-editorial-line-hot" />
      <circle cx="620" cy="112" r="13" className="visual-editorial-checkpoint" />
      <InlineLabels labels={[
        { x: 82, text: copy.labels.a ?? "" },
        { x: 445, text: copy.labels.c ?? "" },
        { x: 620, text: copy.labels.d ?? "" },
        { x: 738, text: copy.labels.e ?? "" },
      ]} />
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
  const layerX = variant === "header" ? [560, 658, 756] : [548, 650, 752];

  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        {[132, 240, 348].map((y) => (
          <circle key={y} cx="108" cy={y} r="18" className="visual-editorial-source" />
        ))}
        <path d="M126 132C238 132 230 240 322 240M126 240H322M126 348C238 348 230 240 322 240" className="visual-editorial-line-muted" />
        <rect x="322" y="132" width="184" height="216" rx="54" className="visual-editorial-panel-hot" />
        <path d="M362 286L410 190L458 286" className="visual-editorial-detail visual-editorial-orchestrator" />
        {layerX.map((x, index) => (
          <rect key={x} x={x} y={288 - index * 66} width="84" height={60 + index * 66} rx="22" className={index === 2 ? "visual-editorial-success" : "visual-editorial-layer-middle"} />
        ))}
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        {[112, 196, 280, 364].map((y, index) => (
          <g key={y}>
            <circle cx="86" cy={y} r={14 + index * 2} className="visual-editorial-source" />
            <path d={`M104 ${y}C220 ${y} 230 240 320 240`} className="visual-editorial-line-muted" />
          </g>
        ))}
        <rect x="320" y="104" width="190" height="272" rx="58" className="visual-editorial-panel-hot" />
        {[{ x: 368, y: 286 }, { x: 414, y: 176 }, { x: 462, y: 274 }].map((node, index) => (
          <g key={`${node.x}-${node.y}`}>
            <circle cx={node.x} cy={node.y} r={index === 1 ? 18 : 12} className="visual-editorial-checkpoint" />
          </g>
        ))}
        <path d="M368 286L414 176L462 274L368 286" className="visual-editorial-detail" />
        <path d="M510 240H548" className="visual-editorial-flow-trace" />
        {layerX.map((x, index) => (
          <rect key={x} x={x} y={300 - index * 72} width="84" height={64 + index * 72} rx="22" className={index === 2 ? "visual-editorial-success" : "visual-editorial-layer-middle"} />
        ))}
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      {[138, 208, 278].map((y, index) => (
        <g key={y}>
          <circle cx="74" cy={y} r={16 + index * 2} className="visual-editorial-source" />
          <path d={`M94 ${y}C190 ${y} 198 218 282 218`} className="visual-editorial-line-muted" />
        </g>
      ))}
      <rect x="282" y="116" width="190" height="204" rx="54" className="visual-editorial-panel-hot" />
      {[{ x: 330, y: 266 }, { x: 376, y: 168 }, { x: 424, y: 254 }].map((node, index) => (
        <circle key={`${node.x}-${node.y}`} cx={node.x} cy={node.y} r={index === 1 ? 17 : 11} className="visual-editorial-checkpoint" />
      ))}
      <path d="M330 266L376 168L424 254L330 266" className="visual-editorial-detail" />
      <path d="M472 218H530" className="visual-editorial-flow-trace" markerEnd={arrow} />
      {[530, 632, 734].map((x, index) => (
        <rect key={x} x={x} y={290 - index * 66} width="84" height={62 + index * 66} rx="22" className={index === 2 ? "visual-editorial-success" : "visual-editorial-layer-middle"} />
      ))}
      <InlineLabels labels={[
        { x: 74, text: copy.labels.a ?? "" },
        { x: 377, text: copy.labels.b ?? "" },
        { x: 572, text: copy.labels.c ?? "" },
        { x: 776, text: copy.labels.d ?? "" },
      ]} />
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
        <DatabaseGlyph x={216} y={154} width={150} height={168} />
        <path d="M292 238H418" className="visual-editorial-flow-trace" />
        <rect x="418" y="142" width="130" height="196" rx="46" className="visual-editorial-panel-hot" />
        <path d="M548 238H642" className="visual-editorial-flow-trace" />
        {[{ x: 674, y: 148 }, { x: 752, y: 148 }, { x: 674, y: 242 }, { x: 752, y: 242 }].map((cell, index) => (
          <rect key={`${cell.x}-${cell.y}`} x={cell.x} y={cell.y} width="62" height="76" rx="18" className={index === 3 ? "visual-editorial-success" : "visual-editorial-layer-middle"} />
        ))}
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <DatabaseGlyph x={180} y={132} width={156} height={204} />
        <path d="M258 240H390" className="visual-editorial-flow-trace" />
        <rect x="390" y="118" width="148" height="244" rx="50" className="visual-editorial-panel-hot" />
        {[150, 198, 246, 294].map((y) => (
          <path key={y} d={`M420 ${y}H508`} className="visual-editorial-detail" />
        ))}
        <path d="M538 240H626" className="visual-editorial-flow-trace" />
        {[{ x: 650, y: 120 }, { x: 748, y: 120 }, { x: 650, y: 246 }, { x: 748, y: 246 }].map((cell, index) => (
          <rect key={`${cell.x}-${cell.y}`} x={cell.x} y={cell.y} width="80" height="104" rx="22" className={index === 3 ? "visual-editorial-success" : "visual-editorial-layer-middle"} />
        ))}
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      <DatabaseGlyph x={136} y={134} width={132} height={174} />
      <path d="M202 220H340" className="visual-editorial-flow-trace" markerEnd={arrow} />
      <rect x="340" y="116" width="152" height="208" rx="48" className="visual-editorial-panel-hot" />
      {[150, 198, 246, 294].map((y) => (
        <path key={y} d={`M374 ${y}H458`} className="visual-editorial-detail" />
      ))}
      <path d="M492 220H586" className="visual-editorial-flow-trace" markerEnd={arrow} />
      {[{ x: 610, y: 110 }, { x: 714, y: 110 }, { x: 610, y: 240 }, { x: 714, y: 240 }].map((cell, index) => (
        <rect key={`${cell.x}-${cell.y}`} x={cell.x} y={cell.y} width="84" height="102" rx="22" className={index === 3 ? "visual-editorial-success" : "visual-editorial-layer-middle"} />
      ))}
      <circle cx="826" cy="220" r="34" className="visual-editorial-checkpoint" />
      <path d="M798 206L812 220L842 188" className="visual-editorial-check" />
      <InlineLabels labels={[
        { x: 136, text: copy.labels.a ?? "" },
        { x: 416, text: copy.labels.c ?? "" },
        { x: 736, text: copy.labels.e ?? "" },
      ]} />
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
        <path d="M78 356C202 328 260 302 334 248S472 136 570 194S682 276 820 112" className="visual-editorial-journey" />
        {[{ x: 78, y: 356 }, { x: 334, y: 248 }, { x: 570, y: 194 }, { x: 820, y: 112 }].map((point, index) => (
          <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r={index === 3 ? 20 : 11} className={index === 3 ? "visual-editorial-checkpoint" : "visual-editorial-source"} />
        ))}
        <path d="M690 356V214H734V172H778V130H822" className="visual-editorial-foundation" />
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <path d="M48 374C168 354 252 312 322 244S470 104 574 190S690 274 850 82" className="visual-editorial-journey" />
        {[{ x: 48, y: 374 }, { x: 322, y: 244 }, { x: 574, y: 190 }, { x: 850, y: 82 }].map((point, index) => (
          <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r={index === 3 ? 22 : 12} className={index === 3 ? "visual-editorial-checkpoint" : "visual-editorial-source"} />
        ))}
        <path d="M618 388V284H674V236H730V188H786V140H842" className="visual-editorial-foundation" />
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      <path d="M46 340C158 326 230 290 302 228S432 112 534 184S654 270 824 92" className="visual-editorial-journey" />
      {[{ x: 46, y: 340 }, { x: 302, y: 228 }, { x: 534, y: 184 }, { x: 824, y: 92 }].map((point, index) => (
        <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r={index === 3 ? 21 : 11} className={index === 3 ? "visual-editorial-checkpoint" : "visual-editorial-source"} />
      ))}
      <path d="M604 338V268H654V224H704V180H754V136H818" className="visual-editorial-foundation" />
      <InlineLabels labels={[
        { x: 92, text: copy.labels.a ?? "" },
        { x: 302, text: copy.labels.b ?? "" },
        { x: 654, text: copy.labels.c ?? "" },
        { x: 810, text: copy.labels.e ?? "" },
      ]} />
    </EditorialFrame>
  );
}

function BackpressureVisual({ copy, markerId, variant }: StoryProps) {
  const arrow = `url(#${markerId}-arrow)`;
  const baseY = variant === "inline" ? 218 : 240;

  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <rect x="72" y="146" width="152" height="188" rx="46" className="visual-editorial-layer-middle" />
        <path d="M104 180V300M146 180V300M188 180V300" className="visual-editorial-detail" />
        <path d="M224 206H348V178H468V206H590V180H714V206H822" className="visual-editorial-flow-trace" />
        <path d="M224 274H348V302H468V274H590V300H714V274H822" className="visual-editorial-flow-trace" />
        {[348, 468, 590, 714].map((x, index) => (
          <rect key={x} x={x - 24} y={182 + index * 6} width="48" height={116 - index * 12} rx="15" className={index === 2 ? "visual-editorial-panel-hot" : "visual-editorial-layer-middle"} />
        ))}
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <rect x="48" y="130" width="164" height="220" rx="48" className="visual-editorial-layer-middle" />
        <path d="M84 170V310M130 170V310M176 170V310" className="visual-editorial-detail" />
        <path d="M212 194H336V152H474V194H612V152H750V194H850" className="visual-editorial-flow-trace" />
        <path d="M212 286H336V328H474V286H612V328H750V286H850" className="visual-editorial-flow-trace" />
        {[336, 474, 612, 750].map((x, index) => (
          <rect key={x} x={x - 28} y={164 + index * 6} width="56" height={152 - index * 12} rx="17" className={index === 2 ? "visual-editorial-panel-hot" : "visual-editorial-layer-middle"} />
        ))}
        <path d="M820 356C650 424 332 424 212 354" className="visual-editorial-rejected" />
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      <rect x="42" y="132" width="134" height="172" rx="42" className="visual-editorial-layer-middle" />
      <path d="M72 166V270M109 166V270M146 166V270" className="visual-editorial-detail" />
      <path d={`M176 ${baseY - 26}H300V${baseY - 54}H430V${baseY - 26}H560V${baseY - 52}H690V${baseY - 26}H826`} className="visual-editorial-flow-trace" markerEnd={arrow} />
      <path d={`M176 ${baseY + 26}H300V${baseY + 54}H430V${baseY + 26}H560V${baseY + 52}H690V${baseY + 26}H826`} className="visual-editorial-flow-trace" />
      {[300, 430, 560, 690].map((x, index) => (
        <rect key={x} x={x - 26} y={156 + index * 7} width="52" height={124 - index * 14} rx="16" className={index === 2 ? "visual-editorial-panel-hot" : "visual-editorial-layer-middle"} />
      ))}
      <path d="M808 330C660 382 336 382 184 324" className="visual-editorial-rejected" />
      <InlineLabels labels={[
        { x: 109, text: copy.labels.a ?? "" },
        { x: 365, text: copy.labels.b ?? "" },
        { x: 560, text: copy.labels.c ?? "" },
        { x: 758, text: `${copy.labels.d ?? ""} / ${copy.labels.e ?? ""}` },
      ]} />
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

function RaceJourneyVisual({ copy, markerId, variant }: StoryProps) {
  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <path d="M54 342C154 118 258 104 338 250S486 390 566 266S700 100 850 188" className="visual-editorial-elevation-profile" />
        <path d="M54 342C154 118 258 104 338 250" className="visual-editorial-line-hot" />
        <circle cx="54" cy="342" r="10" className="visual-editorial-source" />
        <circle cx="566" cy="266" r="18" className="visual-editorial-checkpoint" />
        <circle cx="830" cy="176" r="13" className="visual-editorial-success" />
        <circle cx="850" cy="188" r="13" className="visual-editorial-success" />
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <path d="M40 374C140 90 266 76 348 248S492 430 588 260S724 68 864 158" className="visual-editorial-elevation-profile" />
        <path d="M40 374C140 90 266 76 348 248" className="visual-editorial-line-hot" />
        <circle cx="40" cy="374" r="11" className="visual-editorial-source" />
        <circle cx="588" cy="260" r="22" className="visual-editorial-checkpoint visual-editorial-node-breathe" />
        <circle cx="842" cy="148" r="14" className="visual-editorial-success" />
        <circle cx="864" cy="158" r="14" className="visual-editorial-success" />
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      <path d="M42 328C140 104 240 88 320 232S460 372 548 246S684 88 846 164" className="visual-editorial-elevation-profile" />
      <path d="M42 328C140 104 240 88 320 232" className="visual-editorial-line-hot" />
      <circle cx="42" cy="328" r="10" className="visual-editorial-source" />
      <path d="M330 244L354 268M354 244L330 268" className="visual-editorial-cross" />
      <circle cx="548" cy="246" r="20" className="visual-editorial-checkpoint visual-editorial-node-breathe" />
      <circle cx="824" cy="154" r="14" className="visual-editorial-success" />
      <circle cx="846" cy="164" r="14" className="visual-editorial-success" />
      <InlineLabels labels={[
        { x: 72, text: copy.labels.start ?? "" },
        { x: 342, text: copy.labels.four ?? "" },
        { x: 548, text: copy.labels.checkpoint ?? "" },
        { x: 824, text: copy.labels.sport ?? "" },
      ]} />
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
