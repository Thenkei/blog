import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeSwitcher } from "./ThemeSwitcher";
import type { ThemeMode } from "../../app/providers/ThemeProvider";

type ParallaxHeroProps = {
  scrollY: number;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  title: string;
  subtitle: string;
  labels: {
    systemTheme: string;
    systemThemeTooltip: string;
    darkTheme: string;
    lightTheme: string;
    rocketTheme: string;
  };
  onTitleClick: () => void;
};

export function ParallaxHero({
  scrollY,
  themeMode,
  onThemeChange,
  title,
  subtitle,
  labels,
  onTitleClick,
}: ParallaxHeroProps) {
  const getStyle = (speed: number, offset = 0) => ({
    transform: `translateY(${scrollY * speed + offset}px)`,
  });

  return (
    <section className="parallax-container">
      <div className="parallax-layer layer-bg" style={getStyle(0.1)} />
      <div className="parallax-layer layer-mountain-1" style={getStyle(0.2)} />
      <div className="parallax-layer layer-mountain-2" style={getStyle(0.4)} />
      <div className="parallax-layer layer-mountain-3" style={getStyle(0.8, 50)} />

      <div className="hero-content">
        <ThemeSwitcher
          themeMode={themeMode}
          onThemeChange={onThemeChange}
          labels={labels}
        />
        <LanguageSwitcher />
        <h1 className="hero-title" onClick={onTitleClick}>
          {title}
        </h1>
        <p className="hero-subtitle">{subtitle}</p>
      </div>
    </section>
  );
}
