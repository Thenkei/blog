import { useEffect, useLayoutEffect, useRef } from "react";
import { NavigationType, useLocation, useNavigationType } from "react-router-dom";

const STORAGE_KEY = "blog:scroll-positions";
const MAX_STORED_POSITIONS = 60;
/** Routes are lazy: the page is rarely tall enough on the first frame. */
const RESTORE_TIMEOUT_MS = 2500;
const INTERRUPTING_EVENTS = ["wheel", "touchstart", "keydown", "mousedown"] as const;

export type ScrollNavigationState = {
  /** Keep the reader where they are, e.g. when only the language changes. */
  preserveScroll?: boolean;
};

type LocationSnapshot = {
  key: string;
  pathname: string;
  search: string;
};

function readStoredPositions(): Map<string, number> {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const entries: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(entries)) {
      return new Map();
    }

    return new Map(
      entries.filter(
        (entry): entry is [string, number] =>
          Array.isArray(entry) &&
          typeof entry[0] === "string" &&
          typeof entry[1] === "number",
      ),
    );
  } catch {
    // Storage can be disabled or hold stale data; both mean "start at the top".
    return new Map();
  }
}

function writeStoredPositions(positions: Map<string, number>): void {
  try {
    const recent = Array.from(positions).slice(-MAX_STORED_POSITIONS);
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
  } catch {
    // Losing the position of a past page is not worth surfacing.
  }
}

function isReloadOrHistoryTraversal(): boolean {
  const [entry] = window.performance?.getEntriesByType?.("navigation") ?? [];
  const type = (entry as PerformanceNavigationTiming | undefined)?.type;
  return type === "reload" || type === "back_forward";
}

/**
 * Owns the window scroll position across client-side navigations:
 *
 * - a new page opens at the top, instead of inheriting the previous scroll;
 * - back/forward (and reload) return to where the reader was, once the lazy
 *   route is tall enough to scroll there;
 * - filter changes, in-page anchors and language switches leave it alone.
 *
 * The browser's own restoration runs before lazy content exists, so it lands
 * short; it is switched off while this hook is mounted.
 */
