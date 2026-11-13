import { useEffect, useRef } from "react";

type UsePostKeyboardNavigationParams = {
  enabled: boolean;
  count: number;
};

/**
 * Anything that already gives keys a meaning. A shortcut fired from inside a
 * field, a menu or a dialog would fight the control the reader is using.
 */
const KEY_CONSUMER_SELECTOR =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="menu"], [role="listbox"], [role="dialog"]';

function isKeyConsumer(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(KEY_CONSUMER_SELECTOR) !== null;
}

/**
 * `j` / `k` move through the post cards, vim-style.
 *
 * The shortcut moves real keyboard focus rather than painting a highlight, so
 * Enter, the focus ring and assistive technology all agree on which card is
 * current. Arrow keys are left alone: they scroll the page.
 */
export function usePostKeyboardNavigation({
  enabled,
  count,
}: UsePostKeyboardNavigationParams) {
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (!enabled || count === 0) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        (event.key !== "j" && event.key !== "k") ||
        isKeyConsumer(event.target)
      ) {
        return;
      }

      const cards = cardRefs.current.slice(0, count);
      const current = cards.findIndex(
        (card) => card !== null && card === document.activeElement,
      );
      const step = event.key === "j" ? 1 : -1;
      // From outside the list, `j` enters at the first card and `k` at the last.
      const next =
        current === -1
          ? step === 1
            ? 0
            : count - 1
          : (current + step + count) % count;
      const card = cards[next];
      if (!card) {
        return;
      }

      event.preventDefault();
      card.focus({ preventScroll: true });
      card.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [count, enabled]);

  return { cardRefs };
}
