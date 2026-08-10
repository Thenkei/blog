import { useCallback, type RefObject } from "react";
import {
  computeCinematicProgress,
  useCinematicScroll,
  type CinematicProgressRenderer,
} from "./useCinematicScroll";

type UseMultiplaneCameraOptions = {
  shellRef: RefObject<HTMLElement | null>;
  stageRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  isReducedMotion: boolean;
  compactLayout: boolean;
};

type TrailPose = {
  at: number;
  x: number;
  y: number;
  rotate: number;
  scale: number;
};

export type MultiplaneCameraVars = {
  progress: number;
  skyShift: number;
  farShift: number;
  farScale: number;
  nearShift: number;
  nearScale: number;
  nearDrift: number;
  routeProgress: number;
  runnerProgress: number;
  runnerX: number;
  runnerY: number;
  runnerRotate: number;
  runnerScale: number;
  runnerOpacity: number;
  foregroundOpacity: number;
  titleOpacity: number;
  titleShift: number;
  titleScale: number;
  summitGlow: number;
  atmosphere: number;
  handoff: number;
};

const TRAIL_POSES: readonly [TrailPose, ...TrailPose[]] = [
  { at: 0, x: 6, y: 92, rotate: -18, scale: 1.08 },
  { at: 0.18, x: 23, y: 88, rotate: -24, scale: 1 },
  { at: 0.38, x: 38, y: 69, rotate: -28, scale: 0.88 },
  { at: 0.58, x: 54, y: 60, rotate: -22, scale: 0.76 },
  { at: 0.78, x: 72, y: 46, rotate: -29, scale: 0.63 },
  { at: 1, x: 88, y: 30, rotate: -32, scale: 0.48 },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function smoothstep(start: number, end: number, value: number): number {
  const progress = clamp((value - start) / (end - start), 0, 1);
  return progress * progress * (3 - 2 * progress);
}

function interpolatePose(progress: number): Omit<TrailPose, "at"> {
  const normalized = clamp(progress, 0, 1);
  const nextIndex = TRAIL_POSES.findIndex((pose) => pose.at >= normalized);
  const first = TRAIL_POSES[0];

  if (nextIndex <= 0) {
    const { x, y, rotate, scale } = first;
    return { x, y, rotate, scale };
  }

  const next = TRAIL_POSES[nextIndex];
  const previous = TRAIL_POSES[nextIndex - 1];
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

export const computeCameraProgress = computeCinematicProgress;

export function computeMultiplaneVars(
  progress: number,
  compactLayout: boolean,
  reducedMotion = false,
): MultiplaneCameraVars {
  const normalizedProgress = clamp(progress, 0, 1);
  const sceneProgress = reducedMotion ? 0.46 : normalizedProgress;
  const routeProgress = reducedMotion
    ? 1
    : 0.04 + smoothstep(0.04, 0.9, sceneProgress) * 0.96;
  const runnerProgress = reducedMotion
    ? 0.5
    : smoothstep(0.08, 0.9, sceneProgress);
  const runnerPose = interpolatePose(runnerProgress);
  const handoff = reducedMotion ? 0 : smoothstep(0.88, 1, sceneProgress);
  const titleTravel = reducedMotion
    ? 0
    : smoothstep(0.14, 0.5, sceneProgress);

  return {
    progress: sceneProgress,
    skyShift: sceneProgress * (compactLayout ? -10 : -18),
    farShift: sceneProgress * (compactLayout ? -34 : -56),
    farScale: 1 + sceneProgress * (compactLayout ? 0.025 : 0.04),
    nearShift: sceneProgress * (compactLayout ? -58 : -92),
    nearScale: 1 + sceneProgress * (compactLayout ? 0.13 : 0.2),
    nearDrift:
      Math.sin(sceneProgress * Math.PI * 1.4) * (compactLayout ? 2.5 : 5.5),
    routeProgress,
    runnerProgress,
    runnerX: runnerPose.x,
    runnerY: runnerPose.y,
    runnerRotate: runnerPose.rotate,
    runnerScale: runnerPose.scale * (compactLayout ? 0.84 : 1),
    runnerOpacity: reducedMotion
      ? 1
      : 0.62 + smoothstep(0.02, 0.12, sceneProgress) * 0.38 - handoff * 0.6,
    foregroundOpacity: reducedMotion
      ? 1
      : 1 - smoothstep(0.76, 1, sceneProgress) * 0.44,
    titleOpacity: reducedMotion
      ? 1
      : clamp(1 - titleTravel * 0.69 - handoff * 0.17, 0.14, 1),
    titleShift: reducedMotion ? 0 : titleTravel * (compactLayout ? -24 : -38),
    titleScale: reducedMotion ? 1 : 1 - titleTravel * 0.07,
    summitGlow: 0.16 + smoothstep(0.58, 0.95, sceneProgress) * 0.84,
    atmosphere: 0.22 + smoothstep(0.24, 0.92, sceneProgress) * 0.64,
    handoff,
  };
}

function applyStageVars(stage: HTMLElement, vars: MultiplaneCameraVars) {
  stage.style.setProperty("--camera-progress", vars.progress.toFixed(4));
  stage.style.setProperty("--sky-shift", vars.skyShift.toFixed(3));
  stage.style.setProperty("--far-shift", vars.farShift.toFixed(3));
  stage.style.setProperty("--far-scale", vars.farScale.toFixed(4));
  stage.style.setProperty("--near-shift", vars.nearShift.toFixed(3));
  stage.style.setProperty("--near-scale", vars.nearScale.toFixed(4));
  stage.style.setProperty("--near-drift", vars.nearDrift.toFixed(3));
  stage.style.setProperty("--route-progress", vars.routeProgress.toFixed(4));
  stage.style.setProperty("--runner-progress", vars.runnerProgress.toFixed(4));
  stage.style.setProperty("--runner-x", vars.runnerX.toFixed(3));
  stage.style.setProperty("--runner-y", vars.runnerY.toFixed(3));
  stage.style.setProperty("--runner-rotate", vars.runnerRotate.toFixed(3));
  stage.style.setProperty("--runner-scale", vars.runnerScale.toFixed(4));
  stage.style.setProperty("--runner-opacity", vars.runnerOpacity.toFixed(4));
  stage.style.setProperty("--foreground-opacity", vars.foregroundOpacity.toFixed(4));
  stage.style.setProperty("--cinematic-title-opacity", vars.titleOpacity.toFixed(4));
  stage.style.setProperty("--cinematic-title-shift", vars.titleShift.toFixed(3));
  stage.style.setProperty("--cinematic-title-scale", vars.titleScale.toFixed(4));
  stage.style.setProperty("--summit-glow", vars.summitGlow.toFixed(4));
  stage.style.setProperty("--mountain-atmosphere", vars.atmosphere.toFixed(4));
  stage.style.setProperty("--cinematic-handoff", vars.handoff.toFixed(4));
}

export function useMultiplaneCamera({
  shellRef,
  stageRef,
  enabled,
  isReducedMotion,
  compactLayout,
}: UseMultiplaneCameraOptions) {
  const renderProgress = useCallback<CinematicProgressRenderer>(
    (stage, progress, reducedMotion) => {
      applyStageVars(
        stage,
        computeMultiplaneVars(progress, compactLayout, reducedMotion),
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
