export type ArticleProgressInput = {
  articleTop: number;
  articleBottom: number;
  scrollY: number;
  viewportHeight: number;
};

export type RocketReadingPhase =
  | "ignition"
  | "boost"
  | "approach"
  | "orbit";

export type RocketReadingState = {
  progress: number;
  travelProgress: number;
  boostPower: number;
  phase: RocketReadingPhase;
  orbitActive: boolean;
};

const ORBIT_ENTRY_PROGRESS = 0.999;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function smoothstep(start: number, end: number, value: number): number {
  const normalized = clamp((value - start) / (end - start), 0, 1);
  return normalized * normalized * (3 - 2 * normalized);
}

function interpolate(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

export function computeArticleReadingProgress({
  articleTop,
  articleBottom,
  scrollY,
  viewportHeight,
}: ArticleProgressInput): number {
  const viewport = Math.max(1, viewportHeight);
  const start = articleTop - viewport * 0.2;
  const end = articleBottom - viewport * 0.8;
  const range = Math.max(1, end - start);

  return clamp(((scrollY - start) / range) * 100, 0, 100);
}

export function computeRocketReadingState(
  progressPercent: number,
): RocketReadingState {
  const progress = clamp(progressPercent, 0, 100);
  const travelProgress = progress / 100;

  if (travelProgress >= ORBIT_ENTRY_PROGRESS) {
    return {
      progress,
      travelProgress,
      boostPower: 0.24,
      phase: "orbit",
      orbitActive: true,
    };
  }

  if (travelProgress < 0.12) {
    return {
      progress,
      travelProgress,
      boostPower: interpolate(
        0.28,
        1,
        smoothstep(0, 0.12, travelProgress),
      ),
      phase: "ignition",
      orbitActive: false,
    };
  }

  if (travelProgress < 0.72) {
    return {
      progress,
      travelProgress,
      boostPower: interpolate(
        1,
        0.62,
        smoothstep(0.12, 0.72, travelProgress),
      ),
      phase: "boost",
      orbitActive: false,
    };
  }

  return {
    progress,
    travelProgress,
    boostPower: interpolate(
      0.62,
      0.35,
      smoothstep(0.72, 1, travelProgress),
    ),
    phase: "approach",
    orbitActive: false,
  };
}
