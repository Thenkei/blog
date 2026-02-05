import { useEffect, useRef, useState } from "react";

function ReadingProgressBar({ articleRef }) {
  const progressBarRef = useRef(null);
  const rocketOrbitRef = useRef(null);
  const displayProgressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const animationFrameRef = useRef(null);
  const lastFrameRef = useRef(0);
  const orbitActiveRef = useRef(false);
  const directionRef = useRef("down");
  const lastTargetRef = useRef(0);
  const [orbitActive, setOrbitActive] = useState(false);
  const [theme, setTheme] = useState(
    document.documentElement.getAttribute("data-theme") || "dark",
  );

  const isRocket = theme === "rocket";

  useEffect(() => {
    const observer = new MutationObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.type === "attributes") {
          setTheme(
            document.documentElement.getAttribute("data-theme") || "dark",
          );
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const syncProgressToDom = (value) => {
      const readingValue = value.toFixed(3);
      const rocketValue = (100 - value).toFixed(3);
      if (rocketOrbitRef.current) {
        rocketOrbitRef.current.style.setProperty(
          "--rocket-progress",
          rocketValue,
        );
      }
      if (progressBarRef.current) {
        progressBarRef.current.style.setProperty(
          "--reading-progress",
          readingValue,
        );
        progressBarRef.current.style.setProperty("--runner-speed", "0.25");
        progressBarRef.current.style.setProperty("--runner-trail", "18px");
        progressBarRef.current.style.setProperty("--runner-trail-opacity", "0.45");
        progressBarRef.current.setAttribute(
          "data-direction",
          directionRef.current,
        );
      }

      const nextOrbit = value >= 99.5;
      if (orbitActiveRef.current !== nextOrbit) {
        orbitActiveRef.current = nextOrbit;
        setOrbitActive(nextOrbit);
      }
    };

    syncProgressToDom(displayProgressRef.current);
  }, [theme]);

  useEffect(() => {
    const animateProgress = () => {
      const current = displayProgressRef.current;
      const target = targetProgressRef.current;
      const delta = target - current;

      if (Math.abs(delta) < 0.05) {
        displayProgressRef.current = target;
        const readingValue = target.toFixed(3);
        const rocketValue = (100 - target).toFixed(3);
        if (rocketOrbitRef.current) {
          rocketOrbitRef.current.style.setProperty(
            "--rocket-progress",
            rocketValue,
          );
        }
        if (progressBarRef.current) {
          progressBarRef.current.style.setProperty(
            "--reading-progress",
            readingValue,
          );
        }
        const nextOrbit = target >= 99.5;
        if (orbitActiveRef.current !== nextOrbit) {
          orbitActiveRef.current = nextOrbit;
          setOrbitActive(nextOrbit);
        }
        animationFrameRef.current = null;
        lastFrameRef.current = 0;
        return;
      }

      const now = performance.now();
      const last = lastFrameRef.current || now;
      const deltaTime = Math.min(0.05, (now - last) / 1000);
      lastFrameRef.current = now;

      // Frame-rate independent smoothing.
      const lerpFactor = 1 - Math.exp(-deltaTime * 12);
      const next = current + delta * lerpFactor;
      displayProgressRef.current = next;

      const rocketValue = (100 - next).toFixed(3);
      const readingValue = next.toFixed(3);
      if (rocketOrbitRef.current) {
        rocketOrbitRef.current.style.setProperty(
          "--rocket-progress",
          rocketValue,
        );
      }
      if (progressBarRef.current) {
        progressBarRef.current.style.setProperty(
          "--reading-progress",
          readingValue,
        );
      }

      const nextOrbit = next >= 99.5;
      if (orbitActiveRef.current !== nextOrbit) {
        orbitActiveRef.current = nextOrbit;
        setOrbitActive(nextOrbit);
      }

      animationFrameRef.current = requestAnimationFrame(animateProgress);
    };

    const updateProgress = () => {
      const article = articleRef?.current;

      if (!article) {
        targetProgressRef.current = 0;
        displayProgressRef.current = 0;
        lastTargetRef.current = 0;
        directionRef.current = "down";
        if (rocketOrbitRef.current) {
          rocketOrbitRef.current.style.setProperty("--rocket-progress", "100");
        }
        if (progressBarRef.current) {
          progressBarRef.current.style.setProperty("--reading-progress", "0");
          progressBarRef.current.style.setProperty("--runner-speed", "0.25");
          progressBarRef.current.style.setProperty("--runner-trail", "18px");
          progressBarRef.current.style.setProperty("--runner-trail-opacity", "0.45");
          progressBarRef.current.setAttribute("data-direction", "down");
        }
        if (orbitActiveRef.current) {
          orbitActiveRef.current = false;
          setOrbitActive(false);
        }
        return;
      }

      const windowHeight = window.innerHeight || 1;
      const scrollTop = window.scrollY;
      const doc = document.documentElement;
      const maxScroll = Math.max(1, doc.scrollHeight - windowHeight);
      const percentage = (scrollTop / maxScroll) * 100;

      // Clamp between 0 and 100
      const clamped = Math.min(Math.max(percentage, 0), 100);
      targetProgressRef.current = clamped;

      const deltaTarget = clamped - lastTargetRef.current;
      if (Math.abs(deltaTarget) > 0.15) {
        const nextDirection = deltaTarget > 0 ? "down" : "up";
        if (directionRef.current !== nextDirection) {
          directionRef.current = nextDirection;
          if (progressBarRef.current) {
            progressBarRef.current.setAttribute(
              "data-direction",
              nextDirection,
            );
          }
        }
        if (progressBarRef.current) {
          const speed = Math.min(1, Math.abs(deltaTarget) / 6);
          const speedValue = (0.25 + speed * 0.75).toFixed(2);
          const trailSize = (18 + speed * 24).toFixed(0);
          const trailOpacity = (0.45 + speed * 0.45).toFixed(2);
          progressBarRef.current.style.setProperty(
            "--runner-speed",
            speedValue,
          );
          progressBarRef.current.style.setProperty(
            "--runner-trail",
            `${trailSize}px`,
          );
          progressBarRef.current.style.setProperty(
            "--runner-trail-opacity",
            trailOpacity,
          );
        }
        lastTargetRef.current = clamped;
      }

      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(animateProgress);
      }
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress);
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [articleRef, theme]);

  if (isRocket) {
    return (
      <div className="rocket-progress" aria-hidden="true">
        <div className="moon">
          <svg viewBox="0 0 120 120" role="presentation">
            <defs>
              <radialGradient id="moonGlow" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#fff7d6" />
                <stop offset="70%" stopColor="#f9e7a6" />
                <stop offset="100%" stopColor="#f1d37a" />
              </radialGradient>
            </defs>
            <circle cx="60" cy="60" r="45" fill="url(#moonGlow)" />
            <circle cx="45" cy="48" r="6" fill="#e7c56a" opacity="0.7" />
            <circle cx="72" cy="68" r="8" fill="#e0b85b" opacity="0.7" />
            <circle cx="63" cy="40" r="4" fill="#e0b85b" opacity="0.6" />
          </svg>
        </div>
        <div
          ref={rocketOrbitRef}
          className={`rocket-orbit ${orbitActive ? "active" : ""}`}
        >
          <div className="rocket">
            <svg viewBox="0 0 120 220" role="presentation">
              <defs>
                <linearGradient id="rocketBody" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="60%" stopColor="#cbd5f5" />
                  <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>
                <linearGradient id="rocketGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d946ef" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#fb923c" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <path
                d="M60 8 C40 28 32 52 32 86 L32 150 C32 168 45 184 60 196 C75 184 88 168 88 150 L88 86 C88 52 80 28 60 8 Z"
                fill="url(#rocketBody)"
              />
              <path
                d="M60 8 C40 28 32 52 32 86 L32 120 C52 124 68 124 88 120 L88 86 C88 52 80 28 60 8 Z"
                fill="url(#rocketGlow)"
                opacity="0.6"
              />
              <circle cx="60" cy="90" r="14" fill="#0f172a" opacity="0.7" />
              <circle cx="60" cy="90" r="8" fill="#38bdf8" />
              <path
                d="M32 134 L16 154 L32 154 Z"
                fill="#fb923c"
                opacity="0.85"
              />
              <path
                d="M88 134 L104 154 L88 154 Z"
                fill="#fb923c"
                opacity="0.85"
              />
              <path
                d="M60 196 L46 214 L60 206 L74 214 Z"
                fill="#f97316"
              />
            </svg>
            <span className="rocket-trail" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={progressBarRef}
      className="reading-progress-bar"
      style={{ "--reading-progress": 0 }}
    >
      <span className="reading-progress-track" />
      <span className="reading-progress-runner">
        <svg
          className="reading-progress-runner-icon"
          viewBox="0 0 64 64"
          role="presentation"
          aria-hidden="true"
        >
          <circle className="runner-head" cx="40" cy="14" r="6" />
          <path className="runner-headband" d="M35 14 Q40 10 45 14" />
          <path
            className="runner-torso"
            d="M30 22 Q40 18 46 26 Q50 32 46 36 Q38 40 30 34 Z"
          />
          <path className="runner-pack" d="M28 24 L30 32 L24 34 L22 26 Z" />
          <path className="runner-arm runner-arm-front" d="M34 26 L20 30 L12 36" />
          <path className="runner-arm runner-arm-back" d="M40 26 L54 20" />
          <path className="runner-leg runner-leg-front" d="M36 36 L28 50 L18 56" />
          <path className="runner-leg runner-leg-back" d="M40 36 L52 48 L60 52" />
          <circle className="runner-shoe runner-shoe-front" cx="18" cy="56" r="3" />
          <circle className="runner-shoe runner-shoe-back" cx="60" cy="52" r="3" />
        </svg>
      </span>
    </div>
  );
}

export default ReadingProgressBar;
