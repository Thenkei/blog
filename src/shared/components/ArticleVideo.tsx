import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { PostLocale } from "../../features/posts/content";
import { normalizeLocale } from "../routing";

// Rendered films embedded in an article: `<ArticleVideo id="…">caption</ArticleVideo>`.
// One MP4 and one poster per locale, because the on-screen copy is part of the film.
// A film with a voice also has one WebVTT caption file per locale, next to its MP4.
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
// `no-inline`: a caption file is a few kilobytes, under Vite's inline limit, and a
// `data:` URL is not a reliable `<track>` source. It must be emitted as a file.
const captionFiles = import.meta.glob<string>("/src/assets/videos/posts/**/*.vtt", {
  eager: true,
  import: "default",
  query: "?no-inline",
});

const CAPTIONS_LABEL: Record<PostLocale, string> = { en: "English", fr: "Français" };

type ArticleVideoCopy = {
  /** Folder and base name under `src/assets/videos/posts/`. */
  path: string;
  /** Accessible name of the film. */
  title: Record<PostLocale, string>;
  /** What happens on screen, for readers who do not play it. */
  description: Record<PostLocale, string>;
  /**
   * What the film's audio track carries. Omitted: the film is silent and marked muted.
   * With either value it starts with its sound on (it never autoplays, so the reader has
   * pressed play). `voice` also needs a `.vtt` caption file per locale; `music` has no
   * speech to caption.
   */
  sound?: "music" | "voice";
};

const ARTICLE_VIDEOS = {
  "video-factory-intro": {
    path: "video-factory/intro",
    title: {
      en: "Opening trailer: a video factory in a Git repository",
      fr: "Trailer d’ouverture : une fabrique de vidéos dans un dépôt Git",
    },
    description: {
      en: "Music, no voice, 29 seconds. Dark title cards ask who edits the film a feature needs, then three cards answer: the files of one video folder, the six agents, and what the tooling measures and leaves to a person.",
      fr: "Musique, sans voix, 29 secondes. Des cartons sombres demandent qui monte le film d’une fonctionnalité, puis trois cartes répondent : les fichiers d’un dossier de vidéo, les six agents, et ce que l’outil mesure ou laisse à une personne.",
    },
    sound: "music",
  },
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
      en: "Narrated, 60 seconds, with captions. A question, the files of one video folder, the six roles from story to review, then the checks the tooling runs and the two it leaves to a person.",
      fr: "Avec voix, 64 secondes, sous-titres disponibles. Une question, les fichiers d’un dossier de vidéo, les six rôles de l’histoire à la revue, puis les contrôles faits par l’outil et les deux qu’il laisse à une personne.",
    },
    sound: "voice",
  },
} as const satisfies Record<string, ArticleVideoCopy>;

export type ArticleVideoId = keyof typeof ARTICLE_VIDEOS;

export const articleVideoIds = Object.keys(ARTICLE_VIDEOS) as ArticleVideoId[];

export function getArticleVideo(id: ArticleVideoId, locale: PostLocale) {
  const video: ArticleVideoCopy = ARTICLE_VIDEOS[id];
  const base = `/src/assets/videos/posts/${video.path}.${locale}`;
  const src = videoFiles[`${base}.mp4`];
  const poster = posterFiles[`${base}.jpg`];
  const narrated = video.sound === "voice";
  const captions = narrated ? captionFiles[`${base}.vtt`] : undefined;

  if (!src || !poster) {
    throw new Error(`ArticleVideo: missing ${locale} media for "${id}"`);
  }

  if (narrated && !captions) {
    throw new Error(`ArticleVideo: missing ${locale} captions for narrated film "${id}"`);
  }

  return {
    src,
    poster,
    captions,
    muted: video.sound === undefined,
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
          remounts the element on a language switch, so the other export is loaded.
          Silent films are marked muted; one with music or a voice keeps its sound. */}
      <video
        key={video.src}
        controls
        muted={video.muted}
        playsInline
        preload="none"
        poster={video.poster}
        width={1280}
        height={720}
        aria-label={video.title}
      >
        <source src={video.src} type="video/mp4" />
        {/* Not `default`: the films already carry text, so the reader turns captions on. */}
        {video.captions ? (
          <track kind="captions" src={video.captions} srcLang={locale} label={CAPTIONS_LABEL[locale]} />
        ) : null}
      </video>
      <figcaption>
        {children ? <>{children} </> : null}
        <span className="article-video-description">{video.description}</span>
      </figcaption>
    </figure>
  );
}
