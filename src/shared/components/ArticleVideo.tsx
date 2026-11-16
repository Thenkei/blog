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
  "software-factory-film": {
    path: "software-factory/film",
    title: {
      en: "Short animated film: the Software Factory",
      fr: "Petit film d’animation : la Software Factory",
    },
    description: {
      en: "With voice, captions available, 29 seconds. An engineer answers his agents’ questions until he disappears under the bubbles. Then the main loop turns, two loops attach to it (production errors, customer feedback), and an orchestrator agent brings him three decisions to stamp. Music, and three short lines from the engineer.",
      fr: "Avec voix, sous-titres disponibles, 29 secondes. Un ingénieur répond aux questions de ses agents jusqu’à disparaître sous les bulles. Puis la boucle principale tourne, deux boucles s’y accrochent (erreurs de production, retours clients), et un agent orchestrateur lui apporte trois décisions à tamponner. Musique, et trois répliques courtes de l’ingénieur.",
    },
    sound: "voice",
  },
  "short-film-redis": {
    path: "short-films/redis/film",
    title: {
      en: "Short film: one Redis instance for everything",
      fr: "Petit film : une seule instance Redis pour tout",
    },
    description: {
      en: "With voice, captions available, 40 seconds. Behind an engineer at his desk, a small room stands on a shelf: one Redis instance. Four tenants move in: the cache, the job queues, the sessions and the anti brute-force guard. Week after week the cache box grows while, behind the engineer sipping his coffee, the memory graph climbs. One weekend, at night, the graph spikes and an unplugged alarm bell stays silent. The cache swells, fills the room and crushes its neighbours; the engineer grabs his head. Then the cache, the queues and the sessions each get their own instance. A torch finds dusty boxes left by deleted projects, a robot sweeps them out, the TTLs get shorter and the cache box is vacuum-packed. Music, sound effects, and four short lines from the engineer.",
      fr: "Avec voix, sous-titres disponibles, 40 secondes. Derrière un ingénieur à son bureau, une petite pièce est posée sur une étagère : une instance Redis. Quatre locataires y emménagent : le cache, les files de jobs, les sessions et l’anti brute-force. Semaine après semaine, la boîte du cache grossit pendant que, derrière l’ingénieur qui boit son café, la courbe de mémoire grimpe. Un week-end, la nuit, la courbe s’envole et une sonnette d’alarme débranchée reste muette. Le cache gonfle, remplit la pièce et écrase ses voisins ; l’ingénieur se prend la tête. Ensuite, le cache, les files et les sessions ont chacun leur instance. Une lampe torche éclaire des cartons poussiéreux laissés par des projets supprimés, un robot les balaie, les TTL raccourcissent et la boîte du cache est mise sous vide. Musique, bruitages, et quatre répliques courtes de l’ingénieur.",
    },
    sound: "voice",
  },
  "short-film-nulls": {
    path: "short-films/nulls/film",
    title: {
      en: "Short film: the doorman who can’t tell NULLs apart",
      fr: "Petit film : le portier qui ne reconnaît pas les NULL",
    },
    description: {
      en: "With voice, captions available, 37 seconds. A doorman robot guards the door of an archive room, under a plaque reading UNIQUE INDEX (isin, provider_product_reference). It catches a full duplicate and stamps it ON CONFLICT DO UPDATE, then lets in robots whose reference is NULL: a room fills with identical robots and the rows spill off the board. The engineer loses an hour at his desk. In close-up, the doorman holds up two identical cards: to it, NULL ≠ NULL. The plaque gets NULLS NOT DISTINCT, the next robots are stamped and their row updated instead of added, and the engineer leans back. Music, sound effects, and four short lines from the engineer.",
      fr: "Avec voix, sous-titres disponibles, 37 secondes. Un robot portier garde la porte d’une salle d’archives, sous une plaque UNIQUE INDEX (isin, provider_product_reference). Il reconnaît un doublon complet et le tamponne ON CONFLICT DO UPDATE, puis laisse entrer des robots dont la référence est NULL : une salle se remplit de robots identiques et les lignes débordent du tableau. L’ingénieur perd une heure à son bureau. En gros plan, le portier tient deux cartes identiques : pour lui, NULL ≠ NULL. La plaque reçoit NULLS NOT DISTINCT, les robots suivants sont tamponnés et leur ligne mise à jour au lieu d’être ajoutée, et l’ingénieur se renverse dans sa chaise. Musique, bruitages, et quatre répliques courtes de l’ingénieur.",
    },
    sound: "voice",
  },
  "short-film-ci": {
    path: "short-films/ci/film",
    title: {
      en: "Short film: a CI longer than lunch",
      fr: "Petit film : une CI plus longue que la pause déjeuner",
    },
    description: {
      en: "With voice, captions available, 39 seconds. An engineer starts his CI on one runner and goes to lunch; the build lamp stays amber while he eats, and he comes back with a napkin in his collar. The tests are split across ten robots and he looks pleased with himself. Then worker 7 trips over node_modules and every lamp turns red, a little ghost haunts test_chunk_5 and he chases it down an aisle with a butterfly net. A robot waits for all ten shards to stitch them into one LCOV report. A broom clears the traces, the stacks are dealt again and every lamp turns green. Music, sound effects, and four short lines from the engineer.",
      fr: "Avec voix, sous-titres disponibles, 39 secondes. Un ingénieur lance sa CI sur un seul runner et part déjeuner ; la lampe du build reste orange pendant qu’il mange, et il revient serviette au cou. Les tests sont répartis entre dix robots et il a l’air content de lui. Puis le worker 7 trébuche sur node_modules et toutes les lampes passent au rouge, un petit fantôme hante test_chunk_5 et il le poursuit dans une allée avec un filet à papillons. Un robot attend les dix morceaux pour les coudre en un rapport LCOV. Un balai efface les traces, les piles sont redistribuées et toutes les lampes passent au vert. Musique, bruitages, et quatre répliques courtes de l’ingénieur.",
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
