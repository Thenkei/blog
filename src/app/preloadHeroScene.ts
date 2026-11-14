import { loadMountainScene } from "../shared/components/parallax/loadMountainScene";
import { isLocale } from "../shared/routing";

/** The home page: the base path alone, or followed by nothing but a locale. */
export function isHomePath(pathname: string, basePath: string): boolean {
  const base = basePath.replace(/\/+$/, "");
  const relative = pathname.startsWith(base)
    ? pathname.slice(base.length)
    : pathname;
  const segments = relative.split("/").filter(Boolean);

  return (
    segments.length === 0 || (segments.length === 1 && isLocale(segments[0]))
  );
}

/**
 * Starts downloading the Mountain scene while the app boots.
 *
 * Without this the chunk is only requested once the home page has rendered,
 * which is itself a lazy route: on a first visit the hero then shows an empty
 * stage for one more network round trip.
 *
 * `theme` is what the inline script in index.html put on <html>.
 */
export function preloadHeroScene(
  theme: string | undefined,
  pathname: string,
  basePath: string,
  load: () => Promise<unknown> = loadMountainScene,
): boolean {
  if (theme !== "mountain" || !isHomePath(pathname, basePath)) {
    return false;
  }

  // A failed fetch is not fatal here: the hero asks for the chunk again when
  // it renders, and that request goes through the usual preload recovery.
  load().catch(() => undefined);
  return true;
}
