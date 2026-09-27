import { Children, isValidElement, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { normalizeLocale } from "../../../shared/routing";
import { FigureErrorBoundary } from "./InlineMotionFigure";
import { getAssetScene, type AssetSceneId } from "./figureScenes";
import { NativeScenePoster } from "./NativeScenePoster";

const FigureMotionPlayer = lazy(() => import("./FigureMotionPlayer"));

type Props = {
  assetId: AssetSceneId;
  src?: string | undefined;
  children: ReactNode;
};

export function AssetMotionFigure({ assetId, src, children }: Props) {
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
  const fallback = <NativeScenePoster scene={scene} caption={caption ?? children} imageSrc={src} />;

  return (
    <div ref={rootRef} className="inline-motion-root" data-inline-motion={assetId}>
      {visible && !reduceMotion ? (
        <FigureErrorBoundary key={assetId} fallback={fallback} id={assetId}>
          <Suspense fallback={fallback}>
            <>
              <figure className="post-visual inline-motion-figure" aria-label={scene.title}>
                <FigureMotionPlayer imageSrc={src} scene={scene} />
                {caption ?? <figcaption>{children}</figcaption>}
              </figure>
              <div className="inline-motion-print" aria-hidden="true">{fallback}</div>
            </>
          </Suspense>
        </FigureErrorBoundary>
      ) : fallback}
    </div>
  );
}
