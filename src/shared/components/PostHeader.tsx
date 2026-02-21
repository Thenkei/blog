import type { CSSProperties, ReactNode } from "react";

type PostHeaderProps = {
  backToHomeLabel: string;
  title: string;
  metaInfo: ReactNode;
  onBreadcrumbClick: () => void;
  headerPadRem: number;
};

export function PostHeader({
  backToHomeLabel,
  title,
  metaInfo,
  onBreadcrumbClick,
  headerPadRem,
}: PostHeaderProps) {
  return (
    <header
      className="post-header"
      style={{ "--post-header-pad": `${headerPadRem}rem` } as CSSProperties}
    >
      <div className="post-header-inner">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <button
            className="breadcrumb-link"
            onClick={onBreadcrumbClick}
            type="button"
          >
            ← {backToHomeLabel}
          </button>
        </nav>

        <div className="post-header-title">
          <h1 className="post-hero-title">{title}</h1>
          <div className="post-hero-subtitle">{metaInfo}</div>
        </div>
      </div>
    </header>
  );
}
