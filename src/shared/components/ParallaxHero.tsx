import { useEffect, useRef, useState } from "react";
import { useMultiplaneCamera } from "./parallax/useMultiplaneCamera";
import { useRocketCamera } from "./parallax/useRocketCamera";
import {
  MountainTrailJourney,
  RocketFlightJourney,
} from "./parallax/CinematicSceneArtwork";
import type { ThemeMode } from "../../app/providers/ThemeProvider";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const COMPACT_LAYOUT_QUERY =
  "(max-width: 900px), (max-aspect-ratio: 4 / 5)";

function matchesMediaQuery(query: string): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }

  return window.matchMedia(query).matches;
}

type ParallaxHeroProps = {
  themeMode: ThemeMode;
  title: string;
  subtitle: string;
  signal?: string | undefined;
};

export function ParallaxHero({
  themeMode,
  title,
  subtitle,
  signal,
}: ParallaxHeroProps) {
  const mountainShellRef = useRef<HTMLElement | null>(null);
  const mountainStageRef = useRef<HTMLElement | null>(null);
  const rocketShellRef = useRef<HTMLElement | null>(null);
  const rocketStageRef = useRef<HTMLElement | null>(null);
  const [isReducedMotion, setIsReducedMotion] = useState(() =>
    matchesMediaQuery(REDUCED_MOTION_QUERY),
  );
  const [isCompactLayout, setIsCompactLayout] = useState(() =>
    matchesMediaQuery(COMPACT_LAYOUT_QUERY),
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const reducedMotionMedia = window.matchMedia(REDUCED_MOTION_QUERY);
    const compactLayoutMedia = window.matchMedia(COMPACT_LAYOUT_QUERY);

    const handleReducedMotionChange = (event: MediaQueryListEvent) => {
      setIsReducedMotion(event.matches);
    };

    const handleCompactLayoutChange = (event: MediaQueryListEvent) => {
      setIsCompactLayout(event.matches);
    };

    setIsReducedMotion(reducedMotionMedia.matches);
    setIsCompactLayout(compactLayoutMedia.matches);

    reducedMotionMedia.addEventListener("change", handleReducedMotionChange);
    compactLayoutMedia.addEventListener("change", handleCompactLayoutChange);

    return () => {
      reducedMotionMedia.removeEventListener(
        "change",
        handleReducedMotionChange,
      );
      compactLayoutMedia.removeEventListener(
        "change",
        handleCompactLayoutChange,
      );
    };
  }, []);

  const mountainMode = themeMode === "mountain";
  const rocketMode = themeMode === "rocket";

  useMultiplaneCamera({
    shellRef: mountainShellRef,
    stageRef: mountainStageRef,
    enabled: mountainMode,
    isReducedMotion,
    compactLayout: isCompactLayout,
  });

  useRocketCamera({
    shellRef: rocketShellRef,
    stageRef: rocketStageRef,
    enabled: rocketMode,
    isReducedMotion,
    compactLayout: isCompactLayout,
  });

  const heroContent = (
    <div className="hero-content">
      <h1 className="hero-title">{title}</h1>
      <p className="hero-subtitle">{subtitle}</p>
      {signal ? (
        <div className="hero-signal-slot" aria-live="polite">
          <a className="hero-signal" href="#rocket-logbook">
            {signal}
          </a>
        </div>
      ) : null}
    </div>
  );

  if (mountainMode) {
    return (
      <section className="mountain-camera-shell" ref={mountainShellRef}>
        <div className="mountain-camera-sticky">
          <section
            key="mountain-camera"
            className="parallax-container mountain-camera-stage"
            data-hero-theme={themeMode}
            ref={mountainStageRef}
          >
            <div className="topographic-field" aria-hidden="true" />
            <div
              className="mountain-layer mountain-layer-sky"
              aria-hidden="true"
            />
            <div
              className="mountain-layer mountain-layer-far"
              aria-hidden="true"
            />
            <MountainTrailJourney />
            <div
              className="mountain-layer mountain-layer-near"
              aria-hidden="true"
            />
            {heroContent}
          </section>
        </div>
      </section>
    );
  }

  if (rocketMode) {
    return (
      <section className="rocket-camera-shell" ref={rocketShellRef}>
        <div className="rocket-camera-sticky">
          <section
            key="rocket-camera"
            className="parallax-container rocket-camera-stage"
            data-hero-theme={themeMode}
            ref={rocketStageRef}
          >
            <div className="topographic-field" aria-hidden="true" />
            <div
              className="rocket-layer rocket-layer-space"
              aria-hidden="true"
            />
            <div
              className="rocket-layer rocket-layer-planet"
              aria-hidden="true"
            />
            <div
              className="rocket-layer rocket-layer-asteroids"
              aria-hidden="true"
            />
            <RocketFlightJourney />
            <div
              className="rocket-layer rocket-layer-ship"
              aria-hidden="true"
            />
            {heroContent}
          </section>
        </div>
      </section>
    );
  }

  return (
    <section
      className="parallax-container simple-theme-hero"
      data-hero-theme={themeMode}
    >
      <div className="topographic-field" aria-hidden="true" />
      {heroContent}
    </section>
  );
}
