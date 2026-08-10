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

const ROCKET_LAUNCH_THRESHOLD = 0.5;

type RocketLaunchState = {
  sessionKey: string;
  sequence: number;
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
  const launchArmedRef = useRef(true);
  const pendingLaunchCheckRef = useRef(false);
  const { appliedTheme } = useTheme();
  const { t } = useTranslation();
  const launchSessionKey = `${contentKey}:${appliedTheme}`;
  const [rocketLaunchState, setRocketLaunchState] =
    useState<RocketLaunchState>({
      sessionKey: launchSessionKey,
      sequence: 0,
    });

  const rocketLaunchSequence =
    rocketLaunchState.sessionKey === launchSessionKey
      ? rocketLaunchState.sequence
      : 0;

  useEffect(() => {
    let animationFrame: number | null = null;

    const computeProgress = (allowLaunch: boolean) => {
      const article = articleRef.current;
      if (!article) {
        setProgress(0);
        lastProgressRef.current = 0;
        launchArmedRef.current = true;
        return;
      }

      const rect = article.getBoundingClientRect();
      const next = computeArticleReadingProgress({
        articleTop: rect.top + window.scrollY,
        articleBottom: rect.bottom + window.scrollY,
        scrollY: window.scrollY,
        viewportHeight: window.innerHeight,
      });

      if (allowLaunch && appliedTheme === "rocket") {
        if (next <= ROCKET_LAUNCH_THRESHOLD) {
          launchArmedRef.current = true;
        } else if (launchArmedRef.current) {
          launchArmedRef.current = false;
          setRocketLaunchState((current) => ({
            sessionKey: launchSessionKey,
            sequence:
              current.sessionKey === launchSessionKey
                ? current.sequence + 1
                : 1,
          }));
        }
      } else if (next <= ROCKET_LAUNCH_THRESHOLD) {
        launchArmedRef.current = true;
      }

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

    const scheduleProgressUpdate = (source: "scroll" | "layout") => {
      if (source === "scroll") {
        const scrollDelta = window.scrollY - lastScrollYRef.current;
        if (Math.abs(scrollDelta) > 0.1) {
          pendingDirectionRef.current = scrollDelta > 0 ? "down" : "up";
          lastScrollYRef.current = window.scrollY;
          pendingLaunchCheckRef.current = true;
        }
      }

      if (animationFrame !== null) {
        return;
      }

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = null;
        const allowLaunch = pendingLaunchCheckRef.current;
        pendingLaunchCheckRef.current = false;
        computeProgress(allowLaunch);
      });
    };

    const handleScroll = () => scheduleProgressUpdate("scroll");
    const handleLayoutChange = () => scheduleProgressUpdate("layout");

    lastScrollYRef.current = window.scrollY;
    pendingLaunchCheckRef.current = false;
    setRocketLaunchState((current) =>
      current.sessionKey === launchSessionKey && current.sequence === 0
        ? current
        : { sessionKey: launchSessionKey, sequence: 0 },
    );
    computeProgress(false);
    launchArmedRef.current = lastProgressRef.current <= ROCKET_LAUNCH_THRESHOLD;
    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });
    window.addEventListener("resize", handleLayoutChange);

    const articleResizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(handleLayoutChange);

    if (articleRef.current) {
      articleResizeObserver?.observe(articleRef.current);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleLayoutChange);
      articleResizeObserver?.disconnect();

      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [appliedTheme, articleRef, contentKey, launchSessionKey]);

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
        key={contentKey}
        progress={progress}
        launchSequence={rocketLaunchSequence}
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
