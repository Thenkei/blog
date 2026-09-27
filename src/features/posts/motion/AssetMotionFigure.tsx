import { Children, isValidElement, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { normalizeLocale } from "../../../shared/routing";
import { FigureErrorBoundary } from "./InlineMotionFigure";
import { getAssetScene, type AssetSceneId } from "./figureScenes";

const FigureMotionPlayer = lazy(() => import("./FigureMotionPlayer"));

type Props = {
  assetId: AssetSceneId;
  src?: string | undefined;
  rawSvg?: string | undefined;
  children: ReactNode;
};

export function AssetMotionFigure({ assetId, src, rawSvg, children }: Props) {
  const { i18n } = useTranslation();
  const locale = normalizeLocale(i18n.resolvedLanguage ?? i18n.language);
  const scene = getAssetScene(assetId, locale);
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
    }, { rootMargin: "120px", threshold: .15 });
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [assetId]);

  const caption = Children.toArray(children).find((child) => isValidElement(child) && child.type === "figcaption");
  const fallback = rawSvg
    ? <figure className="article-figure" data-inline-article-diagram><div className="article-figure-svg" dangerouslySetInnerHTML={{ __html: rawSvg }} /><figcaption>{children}</figcaption></figure>
    : src
      ? <figure className="post-visual">{children}</figure>
      : <figure className="post-visual concept-motion-fallback"><ol>{scene.stages.map((stage) => <li key={stage.heading}><strong>{stage.heading}</strong><span>{stage.detail}</span></li>)}</ol><figcaption>{children}</figcaption></figure>;

  return (
    <div ref={rootRef} className="inline-motion-root" data-inline-motion={assetId}>
      {visible && !reduceMotion ? (
        <FigureErrorBoundary key={assetId} fallback={fallback} id={assetId}>
          <Suspense fallback={fallback}>
            <>
              <figure className="post-visual inline-motion-figure" aria-label={scene.title}>
                <FigureMotionPlayer assetSrc={src} rawSvg={rawSvg} scene={scene} />
                {rawSvg || (!src && !rawSvg) ? <figcaption>{children}</figcaption> : caption}
              </figure>
              <div className="inline-motion-print" aria-hidden="true">{fallback}</div>
            </>
          </Suspense>
        </FigureErrorBoundary>
      ) : fallback}
    </div>
  );
}
