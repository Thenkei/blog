import { useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, useLocation, useParams } from "react-router-dom";
import { useTheme } from "../../app/providers/ThemeProvider";
import { normalizeLocale } from "../routing";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function GlobalHeader() {
  const { t } = useTranslation();
  const { themeMode, setThemeMode } = useTheme();
  const params = useParams();
  const { pathname } = useLocation();
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
          onClick={() => {
            // Already on the home page: the title acts as "back to top".
            // Arriving from another page is handled by useScrollManagement.
            if (pathname === `/${locale}`) {
              window.scrollTo(0, 0);
            }
          }}
        >
          {t("header.title")}
        </Link>

        {/* NavLink sets aria-current="page" on the section being viewed. */}
        <nav className="global-header-nav" aria-label={t("ui.primaryNavigation")}>
          <NavLink to={`/${locale}/topics`}>{t("ui.topics")}</NavLink>
          <NavLink to={`/${locale}/about`}>{t("ui.about")}</NavLink>
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
