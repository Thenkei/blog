import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { SITE_URL } from "./constants";

type PageMetaProps = {
  title: string;
  description: string;
  path: string;
  type?: "article" | "website";
  indexable?: boolean;
};

const LOCALES = ["en", "fr"] as const;
const LOCALE_PREFIX_PATTERN = /^\/(en|fr)(?=\/|$)/;

/** The same page in the other language, for `hreflang` alternates. */
function localizedPath(path: string, locale: string): string {
  return path.replace(LOCALE_PREFIX_PATTERN, `/${locale}`);
}

export function PageMeta({
  title,
  description,
  path,
  type = "article",
  indexable = true,
}: PageMetaProps) {
  const { t } = useTranslation();
  const siteName = t("header.title");
  const canonical = `${SITE_URL}${path}`;
  // The home page is titled after the site; repeating it reads as a glitch.
  const fullTitle = title === siteName ? siteName : `${title} | ${siteName}`;
  const isLocalized = LOCALE_PREFIX_PATTERN.test(path);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta
        name="robots"
        content={indexable ? "index,follow" : "noindex,nofollow,noarchive"}
      />
      <link rel="canonical" href={canonical} />
      {indexable && isLocalized
        ? LOCALES.map((locale) => (
            <link
              key={locale}
              rel="alternate"
              hrefLang={locale}
              href={`${SITE_URL}${localizedPath(path, locale)}`}
            />
          ))
        : null}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:type" content={type} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
