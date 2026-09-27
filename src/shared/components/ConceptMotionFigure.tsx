import type { ReactNode } from "react";
import { AssetMotionFigure } from "../../features/posts/motion/AssetMotionFigure";
import type { AssetSceneId } from "../../features/posts/motion/figureScenes";

export function ConceptMotionFigure({ assetId, children }: { assetId: AssetSceneId; children: ReactNode }) {
  return <AssetMotionFigure assetId={assetId}>{children}</AssetMotionFigure>;
}
