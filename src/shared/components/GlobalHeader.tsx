import { useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { useTheme } from "../../app/providers/ThemeProvider";
import { normalizeLocale } from "../routing";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function GlobalHeader() {
  const { t } = useTranslation();
  const { themeMode, setThemeMode } = useTheme();
  const params = useParams();
  const locale = normalizeLocale(params.locale);
  const headerRef = useRef<HTMLElement | null>(null);

  // The header is sticky and wraps onto two rows on narrow screens. Anything
  // pinned below it (reading progress) reads its real height from this token
  // instead of guessing, so it can never end up hidden behind the header.
  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) {
      return;
    }

    const root = document.documentElement;
    const publishHeight = () => {
      const { height } = header.getBoundingClientRect();
      if (height > 0) {
        root.style.setProperty("--global-header-height", `${height}px`);
      }
    };

    publishHeight();
    if (typeof ResizeObserver === "undefined") {
      return () => {
        root.style.removeProperty("--global-header-height");
      };
    }

    const observer = new ResizeObserver(publishHeight);
    observer.observe(header);

    return () => {
      observer.disconnect();
      root.style.removeProperty("--global-header-height");
    };
  }, []);

  return (
    <header className="global-header" ref={headerRef}>
      <div className="global-header-inner">
        <Link
          to={`/${locale}`}
          className="global-header-title"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          {t("header.title")}
        </Link>

        <nav className="global-header-nav" aria-label={t("ui.primaryNavigation")}>
          <Link to={`/${locale}/topics`}>{t("ui.topics")}</Link>
          <Link to={`/${locale}/about`}>{t("ui.about")}</Link>
        </nav>

        <div className="global-header-actions">
          <ThemeSwitcher
            themeMode={themeMode}
            onThemeChange={setThemeMode}
            labels={{
              appearance: t("ui.appearance"),
              lightTheme: t("ui.lightTheme"),
              darkTheme: t("ui.darkTheme"),
              mountainTheme: t("ui.mountainTheme"),
              rocketTheme: t("ui.rocketTheme"),
              themeSwitcher: t("ui.themeSwitcher"),
            }}
            variant="compact"
          />
          <LanguageSwitcher variant="compact" />
        </div>
      </div>
    </header>
  );
}
