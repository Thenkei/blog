import { useId } from "react";
import type { FigureMotif, FigureScene } from "./figureScenes";

type Point = readonly [number, number];

const POSITIONS: Record<FigureMotif, readonly [Point, Point, Point]> = {
  pipeline: [[155, 215], [450, 215], [745, 215]],
  stack: [[450, 92], [450, 215], [450, 338]],
  network: [[165, 120], [450, 285], [735, 120]],
  queue: [[170, 215], [450, 215], [730, 215]],
  gauge: [[175, 282], [450, 220], [725, 148]],
  branch: [[170, 215], [450, 120], [730, 292]],
  orbit: [[215, 120], [450, 304], [685, 120]],
  exchange: [[165, 215], [450, 215], [735, 215]],
  comparison: [[170, 255], [450, 195], [730, 135]],
  route: [[155, 280], [450, 320], [745, 135]],
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const lerp = (start: number, end: number, progress: number) => start + (end - start) * progress;

function Link({ from, to, active, progress }: { from: Point; to: Point; active: boolean; progress: number }) {
  const middle = (from[0] + to[0]) / 2;
  const path = `M${from[0]} ${from[1]} C${middle} ${from[1]},${middle} ${to[1]},${to[0]} ${to[1]}`;
  return <>
    <path d={path} fill="none" stroke="var(--visual-line)" strokeOpacity=".55" strokeWidth="5" />
    <path d={path} fill="none" stroke={active ? "var(--accent-secondary)" : "var(--accent-primary)"} strokeWidth="6" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={active ? 1 - progress : 0} opacity={active ? 1 : .5} />
  </>;
}

export function SceneArtwork({ scene, frame, compact, imageSrc }: {
  scene: FigureScene;
  frame: number;
  compact: boolean;
  imageSrc?: string | undefined;
}) {
  const svgId = useId().replaceAll(":", "");
  const gridId = `${svgId}-grid`;
  const glowId = `${svgId}-glow`;
  const stageIndex = Math.min(2, Math.floor(frame / 105));
  const phase = clamp((frame - stageIndex * 105) / 104);
  const points = POSITIONS[scene.motif];
  const source = points[Math.max(0, stageIndex - 1)]!;
  const target = points[stageIndex]!;
  const packetX = lerp(source[0], target[0], phase);
  const packetY = lerp(source[1], target[1], phase);
  const orbitAngle = frame / 24;

  return <div className={`native-scene-art native-scene-${scene.motif}${compact ? " native-scene-compact" : ""}`}>
    {imageSrc ? <img className="native-scene-image" src={imageSrc} alt="" /> : null}
    <svg className="native-scene-background" viewBox="0 0 900 430" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <pattern id={gridId} width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M32 0H0V32" fill="none" stroke="var(--visual-line)" strokeOpacity=".17" />
        </pattern>
        <radialGradient id={glowId}>
          <stop stopColor="var(--accent-secondary)" stopOpacity=".24" />
          <stop offset="1" stopColor="var(--accent-secondary)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="900" height="430" fill={`url(#${gridId})`} />
      {scene.motif === "stack" ? <>
        {[0, 1, 2].map((level) => <rect key={level} x={245 + level * 28} y={45 + level * 123} width={410 - level * 56} height="96" rx="22" fill="var(--surface-raised)" stroke="var(--visual-line)" strokeWidth="2" opacity={level <= stageIndex ? .84 : .3} />)}
        <path d="M450 70V364" stroke="var(--accent-primary)" strokeWidth="5" strokeDasharray="10 9" />
      </> : null}
      {scene.motif === "network" ? <>
        {[82, 205, 328].map((y) => <path key={y} d={`M450 215C310 ${y} 260 ${y} 130 ${y}M450 215C590 ${y} 640 ${y} 770 ${y}`} fill="none" stroke="var(--visual-line)" strokeOpacity=".42" strokeWidth="3" />)}
        <circle cx="450" cy="215" r={54 + 5 * Math.sin(frame / 10)} fill={`url(#${glowId})`} />
      </> : null}
      {scene.motif === "queue" ? <>
        {[0, 1, 2, 3, 4].map((item) => <rect key={item} x={46 + item * 25} y={115 + (item % 2) * 36} width="18" height="18" rx="5" fill="var(--accent-primary)" opacity={stageIndex === 0 ? .75 : .22} />)}
        <rect x="383" y="122" width="134" height="188" rx="25" fill="none" stroke="var(--accent-secondary)" strokeWidth="3" strokeDasharray="8 8" />
        <path d="M375 138L450 190L525 138" fill="none" stroke="var(--accent-secondary)" strokeWidth="3" opacity=".55" />
      </> : null}
      {scene.motif === "gauge" ? <>
        <path d="M90 334H810" stroke="var(--visual-line)" strokeWidth="4" />
        <path d="M90 334H810" stroke="var(--accent-primary)" strokeWidth="12" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - (stageIndex + phase) / 3} />
        <path d="M600 72V342" stroke="var(--accent-secondary)" strokeWidth="3" strokeDasharray="9 7" />
        <circle cx={90 + 720 * (stageIndex + phase) / 3} cy="334" r="11" fill="var(--accent-secondary)" />
      </> : null}
      {scene.motif === "branch" ? <>
        <path d="M170 215C340 215 340 120 450 120M450 120C590 120 600 292 730 292" fill="none" stroke="var(--visual-line)" strokeWidth="5" />
        <path d="M450 120C570 120 645 95 785 75" fill="none" stroke="var(--accent-secondary)" strokeWidth="4" strokeDasharray="12 8" opacity={stageIndex >= 1 ? .8 : .25} />
        <rect x="756" y="49" width="55" height="50" rx="12" fill="var(--surface-raised)" stroke="var(--accent-secondary)" strokeWidth="2" opacity={stageIndex >= 1 ? 1 : .3} />
      </> : null}
      {scene.motif === "orbit" ? <>
        <ellipse cx="450" cy="215" rx="278" ry="143" fill="none" stroke="var(--visual-line)" strokeWidth="4" strokeDasharray="12 10" />
        <circle cx={450 + 278 * Math.cos(orbitAngle)} cy={215 + 143 * Math.sin(orbitAngle)} r="12" fill="var(--accent-secondary)" />
        <circle cx="450" cy="215" r="42" fill={`url(#${glowId})`} />
      </> : null}
      {scene.motif === "exchange" ? <>
        <rect x="38" y="58" width="325" height="305" rx="28" fill="none" stroke="var(--visual-line)" strokeWidth="3" strokeDasharray="10 9" />
        <rect x="537" y="58" width="325" height="305" rx="28" fill="none" stroke="var(--visual-line)" strokeWidth="3" strokeDasharray="10 9" />
        <path d="M170 160H730M730 285H170" fill="none" stroke="var(--accent-primary)" strokeWidth="4" strokeDasharray="12 10" opacity=".65" />
        <circle cx={170 + 560 * ((frame % 105) / 105)} cy="160" r="10" fill="var(--accent-secondary)" />
        <circle cx={730 - 560 * ((frame % 105) / 105)} cy="285" r="7" fill="var(--accent-primary)" opacity=".75" />
      </> : null}
      {scene.motif === "comparison" ? <>
        {[0, 1, 2].map((bar) => <g key={bar}>
          <rect x={92 + bar * 280} y={90 + bar * 35} width="155" height={255 - bar * 35} rx="20" fill="var(--surface-raised)" stroke="var(--visual-line)" strokeWidth="2" />
          <rect x={92 + bar * 280} y={345 - (bar + 1) * (stageIndex + 1) * 24} width="155" height={(bar + 1) * (stageIndex + 1) * 24} rx="15" fill="var(--accent-primary)" opacity={bar === stageIndex ? .42 : .18} />
        </g>)}
      </> : null}
      {scene.motif === "route" ? <>
        {[0, 1, 2, 3].map((line) => <path key={line} d={`M40 ${110 + line * 70}C220 ${55 + line * 70} 270 ${155 + line * 70} 430 ${110 + line * 70}S650 ${55 + line * 70} 860 ${110 + line * 70}`} fill="none" stroke="var(--visual-line)" strokeOpacity=".24" strokeWidth="2" />)}
        <path d="M155 280C310 120 355 370 450 320S610 210 745 135" fill="none" stroke="var(--accent-secondary)" strokeWidth="5" strokeDasharray="12 9" />
      </> : null}
      {scene.motif === "pipeline" || scene.motif === "queue" || scene.motif === "network" ? <>
        <Link from={points[0]} to={points[1]} active={stageIndex === 1} progress={stageIndex > 1 ? 1 : stageIndex === 1 ? phase : 0} />
        <Link from={points[1]} to={points[2]} active={stageIndex === 2} progress={stageIndex === 2 ? phase : 0} />
      </> : null}
      {scene.motif === "route" || scene.motif === "gauge" || scene.motif === "branch" ? <circle cx={packetX} cy={packetY} r="13" fill="var(--accent-secondary)" opacity=".9" /> : null}
    </svg>
    <div className="native-scene-kicker">{scene.title} <span>/ {String(stageIndex + 1).padStart(2, "0")}</span></div>
    {scene.stages.map((stage, index) => {
      if (compact && index !== stageIndex) return null;
      const [x, y] = points[index]!;
      return <div
        key={`${index}-${stage.nodeLabel}`}
        className={`native-scene-node ${index === stageIndex ? "is-active" : ""} ${index < stageIndex ? "is-complete" : ""}`}
        style={{ left: compact ? "50%" : `${x / 900 * 100}%`, top: compact ? "57%" : `${y / 430 * 100}%`, opacity: index > stageIndex ? .42 : 1, transform: `translate(-50%, -50%) scale(${index === stageIndex ? 1 + .03 * Math.sin(frame / 9) : 1})` }}
      >
        <span className="native-scene-node-index">{String(index + 1).padStart(2, "0")}</span>
        <strong>{stage.nodeLabel}</strong>
      </div>;
    })}
  </div>;
}
