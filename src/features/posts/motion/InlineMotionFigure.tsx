import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { PostDiagramVisualId } from "../content/types";
import type { ArticleMediaId } from "../../../shared/components/ArticleMedia";
import { normalizeLocale } from "../../../shared/routing";
import { getDiagramScene, getMediaScene, type FigureScene } from "./figureScenes";
import { NativeScenePoster } from "./NativeScenePoster";

const FigureMotionPlayer = lazy(() => import("./FigureMotionPlayer"));

type Props = { visualId: PostDiagramVisualId; mediaId?: never } | { mediaId: ArticleMediaId; visualId?: never };

export class FigureErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode; id: string }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("Inline motion failed", { figureId: this.props.id, error });
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function InlineMotionFigure(props: Props) {
  const { i18n } = useTranslation();
  const locale = normalizeLocale(i18n.resolvedLanguage ?? i18n.language);
  const id = props.visualId ?? props.mediaId;
  const scene: FigureScene = props.visualId
    ? getDiagramScene(props.visualId, locale)
    : getMediaScene(props.mediaId, locale);
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return;
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!rootRef.current) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "120px", threshold: 0.15 });
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [id]);

  const fallback = <NativeScenePoster scene={scene} caption={scene.caption} />;

  return (
    <div ref={rootRef} className="inline-motion-root" data-inline-motion={id}>
      {visible && !reduceMotion ? (
        <FigureErrorBoundary key={id} fallback={fallback} id={id}>
          <Suspense fallback={fallback}>
            <>
              <figure className="post-visual inline-motion-figure" aria-label={scene.title}>
                <FigureMotionPlayer scene={scene} />
                <figcaption>{scene.caption}</figcaption>
              </figure>
              <div className="inline-motion-print" aria-hidden="true">{fallback}</div>
            </>
          </Suspense>
        </FigureErrorBoundary>
      ) : fallback}
    </div>
  );
}
