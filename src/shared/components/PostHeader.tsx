import type { CSSProperties } from "react";

type PostHeaderProps = {
  backToHomeLabel: string;
  siteTitle: string;
  siteSubtitle: string;
  breadcrumbLabel: string;
  onTitleClick: () => void;
  onBreadcrumbClick: () => void;
  headerPadRem: number;
};

export function PostHeader({
  backToHomeLabel,
  siteTitle,
  siteSubtitle,
  breadcrumbLabel,
  onTitleClick,
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
            {backToHomeLabel}
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{breadcrumbLabel}</span>
        </nav>

        <div className="post-header-title">
          <h1 className="post-hero-title" onClick={onTitleClick}>
            {siteTitle}
          </h1>
          <p className="post-hero-subtitle">{siteSubtitle}</p>
        </div>
      </div>
    </header>
  );
}
