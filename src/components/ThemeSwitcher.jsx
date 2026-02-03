export default function ThemeSwitcher({ themeMode, onThemeChange, t, variant }) {
  const className = `theme-switcher-container${variant === "compact" ? " compact" : ""}`;

  return (
    <div className={className}>
      <button
        className={`theme-btn ${themeMode === "system" ? "active" : ""}`}
        onClick={() => onThemeChange("system")}
        title={t("ui.systemThemeTooltip")}
      >
        {t("ui.systemTheme")}
      </button>
      <span className="theme-separator">|</span>
      <button
        className={`theme-btn ${themeMode === "dark" ? "active" : ""}`}
        onClick={() => onThemeChange("dark")}
      >
        {t("ui.darkTheme")}
      </button>
      <span className="theme-separator">|</span>
      <button
        className={`theme-btn ${themeMode === "light" ? "active" : ""}`}
        onClick={() => onThemeChange("light")}
      >
        {t("ui.lightTheme")}
      </button>
      <span className="theme-separator">|</span>
      <button
        className={`theme-btn ${themeMode === "rocket" ? "active" : ""}`}
        onClick={() => onThemeChange("rocket")}
      >
        {t("ui.rocketTheme")}
      </button>
    </div>
  );
}
