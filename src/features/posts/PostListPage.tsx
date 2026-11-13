import { useEffect, useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "../../app/providers/ThemeProvider";
import {
  collectPostTags,
  defaultDiscoveryFilters,
  filterPosts,
  getPostSummaries,
  getPostTagLabel,
  getThemeExclusivePostSummaries,
  hasActiveDiscoveryFilters,
  isPostDiagramVisualId,
  postCategories,
  readDiscoveryFilters,
  showsFeaturedPost,
  writeDiscoveryFilters,
  type PostDiscoveryFilters,
  type PostLocale,
} from "./content";
import { usePostKeyboardNavigation } from "./hooks/usePostKeyboardNavigation";
import { ParallaxHero } from "../../shared/components/ParallaxHero";
import { PageMeta } from "../../shared/seo/PageMeta";
import { PostVisual } from "../../shared/components/PostVisual";
import {
  PostEditorialArt,
  hasPostEditorialArt,
} from "../../shared/components/PostEditorialArt";
import { RocketLogbook } from "./RocketLogbook";

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

export function PostListPage({ locale }: PostListPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { appliedTheme, themeMode } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(
    () => readDiscoveryFilters(searchParams),
    [searchParams],
  );
  // Tag and sort sit in a collapsible panel on mobile. Open it when the URL
  // already sets one of them, so an applied filter is never hidden.
  const collapsedFilterCount =
    (filters.tag === null ? 0 : 1) + (filters.sort === "oldest" ? 1 : 0);
  const [areFiltersOpen, setAreFiltersOpen] = useState(
    collapsedFilterCount > 0,
  );
  const filterOptionsId = useId();

  const openPost = (slug: string) => {
    void navigate(`/${locale}/posts/${slug}`);
  };

  const posts = useMemo(() => getPostSummaries(locale, "public"), [locale]);
  // Only offer tags that exist in the selected category. The applied tag stays
  // listed even when a shared URL combines it with another category.
  const tags = useMemo(() => {
    const available = collectPostTags(
      filterPosts(posts, {
        ...defaultDiscoveryFilters,
        category: filters.category,
      }),
      locale,
    );
    return filters.tag === null || available.includes(filters.tag)
      ? available
      : [filters.tag, ...available];
  }, [posts, filters.category, filters.tag, locale]);
  const rocketPosts = useMemo(
    () =>
      appliedTheme === "rocket"
        ? getThemeExclusivePostSummaries(locale, "rocket")
        : [],
    [appliedTheme, locale],
  );

  useEffect(() => {
    if (appliedTheme === "rocket" && location.hash === "#rocket-logbook") {
      document.getElementById("rocket-logbook")?.scrollIntoView({
        block: "start",
      });
    }
  }, [appliedTheme, location.hash]);

  const updateFilters = (patch: Partial<PostDiscoveryFilters>) => {
    setSearchParams(
      writeDiscoveryFilters(searchParams, { ...filters, ...patch }),
      { replace: true },
    );
    setFocusedIndex(-1);
  };

  // A tag is picked inside a category, so changing category clears it rather
  // than leaving a combination that matches nothing.
  const selectCategory = (category: string | null) => {
    updateFilters({ category, tag: null });
  };

  const resetFilters = () => {
    updateFilters({ query: "", tag: null, category: null });
  };

  const filteredPosts = useMemo(
    () => filterPosts(posts, filters),
    [posts, filters],
  );
  const hasActiveFilters = hasActiveDiscoveryFilters(filters);
  const showFeaturedPost = showsFeaturedPost(filters);

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
        signal={
          appliedTheme === "rocket" && rocketPosts.length > 0
            ? t("ui.rocketSignal", { count: rocketPosts.length })
            : undefined
        }
      />

      <main className="blog-content">
        <div className="container">
          <RocketLogbook locale={locale} posts={rocketPosts} />
          <section className="post-controls" aria-label={t("ui.discovery")}>
            <div className="post-controls-header">
              <h2 className="post-list-title">{t("ui.latestPosts")}</h2>
              <div className="post-results">
                <p className="post-result-count" role="status">
                  {t("ui.resultCount", { count: filteredPosts.length })}
                </p>
                {hasActiveFilters ? (
                  <button
                    className="post-reset-filters"
                    type="button"
                    onClick={resetFilters}
                  >
                    {t("ui.resetFilters")}
                  </button>
                ) : null}
              </div>
            </div>
            <div
              className="post-categories"
              role="group"
              aria-label={t("ui.browseCategories")}
            >
              <button
                className="post-category"
                type="button"
                aria-pressed={filters.category === null}
                onFocus={() => setFocusedIndex(-1)}
                onClick={() => selectCategory(null)}
              >
                {t("ui.allCategories")}
              </button>
              {postCategories.map((category) => (
                <button
                  key={category.slug}
                  className="post-category"
                  type="button"
                  aria-pressed={filters.category === category.slug}
                  onFocus={() => setFocusedIndex(-1)}
                  onClick={() => selectCategory(category.slug)}
                >
                  {category.title[locale]}
                </button>
              ))}
            </div>
            <div className="post-controls-grid">
              <label className="post-control-field post-control-search">
                <span>{t("ui.search")}</span>
                <input
                  className="post-control-input"
                  type="search"
                  enterKeyHint="search"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={filters.query}
                  onChange={(event) => {
                    updateFilters({ query: event.target.value });
                  }}
                  placeholder={t("ui.searchPlaceholder")}
                />
              </label>
              <button
                className="post-filter-toggle"
                type="button"
                aria-expanded={areFiltersOpen}
                aria-controls={filterOptionsId}
                onClick={() => setAreFiltersOpen((open) => !open)}
              >
                {t("ui.filters")}
                {collapsedFilterCount > 0 ? (
                  <span className="post-filter-count" aria-hidden="true">
                    {collapsedFilterCount}
                  </span>
                ) : null}
              </button>

              <div
                className={`post-filter-options ${areFiltersOpen ? "open" : ""}`}
                id={filterOptionsId}
              >
                <label className="post-control-field">
                  <span>{t("ui.filterByTag")}</span>
                  <select
                    className="post-control-select"
                    value={filters.tag ?? "all"}
                    onChange={(event) => {
                      const { value } = event.target;
                      updateFilters({ tag: value === "all" ? null : value });
                    }}
                  >
                    <option value="all">{t("ui.allTags")}</option>
                    {tags.map((tag) => (
                      <option key={tag} value={tag}>
                        {getPostTagLabel(tag, locale)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="post-control-field">
                  <span>{t("ui.sortBy")}</span>
                  <select
                    className="post-control-select"
                    value={filters.sort}
                    onChange={(event) => {
                      updateFilters({
                        sort:
                          event.target.value === "oldest" ? "oldest" : "newest",
                      });
                    }}
                  >
                    <option value="newest">{t("ui.sortNewest")}</option>
                    <option value="oldest">{t("ui.sortOldest")}</option>
                  </select>
                </label>
              </div>
            </div>
          </section>

          <div className="post-list post-list-editorial" key="post-list">
            {filteredPosts.length === 0 ? (
              <p className="post-empty">{t("ui.noResults")}</p>
            ) : null}
            {filteredPosts.map((post, index) => {
              const visibleTags = post.tags.slice(0, 3);
              const hiddenTagCount = post.tags.length - visibleTags.length;
              const isFeatured = showFeaturedPost && index === 0;

              return (
                <Link
                  key={post.slug}
                  to={`/${locale}/posts/${post.slug}`}
                  aria-label={`${post.title} - ${t("ui.readPost")}`}
                  ref={(element) => {
                    cardRefs.current[index] = element;
                  }}
                  className={`post-card ${isFeatured ? "post-card-featured" : "post-card-compact"} ${focusedIndex === index ? "focused" : ""}`}
                  onMouseEnter={() => setFocusedIndex(index)}
                  onFocus={() => setFocusedIndex(index)}
                >
                  {hasPostEditorialArt(post.slug) ? (
                    <PostEditorialArt locale={locale} slug={post.slug} variant="card" />
                  ) : (
                    <PostVisual
                      locale={locale}
                      slug={post.slug}
                      variant="card"
                      visualId={
                        isPostDiagramVisualId(post.visualId)
                          ? post.visualId
                          : undefined
                      }
                    />
                  )}
                  <div className="post-card-body">
                    {isFeatured ? <span className="post-featured-label">{t("ui.featuredPost")}</span> : null}
                    <div className="meta meta-inline">
                      <span>{formatDate(post.publishedAt, locale)}</span>
                      <span>
                        {t("ui.readTime", { count: post.readTimeMinutes })}
                      </span>
                    </div>
                    <h3>{post.title}</h3>
                    <p className="post-subtitle">{post.subtitle}</p>
                    <ul className="post-tag-list" aria-label={t("ui.tags")}>
                      {visibleTags.map((tag) => (
                        <li key={tag} className="post-tag-item">
                          {tag}
                        </li>
                      ))}
                      {hiddenTagCount > 0 ? (
                        <li
                          className="post-tag-item post-tag-more"
                          aria-label={t("ui.moreTags", { count: hiddenTagCount })}
                        >
                          +{hiddenTagCount}
                        </li>
                      ) : null}
                    </ul>
                    <span className="post-card-link">{t("ui.readPost")} →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
