import { isValidElement, type ReactNode } from "react";
import type { FigureScene } from "./figureScenes";
import { SceneArtwork } from "./SceneArtwork";

export function NativeScenePoster({ scene, caption, imageSrc }: {
  scene: FigureScene;
  caption: ReactNode;
  imageSrc?: string | undefined;
}) {
  return <figure className="post-visual native-scene-poster" aria-label={scene.title}>
    <SceneArtwork scene={scene} frame={314} compact={false} imageSrc={imageSrc} />
    <ol className="native-scene-poster-steps">
      {scene.stages.map((stage, index) => <li key={`${index}-${stage.heading}`}>
        <span>{String(index + 1).padStart(2, "0")}</span>
        <strong>{stage.heading}</strong>
        <small>{stage.detail}</small>
      </li>)}
    </ol>
    {isValidElement(caption) && caption.type === "figcaption" ? caption : <figcaption>{caption}</figcaption>}
  </figure>;
}
