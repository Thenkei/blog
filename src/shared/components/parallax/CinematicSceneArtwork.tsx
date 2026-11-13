const ROCKET_FLIGHT_PATH =
  "M 30 520 C 170 480 250 430 360 390 C 500 340 590 390 680 420 C 770 450 860 360 845 250 C 832 148 900 90 1035 -35";

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
