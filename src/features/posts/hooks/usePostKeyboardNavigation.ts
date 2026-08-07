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
  const focusedIndexRef = useRef(focusedIndex);
  const onSelectIndexRef = useRef(onSelectIndex);

  useEffect(() => {
    focusedIndexRef.current = focusedIndex;
    onSelectIndexRef.current = onSelectIndex;
  }, [focusedIndex, onSelectIndex]);

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
        const next =
          focusedIndexRef.current < count - 1
            ? focusedIndexRef.current + 1
            : 0;
        focusedIndexRef.current = next;
        setFocusedIndex(next);
        cardRefs.current[next]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return;
      }

      if (event.key === "ArrowUp" || event.key === "k") {
        event.preventDefault();
        const next =
          focusedIndexRef.current > 0
            ? focusedIndexRef.current - 1
            : count - 1;
        focusedIndexRef.current = next;
        setFocusedIndex(next);
        cardRefs.current[next]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return;
      }

      const currentFocusedIndex = focusedIndexRef.current;
      if (event.key === "Enter" && currentFocusedIndex >= 0) {
        event.preventDefault();
        onSelectIndexRef.current(currentFocusedIndex);
        return;
      }

      if (event.key === "Escape") {
        setFocusedIndex(-1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [count, enabled]);

  return {
    focusedIndex,
    setFocusedIndex,
    cardRefs,
  };
}
