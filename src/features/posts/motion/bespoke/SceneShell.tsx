import type { PostLocale } from "../../content/types";
import { Backdrop } from "./Backdrop";
import { COMPACT, easeOut, WIDE } from "./primitives";
import type { BespokeScene } from "./types";

export function activeBeatIndex(scene: BespokeScene, frame: number) {
  let index = 0;
  scene.beats.forEach((beat, beatIndex) => {
    if (frame >= beat.at) index = beatIndex;
  });
  return index;
}

const BEAT_FADE = 16;

// Pure frame → picture. Used by the Remotion composition and, at `posterFrame`,
// by the static poster, so both render the exact same drawing.
export function SceneShell({ scene, frame, compact, locale, showNarration = true }: {
  scene: BespokeScene;
  frame: number;
  compact: boolean;
  locale: PostLocale;
  showNarration?: boolean;
}) {
  const size = compact ? COMPACT : WIDE;
  const beatIndex = activeBeatIndex(scene, frame);
  const beat = scene.beats[beatIndex]!;
  const previous = beatIndex > 0 ? scene.beats[beatIndex - 1] : undefined;
  const beatIn = easeOut(frame, beat.at, beat.at + BEAT_FADE);
  const { Stage } = scene;

  return <div className={`bespoke-scene${compact ? " bespoke-scene-compact" : ""}`} data-beat={beatIndex}>
    <svg className="bespoke-scene-stage" viewBox={`0 0 ${size.width} ${size.stageHeight}`} role="presentation" aria-hidden="true">
      <Backdrop frame={frame} width={size.width} height={size.stageHeight} />
      <Stage frame={frame} compact={compact} locale={locale} width={size.width} height={size.stageHeight} />
    </svg>
    <div className="bespoke-scene-kicker"><i aria-hidden="true" />{scene.title[locale]}</div>
    {showNarration ? <div className="bespoke-scene-narration">
      <div className="bespoke-scene-segments" aria-hidden="true">
        {scene.beats.map((item, index) => {
          const end = scene.beats[index + 1]?.at ?? scene.durationInFrames;
          const fill = Math.max(0, Math.min(1, (frame - item.at) / Math.max(1, end - item.at)));
          return <span key={item.at} className={index === beatIndex ? "is-active" : undefined}><i style={{ transform: `scaleX(${fill})` }} /></span>;
        })}
      </div>
      <div className="bespoke-scene-caption">
        <span className="bespoke-scene-beat-index">{String(beatIndex + 1).padStart(2, "0")}</span>
        <div className="bespoke-scene-lines">
          {previous && beatIn < 1 ? <p aria-hidden="true" style={{ opacity: 1 - beatIn, transform: `translateY(${-10 * beatIn}px)` }}>{previous.text[locale]}</p> : null}
          <p style={{ opacity: previous ? beatIn : 1, transform: `translateY(${previous ? 12 * (1 - beatIn) : 0}px)` }}>{beat.text[locale]}</p>
        </div>
      </div>
    </div> : null}
  </div>;
}
