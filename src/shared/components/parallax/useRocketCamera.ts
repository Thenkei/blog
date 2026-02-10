import { useEffect, type RefObject } from "react";

const ROCKET_REVEAL_THRESHOLD = 0.8;
const ROCKET_TRAVEL_DESKTOP = 360;
const ROCKET_TRAVEL_MOBILE = 220;

type UseRocketCameraOptions = {
  shellRef: RefObject<HTMLElement | null>;
  stageRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  isReducedMotion: boolean;
  mobileReduced: boolean;
};

export type RocketCameraVars = {
  progress: number;
  spaceShift: number;
  planetShift: number;
  asteroidShift: number;
  asteroidDrift: number;
  planetScale: number;
  rocketX: number;
  rocketY: number;
  rocketRotate: number;
  clearance: boolean;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function computeRocketProgress(scrollY: number, startY: number, range: number): number {
  if (range <= 0) {
    return 0;
  }

  return clamp((scrollY - startY) / range, 0, 1);
}

export function computeRocketVars(progress: number, mobileReduced: boolean): RocketCameraVars {
  const normalizedProgress = clamp(progress, 0, 1);
  const travel = mobileReduced ? ROCKET_TRAVEL_MOBILE : ROCKET_TRAVEL_DESKTOP;

  const boostPhase = clamp(
    (normalizedProgress - ROCKET_REVEAL_THRESHOLD) / (1 - ROCKET_REVEAL_THRESHOLD),
    0,
    1,
  );
  const asteroidSpeed = 0.82 + boostPhase * 0.18;

  const rocketX = (mobileReduced ? -180 : -240) + normalizedProgress * (mobileReduced ? 450 : 600);
  const rocketY =
    (mobileReduced ? 98 : 132) -
    normalizedProgress * (mobileReduced ? 150 : 220) +
    Math.sin(normalizedProgress * Math.PI * 2) * (mobileReduced ? 12 : 20);
  const rocketRotate = -14 + normalizedProgress * 36;

  return {
    progress: normalizedProgress,
    spaceShift: -travel * normalizedProgress * 0.1,
    planetShift: -travel * normalizedProgress * 0.3,
    asteroidShift: -travel * normalizedProgress * asteroidSpeed,
    asteroidDrift:
      Math.sin(normalizedProgress * Math.PI * 2.3) * (mobileReduced ? 8 : 12) +
      normalizedProgress * (mobileReduced ? 7 : 10),
    planetScale: 1 + normalizedProgress * (mobileReduced ? 0.05 : 0.08),
    rocketX,
    rocketY,
    rocketRotate,
    clearance: normalizedProgress >= ROCKET_REVEAL_THRESHOLD,
  };
}

function applyStageVars(stage: HTMLElement, vars: RocketCameraVars) {
  stage.style.setProperty("--rocket-camera-progress", vars.progress.toFixed(4));
  stage.style.setProperty("--space-shift", vars.spaceShift.toFixed(3));
  stage.style.setProperty("--planet-shift", vars.planetShift.toFixed(3));
  stage.style.setProperty("--asteroid-shift", vars.asteroidShift.toFixed(3));
  stage.style.setProperty("--asteroid-drift", vars.asteroidDrift.toFixed(3));
  stage.style.setProperty("--planet-scale", vars.planetScale.toFixed(4));
  stage.style.setProperty("--rocket-x", vars.rocketX.toFixed(3));
  stage.style.setProperty("--rocket-y", vars.rocketY.toFixed(3));
  stage.style.setProperty("--rocket-rotate", vars.rocketRotate.toFixed(3));
  stage.classList.toggle("rocket-camera-clearance", vars.clearance);
}

function resetStageVars(stage: HTMLElement) {
  const vars = computeRocketVars(0, false);
  applyStageVars(stage, vars);
  stage.classList.remove("rocket-camera-clearance");
}

export function useRocketCamera({
  shellRef,
  stageRef,
  enabled,
  isReducedMotion,
  mobileReduced,
}: UseRocketCameraOptions) {
  useEffect(() => {
    const stage = stageRef.current;
    if (!enabled || !stage) {
      if (stage) {
        resetStageVars(stage);
      }
      return;
    }

    const shell = shellRef.current;
    if (!shell) {
      return;
    }

    let startY = 0;
    let range = 1;
    let rafId = 0;

    const measure = () => {
      const rect = shell.getBoundingClientRect();
      startY = window.scrollY + rect.top;
      range = Math.max(1, shell.offsetHeight - window.innerHeight);
    };

    const renderProgress = (nextProgress: number) => {
      const vars = computeRocketVars(nextProgress, mobileReduced);
      applyStageVars(stage, vars);
    };

    const update = () => {
      const progress = isReducedMotion
        ? 0
        : computeRocketProgress(window.scrollY, startY, range);

      renderProgress(progress);
    };

    const requestUpdate = () => {
      if (rafId) {
        return;
      }

      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        update();
      });
    };

    const handleResize = () => {
      measure();
      requestUpdate();
    };

    measure();
    update();

    if (!isReducedMotion) {
      window.addEventListener("scroll", requestUpdate, { passive: true });
      window.addEventListener("resize", handleResize);
    }

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }

      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", handleResize);
    };
  }, [enabled, isReducedMotion, mobileReduced, shellRef, stageRef]);
}
