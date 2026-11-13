import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { PostLocale } from "../../features/posts/content";
import { normalizeLocale } from "../routing";

// Rendered films embedded in an article: `<ArticleVideo id="…">caption</ArticleVideo>`.
// One MP4 and one poster per locale, because the on-screen copy is part of the film.
// Files live outside `src/assets/images/posts/` on purpose: they build into
// `assets/videos/` (see vite.config.ts), which the service worker neither precaches
// nor serves from its CacheFirst route, since that route does not answer the range
// requests a video element makes.
const videoFiles = import.meta.glob<string>("/src/assets/videos/posts/**/*.mp4", {
  eager: true,
  import: "default",
  query: "?url",
});
const posterFiles = import.meta.glob<string>("/src/assets/videos/posts/**/*.jpg", {
  eager: true,
  import: "default",
  query: "?url",
});

type ArticleVideoCopy = {
  /** Folder and base name under `src/assets/videos/posts/`. */
  path: string;
  /** Accessible name of the film. */
  title: Record<PostLocale, string>;
  /** What happens on screen, for readers who do not play it. */
  description: Record<PostLocale, string>;
};

const ARTICLE_VIDEOS = {
  "video-factory-trailer": {
    path: "video-factory/trailer",
    title: {
      en: "Example trailer for a fictional race-plan app",
      fr: "Trailer d’exemple pour une application fictive de plan de course",
    },
    description: {
      en: "Silent, 21 seconds. Two dark title cards state the problem, the product name appears, two product details show a plan being recalculated, then a closing card.",
      fr: "Muet, 21 secondes. Deux cartons sombres posent le problème, le nom du produit apparaît, deux détails du produit montrent un plan recalculé, puis un carton de fin.",
    },
  },
  "video-factory-release": {
    path: "video-factory/release",
    title: {
      en: "Example release film with a simulated interface",
      fr: "Film de release d’exemple avec une interface simulée",
    },
    description: {
      en: "Silent, 25 seconds. A title card, then a simulated app window: a cursor types an actual passage time and the following times and margins are recalculated.",
      fr: "Muet, 25 secondes. Un carton titre, puis une fenêtre d’application simulée : un curseur saisit une heure de passage réelle, les heures suivantes et les marges se recalculent.",
    },
  },
  "video-factory-explainer": {
    path: "video-factory/explainer",
    title: {
      en: "Example explainer: how a brief becomes a film",
      fr: "Vidéo explicative d’exemple : comment un brief devient un film",
    },
    description: {
      en: "Silent, 33 seconds. A question, the files of one video folder, the six roles from story to review, then the checks the tooling runs and the two it leaves to a person.",
      fr: "Muet, 33 secondes. Une question, les fichiers d’un dossier de vidéo, les six rôles de l’histoire à la revue, puis les contrôles faits par l’outil et les deux qu’il laisse à une personne.",
    },
  },
} as const satisfies Record<string, ArticleVideoCopy>;

export type ArticleVideoId = keyof typeof ARTICLE_VIDEOS;

export const articleVideoIds = Object.keys(ARTICLE_VIDEOS) as ArticleVideoId[];

export function getArticleVideo(id: ArticleVideoId, locale: PostLocale) {
  const video = ARTICLE_VIDEOS[id];
  const base = `/src/assets/videos/posts/${video.path}.${locale}`;
  const src = videoFiles[`${base}.mp4`];
  const poster = posterFiles[`${base}.jpg`];

  if (!src || !poster) {
    throw new Error(`ArticleVideo: missing ${locale} media for "${id}"`);
  }

  return {
    src,
    poster,
    title: video.title[locale],
    description: video.description[locale],
  };
}

export function ArticleVideo({ id, children }: { id: ArticleVideoId; children?: ReactNode }) {
  const { i18n } = useTranslation();
  const locale = normalizeLocale(i18n.resolvedLanguage ?? i18n.language);
  const video = getArticleVideo(id, locale);

  return (
    <figure className="post-visual article-video" aria-label={video.title} data-article-video={id}>
      {/* `preload="none"`: the poster is enough until the reader presses play. The key
          remounts the element on a language switch, so the other export is loaded. */}
      <video
        key={video.src}
        controls
        muted
        playsInline
        preload="none"
        poster={video.poster}
        width={1280}
        height={720}
        aria-label={video.title}
      >
        <source src={video.src} type="video/mp4" />
      </video>
      <figcaption>
        {children ? <>{children} </> : null}
        <span className="article-video-description">{video.description}</span>
      </figcaption>
    </figure>
  );
}
