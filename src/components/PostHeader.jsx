import ThemeSwitcher from "./ThemeSwitcher";
import LanguageSwitcher from "./LanguageSwitcher";

export default function PostHeader({
  t,
  themeMode,
  onThemeChange,
  i18n,
  onTitleClick,
  onBreadcrumbClick,
  breadcrumbLabel,
  headerPadRem,
}) {
  return (
    <header
      className="post-header"
      style={{ "--post-header-pad": `${headerPadRem}rem` }}
    >
      <div className="post-header-inner">
        <div className="post-header-actions">
          <ThemeSwitcher
            themeMode={themeMode}
            onThemeChange={onThemeChange}
            t={t}
            variant="compact"
          />
          <LanguageSwitcher i18n={i18n} variant="compact" />
        </div>

        <nav className="breadcrumb" aria-label="Breadcrumb">
          <button className="breadcrumb-link" onClick={onBreadcrumbClick}>
            {t("ui.backToHome")}
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{breadcrumbLabel}</span>
        </nav>

        <div className="post-header-title">
          <h1 className="post-hero-title" onClick={onTitleClick}>
            {t("header.title")}
          </h1>
          <p className="post-hero-subtitle">{t("header.subtitle")}</p>
        </div>
      </div>
    </header>
  );
}
