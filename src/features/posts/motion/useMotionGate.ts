import { useEffect, useRef, useState } from "react";

/**
 * Animate only once the figure is near the viewport and the reader has not
 * asked for reduced motion. Until then the static poster carries the content.
 */
export function useMotionGate(id: string) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return;
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "120px", threshold: .15 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [id]);

  return { ref, animate: visible && !reduceMotion };
}
