import { useEffect, useState } from "react";
import { Player } from "@remotion/player";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { PostLocale } from "../../content/types";
import { COMPACT, SCENE_FPS, WIDE } from "./primitives";
import { SceneShell } from "./SceneShell";
import type { BespokeScene } from "./types";

type CompositionProps = { scene: BespokeScene; compact: boolean; locale: PostLocale };

function BespokeComposition({ scene, compact, locale }: CompositionProps) {
  const frame = useCurrentFrame();
  return <AbsoluteFill className="bespoke-scene-composition">
    <SceneShell scene={scene} frame={frame} compact={compact} locale={locale} />
  </AbsoluteFill>;
}

export default function BespokePlayer({ scene, locale }: { scene: BespokeScene; locale: PostLocale }) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const query = window.matchMedia?.("(max-width: 650px)");
    if (!query) return;
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const size = compact ? COMPACT : WIDE;
  return (
    <Player
      key={compact ? "compact" : "wide"}
      component={BespokeComposition}
      inputProps={{ scene, compact, locale }}
      durationInFrames={scene.durationInFrames}
      fps={SCENE_FPS}
      compositionWidth={size.width}
      compositionHeight={size.height}
      autoPlay
      controls
      loop={false}
      moveToBeginningWhenEnded={false}
      showVolumeControls={false}
      allowFullscreen
      style={{ width: "100%", aspectRatio: `${size.width} / ${size.height}` }}
    />
  );
}
