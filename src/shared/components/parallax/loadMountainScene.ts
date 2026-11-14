import type { MountainScene } from "./MountainScene";

type MountainSceneComponent = typeof MountainScene;

let loaded: MountainSceneComponent | null = null;
let pending: Promise<MountainSceneComponent> | null = null;

/**
 * The Mountain scene is its own chunk. Both the hero and the app entry (early
 * fetch for Mountain visitors) go through this loader, so it is requested once.
 */
export function loadMountainScene(): Promise<MountainSceneComponent> {
  pending ??= import("./MountainScene").then(
    (module) => {
      loaded = module.MountainScene;
      return loaded;
    },
    (error: unknown) => {
      // Let the next caller try again instead of keeping a rejected promise.
      pending = null;
      throw error;
    },
  );

  return pending;
}

/** The scene if its chunk has already arrived, without waiting. */
export function getLoadedMountainScene(): MountainSceneComponent | null {
  return loaded;
}
