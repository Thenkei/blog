import type { ReactNode } from "react";
import { AssetMotionFigure } from "../../features/posts/motion/AssetMotionFigure";
import type { AssetSceneId } from "../../features/posts/motion/figureScenes";

type InlineArticleDiagramProps = {
  svg: string;
  assetId: AssetSceneId;
  children: ReactNode;
};

export function InlineArticleDiagram({ svg, assetId, children }: InlineArticleDiagramProps) {
  return <AssetMotionFigure assetId={assetId} rawSvg={svg}>{children}</AssetMotionFigure>;
}
