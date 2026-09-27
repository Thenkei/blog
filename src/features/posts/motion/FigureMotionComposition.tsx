import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { FigureScene } from "./figureScenes";
import { SceneArtwork } from "./SceneArtwork";

export const FIGURE_FPS = 30;
export const STAGE_FRAMES = 105;
export const FIGURE_DURATION = STAGE_FRAMES * 3;

export function FigureMotionComposition({ scene, compact, imageSrc }: {
  scene: FigureScene;
  compact: boolean;
  imageSrc?: string | undefined;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const index = Math.min(2, Math.floor(frame / STAGE_FRAMES));
  const localFrame = frame - index * STAGE_FRAMES;
  const reveal = spring({ frame: localFrame, fps, config: { damping: 22, stiffness: 100 } });
  const progress = interpolate(frame, [0, FIGURE_DURATION - 1], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const stage = scene.stages[index]!;

  return <AbsoluteFill className="native-scene-composition">
    <SceneArtwork scene={scene} frame={frame} compact={compact} imageSrc={imageSrc} />
    <div className={`native-scene-narrative${compact ? " native-scene-narrative-compact" : ""}`}>
      <div className="native-scene-step">{String(index + 1).padStart(2, "0")} <span>/ 03</span></div>
      <div className="native-scene-stage-copy" style={{ opacity: .92 + reveal * .08, transform: `translateY(${(1 - reveal) * 6}px)` }}>
        <strong>{stage.heading}</strong>
        <span>{stage.detail}</span>
      </div>
      <div className="native-scene-progress"><span style={{ width: `${progress}%` }} /></div>
    </div>
  </AbsoluteFill>;
}
