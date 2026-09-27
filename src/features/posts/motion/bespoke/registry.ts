import type { BespokeScene } from "./types";

// One file per scene: `scenes/<figure-id>.tsx` default-exports `defineScene(...)`.
// The file name is the figure id (a visualId, mediaId, assetId or MotionScene id),
// and each scene becomes its own chunk loaded only by the article that uses it.
const modules = import.meta.glob<{ default: BespokeScene }>("./scenes/*.tsx");

const loaders = new Map(
  Object.entries(modules).map(([path, load]) => [path.slice("./scenes/".length, -".tsx".length), load]),
);

const cache = new Map<string, Promise<BespokeScene>>();

export const bespokeSceneIds = [...loaders.keys()].sort();

export function hasBespokeScene(id: string) {
  return loaders.has(id);
}

export function loadBespokeScene(id: string): Promise<BespokeScene> {
  const cached = cache.get(id);
  if (cached) return cached;
  const load = loaders.get(id);
  if (!load) return Promise.reject(new Error(`Unknown bespoke scene: ${id}`));
  const pending = load().then((module) => module.default);
  // A failed chunk load must be retryable on the next mount, not cached forever.
  pending.catch(() => cache.delete(id));
  cache.set(id, pending);
  return pending;
}
