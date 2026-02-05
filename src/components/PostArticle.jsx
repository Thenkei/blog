import { useEffect } from "react";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import sql from "highlight.js/lib/languages/sql";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import TableOfContents from "./TableOfContents";
import ReadingProgressBar from "./ReadingProgressBar";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);

export default function PostArticle({
  currentPost,
  articleRef,
  onBackToList,
  onBackToTop,
  t,
}) {
  useEffect(() => {
    if (!articleRef?.current) return;

    const codeBlocks = articleRef.current.querySelectorAll("pre code");
    codeBlocks.forEach((block) => {
      block.removeAttribute("data-highlighted");
      hljs.highlightElement(block);
    });
  }, [articleRef, currentPost.id, currentPost.content]);

  return (
    <>
      <ReadingProgressBar articleRef={articleRef} />
      <article ref={articleRef} key={currentPost.id}>
        <button className="back-btn" onClick={onBackToList}>
          ← {t("ui.backToHome")}
        </button>
        <div className="meta">
          <span>{currentPost.date}</span>
          <span>•</span>
          <span>
            {t("ui.readTime", { count: parseInt(currentPost.readTime) })}
          </span>
        </div>

        <h1
          style={{
            fontSize: "3.5rem",
            marginBottom: "2rem",
            lineHeight: "1.1",
          }}
        >
          {currentPost.title}
        </h1>

        <div className="trail-line"></div>

        <TableOfContents articleRef={articleRef} />

        {currentPost.content}

        <div className="trail-line" style={{ marginTop: "4rem" }}></div>
        <button className="back-btn" onClick={onBackToTop}>
          ← {t("ui.backToHome")}
        </button>
      </article>
    </>
  );
}
