import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { useTheme } from "../../app/providers/ThemeProvider";

type ReadingProgressBarProps = {
  articleRef: RefObject<HTMLElement | null>;
  contentKey: string;
};

const MOUNTAIN_CHECKPOINTS = [14, 32, 52, 74, 92];
const ROCKET_CHECKPOINTS = [10, 28, 48, 68, 88];

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function ReadingProgressBar({ articleRef, contentKey }: ReadingProgressBarProps) {
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const rocketOrbitRef = useRef<HTMLDivElement | null>(null);
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

  const cssVars = useMemo(
    () => ({
      "--reading-progress": progress,
      "--rocket-progress": 100 - progress,
      "--reading-progress-value": `${progress}%`,
      "--reading-progress-rounded": Math.round(progress),
    }) as CSSProperties,
    [progress],
  );

  if (appliedTheme === "rocket") {
    return (
      <div className="rocket-progress" aria-hidden="true" style={cssVars}>
        <span className="rocket-progress-track" />
        <span className="rocket-progress-fill" />
        <div className="rocket-progress-checkpoints">
          {ROCKET_CHECKPOINTS.map((checkpoint) => (
            <span
              key={checkpoint}
              className={`rocket-checkpoint ${progress >= checkpoint ? "reached" : ""}`}
              style={{ top: `${100 - checkpoint}%` }}
            />
          ))}
        </div>
        <div className="moon">
          <svg viewBox="0 0 120 120" role="presentation">
            <defs>
              <radialGradient id="moonGlow" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#fff7d6" />
                <stop offset="70%" stopColor="#f9e7a6" />
                <stop offset="100%" stopColor="#f1d37a" />
              </radialGradient>
            </defs>
            <circle cx="60" cy="60" r="45" fill="url(#moonGlow)" />
            <circle cx="45" cy="48" r="6" fill="#e7c56a" opacity="0.7" />
            <circle cx="72" cy="68" r="8" fill="#e0b85b" opacity="0.7" />
            <circle cx="63" cy="40" r="4" fill="#e0b85b" opacity="0.6" />
          </svg>
        </div>
        <div
          ref={rocketOrbitRef}
          className={`rocket-orbit ${orbitActive ? "active" : ""}`}
        >
          <div className="rocket" style={orbitActive ? undefined : { top: `${100 - progress}%` }}>
            <svg viewBox="0 0 120 220" role="presentation">
              <defs>
                <linearGradient id="rocketBody" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="60%" stopColor="#cbd5f5" />
                  <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>
                <linearGradient id="rocketGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d946ef" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#fb923c" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <path
                d="M60 8 C40 28 32 52 32 86 L32 150 C32 168 45 184 60 196 C75 184 88 168 88 150 L88 86 C88 52 80 28 60 8 Z"
                fill="url(#rocketBody)"
              />
              <path
                d="M60 8 C40 28 32 52 32 86 L32 120 C52 124 68 124 88 120 L88 86 C88 52 80 28 60 8 Z"
                fill="url(#rocketGlow)"
                opacity="0.6"
              />
              <circle cx="60" cy="90" r="14" fill="#0f172a" opacity="0.7" />
              <circle cx="60" cy="90" r="8" fill="#38bdf8" />
              <path d="M32 134 L16 154 L32 154 Z" fill="#fb923c" opacity="0.85" />
              <path d="M88 134 L104 154 L88 154 Z" fill="#fb923c" opacity="0.85" />
              <path d="M60 196 L46 214 L60 206 L74 214 Z" fill="#f97316" />
            </svg>
            <span className="rocket-trail" />
          </div>
        </div>
        <span className="rocket-progress-readout">{Math.round(progress)}%</span>
      </div>
    );
  }

  if (appliedTheme === "mountain") {
    return (
      <div
        ref={progressBarRef}
        className="mountain-progress"
        style={cssVars}
        data-direction={direction}
        aria-hidden="true"
      >
        <span className="mountain-progress-track" />
        <span className="mountain-progress-fill" />
        <span className="mountain-progress-glow" />
        <div className="mountain-progress-checkpoints">
          {MOUNTAIN_CHECKPOINTS.map((checkpoint) => (
            <span
              key={checkpoint}
              className={`mountain-checkpoint ${progress >= checkpoint ? "reached" : ""}`}
              style={{ top: `${100 - checkpoint}%` }}
            />
          ))}
        </div>
        <span className="mountain-progress-altitude">{Math.round(progress)}%</span>
        <span className="mountain-progress-runner">
          <svg
            className="mountain-runner-icon"
            viewBox="0 0 64 64"
            role="presentation"
            aria-hidden="true"
          >
            <circle className="runner-head" cx="40" cy="14" r="6" />
            <path className="runner-headband" d="M35 14 Q40 10 45 14" />
            <path className="runner-torso" d="M30 22 Q40 18 46 26 Q50 32 46 36 Q38 40 30 34 Z" />
            <path className="runner-pack" d="M28 24 L30 32 L24 34 L22 26 Z" />
            <path className="runner-arm runner-arm-front" d="M34 26 L20 30 L12 36" />
            <path className="runner-arm runner-arm-back" d="M40 26 L54 20" />
            <path className="runner-leg runner-leg-front" d="M36 36 L28 50 L18 56" />
            <path className="runner-leg runner-leg-back" d="M40 36 L52 48 L60 52" />
            <circle className="runner-shoe runner-shoe-front" cx="18" cy="56" r="3" />
            <circle className="runner-shoe runner-shoe-back" cx="60" cy="52" r="3" />
          </svg>
        </span>
      </div>
    );
  }

  return (
    <div
      ref={progressBarRef}
      className={`clean-progress clean-progress-${appliedTheme}`}
      style={cssVars}
      data-direction={direction}
      aria-hidden="true"
    >
      <span className="clean-progress-track" />
      <span className="clean-progress-fill" />
      <span className="clean-progress-marker" />
    </div>
  );
}
