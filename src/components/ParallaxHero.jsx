import ThemeSwitcher from "./ThemeSwitcher";
import LanguageSwitcher from "./LanguageSwitcher";

export default function ParallaxHero({
  scrollY,
  onTitleClick,
  themeMode,
  onThemeChange,
  t,
  i18n,
}) {
  const getStyle = (speed, offset = 0) => ({
    transform: `translateY(${scrollY * speed + offset}px)`,
  });

  return (
    <section className="parallax-container">
      <div className="parallax-layer layer-bg" style={getStyle(0.1)} />
      <div className="parallax-layer layer-mountain-1" style={getStyle(0.2)} />
      <div className="parallax-layer layer-mountain-2" style={getStyle(0.4)} />
      <div
        className="parallax-layer layer-mountain-3"
        style={getStyle(0.8, 50)}
      />

      <div className="hero-content">
        <ThemeSwitcher
          themeMode={themeMode}
          onThemeChange={onThemeChange}
          t={t}
        />
        <LanguageSwitcher i18n={i18n} />
        <h1 className="hero-title" onClick={onTitleClick}>
          {t("header.title")}
        </h1>
        <p className="hero-subtitle">{t("header.subtitle")}</p>
      </div>
    </section>
  );
}
