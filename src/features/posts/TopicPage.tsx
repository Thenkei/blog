import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getTopic, getTopicPosts, topics, type PostLocale } from "./content";
import { PageMeta } from "../../shared/seo/PageMeta";

type TopicPageProps = {
  locale: PostLocale;
  topicSlug?: string | undefined;
};

function formatDate(date: string, locale: PostLocale): string {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

export function TopicPage({ locale, topicSlug }: TopicPageProps) {
  const { t } = useTranslation();

  if (!topicSlug) {
    return (
      <main className="blog-content">
        <div className="container topic-index">
          <PageMeta title={t("ui.topics")} description={t("ui.topicsDescription")} path={`/${locale}/topics`} type="website" />
          <p className="section-eyebrow">{t("ui.explore")}</p>
          <h1>{t("ui.topics")}</h1>
          <p className="topic-index-intro">{t("ui.topicsDescription")}</p>
          <div className="topic-grid">
            {topics.map((topic) => (
              <Link key={topic.slug} className="topic-card" to={`/${locale}/topics/${topic.slug}`}>
                <h2>{topic.title[locale]}</h2>
                <p>{topic.description[locale]}</p>
                <span>{t("ui.exploreTopic")}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    );
  }

  const topic = getTopic(topicSlug);
  if (!topic) {
    return <Navigate to={`/${locale}/topics`} replace />;
  }

  const posts = getTopicPosts(locale, topicSlug);
  return (
    <main className="blog-content">
      <div className="container topic-page">
        <PageMeta title={topic.title[locale]} description={topic.description[locale]} path={`/${locale}/topics/${topic.slug}`} type="website" />
        <Link className="page-back-link" to={`/${locale}/topics`}>← {t("ui.allTopics")}</Link>
        <p className="section-eyebrow">{t("ui.topic")}</p>
        <h1>{topic.title[locale]}</h1>
        <p className="topic-index-intro">{topic.description[locale]}</p>
        <div className="post-list">
          {posts.map((post) => (
            <Link key={post.slug} className="post-card" to={`/${locale}/posts/${post.slug}`} aria-label={`${post.title} - ${t("ui.readPost")}`}>
              <div className="meta"><span>{formatDate(post.publishedAt, locale)}</span><span>•</span><span>{t("ui.readTime", { count: post.readTimeMinutes })}</span></div>
              <h3>{post.title}</h3>
              <p className="post-subtitle">{post.subtitle}</p>
              <p className="post-summary">{post.summary}</p>
              <ul className="post-tag-list" aria-label={t("ui.tags")}>
                {post.tags.map((tag) => <li key={tag} className="post-tag-item">{tag}</li>)}
              </ul>
              <span className="post-card-link">{t("ui.readPost")}</span>
              <div className="trail-line trail-line-small" />
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
