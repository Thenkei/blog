import { useEffect, useId, useState, type CSSProperties } from "react";
import { RocketShipArtwork } from "../../shared/components/rocket/RocketShipArtwork";
import { computeRocketReadingState } from "./readingProgressState";

type RocketReadingProgressProps = {
  progress: number;
  launchSequence: number;
  label: string;
};

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function readsReducedMotionPreference(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(window.matchMedia?.(REDUCED_MOTION_QUERY).matches)
  );
}

export function RocketReadingProgress({
  progress,
  launchSequence,
  label,
}: RocketReadingProgressProps) {
  const labelId = useId();
  const moonIdPrefix = useId().replaceAll(":", "");
  const [isReducedMotion, setIsReducedMotion] = useState(
    readsReducedMotionPreference,
  );
  const moonSurfaceId = `${moonIdPrefix}-moon-surface`;
  const moonShadeId = `${moonIdPrefix}-moon-shade`;
  const state = computeRocketReadingState(progress);
  const roundedProgress = Math.round(state.progress);
  const cssVars = {
    "--reading-progress": state.progress,
    "--rocket-boost": state.boostPower.toFixed(4),
  } as CSSProperties;

  useEffect(() => {
    if (!window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsReducedMotion(event.matches);
    };

    setIsReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return (
    <>
      <p id={labelId} className="reading-progress-label rocket-progress-label">
        {label}
      </p>
      <div
        className="rocket-progress"
        data-flight-phase={state.phase}
        data-orbiting={state.orbitActive ? "true" : "false"}
        data-orbit-motion={isReducedMotion ? "parked" : "continuous"}
        data-reduced-motion={isReducedMotion ? "true" : "false"}
        data-started={state.progress > 0 ? "true" : "false"}
        data-launch-sequence={launchSequence}
        data-progress-placement="right"
        style={cssVars}
        role="progressbar"
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={roundedProgress}
        aria-valuetext={label}
      >
        <div className="rocket-progress-space" aria-hidden="true">
          <span className="rocket-progress-flight-path">
            <span className="rocket-progress-flight-path-fill" />
          </span>

          <span className="rocket-progress-orbit-ring" />
          <span className="rocket-progress-orbit-arc" />

          <span className="rocket-progress-moon">
            <span className="rocket-progress-moon-halo" />
            <svg viewBox="0 0 120 120" role="presentation">
              <defs>
                <radialGradient
                  id={moonSurfaceId}
                  cx="34%"
                  cy="28%"
                  r="76%"
                >
                  <stop offset="0%" stopColor="#fff8d6" />
                  <stop offset="44%" stopColor="#f2d48c" />
                  <stop offset="100%" stopColor="#b87c62" />
                </radialGradient>
                <linearGradient
                  id={moonShadeId}
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop offset="35%" stopColor="#ffffff" stopOpacity="0" />
                  <stop offset="100%" stopColor="#4c315e" stopOpacity="0.72" />
                </linearGradient>
              </defs>
              <circle
                cx="60"
                cy="60"
                r="46"
                fill={`url(#${moonSurfaceId})`}
                className="rocket-progress-moon-disc"
              />
              <circle
                cx="60"
                cy="60"
                r="46"
                fill={`url(#${moonShadeId})`}
                className="rocket-progress-moon-shade"
              />
              <ellipse cx="43" cy="43" rx="9" ry="7" className="rocket-progress-moon-crater" />
              <ellipse cx="74" cy="67" rx="11" ry="8" className="rocket-progress-moon-crater" />
              <ellipse cx="61" cy="34" rx="5" ry="4" className="rocket-progress-moon-crater" />
              <path
                d="M28 60 C34 35 53 20 77 20"
                className="rocket-progress-moon-rim"
              />
            </svg>
          </span>

          <span className="rocket-progress-launch-pad">
            <span
              key={launchSequence}
              className="rocket-progress-launch-effects"
              data-launch-sequence={launchSequence}
            >
              <span className="rocket-progress-launch-ring rocket-progress-launch-ring-primary" />
              <span className="rocket-progress-launch-ring rocket-progress-launch-ring-secondary" />
              <span className="rocket-progress-dust-particle rocket-progress-dust-particle-1" />
              <span className="rocket-progress-dust-particle rocket-progress-dust-particle-2" />
              <span className="rocket-progress-dust-particle rocket-progress-dust-particle-3" />
              <span className="rocket-progress-dust-particle rocket-progress-dust-particle-4" />
              <span className="rocket-progress-dust-particle rocket-progress-dust-particle-5" />
              <span className="rocket-progress-dust-particle rocket-progress-dust-particle-6" />
              <span className="rocket-progress-dust-particle rocket-progress-dust-particle-7" />
              <span className="rocket-progress-dust-particle rocket-progress-dust-particle-8" />
            </span>
            <span className="rocket-progress-ignition-glow" />
          </span>

          <span className="rocket-progress-flight-track">
            <span className="rocket-progress-flight-carrier">
              <span className="rocket-progress-ship-frame">
                <span className="rocket-progress-engine-glow" />
                <RocketShipArtwork className="rocket-progress-ship-artwork" />
              </span>
            </span>
          </span>
        </div>
      </div>
    </>
  );
}
