import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PostLocale } from "../../features/posts/content";
import { normalizeLocale } from "../routing";

// Playable games embedded in an article: `<ArticleGame id="…" />`.
// The frame source comes from this allow-list, never from the MDX, so an article
// cannot embed an arbitrary page. The game only loads once the reader presses play:
// it brings its own bundle, audio context and service worker, none of which a reader
// who only scrolls past should pay for.

type ArticleGameCopy = {
  /** Page that runs the game. */
  src: string;
  /** Accessible name of the frame. */
  title: Record<PostLocale, string>;
  /** How to play, shown under the frame. */
  description: Record<PostLocale, string>;
};

const ARTICLE_GAMES = {
  jokarikara: {
    src: "https://thenkei.github.io/jokarikara/",
    title: {
      en: "Jokarikara, playable in the article",
      fr: "Jokarikara, jouable dans l’article",
    },
    description: {
      en: "Tap or click to place the growing shape inside the previous one. Crossing the boundary ends the run.",
      fr: "Touchez ou cliquez pour placer la forme qui grandit dans la précédente. Dépasser le contour met fin à la partie.",
    },
  },
} as const satisfies Record<string, ArticleGameCopy>;

export type ArticleGameId = keyof typeof ARTICLE_GAMES;

export const articleGameIds = Object.keys(ARTICLE_GAMES) as ArticleGameId[];

export function getArticleGame(id: ArticleGameId, locale: PostLocale) {
  const game: ArticleGameCopy = ARTICLE_GAMES[id];

  return {
    src: game.src,
    title: game.title[locale],
    description: game.description[locale],
  };
}

export function ArticleGame({ id }: { id: ArticleGameId }) {
  const { t, i18n } = useTranslation();
  const locale = normalizeLocale(i18n.resolvedLanguage ?? i18n.language);
  const game = getArticleGame(id, locale);
  const [playing, setPlaying] = useState(false);

  return (
    <figure className="post-visual article-game" aria-label={game.title} data-article-game={id}>
      <div className="article-game-stage">
        {playing ? (
          <iframe
            src={game.src}
            title={game.title}
            // Scripts for the game, same-origin for its storage and service worker.
            sandbox="allow-scripts allow-same-origin"
            allow="autoplay; fullscreen"
            referrerPolicy="no-referrer"
          />
        ) : (
          <button type="button" className="article-game-play" onClick={() => setPlaying(true)}>
            {t("ui.playGame")}
          </button>
        )}
      </div>
      <figcaption>
        <span className="article-game-description">{game.description}</span>{" "}
        <a href={game.src} target="_blank" rel="noopener noreferrer">
          {t("ui.openGameInNewTab")}
        </a>
      </figcaption>
    </figure>
  );
}
