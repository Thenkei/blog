import { useEffect, type RefObject } from "react";

const CAMERA_REVEAL_THRESHOLD = 0.78;
const CAMERA_TRAVEL_DESKTOP = 320;
const CAMERA_TRAVEL_MOBILE = 190;

type UseMultiplaneCameraOptions = {
  shellRef: RefObject<HTMLElement | null>;
  stageRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  isReducedMotion: boolean;
  mobileReduced: boolean;
};

export type MultiplaneCameraVars = {
  progress: number;
  skyShift: number;
  farShift: number;
  nearShift: number;
  nearScale: number;
  nearDrift: number;
  nearTilt: number;
  trailSpeed: number;
  atmosphereShift: number;
  clearance: boolean;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function computeCameraProgress(scrollY: number, startY: number, range: number): number {
  if (range <= 0) {
    return 0;
  }

  return clamp((scrollY - startY) / range, 0, 1);
}

export function computeMultiplaneVars(
  progress: number,
  mobileReduced: boolean,
): MultiplaneCameraVars {
  const normalizedProgress = clamp(progress, 0, 1);
  const travel = mobileReduced ? CAMERA_TRAVEL_MOBILE : CAMERA_TRAVEL_DESKTOP;

  const nearSpeedBoostPhase = clamp(
    (normalizedProgress - CAMERA_REVEAL_THRESHOLD) / (1 - CAMERA_REVEAL_THRESHOLD),
    0,
    1,
  );
  const nearSpeed = 0.8 + nearSpeedBoostPhase * 0.2;
  const pacePulse = Math.sin(normalizedProgress * Math.PI * (mobileReduced ? 4.6 : 6.2));
  const paceEnvelope = 0.35 + normalizedProgress * 0.65;

  const nearScale =
    1 +
    normalizedProgress * (mobileReduced ? 0.09 : 0.16) +
    nearSpeedBoostPhase * (mobileReduced ? 0.09 : 0.18);

  const nearDrift =
    Math.sin(normalizedProgress * Math.PI * 1.75) * (mobileReduced ? 5 : 9) +
    pacePulse * (mobileReduced ? 2.6 : 4.8) * paceEnvelope +
    normalizedProgress * (mobileReduced ? 2.1 : 4.2);

  const nearTilt =
    (mobileReduced ? 2.4 : 4.2) +
    normalizedProgress * (mobileReduced ? 2.3 : 4.6) +
    nearSpeedBoostPhase * (mobileReduced ? 2.1 : 3.8);

  const trailSpeed = clamp(
    0.16 +
      normalizedProgress * (mobileReduced ? 0.5 : 0.7) +
      nearSpeedBoostPhase * 0.45 +
      Math.abs(pacePulse) * (mobileReduced ? 0.12 : 0.18),
    0,
    1,
  );

  return {
    progress: normalizedProgress,
    skyShift: -travel * normalizedProgress * 0.1,
    farShift: -travel * normalizedProgress * 0.3,
    nearShift: -travel * normalizedProgress * nearSpeed,
    nearScale,
    nearDrift,
    nearTilt,
    trailSpeed,
    atmosphereShift: normalizedProgress * (mobileReduced ? 10 : 18),
    clearance: normalizedProgress >= CAMERA_REVEAL_THRESHOLD,
  };
}

function applyStageVars(stage: HTMLElement, vars: MultiplaneCameraVars) {
  stage.style.setProperty("--camera-progress", vars.progress.toFixed(4));
  stage.style.setProperty("--sky-shift", vars.skyShift.toFixed(3));
  stage.style.setProperty("--far-shift", vars.farShift.toFixed(3));
  stage.style.setProperty("--near-shift", vars.nearShift.toFixed(3));
  stage.style.setProperty("--near-scale", vars.nearScale.toFixed(4));
  stage.style.setProperty("--near-drift", vars.nearDrift.toFixed(3));
  stage.style.setProperty("--near-tilt", vars.nearTilt.toFixed(3));
  stage.style.setProperty("--trail-speed", vars.trailSpeed.toFixed(3));
  stage.style.setProperty("--atmosphere-shift", vars.atmosphereShift.toFixed(3));
  stage.classList.toggle("mountain-camera-clearance", vars.clearance);
}

function resetStageVars(stage: HTMLElement) {
  const vars = computeMultiplaneVars(0, false);
  applyStageVars(stage, vars);
  stage.classList.remove("mountain-camera-clearance");
}

export function useMultiplaneCamera({
  shellRef,
  stageRef,
  enabled,
  isReducedMotion,
  mobileReduced,
}: UseMultiplaneCameraOptions) {
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
      const vars = computeMultiplaneVars(nextProgress, mobileReduced);
      applyStageVars(stage, vars);
    };

    const update = () => {
      const progress = isReducedMotion
        ? 0
        : computeCameraProgress(window.scrollY, startY, range);

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
