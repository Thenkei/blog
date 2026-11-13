import { useEffect, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { hasPostSlug, type PostLocale } from "../features/posts/content";
import { useTheme } from "./providers/ThemeProvider";
const PostListPage = lazy(() =>
  import("../features/posts/PostListPage").then((m) => ({
    default: m.PostListPage,
  })),
);
const PostPage = lazy(() =>
  import("../features/posts/PostPage").then((m) => ({ default: m.PostPage })),
);
const TopicPage = lazy(() =>
  import("../features/posts/TopicPage").then((m) => ({ default: m.TopicPage })),
);
const AboutPage = lazy(() =>
  import("../features/about/AboutPage").then((m) => ({ default: m.AboutPage })),
);
const NotFoundPage = lazy(() =>
  import("../features/not-found/NotFoundPage").then((m) => ({
    default: m.NotFoundPage,
  })),
);
import { SiteFooter } from "../shared/components/SiteFooter";
import { GlobalHeader } from "../shared/components/GlobalHeader";
import { isLocale, normalizeLocale } from "../shared/routing";
import { useScrollManagement } from "./useScrollManagement";

/**
 * A URL without a locale ("/about", "/posts/<slug>") is a link someone typed
 * or shortened. Send it to the same page in the reader's language rather than
 * dropping them on the home page.
 */
function LocalePrefixRedirect() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const locale = normalizeLocale(i18n.resolvedLanguage ?? i18n.language);

  return (
    <Navigate
      replace
      to={{
        pathname: `/${locale}${location.pathname}`,
        search: location.search,
        hash: location.hash,
      }}
    />
  );
}

function RootRedirect() {
  const { i18n } = useTranslation();
  const { appliedTheme } = useTheme();
  const location = useLocation();
  const locale = normalizeLocale(i18n.resolvedLanguage ?? i18n.language);
  const postFromLegacyQuery = new URLSearchParams(location.search).get("post");
  const postAccess = appliedTheme === "rocket" ? "rocket" : "public";

  if (postFromLegacyQuery && hasPostSlug(postFromLegacyQuery, postAccess)) {
    return <Navigate replace to={`/${locale}/posts/${postFromLegacyQuery}`} />;
  }

  return <Navigate replace to={`/${locale}`} />;
}

function LocaleLayout() {
  const { i18n, t } = useTranslation();
  const { appliedTheme } = useTheme();
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const locale = normalizeLocale(params.locale);
  const postAccess = appliedTheme === "rocket" ? "rocket" : "public";

  useScrollManagement();

  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
    // Screen readers and hyphenation follow the document language.
    document.documentElement.lang = locale;
  }, [i18n, locale]);

  useEffect(() => {
    const legacyPost = new URLSearchParams(location.search).get("post");
    if (!legacyPost || !hasPostSlug(legacyPost, postAccess)) {
      return;
    }

    const target = `/${locale}/posts/${legacyPost}`;
    if (location.pathname !== target || location.search) {
      void navigate(target, { replace: true });
    }
  }, [locale, location.pathname, location.search, navigate, postAccess]);

  if (!isLocale(params.locale)) {
    return <LocalePrefixRedirect />;
  }

  return (
    <div className="app">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          // Move focus without leaving "#main-content" in the address bar.
          event.preventDefault();
          const main = document.getElementById("main-content");
          main?.focus({ preventScroll: true });
          main?.scrollIntoView({ block: "start" });
        }}
      >
        {t("ui.skipToContent")}
      </a>
      <GlobalHeader />
      <div className="view-transition">
        {/* Holds the page height while a route chunk loads, so the footer
            does not jump to the top and back. */}
        <Suspense fallback={<div className="route-fallback" aria-busy="true" />}>
          <Outlet />
        </Suspense>
      </div>
      <SiteFooter />
    </div>
  );
}

function LocalePostListRoute() {
  const params = useParams();
  const locale = normalizeLocale(params.locale);
  return <PostListPage locale={locale} />;
}

function LocalePostRoute() {
  const params = useParams();
  const locale = normalizeLocale(params.locale);
  const slug = params.slug;

  if (!slug) {
    return <Navigate replace to={`/${locale}`} />;
  }

  return <PostPage locale={locale} slug={slug} />;
}

function LocaleTopicRoute() {
  const params = useParams();
  return <TopicPage locale={normalizeLocale(params.locale)} topicSlug={params.topicSlug} />;
}

function LocaleAboutRoute() {
  const params = useParams();
  return <AboutPage locale={normalizeLocale(params.locale)} />;
}

function LocaleNotFoundRoute() {
  const params = useParams();
  const location = useLocation();
  return (
    <NotFoundPage
      locale={normalizeLocale(params.locale)}
      path={location.pathname}
    />
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/:locale" element={<LocaleLayout />}>
        <Route index element={<LocalePostListRoute />} />
        <Route path="topics" element={<LocaleTopicRoute />} />
        <Route path="topics/:topicSlug" element={<LocaleTopicRoute />} />
        <Route path="about" element={<LocaleAboutRoute />} />
        <Route path="posts/:slug" element={<LocalePostRoute />} />
        <Route path="*" element={<LocaleNotFoundRoute />} />
      </Route>
      <Route path="*" element={<LocalePrefixRedirect />} />
    </Routes>
  );
}

export type { PostLocale };
