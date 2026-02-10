import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { useTheme } from "../../app/providers/ThemeProvider";
import { MountainTrailRunnerIcon } from "./MountainTrailRunnerIcon";

type ReadingProgressBarProps = {
  articleRef: RefObject<HTMLElement | null>;
  contentKey: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function ReadingProgressBar({ articleRef, contentKey }: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [direction, setDirection] = useState<"down" | "up">("down");
  const [orbitActive, setOrbitActive] = useState(false);
  const lastProgressRef = useRef(0);
  const { appliedTheme } = useTheme();

  useEffect(() => {
    const computeProgress = () => {
      const article = articleRef.current;
      if (!article) {
        setProgress(0);
        setOrbitActive(false);
        return;
      }

      const rect = article.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const topOffset = viewport * 0.2;
      const bottomOffset = viewport * 0.8;

      const start = rect.top + window.scrollY - topOffset;
      const end = rect.bottom + window.scrollY - bottomOffset;
      const range = Math.max(1, end - start);
      const raw = ((window.scrollY - start) / range) * 100;
      const next = clamp(raw, 0, 100);

      const delta = next - lastProgressRef.current;
      if (Math.abs(delta) > 0.1) {
        setDirection(delta > 0 ? "down" : "up");
      }

      setProgress(next);
      setOrbitActive(next >= 99.5);
      lastProgressRef.current = next;
    };

    computeProgress();
    window.addEventListener("scroll", computeProgress, { passive: true });
    window.addEventListener("resize", computeProgress);

    return () => {
      window.removeEventListener("scroll", computeProgress);
      window.removeEventListener("resize", computeProgress);
    };
  }, [articleRef, contentKey]);

  const isRunnerMoving = progress > 0 && progress < 100;

  const cssVars = useMemo(
    () => ({
      "--reading-progress": progress,
      "--reading-progress-value": `${progress}%`,
      "--reading-progress-rounded": Math.round(progress),
      "--runner-stride-duration": "0.74s",
    }) as CSSProperties,
    [progress],
  );

  if (appliedTheme === "rocket") {
    return (
      <div
        className="rocket-progress"
        data-progress-placement="right"
        aria-hidden="true"
        style={cssVars}
      >
        <div className="moon">
          <svg viewBox="0 0 120 120" role="presentation">
            <circle cx="60" cy="60" r="42" className="moon-disc" />
            <circle cx="47" cy="47" r="7" className="moon-crater" />
            <circle cx="73" cy="69" r="9" className="moon-crater" />
            <circle cx="63" cy="40" r="4.5" className="moon-crater" />
          </svg>
        </div>
        <div className={`rocket-orbit ${orbitActive ? "active" : ""}`}>
          <div className="rocket" style={orbitActive ? undefined : { top: `${100 - progress}%` }}>
            <svg viewBox="0 0 92 168" role="presentation">
              <path className="rocket-fin" d="M31 105 L14 125 L31 126 Z" />
              <path className="rocket-fin" d="M61 105 L78 125 L61 126 Z" />
              <path
                className="rocket-body"
                d="M46 7 C33 18 24 36 24 58 L24 102 C24 117 34 129 46 139 C58 129 68 117 68 102 L68 58 C68 36 59 18 46 7 Z"
              />
              <path
                className="rocket-stripe"
                d="M46 20 C38 29 34 41 34 56 L34 83 C40 85 52 85 58 83 L58 56 C58 41 54 29 46 20 Z"
              />
              <circle className="rocket-window-ring" cx="46" cy="67" r="12.5" />
              <circle className="rocket-window-core" cx="46" cy="67" r="6.5" />
              <path className="rocket-nozzle" d="M46 139 L34 157 L46 151 L58 157 Z" />
            </svg>
            <span className="rocket-trail" />
          </div>
        </div>
      </div>
    );
  }

  if (appliedTheme === "mountain") {
    return (
      <div
        className="mountain-progress"
        style={cssVars}
        data-progress-placement="top"
        data-direction={direction}
        data-running={isRunnerMoving ? "true" : "false"}
        aria-hidden="true"
      >
        <span className="mountain-progress-runner">
          <MountainTrailRunnerIcon className="mountain-runner-icon" />
        </span>
      </div>
    );
  }

  return (
    <div
      className={`clean-progress clean-progress-${appliedTheme}`}
      style={cssVars}
      data-progress-placement="top"
      data-direction={direction}
      aria-hidden="true"
    >
      <span className="clean-progress-track" />
      <span className="clean-progress-fill" />
      <span className="clean-progress-marker" />
    </div>
  );
}
