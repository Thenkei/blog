import { useCallback, useSyncExternalStore } from "react";

/**
 * Tracks a CSS media query. Returns false where `matchMedia` is unavailable,
 * so callers render their default (wide) layout.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === "undefined" || !window.matchMedia) {
        return () => {};
      }

      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => Boolean(window.matchMedia?.(query).matches),
    () => false,
  );
}
