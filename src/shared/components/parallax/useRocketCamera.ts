import { useCallback, type RefObject } from "react";
import {
  computeCinematicProgress,
  useCinematicScroll,
  type CinematicProgressRenderer,
} from "./useCinematicScroll";

type UseRocketCameraOptions = {
  shellRef: RefObject<HTMLElement | null>;
  stageRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  isReducedMotion: boolean;
  compactLayout: boolean;
};

type RocketPose = {
  at: number;
  x: number;
  y: number;
  rotate: number;
  scale: number;
};

export type RocketCameraVars = {
  progress: number;
  spaceShift: number;
  planetShift: number;
  asteroidShift: number;
  asteroidDrift: number;
  planetScale: number;
  planetOpacity: number;
  asteroidOpacity: number;
  flightProgress: number;
  flightReveal: number;
  rocketX: number;
  rocketY: number;
  rocketRotate: number;
  rocketScale: number;
  rocketOpacity: number;
  boost: number;
  titleOpacity: number;
  titleShift: number;
  titleScale: number;
  arrival: number;
  handoff: number;
};

const ROCKET_POSES: readonly [RocketPose, ...RocketPose[]] = [
  { at: 0, x: 3, y: 79, rotate: 38, scale: 0.72 },
  { at: 0.16, x: 18, y: 75, rotate: 43, scale: 0.8 },
  { at: 0.38, x: 43, y: 64, rotate: 54, scale: 0.94 },
  { at: 0.58, x: 69, y: 70, rotate: 78, scale: 1 },
  { at: 0.72, x: 84, y: 53, rotate: 14, scale: 0.88 },
  { at: 0.84, x: 87, y: 29, rotate: -4, scale: 0.72 },
  { at: 0.92, x: 98, y: 12, rotate: 47, scale: 0.56 },
  { at: 1, x: 116, y: -8, rotate: 49, scale: 0.42 },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function smoothstep(start: number, end: number, value: number): number {
  const progress = clamp((value - start) / (end - start), 0, 1);
  return progress * progress * (3 - 2 * progress);
}

function interpolateRocketPose(progress: number): Omit<RocketPose, "at"> {
  const normalized = clamp(progress, 0, 1);
  const nextIndex = ROCKET_POSES.findIndex((pose) => pose.at >= normalized);
  const first = ROCKET_POSES[0];

  if (nextIndex <= 0) {
    const { x, y, rotate, scale } = first;
    return { x, y, rotate, scale };
  }

  const next = ROCKET_POSES[nextIndex];
  const previous = ROCKET_POSES[nextIndex - 1];
  if (!next || !previous) {
    const { x, y, rotate, scale } = first;
    return { x, y, rotate, scale };
  }
  const localProgress = smoothstep(
    previous.at,
    next.at,
    normalized,
  );
  const mix = (from: number, to: number) =>
    from + (to - from) * localProgress;

  return {
    x: mix(previous.x, next.x),
    y: mix(previous.y, next.y),
    rotate: mix(previous.rotate, next.rotate),
    scale: mix(previous.scale, next.scale),
  };
}

export const computeRocketProgress = computeCinematicProgress;

export function computeRocketVars(
  progress: number,
  compactLayout: boolean,
  reducedMotion = false,
): RocketCameraVars {
  const normalizedProgress = clamp(progress, 0, 1);
  const sceneProgress = reducedMotion ? 0.36 : normalizedProgress;
  const flightProgress = reducedMotion
    ? 0.42
    : smoothstep(0.03, 0.96, sceneProgress);
  const rocketPose = interpolateRocketPose(flightProgress);
  const handoff = reducedMotion ? 0 : smoothstep(0.91, 1, sceneProgress);
  const titleTravel = reducedMotion
    ? 0
    : smoothstep(0.18, 0.54, sceneProgress);

  return {
    progress: sceneProgress,
    spaceShift: sceneProgress * (compactLayout ? -15 : -26),
    planetShift: sceneProgress * (compactLayout ? -38 : -64),
    asteroidShift: sceneProgress * (compactLayout ? -92 : -158),
    asteroidDrift:
      Math.sin(sceneProgress * Math.PI * 2.15) * (compactLayout ? 5 : 10) +
      sceneProgress * (compactLayout ? 4 : 8),
    planetScale:
      1 + smoothstep(0.16, 0.7, sceneProgress) * (compactLayout ? 0.07 : 0.11) -
      handoff * 0.05,
    planetOpacity: reducedMotion ? 1 : 1 - handoff * 0.28,
    asteroidOpacity: reducedMotion
      ? 0.82
      : 1 - smoothstep(0.72, 0.97, sceneProgress) * 0.82,
    flightProgress,
    flightReveal: clamp((rocketPose.x * 10 + 40) / 1120, 0, 1),
    rocketX: rocketPose.x,
    rocketY: rocketPose.y,
    rocketRotate: rocketPose.rotate,
    rocketScale: rocketPose.scale * (compactLayout ? 0.82 : 1),
    rocketOpacity: reducedMotion
      ? 1
      : clamp(0.76 + smoothstep(0, 0.08, sceneProgress) * 0.24 - handoff, 0, 1),
    boost: 0.18 + smoothstep(0.1, 0.88, sceneProgress) * 0.82,
    titleOpacity: reducedMotion
      ? 1
      : clamp(1 - titleTravel * 0.64 - handoff * 0.18, 0.18, 1),
    titleShift: reducedMotion ? 0 : titleTravel * (compactLayout ? -22 : -36),
    titleScale: reducedMotion ? 1 : 1 - titleTravel * 0.06,
    arrival: reducedMotion ? 0.24 : smoothstep(0.73, 0.95, sceneProgress),
    handoff,
  };
}

function applyStageVars(stage: HTMLElement, vars: RocketCameraVars) {
  stage.style.setProperty("--rocket-camera-progress", vars.progress.toFixed(4));
  stage.style.setProperty("--space-shift", vars.spaceShift.toFixed(3));
  stage.style.setProperty("--planet-shift", vars.planetShift.toFixed(3));
  stage.style.setProperty("--asteroid-shift", vars.asteroidShift.toFixed(3));
  stage.style.setProperty("--asteroid-drift", vars.asteroidDrift.toFixed(3));
  stage.style.setProperty("--planet-scale", vars.planetScale.toFixed(4));
  stage.style.setProperty("--planet-opacity", vars.planetOpacity.toFixed(4));
  stage.style.setProperty("--asteroid-opacity", vars.asteroidOpacity.toFixed(4));
  stage.style.setProperty("--flight-progress", vars.flightProgress.toFixed(4));
  stage.style.setProperty("--flight-reveal", vars.flightReveal.toFixed(4));
  stage.style.setProperty("--rocket-x", vars.rocketX.toFixed(3));
  stage.style.setProperty("--rocket-y", vars.rocketY.toFixed(3));
  stage.style.setProperty("--rocket-rotate", vars.rocketRotate.toFixed(3));
  stage.style.setProperty("--rocket-scale", vars.rocketScale.toFixed(4));
  stage.style.setProperty("--rocket-opacity", vars.rocketOpacity.toFixed(4));
  stage.style.setProperty("--rocket-boost", vars.boost.toFixed(4));
  stage.style.setProperty("--cinematic-title-opacity", vars.titleOpacity.toFixed(4));
  stage.style.setProperty("--cinematic-title-shift", vars.titleShift.toFixed(3));
  stage.style.setProperty("--cinematic-title-scale", vars.titleScale.toFixed(4));
  stage.style.setProperty("--rocket-arrival", vars.arrival.toFixed(4));
  stage.style.setProperty("--cinematic-handoff", vars.handoff.toFixed(4));
}

export function useRocketCamera({
  shellRef,
  stageRef,
  enabled,
  isReducedMotion,
  compactLayout,
}: UseRocketCameraOptions) {
  const renderProgress = useCallback<CinematicProgressRenderer>(
    (stage, progress, reducedMotion) => {
      applyStageVars(
        stage,
        computeRocketVars(progress, compactLayout, reducedMotion),
      );
    },
    [compactLayout],
  );

  useCinematicScroll({
    shellRef,
    stageRef,
    enabled,
    isReducedMotion,
    renderProgress,
  });
}
