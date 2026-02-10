import type { ThemeMode } from "../../app/providers/ThemeProvider";

type ThemeSwitcherProps = {
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  labels: {
    systemTheme: string;
    systemThemeTooltip: string;
    darkTheme: string;
    lightTheme: string;
    rocketTheme: string;
  };
  variant?: "default" | "compact";
};

export function ThemeSwitcher({
  themeMode,
  onThemeChange,
  labels,
  variant = "default",
}: ThemeSwitcherProps) {
  const className = `theme-switcher-container${variant === "compact" ? " compact" : ""}`;

  return (
    <div className={className}>
      <button
        className={`theme-btn ${themeMode === "system" ? "active" : ""}`}
        onClick={() => onThemeChange("system")}
        title={labels.systemThemeTooltip}
        type="button"
      >
        {labels.systemTheme}
      </button>
      <span className="theme-separator">|</span>
      <button
        className={`theme-btn ${themeMode === "dark" ? "active" : ""}`}
        onClick={() => onThemeChange("dark")}
        type="button"
      >
        {labels.darkTheme}
      </button>
      <span className="theme-separator">|</span>
      <button
        className={`theme-btn ${themeMode === "light" ? "active" : ""}`}
        onClick={() => onThemeChange("light")}
        type="button"
      >
        {labels.lightTheme}
      </button>
      <span className="theme-separator">|</span>
      <button
        className={`theme-btn ${themeMode === "rocket" ? "active" : ""}`}
        onClick={() => onThemeChange("rocket")}
        type="button"
      >
        {labels.rocketTheme}
      </button>
    </div>
  );
}
