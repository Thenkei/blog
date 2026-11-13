import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { normalizeLocale, withLocale } from "../routing";
import type { PostLocale } from "../../features/posts/content";
import type { ScrollNavigationState } from "../../app/useScrollManagement";

type LanguageSwitcherProps = {
  variant?: "default" | "compact";
};

// Each language is named in itself: that is the name its readers look for.
const LANGUAGES: ReadonlyArray<{ locale: PostLocale; code: string; name: string }> = [
  { locale: "en", code: "EN", name: "English" },
  { locale: "fr", code: "FR", name: "Français" },
];

export function LanguageSwitcher({ variant = "default" }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const currentLocale = normalizeLocale(params.locale);

  const switchLocale = (locale: PostLocale) => {
    if (locale === currentLocale) {
      return;
    }

    void i18n.changeLanguage(locale);
    const nextPath = withLocale(location.pathname, locale);
    // Same page, other language: the reader keeps their place in it.
    const state: ScrollNavigationState = { preserveScroll: true };
    void navigate(
      { pathname: nextPath, search: location.search, hash: location.hash },
      { replace: true, state },
    );
  };

  const className = `lang-switcher-container${variant === "compact" ? " compact" : ""}`;

  return (
    <div className={className} role="group" aria-label={t("ui.language")}>
      {LANGUAGES.map((language, index) => (
        <span className="lang-switcher-item" key={language.locale}>
          {index > 0 ? (
            <span className="lang-separator" aria-hidden="true">
              |
            </span>
          ) : null}
          <button
            className={`lang-btn ${currentLocale === language.locale ? "active" : ""}`}
            onClick={() => switchLocale(language.locale)}
            type="button"
            lang={language.locale}
            aria-label={language.name}
            aria-pressed={currentLocale === language.locale}
          >
            {language.code}
          </button>
        </span>
      ))}
    </div>
  );
}
