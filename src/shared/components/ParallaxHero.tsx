import { useEffect, useRef, useState } from "react";
import { useMultiplaneCamera } from "./parallax/useMultiplaneCamera";
import { useRocketCamera } from "./parallax/useRocketCamera";
import type { ThemeMode } from "../../app/providers/ThemeProvider";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const MOBILE_QUERY = "(max-width: 720px)";

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
  onTitleClick: () => void;
};

export function ParallaxHero({
  themeMode,
  title,
  subtitle,
  onTitleClick,
}: ParallaxHeroProps) {
  const mountainShellRef = useRef<HTMLElement | null>(null);
  const mountainStageRef = useRef<HTMLElement | null>(null);
  const rocketShellRef = useRef<HTMLElement | null>(null);
  const rocketStageRef = useRef<HTMLElement | null>(null);
  const [isReducedMotion, setIsReducedMotion] = useState(() =>
    matchesMediaQuery(REDUCED_MOTION_QUERY),
  );
  const [isMobileReduced, setIsMobileReduced] = useState(() =>
    matchesMediaQuery(MOBILE_QUERY),
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const reducedMotionMedia = window.matchMedia(REDUCED_MOTION_QUERY);
    const mobileMedia = window.matchMedia(MOBILE_QUERY);

    const handleReducedMotionChange = (event: MediaQueryListEvent) => {
      setIsReducedMotion(event.matches);
    };

    const handleMobileChange = (event: MediaQueryListEvent) => {
      setIsMobileReduced(event.matches);
    };

    setIsReducedMotion(reducedMotionMedia.matches);
    setIsMobileReduced(mobileMedia.matches);

    reducedMotionMedia.addEventListener("change", handleReducedMotionChange);
    mobileMedia.addEventListener("change", handleMobileChange);

    return () => {
      reducedMotionMedia.removeEventListener(
        "change",
        handleReducedMotionChange,
      );
      mobileMedia.removeEventListener("change", handleMobileChange);
    };
  }, []);

  const mountainMode = themeMode === "mountain";
  const rocketMode = themeMode === "rocket";

  useMultiplaneCamera({
    shellRef: mountainShellRef,
    stageRef: mountainStageRef,
    enabled: mountainMode,
    isReducedMotion,
    mobileReduced: isMobileReduced,
  });

  useRocketCamera({
    shellRef: rocketShellRef,
    stageRef: rocketStageRef,
    enabled: rocketMode,
    isReducedMotion,
    mobileReduced: isMobileReduced,
  });

  const heroContent = (
    <div className="hero-content">
      <h1 className="hero-title" onClick={onTitleClick}>
        {title}
      </h1>
      <p className="hero-subtitle">{subtitle}</p>
    </div>
  );

  if (mountainMode) {
    return (
      <section className="mountain-camera-shell" ref={mountainShellRef}>
        <div className="mountain-camera-sticky">
          <section
            className="parallax-container mountain-camera-stage"
            data-hero-theme={themeMode}
            ref={mountainStageRef}
          >
            <div
              className="mountain-layer mountain-layer-sky"
              aria-hidden="true"
            />
            <div
              className="mountain-layer mountain-layer-far"
              aria-hidden="true"
            />
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
            className="parallax-container rocket-camera-stage"
            data-hero-theme={themeMode}
            ref={rocketStageRef}
          >
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
      {heroContent}
    </section>
  );
}
