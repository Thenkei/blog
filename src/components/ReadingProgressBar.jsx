import { useEffect, useState } from "react";

function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const article = document.querySelector("article");
      const blogContent = document.querySelector(".blog-content");

      if (!article || !blogContent) {
        setProgress(0);
        return;
      }

      const windowHeight = window.innerHeight;
      const scrollTop = window.scrollY;

      // Get blog-content boundaries
      const contentTop = blogContent.offsetTop;
      const articleHeight = article.scrollHeight;

      // Calculate scroll position relative to when blog-content enters viewport
      const scrollIntoContent = scrollTop - contentTop + windowHeight;

      // Progress is based on how much of the article we've scrolled through
      const percentage = (scrollIntoContent / articleHeight) * 100;

      // Clamp between 0 and 100
      const clamped = Math.min(Math.max(percentage, 0), 100);
      setProgress(clamped);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress);
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return (
    <div className="reading-progress-bar" style={{ width: `${progress}%` }} />
  );
}

export default ReadingProgressBar;
