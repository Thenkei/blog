import type { ReactNode } from "react";
import { AssetMotionFigure } from "../../features/posts/motion/AssetMotionFigure";
import type { AssetSceneId } from "../../features/posts/motion/figureScenes";

type InlineArticleDiagramProps = {
  assetId: AssetSceneId;
  children: ReactNode;
};

export function InlineArticleDiagram({ assetId, children }: InlineArticleDiagramProps) {
  return <AssetMotionFigure assetId={assetId}>{children}</AssetMotionFigure>;
}
