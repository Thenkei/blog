import { useCallback, useEffect, useRef, type RefObject } from "react";
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

export type MultiplaneCameraVars = {
  progress: number;
  skyShift: number;
  farShift: number;
  farScale: number;
  nearShift: number;
  nearScale: number;
  nearDrift: number;
  /** How far along the visible route the runner is, from 0 to 1. */
  routeProgress: number;
  runnerScale: number;
  runnerOpacity: number;
  titleShift: number;
  /** First light (0) to sunrise (1): drives stars, sun, glow and warm light. */
  dawn: number;
  passGlow: number;
  hintOpacity: number;
  handoff: number;
};

export type TrailSample = {
  x: number;
  y: number;
  /** Direction of travel at this point (does not need to be normalised). */
  dx: number;
  dy: number;
};

export type RunnerPlacement = {
  x: number;
  y: number;
  /** Degrees, already signed for the direction the runner faces. */
  rotate: number;
  /** 1 when running towards the right, -1 on a switchback going left. */
  facing: 1 | -1;
};

/** Poster frame used when motion is reduced: mid-climb, sun already up. */
const POSTER_PROGRESS = 0.62;
/** The runner leans with the slope, but only part of the way. */
const SLOPE_LEAN = 0.35;
const MAX_LEAN_DEGREES = 14;
/** Scene units kept between the frame edge and the runner's first step. */
const ENTRY_MARGIN = 70;
const ENTRY_SAMPLES = 160;
/** Scene units covered by one stride pose. */
const STRIDE_LENGTH = 24;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function smoothstep(start: number, end: number, value: number): number {
  const progress = clamp((value - start) / (end - start), 0, 1);
  return progress * progress * (3 - 2 * progress);
}

export const computeCameraProgress = computeCinematicProgress;

export function computeMultiplaneVars(
  progress: number,
  compactLayout: boolean,
  reducedMotion = false,
): MultiplaneCameraVars {
  const sceneProgress = reducedMotion
    ? POSTER_PROGRESS
    : clamp(progress, 0, 1);
  const routeProgress = reducedMotion
    ? POSTER_PROGRESS
    : smoothstep(0, 0.94, sceneProgress) * 0.55 +
      clamp(sceneProgress / 0.94, 0, 1) * 0.45;
  const handoff = reducedMotion ? 0 : smoothstep(0.9, 1, sceneProgress);
  // The runner shrinks as the trail recedes towards the pass.
  const perspective = 1.02 - routeProgress * 0.34;

  return {
    progress: sceneProgress,
    skyShift: sceneProgress * (compactLayout ? -10 : -18),
    farShift: sceneProgress * (compactLayout ? -34 : -56),
    farScale: 1 + sceneProgress * (compactLayout ? 0.018 : 0.03),
    nearShift: sceneProgress * (compactLayout ? -58 : -92),
    nearScale: 1 + sceneProgress * (compactLayout ? 0.06 : 0.09),
    nearDrift:
      Math.sin(sceneProgress * Math.PI * 1.4) * (compactLayout ? 2.5 : 5.5),
    routeProgress,
    runnerScale: perspective * (compactLayout ? 1.4 : 1),
    runnerOpacity: 1 - handoff * 0.4,
    titleShift: reducedMotion ? 0 : sceneProgress * (compactLayout ? -8 : -28),
    dawn: reducedMotion ? 0.78 : smoothstep(0.05, 0.9, sceneProgress),
    passGlow: smoothstep(0.66, 0.97, sceneProgress),
    hintOpacity: reducedMotion ? 0 : 1 - smoothstep(0.015, 0.09, sceneProgress),
    handoff,
  };
}

/**
 * Where the runner starts. On narrow frames the trailhead is outside the
 * picture, so the run begins where the trail first enters it.
 */
export function computeTrailEntry(
  samples: readonly { x: number; length: number }[],
  visibleLeft: number,
): number {
  const first = samples[0];
  if (!first || first.x >= visibleLeft) {
    return 0;
  }

  return samples.find((sample) => sample.x >= visibleLeft)?.length ?? 0;
}

export function computeRunnerPlacement(sample: TrailSample): RunnerPlacement {
  const facing = sample.dx < 0 ? -1 : 1;
  const slopeDegrees =
    (Math.atan2(sample.dy, Math.abs(sample.dx)) * 180) / Math.PI;
  const lean = clamp(
    slopeDegrees * SLOPE_LEAN,
    -MAX_LEAN_DEGREES,
    MAX_LEAN_DEGREES,
  );

  return {
    x: sample.x,
    y: sample.y,
    rotate: lean * facing,
    facing,
  };
}

type TrailGeometry = {
  route: SVGPathElement;
  runner: SVGGElement;
  total: number;
  entry: number;
};

function measureTrail(stage: HTMLElement): TrailGeometry | null {
  const route = stage.querySelector<SVGPathElement>(".mountain-route-line");
  const runner = stage.querySelector<SVGGElement>(".mountain-cinematic-runner");
  const layer = stage.querySelector<HTMLElement>(".mountain-layer-near");
  const viewBox = route?.ownerSVGElement?.viewBox?.baseVal;

  // jsdom (tests) and very old engines do not implement SVG geometry: the
  // scene then stays on its static default pose.
  if (
    !route ||
    !runner ||
    !layer ||
    !viewBox ||
    typeof route.getTotalLength !== "function" ||
    typeof route.getPointAtLength !== "function"
  ) {
    return null;
  }

  const scale = layer.offsetHeight / viewBox.height;
  const total = route.getTotalLength();
  if (!(scale > 0) || !(total > 0)) {
    return null;
  }

  const visibleLeft =
    viewBox.x + viewBox.width - stage.offsetWidth / scale + ENTRY_MARGIN;
  const samples = Array.from({ length: ENTRY_SAMPLES + 1 }, (_, index) => {
    const length = (total * index) / ENTRY_SAMPLES;
    return { x: route.getPointAtLength(length).x, length };
  });

  return {
    route,
    runner,
    total,
    entry: computeTrailEntry(samples, visibleLeft),
  };
}

