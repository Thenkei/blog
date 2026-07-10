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
import { SiteFooter } from "../shared/components/SiteFooter";
import { normalizeLocale } from "../shared/routing";

function RootRedirect() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const locale = normalizeLocale(i18n.resolvedLanguage ?? i18n.language);
  const postFromLegacyQuery = new URLSearchParams(location.search).get("post");

  if (postFromLegacyQuery && hasPostSlug(postFromLegacyQuery)) {
    return <Navigate replace to={`/${locale}/posts/${postFromLegacyQuery}`} />;
  }

  return <Navigate replace to={`/${locale}`} />;
}

function LocaleLayout() {
  const { i18n } = useTranslation();
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const locale = normalizeLocale(params.locale);

  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [i18n, locale]);

  useEffect(() => {
    const legacyPost = new URLSearchParams(location.search).get("post");
    if (!legacyPost || !hasPostSlug(legacyPost)) {
      return;
    }

    const target = `/${locale}/posts/${legacyPost}`;
    if (location.pathname !== target || location.search) {
      void navigate(target, { replace: true });
    }
  }, [locale, location.pathname, location.search, navigate]);

  if (!params.locale || (params.locale !== "en" && params.locale !== "fr")) {
    return <Navigate replace to={`/${locale}`} />;
  }

  return (
    <div className="app">
      <div className="circuit-overlay" />
      <div className="view-transition">
        <Suspense fallback={<div />}>
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

function NotFoundRedirect() {
  return <Navigate replace to="/en" />;
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
      </Route>
      <Route path="*" element={<NotFoundRedirect />} />
    </Routes>
  );
}

export type { PostLocale };
