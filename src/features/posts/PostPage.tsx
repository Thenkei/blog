import { useEffect, useMemo, useRef } from "react";

import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  getAdjacentPosts,
  getPost,
  getRelatedPosts,
  type PostLocale,
} from "./content";
import { PostHeader } from "../../shared/components/PostHeader";
import { PageMeta } from "../../shared/seo/PageMeta";
import { ReadingProgressBar } from "../reading/ReadingProgressBar";
import { TableOfContents } from "../reading/TableOfContents";
import { CopyLinkButtons } from "../reading/CopyLinkButtons";

type PostPageProps = {
  locale: PostLocale;
  slug: string;
};

function formatDate(date: string, locale: PostLocale): string {
  const formatter = new Intl.DateTimeFormat(
    locale === "fr" ? "fr-FR" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );
  return formatter.format(new Date(`${date}T00:00:00.000Z`));
}

export function PostPage({ locale, slug }: PostPageProps) {
  const articleRef = useRef<HTMLElement | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const post = useMemo(() => getPost(locale, slug), [locale, slug]);
  const related = useMemo(() => getRelatedPosts(locale, slug, 4), [locale, slug]);
  const adjacent = useMemo(
    () => getAdjacentPosts(locale, slug),
    [locale, slug],
  );

  useEffect(() => {
    if (!articleRef.current || !post) {
      return;
    }

    const codeBlocks = Array.from(
      articleRef.current.querySelectorAll("pre code"),
    );
    if (codeBlocks.length === 0) return;

    void import("highlight.js/lib/core").then(({ default: hljs }) => {
      void Promise.all([
        import("highlight.js/lib/languages/javascript"),
        import("highlight.js/lib/languages/typescript"),
        import("highlight.js/lib/languages/sql"),
        import("highlight.js/lib/languages/json"),
        import("highlight.js/lib/languages/bash"),
      ]).then(([javascript, typescript, sql, json, bash]) => {
        hljs.registerLanguage("javascript", javascript.default);
        hljs.registerLanguage("js", javascript.default);
        hljs.registerLanguage("typescript", typescript.default);
        hljs.registerLanguage("ts", typescript.default);
        hljs.registerLanguage("sql", sql.default);
        hljs.registerLanguage("json", json.default);
        hljs.registerLanguage("bash", bash.default);

        codeBlocks.forEach((block) => {
          block.removeAttribute("data-highlighted");
          hljs.highlightElement(block as HTMLElement);
        });
      });
    });
  }, [post]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug, locale]);

  if (!post) {
    return <Navigate to={`/${locale}`} replace />;
  }

  const contentKey = `${locale}:${slug}`;
  const [recommended, ...moreRelated] = related;
  const headerPadRem = Math.min(
    3.5,
    1.5 + Math.max(0, (post.title.length - 40) * 0.02),
  );

  return (
    <>
      <PageMeta
        title={post.title}
        description={post.summary}
        path={`/${locale}/posts/${post.slug}`}
      />

      <PostHeader
        backToHomeLabel={`${t("ui.backToHome")} / ${t("header.title")}`}
        title={post.title}
        metaInfo={
          <>
            <span>{formatDate(post.publishedAt, locale)}</span>
            <span>•</span>
            <span>{t("ui.readTime", { count: post.readTimeMinutes })}</span>
          </>
        }
        onBreadcrumbClick={() => {
          void navigate(`/${locale}`);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        headerPadRem={headerPadRem}
      />

      <main className="blog-content">
        <div className="container">
          <ReadingProgressBar articleRef={articleRef} contentKey={contentKey} />
          <article ref={articleRef} key={contentKey}>
            <TableOfContents articleRef={articleRef} contentKey={contentKey} />
            <CopyLinkButtons articleRef={articleRef} contentKey={contentKey} />
            <post.Component />
            <div className="trail-line article-end-line" />
            <section className="post-nav" aria-label={t("ui.seriesNavigation")}>
              {adjacent.previous ? (
                <Link
                  className="post-nav-link"
                  to={`/${locale}/posts/${adjacent.previous.slug}`}
                >
                  ← {adjacent.previous.title}
                </Link>
              ) : (
                <span className="post-nav-placeholder" />
              )}
              {adjacent.next ? (
                <Link
                  className="post-nav-link"
                  to={`/${locale}/posts/${adjacent.next.slug}`}
                >
                  {adjacent.next.title} →
                </Link>
              ) : (
                <span className="post-nav-placeholder" />
              )}
            </section>
            {recommended ? (
              <section className="next-recommended" aria-label={t("ui.nextRecommended")}>
                <p className="section-eyebrow">{t("ui.recommendedBecause")}</p>
                <h2>{t("ui.nextRecommended")}</h2>
                <Link className="next-recommended-link" to={`/${locale}/posts/${recommended.slug}`}>{recommended.title} →</Link>
              </section>
            ) : null}
            {moreRelated.length > 0 ? (
              <section
                className="related-posts"
                aria-label={t("ui.moreRelatedPosts")}
              >
                <h2>{t("ui.moreRelatedPosts")}</h2>
                <ul className="related-post-list">
                  {moreRelated.map((item) => (
                    <li key={item.slug}>
                      <Link
                        className="related-post-link"
                        to={`/${locale}/posts/${item.slug}`}
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </article>
        </div>
      </main>
    </>
  );
}
