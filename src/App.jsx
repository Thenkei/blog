import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import "./i18n/config";
import "./index.css";

import TableOfContents from "./components/TableOfContents";
import ReadingProgressBar from "./components/ReadingProgressBar";
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

function App() {
  const [scrollY, setScrollY] = useState(0);
  const [currentPostId, setCurrentPostId] = useState(null);
  const [themeMode, setThemeMode] = useState("system");
  const [appliedTheme, setAppliedTheme] = useState("dark");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const { t, i18n } = useTranslation();
  const articleRef = useRef(null);
  const postCardsRef = useRef([]);

  // Get posts for current language
  const lang = i18n.language === "fr" ? "fr" : "en";
  const posts = getPosts(lang);
  const currentPost = currentPostId ? getPost(currentPostId, lang) : null;

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Theme initialization with migration from old "theme" key
  useEffect(() => {
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

    setThemeMode(savedMode);
    const applied = computeAppliedTheme(savedMode);
    setAppliedTheme(applied);
    document.documentElement.setAttribute("data-theme", applied);
  }, []);

  // Listen to system theme changes when mode is "system"
  useEffect(() => {
    if (themeMode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = (e) => {
      const newTheme = e.matches ? "dark" : "light";
      setAppliedTheme(newTheme);
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
          setCurrentPostId(selectedPost.id);
          window.scrollTo(0, window.innerHeight * 0.8);
        }
      } else if (e.key === "Escape") {
        setFocusedIndex(-1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPostId, focusedIndex, posts]);

  // Reset focus when returning to post list
  useEffect(() => {
    if (!currentPostId) {
      setFocusedIndex(-1);
    }
  }, [currentPostId]);

  const handleThemeChange = (newMode) => {
    setThemeMode(newMode);
    localStorage.setItem("themeMode", newMode);

    const applied = computeAppliedTheme(newMode);
    setAppliedTheme(applied);
    document.documentElement.setAttribute("data-theme", applied);
  };

  const getStyle = (speed, offset = 0) => ({
    transform: `translateY(${scrollY * speed + offset}px)`,
  });

  return (
    <div className="app">
      <div className="circuit-overlay"></div>

      <section className="parallax-container">
        <div
          className="parallax-layer layer-mountain-1"
          style={getStyle(0.2)}
        ></div>
        <div
          className="parallax-layer layer-mountain-2"
          style={getStyle(0.4)}
        ></div>
        <div
          className="parallax-layer layer-mountain-3"
          style={getStyle(0.8, 50)}
        ></div>

        <div className="hero-content">
          <div className="theme-switcher-container">
            <button
              className={`theme-btn ${themeMode === "system" ? "active" : ""}`}
              onClick={() => handleThemeChange("system")}
              title={t("ui.systemThemeTooltip")}
            >
              {t("ui.systemTheme")}
            </button>
            <span className="theme-separator">|</span>
            <button
              className={`theme-btn ${themeMode === "dark" ? "active" : ""}`}
              onClick={() => handleThemeChange("dark")}
            >
              {t("ui.darkTheme")}
            </button>
            <span className="theme-separator">|</span>
            <button
              className={`theme-btn ${themeMode === "light" ? "active" : ""}`}
              onClick={() => handleThemeChange("light")}
            >
              {t("ui.lightTheme")}
            </button>
          </div>
          <div className="lang-switcher-container">
            <button
              className={`lang-btn ${i18n.language === "en" ? "active" : ""}`}
              onClick={() => i18n.changeLanguage("en")}
            >
              EN
            </button>
            <span className="lang-separator">|</span>
            <button
              className={`lang-btn ${i18n.language === "fr" ? "active" : ""}`}
              onClick={() => i18n.changeLanguage("fr")}
            >
              FR
            </button>
          </div>
          <h1
            className="hero-title"
            onClick={() => {
              setCurrentPostId(null);
              window.scrollTo(0, 0);
            }}
            style={{ cursor: "pointer" }}
          >
            {t("header.title")}
          </h1>
          <p className="hero-subtitle">{t("header.subtitle")}</p>
        </div>
      </section>

      <main className="blog-content">
        <div className="container">
          {!currentPost ? (
            <div className="post-list" key="post-list">
              <h2 style={{ marginTop: 0, marginBottom: "3rem" }}>
                {t("ui.latestPosts")}
              </h2>
              {posts.map((post, index) => (
                <div
                  key={post.id}
                  ref={(el) => (postCardsRef.current[index] = el)}
                  className={`post-card ${focusedIndex === index ? "focused" : ""}`}
                  onClick={() => {
                    setCurrentPostId(post.id);
                    window.scrollTo(0, window.innerHeight * 0.8);
                  }}
                >
                  <div className="meta">
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>
                      {t("ui.readTime", { count: parseInt(post.readTime) })}
                    </span>
                  </div>
                  <h3>{post.title}</h3>
                  <p style={{ color: "var(--text-secondary)" }}>
                    {post.subtitle}
                  </p>
                  <div
                    className="trail-line"
                    style={{ width: "50px", margin: "1rem 0" }}
                  ></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <ReadingProgressBar />
              <article ref={articleRef} key={currentPostId}>
                <button
                  className="back-btn"
                  onClick={() => setCurrentPostId(null)}
                >
                  ← {t("ui.backToHome")}
                </button>
                <div className="meta">
                  <span>{currentPost.date}</span>
                  <span>•</span>
                  <span>
                    {t("ui.readTime", {
                      count: parseInt(currentPost.readTime),
                    })}
                  </span>
                </div>

                <h1
                  style={{
                    fontSize: "3.5rem",
                    marginBottom: "2rem",
                    lineHeight: "1.1",
                  }}
                >
                  {currentPost.title}
                </h1>

                <div className="trail-line"></div>

                <TableOfContents articleRef={articleRef} />

                {currentPost.content}

                <div className="trail-line" style={{ marginTop: "4rem" }}></div>
                <button
                  className="back-btn"
                  onClick={() => {
                    setCurrentPostId(null);
                    window.scrollTo(0, 0);
                  }}
                >
                  ← {t("ui.backToHome")}
                </button>
              </article>
            </>
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <span className="footer-copyright">
            {t("ui.footer.copyright", { year: new Date().getFullYear() })}
          </span>
          <div className="footer-links">
            <a
              href="https://github.com/Thenkei"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
              aria-label={t("ui.footer.github")}
            >
              <svg
                className="footer-icon"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              {t("ui.footer.github")}
            </a>
            <a
              href="https://www.linkedin.com/in/morgan-perre-15295782"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
              aria-label={t("ui.footer.linkedin")}
            >
              <svg
                className="footer-icon"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              {t("ui.footer.linkedin")}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
