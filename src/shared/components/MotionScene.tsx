import type { ReactNode } from "react";
import { BespokeMotionFigure } from "../../features/posts/motion/bespoke/BespokeMotionFigure";

// Pin-point explainer placed anywhere in an article: `<MotionScene id="…" />`
// renders `src/features/posts/motion/bespoke/scenes/<id>.tsx`.
export function MotionScene({ id, children }: { id: string; children?: ReactNode }) {
  return <BespokeMotionFigure id={id} caption={children} fallback={<div className="bespoke-scene-loading" aria-busy="true" />} />;
}
