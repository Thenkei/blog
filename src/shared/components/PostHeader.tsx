import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeSwitcher } from "./ThemeSwitcher";
import type { ThemeMode } from "../../app/providers/ThemeProvider";
import type { CSSProperties } from "react";

type PostHeaderProps = {
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  labels: {
    systemTheme: string;
    systemThemeTooltip: string;
    darkTheme: string;
    lightTheme: string;
    rocketTheme: string;
    backToHome: string;
  };
  siteTitle: string;
  siteSubtitle: string;
  breadcrumbLabel: string;
  onTitleClick: () => void;
  onBreadcrumbClick: () => void;
  headerPadRem: number;
};

export function PostHeader({
  themeMode,
  onThemeChange,
  labels,
  siteTitle,
  siteSubtitle,
  breadcrumbLabel,
  onTitleClick,
  onBreadcrumbClick,
  headerPadRem,
}: PostHeaderProps) {
  return (
    <header
      className="post-header"
      style={{ "--post-header-pad": `${headerPadRem}rem` } as CSSProperties}
    >
      <div className="post-header-inner">
        <div className="post-header-actions">
          <ThemeSwitcher
            themeMode={themeMode}
            onThemeChange={onThemeChange}
            labels={labels}
            variant="compact"
          />
          <LanguageSwitcher variant="compact" />
        </div>

        <nav className="breadcrumb" aria-label="Breadcrumb">
          <button className="breadcrumb-link" onClick={onBreadcrumbClick} type="button">
            {labels.backToHome}
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{breadcrumbLabel}</span>
        </nav>

        <div className="post-header-title">
          <h1 className="post-hero-title" onClick={onTitleClick}>
            {siteTitle}
          </h1>
          <p className="post-hero-subtitle">{siteSubtitle}</p>
        </div>
      </div>
    </header>
  );
}