type RunnerPose = {
  placement: RunnerPlacement;
  /** Share of the whole trail behind the runner, from 0 to 1. */
  routeFraction: number;
  stride: "a" | "b";
};

/**
 * Where the runner stands for these camera values. Reads the trail geometry
 * and writes nothing.
 *
 * Asking an SVG path for a point makes the browser bring style up to date
 * first. A frame therefore locates the runner before it writes any camera
 * variable: the other way round, every scroll frame paid for a second,
 * synchronous style pass over the whole scene.
 */
function locateRunner(
  geometry: TrailGeometry | null,
  vars: MultiplaneCameraVars,
): RunnerPose | null {
  if (!geometry) {
    return null;
  }

  const { route, total, entry } = geometry;
  const length = entry + vars.routeProgress * (total - entry);
  const from = route.getPointAtLength(Math.max(0, length - 3));
  const to = route.getPointAtLength(Math.min(total, length + 3));
  const here = route.getPointAtLength(length);

  return {
    placement: computeRunnerPlacement({
      x: here.x,
      y: here.y,
      dx: to.x - from.x,
      dy: to.y - from.y,
    }),
    routeFraction: length / total,
    stride: Math.floor(length / STRIDE_LENGTH) % 2 === 0 ? "a" : "b",
  };
}

function drawRunner(
  stage: HTMLElement,
  geometry: TrailGeometry | null,
  vars: MultiplaneCameraVars,
  pose: RunnerPose | null,
) {
  if (!geometry || !pose) {
    stage.style.setProperty("--route-fraction", vars.routeProgress.toFixed(4));
    return;
  }

  const { placement } = pose;
  geometry.runner.setAttribute(
    "transform",
    `translate(${placement.x.toFixed(1)} ${placement.y.toFixed(1)}) ` +
      `rotate(${placement.rotate.toFixed(1)}) ` +
      `scale(${(vars.runnerScale * placement.facing).toFixed(3)} ${vars.runnerScale.toFixed(3)})`,
  );
  geometry.runner.dataset.stride = pose.stride;
  stage.style.setProperty("--route-fraction", pose.routeFraction.toFixed(4));
}

function applyStageVars(stage: HTMLElement, vars: MultiplaneCameraVars) {
  stage.style.setProperty("--camera-progress", vars.progress.toFixed(4));
  stage.style.setProperty("--sky-shift", vars.skyShift.toFixed(3));
  stage.style.setProperty("--far-shift", vars.farShift.toFixed(3));
  stage.style.setProperty("--far-scale", vars.farScale.toFixed(4));
  stage.style.setProperty("--near-shift", vars.nearShift.toFixed(3));
  stage.style.setProperty("--near-scale", vars.nearScale.toFixed(4));
  stage.style.setProperty("--near-drift", vars.nearDrift.toFixed(3));
  stage.style.setProperty("--runner-opacity", vars.runnerOpacity.toFixed(4));
  stage.style.setProperty("--cinematic-title-shift", vars.titleShift.toFixed(3));
  stage.style.setProperty("--mountain-dawn", vars.dawn.toFixed(4));
  stage.style.setProperty("--pass-glow", vars.passGlow.toFixed(4));
  stage.style.setProperty("--hero-hint-opacity", vars.hintOpacity.toFixed(4));
  stage.style.setProperty("--cinematic-handoff", vars.handoff.toFixed(4));
}

export function useMultiplaneCamera({
  shellRef,
  stageRef,
  enabled,
  isReducedMotion,
  compactLayout,
}: UseMultiplaneCameraOptions) {
  const geometryRef = useRef<TrailGeometry | null>(null);
  const lastVarsRef = useRef<MultiplaneCameraVars | null>(null);

  /**
   * Re-measures the trail and puts the runner back on it. Needed whenever the
   * framing changes without a scroll: the scene finishing its lazy load, a
   * resize, or the switch between wide and compact framing.
   */
  const refresh = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    geometryRef.current = measureTrail(stage);
    if (lastVarsRef.current) {
      const pose = locateRunner(geometryRef.current, lastVarsRef.current);
      drawRunner(stage, geometryRef.current, lastVarsRef.current, pose);
    }
  }, [stageRef]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!enabled || !stage || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(refresh);
    observer.observe(stage);

    return () => {
      observer.disconnect();
      geometryRef.current = null;
    };
  }, [enabled, refresh, stageRef]);

  const renderProgress = useCallback<CinematicProgressRenderer>(
    (stage, progress, reducedMotion) => {
      const vars = computeMultiplaneVars(progress, compactLayout, reducedMotion);
      geometryRef.current ??= measureTrail(stage);
      lastVarsRef.current = vars;
      // Every read of the scene comes before the first write of the frame.
      const pose = locateRunner(geometryRef.current, vars);
      applyStageVars(stage, vars);
      drawRunner(stage, geometryRef.current, vars, pose);
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

  return { refresh };
}
