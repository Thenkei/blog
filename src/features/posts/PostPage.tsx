import { useEffect, useMemo, useRef } from "react";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import sql from "highlight.js/lib/languages/sql";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useTheme } from "../../app/providers/ThemeProvider";
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

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);

type PostPageProps = {
  locale: PostLocale;
  slug: string;
};

function formatDate(date: string, locale: PostLocale): string {
  const formatter = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return formatter.format(new Date(`${date}T00:00:00.000Z`));
}

export function PostPage({ locale, slug }: PostPageProps) {
  const articleRef = useRef<HTMLElement | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { themeMode, setThemeMode } = useTheme();

  const post = useMemo(() => getPost(locale, slug), [locale, slug]);
  const related = useMemo(() => getRelatedPosts(locale, slug), [locale, slug]);
  const adjacent = useMemo(() => getAdjacentPosts(locale, slug), [locale, slug]);

  useEffect(() => {
    if (!articleRef.current || !post) {
      return;
    }

    const codeBlocks = articleRef.current.querySelectorAll("pre code");
    codeBlocks.forEach((block) => {
      block.removeAttribute("data-highlighted");
      hljs.highlightElement(block as HTMLElement);
    });
  }, [post]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug, locale]);

  if (!post) {
    return <Navigate to={`/${locale}`} replace />;
  }

  const contentKey = `${locale}:${slug}`;
  const headerPadRem = Math.min(6, 3.5 + Math.max(0, (post.title.length - 40) * 0.04));

  return (
    <>
      <PageMeta title={post.title} description={post.summary} path={`/${locale}/posts/${post.slug}`} />

      <PostHeader
        themeMode={themeMode}
        onThemeChange={setThemeMode}
        labels={{
          systemTheme: t("ui.systemTheme"),
          systemThemeTooltip: t("ui.systemThemeTooltip"),
          darkTheme: t("ui.darkTheme"),
          lightTheme: t("ui.lightTheme"),
          rocketTheme: t("ui.rocketTheme"),
          backToHome: t("ui.backToHome"),
        }}
        siteTitle={t("header.title")}
        siteSubtitle={t("header.subtitle")}
        breadcrumbLabel={post.title}
        onTitleClick={() => {
          void navigate(`/${locale}`);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
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
            <button
              className="back-btn"
              onClick={() => {
                void navigate(`/${locale}`);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              type="button"
            >
              ← {t("ui.backToHome")}
            </button>

            <div className="meta">
              <span>{formatDate(post.publishedAt, locale)}</span>
              <span>•</span>
              <span>{t("ui.readTime", { count: post.readTimeMinutes })}</span>
            </div>

            <h1 className="article-title">{post.title}</h1>

            <div className="trail-line" />
            <TableOfContents articleRef={articleRef} contentKey={contentKey} />
            <post.Component />

            <div className="trail-line article-end-line" />

            <section className="post-nav" aria-label={t("ui.seriesNavigation")}>
              {adjacent.previous ? (
                <Link className="post-nav-link" to={`/${locale}/posts/${adjacent.previous.slug}`}>
                  ← {adjacent.previous.title}
                </Link>
              ) : (
                <span className="post-nav-placeholder" />
              )}
              {adjacent.next ? (
                <Link className="post-nav-link" to={`/${locale}/posts/${adjacent.next.slug}`}>
                  {adjacent.next.title} →
                </Link>
              ) : (
                <span className="post-nav-placeholder" />
              )}
            </section>

            {related.length > 0 ? (
              <section className="related-posts" aria-label={t("ui.relatedPosts")}>
                <h2>{t("ui.relatedPosts")}</h2>
                <ul className="related-post-list">
                  {related.map((item) => (
                    <li key={item.slug}>
                      <Link className="related-post-link" to={`/${locale}/posts/${item.slug}`}>
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <button
              className="back-btn"
              onClick={() => {
                void navigate(`/${locale}`);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              type="button"
            >
              ← {t("ui.backToHome")}
            </button>
          </article>
        </div>
      </main>
    </>
  );
}
