import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { PostLocale } from "../posts/content";
import { PageMeta } from "../../shared/seo/PageMeta";

type NotFoundPageProps = {
  locale: PostLocale;
  /** The requested path, kept as the canonical so the miss is not indexed elsewhere. */
  path: string;
};

export function NotFoundPage({ locale, path }: NotFoundPageProps) {
  const { t } = useTranslation();

  return (
    <main className="blog-content" id="main-content" tabIndex={-1}>
      <div className="container not-found-page">
        <PageMeta
          title={t("ui.notFoundTitle")}
          description={t("ui.notFoundText")}
          path={path}
          type="website"
          indexable={false}
        />
        <p className="section-eyebrow">404</p>
        <h1>{t("ui.notFoundTitle")}</h1>
        <p className="topic-index-intro">{t("ui.notFoundText")}</p>
        <div className="not-found-actions">
          <Link className="not-found-link" to={`/${locale}`}>
            {t("ui.notFoundHome")} →
          </Link>
          <Link className="not-found-link" to={`/${locale}/topics`}>
            {t("ui.allTopics")} →
          </Link>
        </div>
      </div>
    </main>
  );
}
