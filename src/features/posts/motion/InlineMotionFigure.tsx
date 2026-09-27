import { Component, lazy, Suspense, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { PostDiagramVisualId } from "../content/types";
import type { ArticleMediaId } from "../../../shared/components/ArticleMedia";
import { normalizeLocale } from "../../../shared/routing";
import { BespokeMotionFigure } from "./bespoke/BespokeMotionFigure";
import { hasBespokeScene } from "./bespoke/registry";
import { getDiagramScene, getMediaScene, type FigureScene } from "./figureScenes";
import { NativeScenePoster } from "./NativeScenePoster";
import { useMotionGate } from "./useMotionGate";

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
  const fallback = <NativeScenePoster scene={scene} caption={scene.caption} />;

  // Bespoke scenes carry their own caption, written for the mechanism they show.
  if (hasBespokeScene(id)) return <BespokeMotionFigure id={id} fallback={fallback} />;
  return <GenericMotionFigure id={id} scene={scene} fallback={fallback} />;
}

function GenericMotionFigure({ id, scene, fallback }: { id: string; scene: FigureScene; fallback: ReactNode }) {
  const { ref, animate } = useMotionGate(id);

  return (
    <div ref={ref} className="inline-motion-root" data-inline-motion={id}>
      {animate ? (
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
