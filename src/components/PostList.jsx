export default function PostList({
  posts,
  focusedIndex,
  postCardsRef,
  onSelectPost,
  t,
}) {
  return (
    <div className="post-list" key="post-list">
      <h2 style={{ marginTop: 0, marginBottom: "3rem" }}>
        {t("ui.latestPosts")}
      </h2>
      {posts.map((post, index) => (
        <div
          key={post.id}
          ref={(el) => (postCardsRef.current[index] = el)}
          className={`post-card ${focusedIndex === index ? "focused" : ""}`}
          onClick={() => onSelectPost(post)}
        >
          <div className="meta">
            <span>{post.date}</span>
            <span>•</span>
            <span>{t("ui.readTime", { count: parseInt(post.readTime) })}</span>
          </div>
          <h3>{post.title}</h3>
          <p style={{ color: "var(--text-secondary)" }}>{post.subtitle}</p>
          <div
            className="trail-line"
            style={{ width: "50px", margin: "1rem 0" }}
          />
        </div>
      ))}
    </div>
  );
}
