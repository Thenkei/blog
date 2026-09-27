import { useEffect, useState } from "react";
import { Player } from "@remotion/player";
import { FigureMotionComposition, FIGURE_DURATION, FIGURE_FPS } from "./FigureMotionComposition";
import type { FigureScene } from "./figureScenes";

export default function FigureMotionPlayer({ imageSrc, scene }: {
  imageSrc?: string | undefined;
  scene: FigureScene;
}) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const query = window.matchMedia?.("(max-width: 650px)");
    if (!query) return;
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return (
    <Player
      key={compact ? "compact" : "wide"}
      component={FigureMotionComposition}
      inputProps={{ imageSrc, scene, compact }}
      durationInFrames={FIGURE_DURATION}
      fps={FIGURE_FPS}
      compositionWidth={compact ? 390 : 900}
      compositionHeight={compact ? 590 : 600}
      autoPlay
      controls
      loop={false}
      moveToBeginningWhenEnded={false}
      showVolumeControls={false}
      allowFullscreen
      style={{ width: "100%", aspectRatio: compact ? "39 / 59" : "3 / 2" }}
    />
  );
}
