import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type {
  PostLocale,
  PostVisualId,
} from "../../features/posts/content";
import { isPostDiagramVisualId } from "../../features/posts/content";
import { LazyPostVisual as PostVisual } from "./LazyPostVisual";
import { PostEditorialArt, hasPostEditorialArt } from "./PostEditorialArt";

type PostHeaderProps = {
  backToHomeLabel: string;
  title: string;
  locale: PostLocale;
  slug: string;
  visualId?: PostVisualId | undefined;
  metaInfo: ReactNode;
  homeHref: string;
  headerPadRem: number;
};

export function PostHeader({
  backToHomeLabel,
  title,
  locale,
  slug,
  visualId,
  metaInfo,
  homeHref,
  headerPadRem,
}: PostHeaderProps) {
  const { t } = useTranslation();

  return (
    <header
      className="post-header"
      style={{ "--post-header-pad": `${headerPadRem}rem` } as CSSProperties}
    >
      <div className="post-header-inner">
        <nav className="breadcrumb" aria-label={t("ui.breadcrumb")}>
          <Link className="breadcrumb-link" to={homeHref}>
            ← {backToHomeLabel}
          </Link>
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
