import type { CSSProperties, ReactNode } from "react";
import type {
  PostLocale,
  PostVisualId,
} from "../../features/posts/content";
import { isPostDiagramVisualId } from "../../features/posts/content";
import { PostVisual } from "./PostVisual";
import { PostEditorialArt, hasPostEditorialArt } from "./PostEditorialArt";

type PostHeaderProps = {
  backToHomeLabel: string;
  title: string;
  locale: PostLocale;
  slug: string;
  visualId?: PostVisualId | undefined;
  metaInfo: ReactNode;
  onBreadcrumbClick: () => void;
  headerPadRem: number;
};

export function PostHeader({
  backToHomeLabel,
  title,
  locale,
  slug,
  visualId,
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

        <div className="post-header-grid">
          <div className="post-header-title">
            <h1 className="post-hero-title">{title}</h1>
            <div className="post-hero-subtitle">{metaInfo}</div>
          </div>
          {hasPostEditorialArt(slug) ? (
            <PostEditorialArt locale={locale} slug={slug} variant="header" />
          ) : (
            <PostVisual
              locale={locale}
              slug={slug}
              variant="header"
              visualId={
                visualId && isPostDiagramVisualId(visualId)
                  ? visualId
                  : undefined
              }
            />
          )}
        </div>
      </div>
    </header>
  );
}
