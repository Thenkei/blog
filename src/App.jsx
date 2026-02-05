import { useCallback, useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import "./i18n/config";
import "./index.css";

import ParallaxHero from "./components/ParallaxHero";
import PostHeader from "./components/PostHeader";
import PostList from "./components/PostList";
import PostArticle from "./components/PostArticle";
import SiteFooter from "./components/SiteFooter";
import { getPosts, getPost } from "./posts";

// Helper functions for theme management
function getSystemTheme() {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

function computeAppliedTheme(themeMode) {
  if (themeMode === "system") {
    return getSystemTheme();
  }
  return themeMode;
}

// Initialize theme from localStorage (runs once at module load)
function getInitialThemeMode() {
  if (typeof window === "undefined") return "system";
  let savedMode = localStorage.getItem("themeMode");
  if (!savedMode) {
    const oldTheme = localStorage.getItem("theme");
    if (oldTheme === "dark" || oldTheme === "light") {
      savedMode = oldTheme;
      localStorage.setItem("themeMode", savedMode);
      localStorage.removeItem("theme");
    } else {
      savedMode = "system";
    }
  }
  // Apply theme to DOM immediately
  const applied = computeAppliedTheme(savedMode);
  document.documentElement.setAttribute("data-theme", applied);
  return savedMode;
}

function getPostIdFromUrl() {
  if (typeof window === "undefined") return null;

  const postId = new URLSearchParams(window.location.search).get("post");
  if (!postId) return null;

  return getPost(postId, "en") ? postId : null;
}

function syncUrlWithPost(postId) {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  if (postId) {
    url.searchParams.set("post", postId);
  } else {
    url.searchParams.delete("post");
  }

  window.history.pushState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

function App() {
  const [scrollY, setScrollY] = useState(0);
  const [currentPostId, setCurrentPostId] = useState(getPostIdFromUrl);
  const [themeMode, setThemeMode] = useState(getInitialThemeMode);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const { t, i18n } = useTranslation();
  const articleRef = useRef(null);
  const postCardsRef = useRef([]);

  // Get posts for current language
  const lang = i18n.language === "fr" ? "fr" : "en";
  const posts = getPosts(lang);
  const currentPost = currentPostId ? getPost(currentPostId, lang) : null;

  const openPost = useCallback((postId) => {
    setCurrentPostId(postId);
    setFocusedIndex(-1);
    syncUrlWithPost(postId);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Listen to system theme changes when mode is "system"
  useEffect(() => {
    if (themeMode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = (e) => {
      const newTheme = e.matches ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", newTheme);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleSystemThemeChange);
    } else {
      mediaQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleSystemThemeChange);
      } else {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, [themeMode]);

  // Keep the selected post in sync with browser navigation.
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPostId(getPostIdFromUrl());
      setFocusedIndex(-1);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Keyboard navigation for posts
  useEffect(() => {
    if (currentPostId) return;

    const handleKeyDown = (e) => {
      const postCount = posts.length;

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev < postCount - 1 ? prev + 1 : 0;
          postCardsRef.current[next]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          return next;
        });
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : postCount - 1;
          postCardsRef.current[next]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          return next;
        });
      } else if (e.key === "Enter" && focusedIndex >= 0) {
        e.preventDefault();
        const selectedPost = posts[focusedIndex];
        if (selectedPost) {
          openPost(selectedPost.id);
        }
      } else if (e.key === "Escape") {
        setFocusedIndex(-1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPostId, focusedIndex, openPost, posts]);

  // Helper to navigate back to post list
  const navigateToPostList = () => {
    openPost(null);
  };

  const handleThemeChange = (newMode) => {
    setThemeMode(newMode);
    localStorage.setItem("themeMode", newMode);
    document.documentElement.setAttribute(
      "data-theme",
      computeAppliedTheme(newMode),
    );
  };

  useEffect(() => {
    if (currentPostId) {
      window.scrollTo(0, 0);
    }
  }, [currentPostId]);

  const isPostView = Boolean(currentPost);
  const headerPadRem = isPostView
    ? Math.min(
        6,
        3.5 + Math.max(0, (currentPost.title.length - 40) * 0.04),
      )
    : 0;

  return (
    <div className="app">
      <div className="circuit-overlay"></div>

      <div className="view-transition" key={isPostView ? "post" : "list"}>
        {!isPostView ? (
          <ParallaxHero
            scrollY={scrollY}
            themeMode={themeMode}
            onThemeChange={handleThemeChange}
            t={t}
            i18n={i18n}
            onTitleClick={() => {
              navigateToPostList();
              window.scrollTo(0, 0);
            }}
          />
        ) : (
          <PostHeader
            t={t}
            themeMode={themeMode}
            onThemeChange={handleThemeChange}
            i18n={i18n}
            onTitleClick={() => {
              navigateToPostList();
              window.scrollTo(0, 0);
            }}
            onBreadcrumbClick={() => {
              navigateToPostList();
              window.scrollTo(0, 0);
            }}
            breadcrumbLabel={currentPost.title}
            headerPadRem={headerPadRem}
          />
        )}

        <main className="blog-content">
          <div className="container">
            {!currentPost ? (
              <PostList
                posts={posts}
                focusedIndex={focusedIndex}
                postCardsRef={postCardsRef}
                t={t}
                onSelectPost={(post) => {
                  openPost(post.id);
                }}
              />
            ) : (
              <PostArticle
                currentPost={currentPost}
                articleRef={articleRef}
                t={t}
                onBackToList={navigateToPostList}
                onBackToTop={() => {
                  navigateToPostList();
                  window.scrollTo(0, 0);
                }}
              />
            )}
          </div>
        </main>
      </div>

      <SiteFooter t={t} />
    </div>
  );
}

export default App;
