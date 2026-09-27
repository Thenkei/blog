import type { ReactNode } from "react";
import { AssetMotionFigure } from "../../features/posts/motion/AssetMotionFigure";
import type { AssetSceneId } from "../../features/posts/motion/figureScenes";

export function ImageMotionFigure({ assetId, src, children }: { assetId: AssetSceneId; src: string; children: ReactNode }) {
  return <AssetMotionFigure assetId={assetId} src={src}>{children}</AssetMotionFigure>;
}
