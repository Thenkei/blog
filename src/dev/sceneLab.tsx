// Dev-only preview for bespoke scenes (served by `npm run dev`, not built):
//   /blog/scene-lab.html?id=<scene>&frame=<n|all>&theme=<light|dark|mountain|rocket>&compact=1&locale=fr&play=1
import { StrictMode, use, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "../styles/tokens.css";
import "../styles/base.css";
import "../styles/layout.css";
import "../styles/scenes.css";
import "../styles/components.css";
import BespokePlayer from "../features/posts/motion/bespoke/BespokePlayer";
import { bespokeSceneIds, loadBespokeScene } from "../features/posts/motion/bespoke/registry";
import { SceneShell } from "../features/posts/motion/bespoke/SceneShell";
import { COMPACT, WIDE } from "../features/posts/motion/bespoke/primitives";
import type { PostLocale } from "../features/posts/content/types";

const params = new URLSearchParams(location.search);
const id = params.get("id");
const compact = params.get("compact") === "1";
const locale: PostLocale = params.get("locale") === "fr" ? "fr" : "en";
document.documentElement.setAttribute("data-theme", params.get("theme") ?? "dark");

function Lab({ sceneId }: { sceneId: string }) {
  const scene = use(loadBespokeScene(sceneId));
  const size = compact ? COMPACT : WIDE;
  if (params.get("play") === "1") return <div style={{ width: compact ? 390 : 960 }}><BespokePlayer scene={scene} locale={locale} /></div>;
  const frameParam = params.get("frame") ?? "all";
  const frames = frameParam === "all"
    ? [...scene.beats.map((beat, index) => Math.round((beat.at + (scene.beats[index + 1]?.at ?? scene.durationInFrames)) / 2)), scene.posterFrame, scene.durationInFrames - 1]
    : frameParam.split(",").map(Number);
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 16, padding: 16 }}>
    {frames.map((frame) => <div key={frame} data-frame={frame} style={{ width: size.width, height: size.height, position: "relative", overflow: "hidden", outline: "1px solid var(--divider)" }}>
      <div className="bespoke-scene-composition" style={{ position: "absolute", inset: 0 }}>
        <SceneShell scene={scene} frame={Math.min(frame, scene.durationInFrames - 1)} compact={compact} locale={locale} />
      </div>
      <code style={{ position: "absolute", right: 8, bottom: 8, color: "var(--text-muted)", fontSize: 11 }}>f{frame}</code>
    </div>)}
  </div>;
}

// Contact sheet for review: ?sheet=1&from=0&count=12&at=poster|end|0.5
function Sheet() {
  const from = Number(params.get("from") ?? 0);
  const count = Number(params.get("count") ?? 12);
  const ids = bespokeSceneIds.slice(from, from + count);
  return <div style={{ display: "grid", gridTemplateColumns: `repeat(2, ${(compact ? 270 : 480)}px)`, gap: 12, padding: 12 }}>
    {ids.map((sceneId) => <SheetTile key={sceneId} sceneId={sceneId} />)}
  </div>;
}

function SheetTile({ sceneId }: { sceneId: string }) {
  const scene = use(loadBespokeScene(sceneId));
  const size = compact ? COMPACT : WIDE;
  const at = params.get("at") ?? "poster";
  const frame = at === "poster" ? scene.posterFrame : at === "end" ? scene.durationInFrames - 1 : Math.round(Number(at) * (scene.durationInFrames - 1));
  return <div style={{ width: size.width / 2, height: size.height / 2 + 16, overflow: "hidden" }}>
    <code style={{ fontSize: 10, color: "var(--text-muted)" }}>{sceneId}</code>
    <div style={{ width: size.width, height: size.height, transform: "scale(.5)", transformOrigin: "0 0", position: "relative" }}>
      <div className="bespoke-scene-composition" style={{ position: "absolute", inset: 0 }}>
        <SceneShell scene={scene} frame={frame} compact={compact} locale={locale} />
      </div>
    </div>
  </div>;
}

createRoot(document.getElementById("root")!).render(<StrictMode>
  {params.get("sheet") === "1" ? <Suspense fallback={null}><Sheet /></Suspense> : id
    ? <Suspense fallback={null}><Lab sceneId={id} /></Suspense>
    : <ul>{bespokeSceneIds.map((sceneId) => <li key={sceneId}><a href={`?id=${sceneId}`}>{sceneId}</a></li>)}</ul>}
</StrictMode>);
