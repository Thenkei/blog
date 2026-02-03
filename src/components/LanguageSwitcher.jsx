export default function LanguageSwitcher({ i18n, variant }) {
  const className = `lang-switcher-container${variant === "compact" ? " compact" : ""}`;

  return (
    <div className={className}>
      <button
        className={`lang-btn ${i18n.language === "en" ? "active" : ""}`}
        onClick={() => i18n.changeLanguage("en")}
      >
        EN
      </button>
      <span className="lang-separator">|</span>
      <button
        className={`lang-btn ${i18n.language === "fr" ? "active" : ""}`}
        onClick={() => i18n.changeLanguage("fr")}
      >
        FR
      </button>
    </div>
  );
}
