import { useEffect, useRef, useState } from "react";

type UsePostKeyboardNavigationParams = {
  enabled: boolean;
  count: number;
  onSelectIndex: (index: number) => void;
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.isContentEditable
  );
}

export function usePostKeyboardNavigation({
  enabled,
  count,
  onSelectIndex,
}: UsePostKeyboardNavigationParams) {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (!enabled) {
      setFocusedIndex(-1);
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) || count === 0) {
        return;
      }

      if (event.key === "ArrowDown" || event.key === "j") {
        event.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev < count - 1 ? prev + 1 : 0;
          cardRefs.current[next]?.scrollIntoView({ behavior: "smooth", block: "center" });
          return next;
        });
        return;
      }

      if (event.key === "ArrowUp" || event.key === "k") {
        event.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : count - 1;
          cardRefs.current[next]?.scrollIntoView({ behavior: "smooth", block: "center" });
          return next;
        });
        return;
      }

      if (event.key === "Enter" && focusedIndex >= 0) {
        event.preventDefault();
        onSelectIndex(focusedIndex);
        return;
      }

      if (event.key === "Escape") {
        setFocusedIndex(-1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [count, enabled, focusedIndex, onSelectIndex]);

  return {
    focusedIndex,
    setFocusedIndex,
    cardRefs,
  };
}
