import { useEffect, type RefObject } from "react";

export type CinematicProgressRenderer = (
  stage: HTMLElement,
  progress: number,
  isReducedMotion: boolean,
) => void;

type UseCinematicScrollOptions = {
  shellRef: RefObject<HTMLElement | null>;
  stageRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  isReducedMotion: boolean;
  renderProgress: CinematicProgressRenderer;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function computeCinematicProgress(
  scrollY: number,
  startY: number,
  range: number,
): number {
  if (
    !Number.isFinite(scrollY) ||
    !Number.isFinite(startY) ||
    !Number.isFinite(range) ||
    range <= 0
  ) {
    return 0;
  }

  return clamp((scrollY - startY) / range, 0, 1);
}

export function useCinematicScroll({
  shellRef,
  stageRef,
  enabled,
  isReducedMotion,
  renderProgress,
}: UseCinematicScrollOptions): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const shell = shellRef.current;
    const stage = stageRef.current;
    if (!shell || !stage) {
      return;
    }

    let startY = 0;
    let range = 0;
    let rafId: number | null = null;
    let lastProgress: number | null = null;
    let lastReducedMotion: boolean | null = null;

    const renderIfChanged = (progress: number, reducedMotion: boolean) => {
      const normalizedProgress = clamp(progress, 0, 1);
      if (
        normalizedProgress === lastProgress &&
        reducedMotion === lastReducedMotion
      ) {
        return;
      }

      lastProgress = normalizedProgress;
      lastReducedMotion = reducedMotion;
      renderProgress(stage, normalizedProgress, reducedMotion);
    };

    if (isReducedMotion) {
      renderIfChanged(0, true);
      return;
    }

    const measure = () => {
      const shellRect = shell.getBoundingClientRect();
      startY = window.scrollY + shellRect.top;
      range = Math.max(0, shell.offsetHeight - stage.offsetHeight);
    };

    const renderFromScroll = () => {
      rafId = null;
      renderIfChanged(
        computeCinematicProgress(window.scrollY, startY, range),
        false,
      );
    };

    const requestRender = () => {
      if (rafId !== null) {
        return;
      }

      rafId = window.requestAnimationFrame(renderFromScroll);
    };

    const handleResize = () => {
      measure();
      requestRender();
    };

    measure();
    renderFromScroll();

    window.addEventListener("scroll", requestRender, { passive: true });
    window.addEventListener("resize", handleResize);

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(handleResize);
    resizeObserver?.observe(shell);
    resizeObserver?.observe(stage);

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }

      window.removeEventListener("scroll", requestRender);
      window.removeEventListener("resize", handleResize);
      resizeObserver?.disconnect();
    };
  }, [enabled, isReducedMotion, renderProgress, shellRef, stageRef]);
}
