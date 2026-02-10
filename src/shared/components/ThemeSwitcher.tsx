import type { ThemeMode } from "../../app/providers/ThemeProvider";
import type { CSSProperties } from "react";

type ThemeSwitcherProps = {
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  labels: {
    lightTheme: string;
    darkTheme: string;
    mountainTheme: string;
    rocketTheme: string;
    themeSwitcher: string;
  };
  variant?: "default" | "compact";
};

export function ThemeSwitcher({
  themeMode,
  onThemeChange,
  labels,
  variant = "default",
}: ThemeSwitcherProps) {
  const themeOptions: Array<{ mode: ThemeMode; label: string }> = [
    { mode: "light", label: labels.lightTheme },
    { mode: "dark", label: labels.darkTheme },
    { mode: "mountain", label: labels.mountainTheme },
    { mode: "rocket", label: labels.rocketTheme },
  ];
  const activeIndex = Math.max(
    0,
    themeOptions.findIndex((option) => option.mode === themeMode),
  );
  const className = `theme-switcher-container${variant === "compact" ? " compact" : ""}`;

  return (
    <div
      className={className}
      role="radiogroup"
      aria-label={labels.themeSwitcher}
      style={
        {
          "--active-theme-index": activeIndex,
          "--theme-option-count": themeOptions.length,
        } as CSSProperties
      }
    >
      <span className="theme-indicator" aria-hidden="true" />
      {themeOptions.map((option) => (
        <button
          key={option.mode}
          className={`theme-btn ${themeMode === option.mode ? "active" : ""}`}
          onClick={() => onThemeChange(option.mode)}
          type="button"
          role="radio"
          aria-checked={themeMode === option.mode}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
