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

  return (
    <header className="global-header">
      <div className="global-header-inner">
        <Link
          to={`/${locale}`}
          className="global-header-title"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          {t("header.title")}
        </Link>

        <div className="global-header-actions">
          <ThemeSwitcher
            themeMode={themeMode}
            onThemeChange={setThemeMode}
            labels={{
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
