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
    lightTheme: string;
    darkTheme: string;
    mountainTheme: string;
    rocketTheme: string;
    themeSwitcher: string;
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
    <section className="parallax-container" data-hero-theme={themeMode}>
      <div className="parallax-layer layer-bg" style={getStyle(0.1)} />
      <div className="parallax-layer layer-atmosphere" style={getStyle(0.14)} />
      <div className="parallax-layer layer-stars" style={getStyle(0.04)} />
      <div className="parallax-layer layer-mountain-1" style={getStyle(0.22)} />
      <div className="parallax-layer layer-mountain-2" style={getStyle(0.44)} />
      <div className="parallax-layer layer-mountain-3" style={getStyle(0.72, 40)} />
      <div className="parallax-layer layer-foreground-mist" style={getStyle(0.86, 60)} />

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
