import { lazy, type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { normalizeLocale } from "../shared/routing";

// Article figures bring the diagram system and the motion runtime with them,
// several hundred kilobytes that only an article with a figure needs. Loading
// them on demand keeps them out of the home, topic and about pages. They
// suspend into the boundary PostPage already has around the article body, so
// an article still appears in one piece.
const figureModules = {
  postVisual: () => import("../shared/components/PostVisual"),
  articleMedia: () => import("../shared/components/ArticleMedia"),
  inlineArticleDiagram: () => import("../shared/components/InlineArticleDiagram"),
  imageMotionFigure: () => import("../shared/components/ImageMotionFigure"),
  conceptMotionFigure: () => import("../shared/components/ConceptMotionFigure"),
  motionScene: () => import("../shared/components/MotionScene"),
  articleVideo: () => import("../shared/components/ArticleVideo"),
};

const ArticleDiagram = lazy(() =>
  figureModules.postVisual().then((module) => ({ default: module.ArticleDiagram })),
);
const ArticleMedia = lazy(() =>
  figureModules.articleMedia().then((module) => ({ default: module.ArticleMedia })),
);
const InlineArticleDiagram = lazy(() =>
  figureModules
    .inlineArticleDiagram()
    .then((module) => ({ default: module.InlineArticleDiagram })),
);
const ImageMotionFigure = lazy(() =>
  figureModules
    .imageMotionFigure()
    .then((module) => ({ default: module.ImageMotionFigure })),
);
const ConceptMotionFigure = lazy(() =>
  figureModules
    .conceptMotionFigure()
    .then((module) => ({ default: module.ConceptMotionFigure })),
);
const MotionScene = lazy(() =>
  figureModules.motionScene().then((module) => ({ default: module.MotionScene })),
);

const ArticleVideo = lazy(() =>
  figureModules.articleVideo().then((module) => ({ default: module.ArticleVideo })),
);

/** Fetches every figure module ahead of the first article render. */
export function preloadArticleFigures(): Promise<unknown> {
  return Promise.all(Object.values(figureModules).map((load) => load()));
}

const EXTERNAL_LINK_PATTERN = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;
// Posts reference each other as "../posts/<slug>" or "/posts/<slug>". Neither
// form knows the active locale, and the absolute one escapes the "/blog/" base.
const POST_LINK_PATTERN = /^(?:\.\.?\/|\/)?posts\/([a-z0-9-]+)\/?(#.*)?$/i;

/**
 * Resolves an in-article link to the route it should open inside the app, or
 * `null` when the browser should handle it (external URL, in-page anchor).
 */
export function resolveArticleLink(
  href: string | undefined,
  locale: string,
): string | null {
  if (!href || href.startsWith("#") || EXTERNAL_LINK_PATTERN.test(href)) {
    return null;
  }

  const postLink = POST_LINK_PATTERN.exec(href);
  if (!postLink) {
    return null;
  }

  const [, slug, hash = ""] = postLink;
  return `/${locale}/posts/${slug}${hash}`;
}

function ArticleLink({ href, children, ...props }: ComponentProps<"a">) {
  const params = useParams();
  const internalRoute = resolveArticleLink(href, normalizeLocale(params.locale));

  if (internalRoute) {
    return (
      <Link {...props} to={internalRoute}>
        {children}
      </Link>
    );
  }

  const isExternal = Boolean(href && /^(?:https?:)?\/\//i.test(href));
  return (
    <a
      {...props}
      href={href}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

/**
 * A table sizes itself to its content, so a few long cells push the whole page
 * sideways on a phone. The wrapper scrolls instead; it is a focusable, named
 * region so the overflow is reachable from the keyboard.
 */
function ArticleTable(props: ComponentProps<"table">) {
  const { t } = useTranslation();

  return (
    <div
      className="article-table-wrap"
      role="region"
      aria-label={t("ui.scrollableTable")}
      tabIndex={0}
    >
      <table {...props} />
    </div>
  );
}

export const mdxComponents = {
  a: ArticleLink,
  table: ArticleTable,
  img: (props: ComponentProps<"img">) => (
    <img loading="lazy" decoding="async" {...props} />
  ),
  picture: (props: ComponentProps<"picture">) => <picture {...props} />,
  ArticleDiagram,
  ArticleMedia,
  InlineArticleDiagram,
  ImageMotionFigure,
  ConceptMotionFigure,
  MotionScene,
  ArticleVideo,
};