export function useScrollManagement(): void {
  const location = useLocation();
  const navigationType = useNavigationType();
  const positionsRef = useRef<Map<string, number> | null>(null);
  const previousLocationRef = useRef<LocationSnapshot | null>(null);
  const currentKeyRef = useRef(location.key);
  const lastScrollYRef = useRef(0);
  const cancelRestoreRef = useRef<(() => void) | null>(null);
  const isTraversingRef = useRef(false);

  // The router only keys the entries it creates. A reload and a native anchor
  // click both leave "default", so the path and the hash tell them apart.
  const positionKey = `${location.key}:${location.pathname}${location.hash}`;

  useEffect(() => {
    const { history } = window;
    if (!("scrollRestoration" in history)) {
      return;
    }

    const previous = history.scrollRestoration;
    history.scrollRestoration = "manual";
    return () => {
      history.scrollRestoration = previous;
    };
  }, []);

  useEffect(() => {
    let frame: number | null = null;

    const remember = () => {
      frame = null;
      // While a restoration is pending the page is still growing; the browser
      // clamps the scroll in the meantime and that value must not be saved.
      if (cancelRestoreRef.current || isTraversingRef.current) {
        return;
      }

      lastScrollYRef.current = window.scrollY;
      positionsRef.current?.set(currentKeyRef.current, window.scrollY);
    };

    const handleScroll = () => {
      if (frame === null) {
        frame = window.requestAnimationFrame(remember);
      }
    };

    const persist = () => {
      if (positionsRef.current) {
        writeStoredPositions(positionsRef.current);
      }
    };

    // An anchor click scrolls first and reaches the router a moment later.
    // Until the new location is rendered, the scroll belongs to an entry this
    // hook has not seen yet and must not be saved under the previous one.
    let traversalTimeout: number | null = null;
    const handlePopState = () => {
      isTraversingRef.current = true;
      if (traversalTimeout !== null) {
        window.clearTimeout(traversalTimeout);
      }
      // Safety net for a popstate the router ignores.
      traversalTimeout = window.setTimeout(() => {
        isTraversingRef.current = false;
      }, 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pagehide", persist);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pagehide", persist);
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }
      if (traversalTimeout !== null) {
        window.clearTimeout(traversalTimeout);
      }
      persist();
    };
  }, []);

  useLayoutEffect(() => {
    const positions = (positionsRef.current ??= readStoredPositions());
    const previous = previousLocationRef.current;
    isTraversingRef.current = false;
    // React re-runs effects for the same location in StrictMode.
    if (previous?.key === positionKey) {
      return;
    }

    const departingScrollY = lastScrollYRef.current;
    previousLocationRef.current = {
      key: positionKey,
      pathname: location.pathname,
      search: location.search,
    };
    currentKeyRef.current = positionKey;
    cancelRestoreRef.current?.();

    const settle = () => {
      positions.set(positionKey, window.scrollY);
      lastScrollYRef.current = window.scrollY;
    };

    const restore = (top: number) => {
      window.scrollTo(0, top);
      if (top <= 0) {
        positions.set(positionKey, 0);
        lastScrollYRef.current = 0;
        return;
      }

      const deadline = Date.now() + RESTORE_TIMEOUT_MS;
      let frame: number | null = null;

      const release = () => {
        if (frame !== null) {
          window.cancelAnimationFrame(frame);
          frame = null;
        }
        INTERRUPTING_EVENTS.forEach((type) =>
          window.removeEventListener(type, interrupt),
        );
        cancelRestoreRef.current = null;
      };

      // The reader taking over always wins against a pending restoration.
      const interrupt = () => {
        release();
        settle();
      };

      const attempt = () => {
        const maxScroll =
          document.documentElement.scrollHeight - window.innerHeight;
        if (maxScroll < top && Date.now() < deadline) {
          frame = window.requestAnimationFrame(attempt);
          return;
        }

        frame = null;
        window.scrollTo(0, Math.min(top, Math.max(maxScroll, 0)));
        release();
        settle();
      };

      INTERRUPTING_EVENTS.forEach((type) =>
        window.addEventListener(type, interrupt, { passive: true }),
      );
      // A newer navigation abandons this one without recording a position:
      // the target it was waiting for is still the right one for this entry.
      positions.set(positionKey, top);
      cancelRestoreRef.current = release;
      attempt();
    };

    const state = location.state as ScrollNavigationState | null;
    const saved = positions.get(positionKey);

    if (!previous) {
      // First render of the session entry: only a reload or a history
      // traversal has a position worth returning to.
      if (saved !== undefined && !location.hash && isReloadOrHistoryTraversal()) {
        restore(saved);
      }
      return;
    }

    if (navigationType === NavigationType.Pop) {
      if (saved !== undefined) {
        restore(saved);
      } else if (location.hash) {
        // An unseen entry with a hash is an in-page anchor the browser has
        // already scrolled to.
        settle();
      } else {
        restore(0);
      }
      return;
    }

    if (state?.preserveScroll) {
      restore(departingScrollY);
      return;
    }

    const isSamePage =
      previous.pathname === location.pathname &&
      previous.search === location.search;

    if (previous.pathname !== location.pathname) {
      // Hash targets on the new page are scrolled to by the page itself once
      // its content exists; start from the top either way.
      restore(0);
    } else if (isSamePage && navigationType === NavigationType.Push && !location.hash) {
      // Following a link to the page already open, e.g. the site title.
      restore(0);
    } else {
      // Filters and in-page anchors keep the reader where they are.
      settle();
    }
  }, [
    location.hash,
    location.pathname,
    location.search,
    location.state,
    navigationType,
    positionKey,
  ]);

  useEffect(
    () => () => {
      // Forget the last location too, so a remount (including the StrictMode
      // one) evaluates its entry again instead of treating it as handled.
      cancelRestoreRef.current?.();
      previousLocationRef.current = null;
    },
    [],
  );
}
