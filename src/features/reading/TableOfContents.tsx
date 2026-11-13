import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { useTranslation } from "react-i18next";

const ListIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="toc-icon"
    aria-hidden="true"
  >
    <line x1="8" y1="6" x2="21" y2="6"></line>
    <line x1="8" y1="12" x2="21" y2="12"></line>
    <line x1="8" y1="18" x2="21" y2="18"></line>
    <line x1="3" y1="6" x2="3.01" y2="6"></line>
    <line x1="3" y1="12" x2="3.01" y2="12"></line>
    <line x1="3" y1="18" x2="3.01" y2="18"></line>
  </svg>
);

type HeadingItem = {
  id: string;
  text: string;
};

type TableOfContentsProps = {
  articleRef: RefObject<HTMLElement | null>;
  contentKey: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

/** A heading counts as reached once it sits this close to the sticky header. */
const ACTIVE_HEADING_OFFSET_PX = 32;

function getHeaderHeight(): number {
  return document.querySelector(".global-header")?.getBoundingClientRect().height ?? 0;
}

export function TableOfContents({
  articleRef,
  contentKey,
}: TableOfContentsProps) {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelId = useId();
  const { t } = useTranslation();

  useEffect(() => {
    const article = articleRef.current;
    if (!article) {
      setHeadings([]);
      return;
    }

    const contentRoot = article.querySelector(".post-document") ?? article;
    const headingNodes = Array.from(contentRoot.querySelectorAll("h2"));
    const counter = new Map<string, number>();

    const nextHeadings = headingNodes
      .map((heading) => {
        const text = heading.textContent?.trim() ?? "";
        if (!text) {
          return null;
        }

        const base = heading.id || slugify(text) || "section";
        const occurrence = counter.get(base) ?? 0;
        counter.set(base, occurrence + 1);

        const id = occurrence === 0 ? base : `${base}-${occurrence + 1}`;
        heading.id = id;

        return { id, text };
      })
      .filter((item): item is HeadingItem => Boolean(item));

    setHeadings(nextHeadings);
    setIsOpen(false);
  }, [articleRef, contentKey]);

  // Mark the section being read. The observer only wakes this up when a
  // heading crosses the line under the header, not on every scroll frame.
  useEffect(() => {
    if (headings.length < 2 || typeof IntersectionObserver === "undefined") {
      return;
    }

    const nodes = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((node): node is HTMLElement => node !== null);
    if (nodes.length === 0) {
      return;
    }

    const line = Math.round(getHeaderHeight()) + ACTIVE_HEADING_OFFSET_PX;
    const updateActiveHeading = () => {
      const reached = nodes.filter(
        (node) => node.getBoundingClientRect().top <= line + 1,
      );
      setActiveId(reached.at(-1)?.id ?? null);
    };

    const observer = new IntersectionObserver(updateActiveHeading, {
      rootMargin: `-${line}px 0px 0px 0px`,
      threshold: [0, 1],
    });
    nodes.forEach((node) => observer.observe(node));
    updateActiveHeading();

    return () => observer.disconnect();
  }, [headings]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setIsOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (headings.length < 2) {
    return null;
  }

  return (
    <nav
      className={`toc${isOpen ? " open" : ""}`}
      aria-label={t("ui.tableOfContents")}
      ref={containerRef}
      onBlur={(event) => {
        // Tabbing out of the panel closes it; moving inside it does not.
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        ref={triggerRef}
        className="toc-bubble"
        type="button"
        aria-label={t("ui.tableOfContents")}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <ListIcon />
      </button>
      <div className="toc-content" id={panelId}>
        <p className="toc-title">{t("ui.tableOfContents")}</p>
        <ul className="toc-list">
          {headings.map((heading) => (
            <li key={heading.id}>
              <a
                className="toc-link"
                href={`#${heading.id}`}
                aria-current={heading.id === activeId ? "location" : undefined}
                onClick={() => setIsOpen(false)}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
