import { useId } from "react";
import { hash } from "./primitives";

// One atmosphere per theme, all drawn every frame and toggled by CSS on
// `data-theme` (see layout.css): the scene itself never needs to know the theme.
//   light    → drafting paper: fine dot grid, cool daylight wash
//   dark     → night console: dot grid, two soft accent glows
//   mountain → topographic map: contour lines drifting slowly
//   rocket   → deep space: twinkling stars, a slow orbit, an occasional meteor
export function Backdrop({ frame, width, height }: { frame: number; width: number; height: number }) {
  const id = useId().replaceAll(":", "");
  return <g aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-base`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={{ stopColor: "var(--scene-bg-a)" }} />
        <stop offset="1" style={{ stopColor: "var(--scene-bg-b)" }} />
      </linearGradient>
      <radialGradient id={`${id}-glow`} cx=".5" cy="0" r=".75">
        <stop offset="0" style={{ stopColor: "var(--accent-primary)", stopOpacity: "var(--scene-glow-top)" }} />
        <stop offset="1" style={{ stopColor: "var(--accent-primary)", stopOpacity: 0 }} />
      </radialGradient>
      <radialGradient id={`${id}-glow2`} cx="1" cy="1" r=".7">
        <stop offset="0" style={{ stopColor: "var(--accent-tertiary)", stopOpacity: "var(--scene-glow-corner)" }} />
        <stop offset="1" style={{ stopColor: "var(--accent-tertiary)", stopOpacity: 0 }} />
      </radialGradient>
      <pattern id={`${id}-dots`} width="22" height="22" patternUnits="userSpaceOnUse">
        <circle cx="11" cy="11" r=".95" style={{ fill: "var(--scene-dot)" }} />
      </pattern>
    </defs>
    <rect width={width} height={height} fill={`url(#${id}-base)`} />
    <rect width={width} height={height} fill={`url(#${id}-glow)`} />
    <rect width={width} height={height} fill={`url(#${id}-glow2)`} />
    <g className="scene-bd scene-bd-grid"><rect width={width} height={height} fill={`url(#${id}-dots)`} /></g>
    <g className="scene-bd scene-bd-mountain"><Contours frame={frame} width={width} height={height} /></g>
    <g className="scene-bd scene-bd-rocket"><Stars frame={frame} width={width} height={height} /></g>
  </g>;
}

function Contours({ frame, width, height }: { frame: number; width: number; height: number }) {
  const lines = 11;
  const drift = frame * .0035;
  return <>
    {Array.from({ length: lines }, (_, line) => {
      const base = (line + .5) * height / lines;
      const points = Array.from({ length: Math.ceil(width / 24) + 1 }, (_, step) => {
        const x = step * 24;
        const y = base
          + 16 * Math.sin(x / 150 + line * .9 + drift)
          + 9 * Math.sin(x / 61 - line * .5 - drift * 1.6)
          + 22 * Math.exp(-(((x - width * .62) / 170) ** 2)) * Math.sin(line * .7);
        return `${step === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      });
      return <path key={line} d={points.join("")} fill="none" style={{ stroke: "var(--scene-dot)" }} strokeWidth={line % 4 === 0 ? 1.3 : .8} />;
    })}
  </>;
}

function Stars({ frame, width, height }: { frame: number; width: number; height: number }) {
  const meteor = (frame % 270) / 26;
  return <>
    {Array.from({ length: 90 }, (_, star) => {
      const twinkle = .5 + .5 * Math.sin(frame * (.03 + hash(star + 7) * .05) + star);
      return <circle
        key={star}
        cx={hash(star) * width}
        cy={hash(star + 101) * height}
        r={.5 + hash(star + 203) * (hash(star + 307) > .92 ? 1.6 : .8)}
        style={{ fill: "var(--scene-ink)" }}
        opacity={.12 + .5 * twinkle * hash(star + 401)}
      />;
    })}
    <ellipse cx={width * .78} cy={height * 1.02} rx={width * .52} ry={height * .34} fill="none" style={{ stroke: "var(--accent-tertiary)" }} strokeOpacity={.14} strokeWidth={1} strokeDasharray="2 9" strokeDashoffset={-frame * .4} />
    {meteor < 1 ? <line
      x1={width * (.15 + .5 * meteor)} y1={height * (.08 + .22 * meteor)}
      x2={width * (.15 + .5 * meteor) - 46} y2={height * (.08 + .22 * meteor) - 20}
      style={{ stroke: "var(--scene-ink)" }} strokeWidth={1.2} strokeLinecap="round" opacity={.5 * Math.sin(Math.PI * meteor)}
    /> : null}
  </>;
}
