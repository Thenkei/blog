import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { PostDiagramVisualId } from "../content/types";
import type { ArticleMediaId } from "../../../shared/components/ArticleMedia";
import { StaticArticleMedia } from "../../../shared/components/ArticleMedia";
import { PostVisual } from "../../../shared/components/PostVisual";
import type { FigureScene } from "./figureScenes";

export const FIGURE_FPS = 30;
const STAGE_FRAMES = 105;
export const FIGURE_DURATION = STAGE_FRAMES * 3;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export function FigureMotionComposition({ visualId, mediaId, assetSrc, rawSvg, scene, compact }: {
  visualId?: PostDiagramVisualId | undefined;
  mediaId?: ArticleMediaId | undefined;
  assetSrc?: string | undefined;
  rawSvg?: string | undefined;
  scene: FigureScene;
  compact: boolean;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const index = Math.min(2, Math.floor(frame / STAGE_FRAMES));
  const localFrame = frame - index * STAGE_FRAMES;
  const reveal = spring({ frame: localFrame, fps, config: { damping: 22, stiffness: 100 } });
  const stage = scene.stages[index]!;
  const prior = scene.stages[Math.max(0, index - 1)]!;
  const canvasWidth = compact ? 390 : 900;
  const artHeight = compact ? 340 : 430;
  const x = interpolate(reveal, [0, 1], [prior.x * canvasWidth, stage.x * canvasWidth], clamp);
  const y = interpolate(reveal, [0, 1], [prior.y * artHeight, stage.y * artHeight], clamp);
  const progress = interpolate(frame, [0, FIGURE_DURATION - 1], [0, 100], clamp);
  const localProgress = interpolate(localFrame, [0, STAGE_FRAMES - 1], [0, 1], clamp);
  const pulse = 1 + Math.sin(frame / 8) * 0.08;
  const flowVisible = index === 0 ? 20 + localProgress * 13 : (index + localProgress) / 3 * 100;

  return (
    <AbsoluteFill style={{ background: "var(--visual-surface)", color: "var(--text-primary)", fontFamily: "var(--font-display)", overflow: "hidden" }}>
      <div className="figure-motion-art" style={{ position: "absolute", top: 0, left: 0, right: 0, height: artHeight, opacity: .88, transform: `scale(${1 + reveal * .018})`, clipPath: scene.kind === "flow" ? `inset(0 ${100 - flowVisible}% 0 0)` : undefined }}>
        {visualId ? <PostVisual slug={visualId} variant="header" visualId={visualId} /> : null}
        {mediaId ? <StaticArticleMedia mediaId={mediaId} /> : null}
        {assetSrc ? <img src={assetSrc} alt="" style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }} /> : null}
        {rawSvg ? <div className="figure-motion-raw-svg" dangerouslySetInnerHTML={{ __html: rawSvg }} /> : null}
        {!visualId && !mediaId && !assetSrc && !rawSvg ? (
          <svg viewBox="0 0 900 430" style={{ width: "100%", height: "100%" }} aria-hidden="true">
            <rect width="900" height="430" fill="var(--visual-surface)" />
            <path
              d={scene.kind === "threshold" ? "M150 190 C320 190 350 340 450 300 S650 150 750 140" : scene.kind === "choice" ? "M150 215 H450 M450 215 C560 215 610 135 750 125 M450 215 C560 215 610 300 750 305" : "M150 215 H750"}
              fill="none"
              stroke="var(--accent-primary)"
              strokeWidth="5"
              strokeDasharray="12 10"
            />
            {scene.stages.map((item, stageIndex) => (
              <g key={item.heading} opacity={stageIndex <= index ? 1 : .35}>
                <circle cx={item.x * 900} cy={item.y * 430} r="44" fill="var(--surface-raised)" stroke="var(--accent-secondary)" strokeWidth="4" />
                <text x={item.x * 900} y={item.y * 430 + 8} textAnchor="middle" fill="var(--accent-primary)" fontSize="26" fontWeight="700">{String(stageIndex + 1).padStart(2, "0")}</text>
              </g>
            ))}
          </svg>
        ) : null}
      </div>
      <svg viewBox={`0 0 ${canvasWidth} ${artHeight}`} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: artHeight, overflow: "visible", pointerEvents: "none" }} aria-hidden="true">
        <defs>
          <radialGradient id="figure-focus">
            <stop offset="0" stopColor="var(--accent-secondary)" stopOpacity=".3" />
            <stop offset="1" stopColor="var(--accent-secondary)" stopOpacity="0" />
          </radialGradient>
        </defs>
        {index > 0 ? <path d={`M${prior.x * canvasWidth} ${prior.y * artHeight} Q${canvasWidth / 2} 40 ${x} ${y}`} fill="none" stroke="var(--accent-primary)" strokeWidth={compact ? 2 : 4} strokeDasharray="12 9" opacity=".7" pathLength="1" strokeDashoffset={1 - reveal} /> : null}
        <circle cx={x} cy={y} r={(compact ? 48 : 78) * pulse} fill="url(#figure-focus)" />
        <circle cx={x} cy={y} r={(compact ? 24 : 34) * pulse} fill="none" stroke="var(--accent-secondary)" strokeWidth={compact ? 3 : 4} />
        <circle cx={x} cy={y} r="6" fill="var(--accent-secondary)" />
      </svg>
      <div style={{ position: "absolute", top: 16, left: 20, padding: "7px 12px", borderRadius: 8, background: "var(--surface-raised)", font: "700 15px var(--font-mono)", letterSpacing: 1.5, color: "var(--accent-primary)" }}>
        {String(index + 1).padStart(2, "0")} / 03
      </div>
      <svg viewBox="0 0 150 70" style={{ position: "absolute", top: 12, right: 14, width: compact ? 104 : 150, height: compact ? 49 : 70, borderRadius: 10, background: "var(--surface-raised)", boxShadow: "0 2px 15px var(--accent-soft)" }} aria-hidden="true">
        {scene.kind === "flow" ? <>
          <path d="M20 35H130" stroke="var(--accent-primary)" strokeWidth="4" strokeDasharray="7 6" />
          <circle cx={20 + 110 * localProgress} cy="35" r="8" fill="var(--accent-secondary)" />
        </> : null}
        {scene.kind === "threshold" ? <>
          <rect x="18" y="24" width="114" height="22" rx="11" fill="var(--divider)" />
          <rect x="18" y="24" width={114 * localProgress} height="22" rx="11" fill={localProgress > .72 ? "var(--accent-secondary)" : "var(--accent-primary)"} />
          <path d="M100 15V54" stroke="var(--text-primary)" strokeWidth="3" />
        </> : null}
        {scene.kind === "choice" ? <>
          <path d="M20 35H65L125 15M65 35L125 55" fill="none" stroke="var(--accent-primary)" strokeWidth="4" />
          <circle cx={65 + 60 * localProgress} cy={35 + (index === 1 ? -20 : index === 2 ? 20 : 0) * localProgress} r="8" fill="var(--accent-secondary)" />
        </> : null}
        {scene.kind === "cycle" ? <>
          <circle cx="75" cy="35" r="24" fill="none" stroke="var(--accent-primary)" strokeWidth="4" strokeDasharray="8 5" />
          <circle cx={75 + 24 * Math.cos(frame / 18)} cy={35 + 24 * Math.sin(frame / 18)} r="8" fill="var(--accent-secondary)" />
        </> : null}
      </svg>
      <div style={{ position: "absolute", top: artHeight, bottom: 0, left: 0, right: 0, background: "var(--surface-raised)", borderTop: "3px solid var(--accent-primary)", padding: compact ? "28px 24px 48px" : "24px 32px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", gap: compact ? 15 : 9 }}>
        <div style={{ font: `700 ${compact ? 27 : 28}px var(--font-display)`, lineHeight: 1.12, transform: `translateY(${(1 - reveal) * 15}px)` }}>{stage.heading}</div>
        <div style={{ font: `600 ${compact ? 18 : 20}px var(--font-mono)`, color: "var(--text-secondary)", lineHeight: 1.3 }}>{stage.detail}</div>
        <div style={{ position: "absolute", bottom: 0, left: 0, height: 5, width: `${progress}%`, background: "var(--accent-secondary)" }} />
      </div>
    </AbsoluteFill>
  );
}
