const MOUNTAIN_ROUTE =
  "M 40 569 C 131 526 216 532 299 471 C 380 411 457 433 544 363 C 626 298 704 322 777 251 C 820 210 848 191 881 181";

const ROCKET_FLIGHT_PATH =
  "M 30 520 C 170 480 250 430 360 390 C 500 340 590 390 680 420 C 770 450 860 360 845 250 C 832 148 900 90 1035 -35";

export function MountainTrailJourney() {
  return (
    <div className="mountain-trail-journey" aria-hidden="true">
      <svg
        className="mountain-trail-map"
        viewBox="0 0 1000 600"
        preserveAspectRatio="none"
        focusable="false"
      >
        <defs>
          <linearGradient id="mountain-route-gradient" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#d4a95f" />
            <stop offset="0.5" stopColor="#f2d38b" />
            <stop offset="1" stopColor="#fff0b8" />
          </linearGradient>
          <filter id="mountain-route-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="mountain-route-reveal" clipPathUnits="userSpaceOnUse">
            <rect
              className="mountain-route-reveal-clip"
              x="-30"
              y="-30"
              width="1060"
              height="660"
            />
          </clipPath>
        </defs>

        <path className="mountain-route-bed" d={MOUNTAIN_ROUTE} />
        <path
          className="mountain-route-line"
          d={MOUNTAIN_ROUTE}
          clipPath="url(#mountain-route-reveal)"
          filter="url(#mountain-route-glow)"
        />
        <circle className="mountain-route-trailhead" cx="40" cy="569" r="8" />
        <circle className="mountain-route-summit-ring" cx="881" cy="181" r="17" />
        <circle className="mountain-route-summit" cx="881" cy="181" r="5" />
      </svg>

      <svg
        className="mountain-cinematic-runner"
        viewBox="0 0 84 84"
        focusable="false"
      >
        <g className="mountain-runner-silhouette">
          <path className="mountain-runner-pole" d="M18 32 L8 76 M67 29 L75 73" />
          <path className="mountain-runner-pack" d="M29 27 Q34 20 42 21 L43 43 Q34 47 27 41 Z" />
          <path className="mountain-runner-torso" d="M39 20 Q48 18 52 27 L48 46 Q40 50 34 44 L35 29 Z" />
          <circle cx="49" cy="12" r="7" />
          <path className="mountain-runner-limb" d="M39 29 L27 38 L17 31" />
          <path className="mountain-runner-limb" d="M47 29 L58 37 L68 27" />
          <path className="mountain-runner-limb" d="M39 45 L28 59 L15 67" />
          <path className="mountain-runner-limb" d="M45 45 L57 58 L71 62" />
        </g>
      </svg>

      <div className="mountain-summit-glow" />
    </div>
  );
}

export function RocketFlightJourney() {
  return (
    <div className="rocket-flight-journey" aria-hidden="true">
      <svg
        className="rocket-flight-map"
        viewBox="0 0 1000 600"
        preserveAspectRatio="none"
        focusable="false"
      >
        <defs>
          <linearGradient id="rocket-flight-gradient" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#7de4ff" />
            <stop offset="0.52" stopColor="#ca78ff" />
            <stop offset="1" stopColor="#ff9a6a" />
          </linearGradient>
          <filter id="rocket-flight-glow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="rocket-flight-reveal" clipPathUnits="userSpaceOnUse">
            <rect
              className="rocket-flight-reveal-clip"
              x="-40"
              y="-60"
              width="1120"
              height="720"
            />
          </clipPath>
        </defs>

        <path className="rocket-flight-ghost" d={ROCKET_FLIGHT_PATH} />
        <path
          className="rocket-flight-line"
          d={ROCKET_FLIGHT_PATH}
          clipPath="url(#rocket-flight-reveal)"
          filter="url(#rocket-flight-glow)"
        />
      </svg>

      <div className="rocket-arrival" aria-hidden="true">
        <span className="rocket-arrival-orbit rocket-arrival-orbit-outer" />
        <span className="rocket-arrival-orbit rocket-arrival-orbit-inner" />
        <span className="rocket-arrival-core" />
      </div>
    </div>
  );
}
