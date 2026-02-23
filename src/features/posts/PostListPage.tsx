import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../app/providers/ThemeProvider";
import { getAvailableTags, getPostSummaries, type PostLocale } from "./content";
import { usePostKeyboardNavigation } from "./hooks/usePostKeyboardNavigation";
import { ParallaxHero } from "../../shared/components/ParallaxHero";
import { PageMeta } from "../../shared/seo/PageMeta";

type PostListPageProps = {
  locale: PostLocale;
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

function includesQuery(
  post: { title: string; subtitle: string; summary: string; tags: string[] },
  query: string,
): boolean {
  if (!query.trim()) {
    return true;
  }

  const haystack =
    `${post.title} ${post.subtitle} ${post.summary} ${post.tags.join(" ")}`.toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

export function PostListPage({ locale }: PostListPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { themeMode } = useTheme();
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const openPost = (slug: string) => {
    void navigate(`/${locale}/posts/${slug}`);
  };

  const posts = useMemo(() => getPostSummaries(locale), [locale]);
  const tags = useMemo(() => getAvailableTags(locale), [locale]);

  const filteredPosts = useMemo(() => {
    const filtered = posts
      .filter((post) => includesQuery(post, query))
      .filter(
        (post) => selectedTag === "all" || post.tags.includes(selectedTag),
      );

    filtered.sort((a, b) => {
      if (sortOrder === "newest") {
        return b.publishedAt.localeCompare(a.publishedAt);
      }
      return a.publishedAt.localeCompare(b.publishedAt);
    });

    return filtered;
  }, [posts, query, selectedTag, sortOrder]);

  const { focusedIndex, setFocusedIndex, cardRefs } = usePostKeyboardNavigation(
    {
      enabled: true,
      count: filteredPosts.length,
      onSelectIndex: (index) => {
        const selected = filteredPosts[index];
        if (selected) {
          openPost(selected.slug);
        }
      },
    },
  );

  return (
    <>
      <PageMeta
        title={t("header.title")}
        description={t("header.subtitle")}
        path={`/${locale}`}
      />
      <ParallaxHero
        themeMode={themeMode}
        title={t("header.title")}
        subtitle={t("header.subtitle")}
        onTitleClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      />

      <main className="blog-content">
        <div className="container">
          <section className="post-controls" aria-label={t("ui.discovery")}>
            <h2 className="post-list-title">{t("ui.latestPosts")}</h2>
            <div className="post-controls-grid">
              <label className="post-control-field">
                <span>{t("ui.search")}</span>
                <input
                  className="post-control-input"
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setFocusedIndex(-1);
                  }}
                  placeholder={t("ui.searchPlaceholder")}
                />
              </label>

              <label className="post-control-field">
                <span>{t("ui.filterByTag")}</span>
                <select
                  className="post-control-select"
                  value={selectedTag}
                  onChange={(event) => {
                    setSelectedTag(event.target.value);
                    setFocusedIndex(-1);
                  }}
                >
                  <option value="all">{t("ui.allTags")}</option>
                  {tags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </label>

              <label className="post-control-field">
                <span>{t("ui.sortBy")}</span>
                <select
                  className="post-control-select"
                  value={sortOrder}
                  onChange={(event) => {
                    setSortOrder(
                      event.target.value === "oldest" ? "oldest" : "newest",
                    );
                    setFocusedIndex(-1);
                  }}
                >
                  <option value="newest">{t("ui.sortNewest")}</option>
                  <option value="oldest">{t("ui.sortOldest")}</option>
                </select>
              </label>
            </div>
          </section>

          <div className="post-list" key="post-list">
            {filteredPosts.length === 0 ? (
              <p className="post-empty">{t("ui.noResults")}</p>
            ) : (
              filteredPosts.map((post, index) => (
                <Link
                  key={post.slug}
                  to={`/${locale}/posts/${post.slug}`}
                  aria-label={`${post.title} - ${t("ui.readPost")}`}
                  ref={(element) => {
                    cardRefs.current[index] = element;
                  }}
                  className={`post-card ${focusedIndex === index ? "focused" : ""}`}
                  onMouseEnter={() => setFocusedIndex(index)}
                  onFocus={() => setFocusedIndex(index)}
                >
                  <div className="meta">
                    <span>{formatDate(post.publishedAt, locale)}</span>
                    <span>•</span>
                    <span>
                      {t("ui.readTime", { count: post.readTimeMinutes })}
                    </span>
                  </div>
                  <h3>{post.title}</h3>
                  <p className="post-subtitle">{post.subtitle}</p>
                  <p className="post-summary">{post.summary}</p>
                  <ul className="post-tag-list" aria-label={t("ui.tags")}>
                    {post.tags.map((tag) => (
                      <li key={tag} className="post-tag-item">
                        {tag}
                      </li>
                    ))}
                  </ul>
                  <span className="post-card-link">{t("ui.readPost")}</span>
                  <div className="trail-line trail-line-small" />
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  );
}
