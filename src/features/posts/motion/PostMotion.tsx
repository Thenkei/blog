import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { PostLocale } from "../content/types";
import { getMotionStory, type MotionStory } from "./stories";

const MotionPlayer = lazy(() => import("./MotionPlayer"));

function Poster({ story }: { story: MotionStory }) {
  return (
    <div className={`post-motion-poster post-motion-${story.kind}`}>
      <ol>
        {story.beats.map((beat, index) => (
          <li key={index}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{beat}</strong>
          </li>
        ))}
      </ol>
    </div>
  );
}

class MotionErrorBoundary extends Component<
  { story: MotionStory; slug: string; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("Article motion failed", { slug: this.props.slug, error });
  }

  render() {
    return this.state.failed ? <Poster story={this.props.story} /> : this.props.children;
  }
}

export function PostMotion({ slug, locale, title }: { slug: string; locale: PostLocale; title: string }) {
  const story = useMemo(() => getMotionStory(slug, locale), [slug, locale]);
  const rootRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return;
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const query = window.matchMedia?.("(max-width: 650px)");
    if (!query) return;
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!story || !rootRef.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.35 });
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [story]);

  if (!story) return null;
  const label = locale === "fr" ? "L’article en mouvement" : "The article in motion";

  return (
    <figure ref={rootRef} className="post-motion" data-post-motion={slug} aria-label={`${label}: ${title}`}>
      <div className="post-motion-heading">
        <span>{label}</span>
        <span>{locale === "fr" ? "8 secondes · 3 idées" : "8 seconds · 3 ideas"}</span>
      </div>
      {visible && !reduceMotion ? (
        <MotionErrorBoundary key={slug} story={story} slug={slug}>
          <Suspense fallback={<Poster story={story} />}>
            <MotionPlayer story={story} compact={compact} />
          </Suspense>
        </MotionErrorBoundary>
      ) : (
        <Poster story={story} />
      )}
      <figcaption>{story.beats.join(" → ")}</figcaption>
    </figure>
  );
}
