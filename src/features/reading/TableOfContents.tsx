import { useEffect, useState, type RefObject } from "react";
import { useTranslation } from "react-i18next";

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

export function TableOfContents({ articleRef, contentKey }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    const article = articleRef.current;
    if (!article) {
      setHeadings([]);
      return;
    }

    const headingNodes = Array.from(article.querySelectorAll("h2"));
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
  }, [articleRef, contentKey]);

  if (headings.length < 2) {
    return null;
  }

  return (
    <nav className="toc" aria-label={t("ui.tableOfContents")}>
      <h4 className="toc-title">{t("ui.tableOfContents")}</h4>
      <ul className="toc-list">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a className="toc-link" href={`#${heading.id}`}>
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
