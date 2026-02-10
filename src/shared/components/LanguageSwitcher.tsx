import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { normalizeLocale, withLocale } from "../routing";
import type { PostLocale } from "../../features/posts/content";

type LanguageSwitcherProps = {
  variant?: "default" | "compact";
};

export function LanguageSwitcher({ variant = "default" }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const currentLocale = normalizeLocale(params.locale);

  const switchLocale = (locale: PostLocale) => {
    void i18n.changeLanguage(locale);
    const nextPath = withLocale(location.pathname, locale);
    void navigate(
      { pathname: nextPath, search: location.search, hash: location.hash },
      { replace: true },
    );
  };

  const className = `lang-switcher-container${variant === "compact" ? " compact" : ""}`;

  return (
    <div className={className}>
      <button
        className={`lang-btn ${currentLocale === "en" ? "active" : ""}`}
        onClick={() => switchLocale("en")}
        type="button"
      >
        EN
      </button>
      <span className="lang-separator">|</span>
      <button
        className={`lang-btn ${currentLocale === "fr" ? "active" : ""}`}
        onClick={() => switchLocale("fr")}
        type="button"
      >
        FR
      </button>
    </div>
  );
}
