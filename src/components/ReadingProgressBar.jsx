import { useEffect, useMemo, useState } from "react";

function ReadingProgressBar({ articleRef }) {
  const [progress, setProgress] = useState(0);
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
    const updateProgress = () => {
      const article = articleRef?.current;

      if (!article) {
        setProgress(0);
        return;
      }

      const windowHeight = window.innerHeight || 1;
      const scrollTop = window.scrollY;
      const articleTop = article.offsetTop;
      const articleHeight = article.scrollHeight;
      const maxScroll = Math.max(1, articleHeight - windowHeight);
      const scrollWithin = scrollTop - articleTop;
      const percentage = (scrollWithin / maxScroll) * 100;

      // Clamp between 0 and 100
      const clamped = Math.min(Math.max(percentage, 0), 100);
      setProgress(clamped);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress);
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [articleRef]);

  const rocketOffset = useMemo(() => {
    const clamped = Math.min(Math.max(progress, 0), 100);
    return 100 - clamped;
  }, [progress]);

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
          className={`rocket-orbit ${progress >= 100 ? "active" : ""}`}
          style={{ "--rocket-progress": rocketOffset }}
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
    <div className="reading-progress-bar" style={{ width: `${progress}%` }} />
  );
}

export default ReadingProgressBar;
