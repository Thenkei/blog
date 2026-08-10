import {
  createElement,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";

import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  getAdjacentPosts,
  getPost,
  getRelatedPosts,
  loadPostComponent,
  type PostAccessScope,
  type PostLocale,
} from "./content";
import { useTheme } from "../../app/providers/ThemeProvider";
import { PostHeader } from "../../shared/components/PostHeader";
import { PageMeta } from "../../shared/seo/PageMeta";
import { ReadingProgressBar } from "../reading/ReadingProgressBar";
import { TableOfContents } from "../reading/TableOfContents";
import { CopyLinkButtons } from "../reading/CopyLinkButtons";
import { enhanceCodeBlocks } from "../reading/enhanceCodeBlocks";

type PostPageProps = {
  locale: PostLocale;
  slug: string;
};

type LoadedPostContentProps = {
  onReady: () => void;
};

const postContentComponents = new Map<
  string,
  ComponentType<LoadedPostContentProps>
>();

function getPostContentComponent(
  locale: PostLocale,
  slug: string,
  access: PostAccessScope,
) {
  const key = `${access}:${locale}:${slug}`;
  const existing = postContentComponents.get(key);
  if (existing) {
    return existing;
  }

  const PostContent = lazy(async () => {
    const MdxContent = await loadPostComponent({ locale, slug }, access);

    function LoadedPostContent({ onReady }: LoadedPostContentProps) {
      useEffect(() => {
        onReady();
      }, [onReady]);

      return createElement(MdxContent);
    }

    return { default: LoadedPostContent };
  });

  postContentComponents.set(key, PostContent);
  return PostContent;
}

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
  const { appliedTheme } = useTheme();
  const postAccess = appliedTheme === "rocket" ? "rocket" : "public";
  const [readyContentKey, setReadyContentKey] = useState<string | null>(null);
  const postKey = `${locale}:${slug}`;
  const isContentReady = readyContentKey === postKey;

  const post = useMemo(
    () => getPost(locale, slug, postAccess),
    [locale, postAccess, slug],
  );
  const related = useMemo(
    () => getRelatedPosts(locale, slug, postAccess, 4),
    [locale, postAccess, slug],
  );
  const adjacent = useMemo(
    () => getAdjacentPosts(locale, slug, postAccess),
    [locale, postAccess, slug],
  );

  useEffect(() => {
    if (!articleRef.current || !post || !isContentReady) {
      return;
    }

    return enhanceCodeBlocks(articleRef.current);
  }, [isContentReady, post]);

  useEffect(() => {
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, [slug, locale]);

  const markContentReady = useCallback(() => {
    setReadyContentKey(postKey);
  }, [postKey]);

  if (!post) {
    return <Navigate to={`/${locale}`} replace />;
  }

  const PostContent = getPostContentComponent(locale, slug, postAccess);
  const contentKey = `${locale}:${slug}:${isContentReady ? "ready" : "loading"}`;
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
        indexable={post.visibility === "public"}
      />

      <PostHeader
        backToHomeLabel={`${t("ui.backToHome")} / ${t("header.title")}`}
        title={post.title}
        locale={locale}
        slug={post.slug}
        visualId={post.visualId}
        metaInfo={
          <>
            {post.visibility === "rocket" ? (
              <>
                <span className="rocket-post-badge">
                  {t("ui.rocketTransmission", {
                    count: String(post.seriesOrder ?? 0).padStart(3, "0"),
                  })}
                </span>
                <span>•</span>
              </>
            ) : null}
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
          <article ref={articleRef}>
            <TableOfContents articleRef={articleRef} contentKey={contentKey} />
            <CopyLinkButtons articleRef={articleRef} contentKey={contentKey} />
            {post ? (
              <Suspense key={`${locale}:${slug}`} fallback={<div aria-busy="true" />}>
                <div className="post-document">
                  {createElement(PostContent, { onReady: markContentReady })}
                </div>
              </Suspense>
            ) : null}
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
