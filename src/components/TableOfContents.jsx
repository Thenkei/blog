import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

function TableOfContents({ articleRef }) {
  const [headings, setHeadings] = useState([]);
  const { t } = useTranslation();

  useEffect(() => {
    if (!articleRef.current) return;

    const h2Elements = articleRef.current.querySelectorAll("h2");
    const items = Array.from(h2Elements).map((h2, index) => {
      const text = h2.textContent;
      const id = `heading-${index}-${text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 30)}`;
      h2.id = id;
      return { id, text };
    });

    setHeadings(items);
  }, [articleRef]);

  if (headings.length < 2) return null;

  const handleClick = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav className="toc">
      <h4 className="toc-title">{t("ui.tableOfContents")}</h4>
      <ul className="toc-list">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              onClick={(e) => handleClick(e, heading.id)}
              className="toc-link"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default TableOfContents;
