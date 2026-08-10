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
import { RocketReadingProgress } from "./RocketReadingProgress";
import { computeArticleReadingProgress } from "./readingProgressState";
import { useTranslation } from "react-i18next";

type ReadingProgressBarProps = {
  articleRef: RefObject<HTMLElement | null>;
  contentKey: string;
};

export function ReadingProgressBar({
  articleRef,
  contentKey,
}: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [direction, setDirection] = useState<"down" | "up">("down");
  const lastProgressRef = useRef(0);
  const lastScrollYRef = useRef(0);
  const pendingDirectionRef = useRef<"down" | "up" | null>(null);
  const { appliedTheme } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    let animationFrame: number | null = null;

    const computeProgress = () => {
      const article = articleRef.current;
      if (!article) {
        setProgress(0);
        lastProgressRef.current = 0;
        return;
      }

      const rect = article.getBoundingClientRect();
      const next = computeArticleReadingProgress({
        articleTop: rect.top + window.scrollY,
        articleBottom: rect.bottom + window.scrollY,
        scrollY: window.scrollY,
        viewportHeight: window.innerHeight,
      });

      const delta = next - lastProgressRef.current;
      if (pendingDirectionRef.current) {
        setDirection(pendingDirectionRef.current);
      } else if (Math.abs(delta) > 0.1) {
        setDirection(delta > 0 ? "down" : "up");
      }

      pendingDirectionRef.current = null;
      setProgress(next);
      lastProgressRef.current = next;
    };

    const scheduleProgressUpdate = () => {
      const scrollDelta = window.scrollY - lastScrollYRef.current;
      if (Math.abs(scrollDelta) > 0.1) {
        pendingDirectionRef.current = scrollDelta > 0 ? "down" : "up";
        lastScrollYRef.current = window.scrollY;
      }

      if (animationFrame !== null) {
        return;
      }

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = null;
        computeProgress();
      });
    };

    lastScrollYRef.current = window.scrollY;
    computeProgress();
    window.addEventListener("scroll", scheduleProgressUpdate, {
      passive: true,
    });
    window.addEventListener("resize", scheduleProgressUpdate);

    const articleResizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(scheduleProgressUpdate);

    if (articleRef.current) {
      articleResizeObserver?.observe(articleRef.current);
    }

    return () => {
      window.removeEventListener("scroll", scheduleProgressUpdate);
      window.removeEventListener("resize", scheduleProgressUpdate);
      articleResizeObserver?.disconnect();

      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [articleRef, contentKey]);

  const isRunnerMoving = progress > 0 && progress < 100;
  const roundedProgress = Math.round(progress);

  const cssVars = useMemo(
    () =>
      ({
        "--reading-progress": progress,
        "--reading-progress-value": `${progress}%`,
        "--reading-progress-rounded": Math.round(progress),
        "--runner-stride-duration": "0.74s",
      }) as CSSProperties,
    [progress],
  );

  if (appliedTheme === "rocket") {
    return (
      <RocketReadingProgress
        progress={progress}
        label={t("ui.readingProgress", { progress: roundedProgress })}
      />
    );
  }

  if (appliedTheme === "mountain") {
    return (
      <>
        <p className="reading-progress-label mountain-progress-label">{t("ui.readingProgress", { progress: roundedProgress })}</p>
        <div className="mountain-progress" style={cssVars} data-progress-placement="top" data-direction={direction} data-running={isRunnerMoving ? "true" : "false"} aria-hidden="true">
        <span className="mountain-progress-runner">
          <MountainTrailRunnerIcon className="mountain-runner-icon" />
        </span>
        </div>
      </>
    );
  }

  return (
    <>
      <p className="reading-progress-label clean-progress-label">{t("ui.readingProgress", { progress: roundedProgress })}</p>
      <div className={`clean-progress clean-progress-${appliedTheme}`} data-progress-placement="top" style={cssVars} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={roundedProgress} aria-label={t("ui.readingProgress", { progress: roundedProgress })}>
        <span className="clean-progress-track" />
        <span className="clean-progress-fill" />
        <span className="clean-progress-marker" />
      </div>
    </>
  );
}
