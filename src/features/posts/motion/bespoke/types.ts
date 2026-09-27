import type { ComponentType } from "react";
import type { PostLocale } from "../../content/types";

export type Localized<T = string> = Record<PostLocale, T>;

export type SceneBeat = {
  /** First frame (30 fps) at which this narration line becomes active. */
  at: number;
  text: Localized;
};

export type SceneStageProps = {
  frame: number;
  compact: boolean;
  locale: PostLocale;
  /** Stage size in SVG user units: 960×420 wide, 540×520 compact. */
  width: number;
  height: number;
};

// A bespoke scene explains one precise mechanism of one article. The stage only
// draws SVG; the shell owns the kicker, narration strip, progress and poster.
export type BespokeScene = {
  durationInFrames: number;
  /** Frame rendered as the static poster (reduced motion, print, pre-load). */
  posterFrame: number;
  title: Localized;
  caption: Localized;
  beats: readonly [SceneBeat, ...SceneBeat[]];
  Stage: ComponentType<SceneStageProps>;
};

export function defineScene(scene: BespokeScene): BespokeScene {
  return scene;
}
