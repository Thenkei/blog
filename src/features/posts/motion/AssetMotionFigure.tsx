import { Children, isValidElement, lazy, Suspense, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { normalizeLocale } from "../../../shared/routing";
import { BespokeMotionFigure } from "./bespoke/BespokeMotionFigure";
import { hasBespokeScene } from "./bespoke/registry";
import { FigureErrorBoundary } from "./InlineMotionFigure";
import { getAssetScene, type AssetSceneId } from "./figureScenes";
import { NativeScenePoster } from "./NativeScenePoster";
import { useMotionGate } from "./useMotionGate";

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
  // toArray clones with fresh keys on every call: take one snapshot and compare within it.
  const parts = Children.toArray(children);
  const caption = parts.find((child) => isValidElement(child) && child.type === "figcaption");
  const fallback = <NativeScenePoster scene={scene} caption={caption ?? children} imageSrc={src} />;

  if (hasBespokeScene(assetId)) {
    // Keep the article's own media (e.g. a <picture>): the scene explains it, it doesn't replace it.
    const media = caption ? parts.filter((child) => child !== caption) : [];
    return <>
      {media.length > 0 ? <div className="bespoke-scene-media">{media}</div> : null}
      <BespokeMotionFigure id={assetId} caption={caption ?? children} fallback={fallback} />
    </>;
  }

  return <GenericAssetFigure assetId={assetId} src={src} scene={scene} caption={caption ?? <figcaption>{children}</figcaption>} fallback={fallback} />;
}

function GenericAssetFigure({ assetId, src, scene, caption, fallback }: {
  assetId: AssetSceneId;
  src?: string | undefined;
  scene: ReturnType<typeof getAssetScene>;
  caption: ReactNode;
  fallback: ReactNode;
}) {
  const { ref, animate } = useMotionGate(assetId);

  return (
    <div ref={ref} className="inline-motion-root" data-inline-motion={assetId}>
      {animate ? (
        <FigureErrorBoundary key={assetId} fallback={fallback} id={assetId}>
          <Suspense fallback={fallback}>
            <>
              <figure className="post-visual inline-motion-figure" aria-label={scene.title}>
                <FigureMotionPlayer imageSrc={src} scene={scene} />
                {caption}
              </figure>
              <div className="inline-motion-print" aria-hidden="true">{fallback}</div>
            </>
          </Suspense>
        </FigureErrorBoundary>
      ) : fallback}
    </div>
  );
}
