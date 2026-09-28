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

/** Static drawing plus the narration as an ordered text alternative. */
function PosterMedia({ scene, locale }: { scene: BespokeScene; locale: PostLocale }) {
  return <div className="bespoke-scene-poster">
    <SceneShell scene={scene} frame={scene.posterFrame} compact={false} locale={locale} showNarration={false} />
    <ol className="bespoke-scene-beats">
      {scene.beats.map((beat, index) => <li key={beat.at}>
        <span>{String(index + 1).padStart(2, "0")}</span>
        <p>{beat.text[locale]}</p>
      </li>)}
    </ol>
  </div>;
}

export function BespokePoster({ scene, locale, caption }: { scene: BespokeScene; locale: PostLocale; caption?: ReactNode }) {
  return <figure className="post-visual bespoke-scene-figure" aria-label={scene.title[locale]}>
    <PosterMedia scene={scene} locale={locale} />
    <Caption scene={scene} locale={locale} caption={caption} />
  </figure>;
}

function Caption({ scene, locale, caption }: { scene: BespokeScene; locale: PostLocale; caption?: ReactNode }) {
  if (isValidElement(caption) && caption.type === "figcaption") return caption;
  return <figcaption>{caption ?? scene.caption[locale]}</figcaption>;
}

// One <figure> for the whole life of the scene: only its media swaps (poster →
// player, or back to the poster if the player fails). Replacing the figure
// itself would drop a screen reader's reading position right as the reader
// scrolls in, and detach any reference held to it.
function LoadedFigure({ id, caption, locale, animate }: Props & { locale: PostLocale; animate: boolean }) {
  const scene = use(loadBespokeScene(id));
  const poster = <PosterMedia scene={scene} locale={locale} />;
  return <>
    <figure className={`post-visual bespoke-scene-figure${animate ? " inline-motion-figure" : ""}`} aria-label={scene.title[locale]}>
      {animate
        ? <FigureErrorBoundary key={id} fallback={poster} id={id}>
          <Suspense fallback={poster}>
            <BespokePlayer scene={scene} locale={locale} />
          </Suspense>
        </FigureErrorBoundary>
        : poster}
      <Caption scene={scene} locale={locale} caption={caption} />
    </figure>
    {/* Print hides the player figure and shows this static copy instead. */}
    {animate ? <div className="inline-motion-print" aria-hidden="true"><BespokePoster scene={scene} locale={locale} caption={caption} /></div> : null}
  </>;
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
