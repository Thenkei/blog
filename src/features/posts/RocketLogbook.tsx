import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PostVisual } from "../../shared/components/PostVisual";
import type { PostLocale, PostSummary } from "./content";

type RocketLogbookProps = {
  locale: PostLocale;
  posts: PostSummary[];
};

export function RocketLogbook({ locale, posts }: RocketLogbookProps) {
  const { t } = useTranslation();

  if (posts.length === 0) {
    return null;
  }

  return (
    <section
      className="rocket-logbook"
      id="rocket-logbook"
      aria-labelledby="rocket-logbook-title"
    >
      <div className="rocket-logbook-header">
        <div>
          <p className="section-eyebrow">{t("ui.rocketLogbookEyebrow")}</p>
          <h2 id="rocket-logbook-title">{t("ui.rocketLogbook")}</h2>
        </div>
        <p className="rocket-logbook-intro">{t("ui.rocketLogbookIntro")}</p>
      </div>

      <div className="rocket-logbook-grid">
        {posts.map((post) => {
          const transmissionLabel = t("ui.rocketTransmission", {
            count: String(post.seriesOrder ?? 0).padStart(3, "0"),
          });

          return (
            <Link
              key={post.slug}
              className="post-card rocket-logbook-card"
              to={`/${locale}/posts/${post.slug}`}
              aria-label={`${post.title} - ${transmissionLabel} - ${t("ui.rocketOnly")} - ${t("ui.readPost")}`}
            >
              <PostVisual
                locale={locale}
                slug={post.slug}
                variant="card"
                visualId={post.visualId}
              />
              <div className="post-card-body">
                <div className="rocket-logbook-meta">
                  <span>{transmissionLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>{t("ui.rocketOnly")}</span>
                </div>
                <h3>{post.title}</h3>
                <p className="post-subtitle">{post.subtitle}</p>
                <span className="post-card-link">{t("ui.readPost")} →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
