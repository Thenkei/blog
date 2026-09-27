import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { MotionStory } from "./stories";

export const MOTION_FPS = 30;
export const BEAT_FRAMES = 75;
export const MOTION_DURATION = BEAT_FRAMES * 3;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const paths: Record<MotionStory["kind"], string> = {
  flow: "M150 160 H750",
  choice: "M150 160 C290 160 300 85 450 85 C600 85 610 160 750 160",
  cycle: "M150 160 C300 80 600 80 750 160 C600 280 300 280 150 160",
  threshold: "M150 225 C360 220 520 210 610 170 S715 90 750 85",
};

export function MotionComposition({ story, compact }: { story: MotionStory; compact: boolean }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const activeBeat = Math.min(2, Math.floor(frame / BEAT_FRAMES));
  const localFrame = frame - activeBeat * BEAT_FRAMES;
  const intro = spring({ frame: localFrame, fps, config: { damping: 18, stiffness: 95 } });
  const progress = interpolate(frame, [0, MOTION_DURATION - 1], [0, 1], clamp);
  const signalX = interpolate(frame, [0, MOTION_DURATION - 1], [150, 750], clamp);
  const cardX = [118, 345, 572];

  if (compact) {
    return (
      <AbsoluteFill
        style={{
          background: "linear-gradient(150deg, var(--surface-1), var(--bg-color))",
          color: "var(--text-primary)",
          fontFamily: "var(--font-display)",
          overflow: "hidden",
        }}
      >
        <svg viewBox="0 0 390 540" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden="true">
          <path d="M195 120V310" fill="none" stroke="var(--text-muted)" strokeOpacity="0.35" strokeWidth="4" />
          <path d="M195 120V310" fill="none" stroke="var(--accent-secondary)" strokeWidth="5" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - progress} />
          <circle cx="195" cy={120 + progress * 190} r="8" fill="var(--accent-secondary)" />
        </svg>
        <div style={{ position: "absolute", top: 24, left: 26, color: "var(--accent-primary)", font: "700 18px var(--font-mono)", letterSpacing: 2 }}>
          {String(activeBeat + 1).padStart(2, "0")} / 03
        </div>
        {story.beats.map((beat, index) => {
          const active = activeBeat === index;
          return (
            <div
              key={index}
              style={{
                position: "absolute",
                top: 78 + index * 95,
                left: 34,
                width: 322,
                height: 74,
                borderRadius: 16,
                border: `2px solid ${active ? "var(--accent-primary)" : "var(--divider)"}`,
                background: "var(--surface-2)",
                boxShadow: active ? "0 0 30px var(--accent-soft)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px 15px",
                boxSizing: "border-box",
                textAlign: "center",
                fontSize: 21,
                fontWeight: 700,
                lineHeight: 1.18,
                opacity: frame >= index * BEAT_FRAMES ? 1 : 0.5,
                transform: `scale(${active ? 1 + intro * 0.02 : 1})`,
              }}
            >
              {beat}
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 28, right: 28, top: 390, paddingLeft: 16, minHeight: 62, borderLeft: "4px solid var(--accent-secondary)", display: "flex", alignItems: "center", fontSize: 25, fontWeight: 700, lineHeight: 1.15, opacity: intro }}>
          {story.beats[activeBeat]}
        </div>
        <div style={{ position: "absolute", left: 28, right: 28, bottom: 55, height: 4, borderRadius: 4, background: "var(--divider)" }}>
          <div style={{ width: `${progress * 100}%`, height: "100%", borderRadius: 4, background: "var(--accent-secondary)" }} />
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(145deg, var(--surface-1), var(--bg-color))",
        color: "var(--text-primary)",
        fontFamily: "var(--font-display)",
        overflow: "hidden",
      }}
    >
      <svg viewBox="0 0 900 450" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden="true">
        <defs>
          <pattern id="motion-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M32 0H0V32" fill="none" stroke="var(--accent-primary)" strokeOpacity="0.08" />
          </pattern>
          <linearGradient id="motion-line" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="var(--accent-primary)" />
            <stop offset="1" stopColor="var(--accent-secondary)" />
          </linearGradient>
        </defs>
        <rect width="900" height="450" fill="url(#motion-grid)" />
        <path d={paths[story.kind]} fill="none" stroke="var(--text-muted)" strokeOpacity="0.28" strokeWidth="3" />
        <path
          d={paths[story.kind]}
          fill="none"
          stroke="url(#motion-line)"
          strokeWidth="5"
          strokeLinecap="round"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - progress}
        />
        <circle cx={signalX} cy={story.kind === "threshold" ? 225 - progress * 140 : 160} r="9" fill="var(--accent-secondary)" opacity="0.8" />
      </svg>

      <div style={{ position: "absolute", top: 25, left: 36, font: "600 17px var(--font-mono)", letterSpacing: 3, color: "var(--accent-primary)" }}>
        {String(activeBeat + 1).padStart(2, "0")} / 03
      </div>

      {story.beats.map((beat, index) => {
        const reached = frame >= index * BEAT_FRAMES;
        const active = activeBeat === index;
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              top: 127,
              left: cardX[index],
              width: 210,
              height: 80,
              borderRadius: 18,
              border: `2px solid ${active ? "var(--accent-primary)" : "var(--divider)"}`,
              background: "var(--surface-2)",
              boxShadow: active ? "0 0 35px var(--accent-soft)" : "none",
              opacity: reached ? 1 : 0.48,
              transform: `translateY(${active ? (1 - intro) * 12 : 0}px) scale(${active ? 1.05 : 1})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "8px 14px",
              boxSizing: "border-box",
              fontSize: 19,
              fontWeight: 700,
              lineHeight: 1.18,
            }}
          >
            {beat}
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: 48,
          right: 48,
          bottom: 72,
          minHeight: 82,
          borderLeft: "5px solid var(--accent-secondary)",
          padding: "6px 0 6px 22px",
          display: "flex",
          alignItems: "center",
          fontSize: 32,
          fontWeight: 700,
          lineHeight: 1.15,
          opacity: intro,
          transform: `translateY(${(1 - intro) * 18}px)`,
        }}
      >
        {story.beats[activeBeat]}
      </div>
      <div style={{ position: "absolute", bottom: 42, left: 48, right: 48, height: 4, background: "var(--divider)", borderRadius: 3 }}>
        <div style={{ width: `${progress * 100}%`, height: "100%", background: "var(--accent-secondary)", borderRadius: 3 }} />
      </div>
    </AbsoluteFill>
  );
}
