import TableOfContents from "./TableOfContents";
import ReadingProgressBar from "./ReadingProgressBar";

export default function PostArticle({
  currentPost,
  articleRef,
  onBackToList,
  onBackToTop,
  t,
}) {
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
