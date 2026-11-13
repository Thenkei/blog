import { useId, useLayoutEffect, useRef, type CSSProperties } from "react";
import { TrailRunnerFigure } from "../../shared/components/parallax/TrailRunnerFigure";
import { computeRunnerPlacement } from "../../shared/components/parallax/useMultiplaneCamera";

type MountainReadingProgressProps = {
  /** Article progress, from 0 to 100. */
  progress: number;
  direction: "down" | "up";
  label: string;
};

/**
 * One switchback trail from the trailhead (bottom) to the summit (top), in a
 * 120 × 560 drawing. The lit part of the trail and the runner both follow it.
 */
const CLIMB_TRAIL =
  "M60 540 C76 525 91 512 91 478 C91 442 33 448 33 412 C33 378 83 384 83 350 C83 318 41 324 41 292 C41 262 75 268 75 238 C75 212 48 216 48 190 C48 167 69 171 69 148 C69 107 61 94 61 74";
const TRAILHEAD = { x: 60, y: 540 };
const SUMMIT = { x: 61, y: 74 };
/** The runner figure is about 66 units tall; this brings it to trail scale. */
const RUNNER_SCALE = 0.5;
/** Drawing units covered by one stride pose. */
const STRIDE_LENGTH = 11;

/**
 * Mountain reading progress: the reader climbs a small mountain in the page
 * margin, with the same runner as the home hero. On narrow screens the climb
 * is replaced by a thin line under the header (see `reading.css`), so the
 * article keeps its full width.
 */
export function MountainReadingProgress({
  progress,
  direction,
  label,
}: MountainReadingProgressProps) {
  const labelId = useId();
  const gradientId = `${useId().replaceAll(":", "")}-climb`;
  const trailRef = useRef<SVGPathElement | null>(null);
  const runnerRef = useRef<SVGGElement | null>(null);
  const clamped = Math.min(Math.max(progress, 0), 100);
  const rounded = Math.round(clamped);
  const isRunning = clamped > 0 && clamped < 100;

  useLayoutEffect(() => {
    const trail = trailRef.current;
    const runner = runnerRef.current;
    // jsdom (tests) has no SVG geometry: the runner keeps its default pose.
    if (
      !trail ||
      !runner ||
      typeof trail.getTotalLength !== "function" ||
      typeof trail.getPointAtLength !== "function"
    ) {
      return;
    }

    const total = trail.getTotalLength();
    const length = (total * clamped) / 100;
    const here = trail.getPointAtLength(length);
    const from = trail.getPointAtLength(Math.max(0, length - 2));
    const to = trail.getPointAtLength(Math.min(total, length + 2));
    const placement = computeRunnerPlacement({
      x: here.x,
      y: here.y,
      dx: to.x - from.x,
      dy: to.y - from.y,
    });

    runner.setAttribute(
      "transform",
      `translate(${placement.x.toFixed(1)} ${placement.y.toFixed(1)}) ` +
        `rotate(${placement.rotate.toFixed(1)}) ` +
        `scale(${(RUNNER_SCALE * placement.facing).toFixed(3)} ${RUNNER_SCALE})`,
    );
    runner.dataset.stride =
      Math.floor(length / STRIDE_LENGTH) % 2 === 0 ? "a" : "b";
  }, [clamped]);

  return (
    <>
      <p id={labelId} className="reading-progress-label mountain-progress-label">
        {label}
      </p>
      <div
        className="mountain-progress"
        data-progress-placement="right"
        data-direction={direction}
        data-running={isRunning ? "true" : "false"}
        data-summit={clamped >= 100 ? "true" : "false"}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={rounded}
        aria-labelledby={labelId}
        style={{ "--reading-progress": clamped } as CSSProperties}
      >
        <svg
          className="mountain-progress-climb"
          viewBox="0 0 120 560"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient
              id={`${gradientId}-rock`}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="58"
              x2="0"
              y2="560"
            >
              <stop offset="0" className="mountain-progress-rock-top" />
              <stop offset="0.7" className="mountain-progress-rock-mid" />
              <stop offset="1" className="mountain-progress-rock-base" />
            </linearGradient>
            <linearGradient
              id={gradientId}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1={TRAILHEAD.y}
              x2="0"
              y2={SUMMIT.y}
            >
              <stop offset="0" stopColor="#7de0bf" />
              <stop offset="1" stopColor="#f0c277" />
            </linearGradient>
          </defs>

          <path
            className="mountain-progress-massif"
            fill={`url(#${gradientId}-rock)`}
            d="M2 560 L6 502 L13 452 L15 402 L23 352 L25 300 L33 250 L35 204 L42 160 L44 118 L61 58 L78 118 L80 160 L87 204 L89 250 L97 300 L99 352 L107 402 L109 452 L116 502 L119 560 Z"
          />
          <path
            className="mountain-progress-light"
            d="M61 58 L78 118 L80 160 L87 204 L89 250 L97 300 L99 352 L107 402 L109 452 L92 454 L96 400 L84 352 L87 300 L76 252 L78 204 L68 160 L70 118 Z"
          />
          <path
            className="mountain-progress-snow"
            d="M61 58 L48 106 L54 99 L59 116 L64 102 L70 114 L74 104 Z"
          />
          <path
            className="mountain-progress-firs"
            d="M14 548 l6 -20 l6 20 Z M27 556 l5 -16 l5 16 Z M96 552 l6 -22 l6 22 Z M84 558 l5 -15 l5 15 Z"
          />

          <path className="mountain-progress-trail" d={CLIMB_TRAIL} />
          <path
            ref={trailRef}
            className="mountain-progress-trail-lit"
            d={CLIMB_TRAIL}
            pathLength={1}
            stroke={`url(#${gradientId})`}
          />

          <circle
            className="mountain-progress-trailhead"
            cx={TRAILHEAD.x}
            cy={TRAILHEAD.y}
            r="4.5"
          />
          <g
            className="mountain-progress-summit"
            transform={`translate(${SUMMIT.x} ${SUMMIT.y - 14})`}
          >
            <path className="mountain-pass-pole" d="M0 2 V-30" />
            <path className="mountain-pass-flag" d="M0 -30 L18 -24.5 L0 -19 Z" />
          </g>

          <g
            ref={runnerRef}
            className="mountain-progress-runner"
            data-stride="a"
            transform={`translate(${TRAILHEAD.x} ${TRAILHEAD.y}) scale(${RUNNER_SCALE})`}
          >
            <TrailRunnerFigure />
          </g>
        </svg>
      </div>
    </>
  );
}
