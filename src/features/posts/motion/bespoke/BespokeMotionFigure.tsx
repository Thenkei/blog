import { isValidElement, lazy, Suspense, use, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { normalizeLocale } from "../../../../shared/routing";
import type { PostLocale } from "../../content/types";
import { FigureErrorBoundary } from "../InlineMotionFigure";
import { useMotionGate } from "../useMotionGate";
import { loadBespokeScene } from "./registry";
import { SceneShell } from "./SceneShell";
import type { BespokeScene } from "./types";

const BespokePlayer = lazy(() => import("./BespokePlayer"));

type Props = {
  id: string;
  /** Article-provided caption (MDX children); falls back to the scene's own caption. */
  caption?: ReactNode;
};

export function BespokePoster({ scene, locale, caption }: { scene: BespokeScene; locale: PostLocale; caption?: ReactNode }) {
  return <figure className="post-visual bespoke-scene-poster" aria-label={scene.title[locale]}>
    <SceneShell scene={scene} frame={scene.posterFrame} compact={false} locale={locale} showNarration={false} />
    <ol className="bespoke-scene-beats">
      {scene.beats.map((beat, index) => <li key={beat.at}>
        <span>{String(index + 1).padStart(2, "0")}</span>
        <p>{beat.text[locale]}</p>
      </li>)}
    </ol>
    <Caption scene={scene} locale={locale} caption={caption} />
  </figure>;
}

function Caption({ scene, locale, caption }: { scene: BespokeScene; locale: PostLocale; caption?: ReactNode }) {
  if (isValidElement(caption) && caption.type === "figcaption") return caption;
  return <figcaption>{caption ?? scene.caption[locale]}</figcaption>;
}

function LoadedFigure({ id, caption, locale, animate }: Props & { locale: PostLocale; animate: boolean }) {
  const scene = use(loadBespokeScene(id));
  const poster = <BespokePoster scene={scene} locale={locale} caption={caption} />;
  if (!animate) return poster;
  return <FigureErrorBoundary key={id} fallback={poster} id={id}>
    <Suspense fallback={poster}>
      <figure className="post-visual inline-motion-figure bespoke-scene-figure" aria-label={scene.title[locale]}>
        <BespokePlayer scene={scene} locale={locale} />
        <Caption scene={scene} locale={locale} caption={caption} />
      </figure>
      <div className="inline-motion-print" aria-hidden="true">{poster}</div>
    </Suspense>
  </FigureErrorBoundary>;
}

export function BespokeMotionFigure({ id, caption, fallback }: Props & { fallback: ReactNode }) {
  const { i18n } = useTranslation();
  const locale = normalizeLocale(i18n.resolvedLanguage ?? i18n.language);
  const { ref, animate } = useMotionGate(id);

  return <div ref={ref} className="inline-motion-root" data-inline-motion={id} data-motion-scene="bespoke">
    {/* The generic storyboard doubles as loading state and chunk-failure fallback. */}
    <FigureErrorBoundary key={id} fallback={fallback} id={`${id}:load`}>
      <Suspense fallback={fallback}>
        <LoadedFigure id={id} caption={caption} locale={locale} animate={animate} />
      </Suspense>
    </FigureErrorBoundary>
  </div>;
}
