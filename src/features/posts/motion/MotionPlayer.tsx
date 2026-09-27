import { Player } from "@remotion/player";
import { MotionComposition, MOTION_DURATION, MOTION_FPS } from "./MotionComposition";
import type { MotionStory } from "./stories";

export default function MotionPlayer({ story, compact }: { story: MotionStory; compact: boolean }) {
  return (
    <Player
      key={compact ? "compact" : "wide"}
      component={MotionComposition}
      inputProps={{ story, compact }}
      durationInFrames={MOTION_DURATION}
      fps={MOTION_FPS}
      compositionWidth={compact ? 390 : 900}
      compositionHeight={compact ? 540 : 450}
      autoPlay
      controls
      moveToBeginningWhenEnded={false}
      showVolumeControls={false}
      allowFullscreen={false}
      style={{ width: "100%", aspectRatio: compact ? "13 / 18" : "2 / 1" }}
    />
  );
}
