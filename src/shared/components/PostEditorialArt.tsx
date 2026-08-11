import type { CSSProperties } from "react";
import type { PostLocale } from "../../features/posts/content";

export type PostEditorialArtVariant = "card" | "header";

type EditorialArtCopy = {
  alt: Record<PostLocale, string>;
  objectPosition?: string;
};

export type EditorialArtAsset = EditorialArtCopy & {
  slug: string;
  avif: { small: string; large: string };
  webp: { small: string; large: string };
  fallback: string;
};

const avifAssets = import.meta.glob<string>(
  "/src/assets/images/posts/editorial/*-source-*.avif",
  { eager: true, import: "default", query: "?url" },
);
const webpAssets = import.meta.glob<string>(
  "/src/assets/images/posts/editorial/*-source-*.webp",
  { eager: true, import: "default", query: "?url" },
);
const jpegAssets = import.meta.glob<string>(
  "/src/assets/images/posts/editorial/*-source-1600.jpg",
  { eager: true, import: "default", query: "?url" },
);

const EDITORIAL_ART_COPY: Record<string, EditorialArtCopy> = {
  "agent-battle-2026": {
    alt: {
      en: "Manga-inspired scene of an engineer choosing between three distinct routes for AI-assisted work.",
      fr: "Scène inspirée du manga montrant un ingénieur choisissant entre trois itinéraires pour un travail assisté par IA.",
    },
  },
  "ai-force-multiplier": {
    alt: {
      en: "Editorial illustration of an engineer directing several controlled workstreams across a layered technical landscape.",
      fr: "Illustration éditoriale d'un ingénieur dirigeant plusieurs flux de travail contrôlés dans un paysage technique en strates.",
    },
  },
  "ai-human-judgment-rockfi": {
    alt: {
      en: "Manga-inspired workshop scene of a team assembling a product system with a human review gate.",
      fr: "Scène d'atelier inspirée du manga montrant une équipe assemblant un système produit avec un point de revue humaine.",
    },
  },
  "architecture-sse-agent-communication": {
    alt: {
      en: "Editorial cutaway of a client sending an outbound heartbeat tunnel through a firewall to a control room.",
      fr: "Vue en coupe éditoriale d'un client envoyant un tunnel de heartbeat sortant à travers un pare-feu vers une salle de contrôle.",
    },
  },
  "backend-to-data-engineer-rockfi": {
    alt: {
      en: "Editorial bridge scene of an engineer moving from application services toward a layered data foundation.",
      fr: "Scène éditoriale d'un pont où un ingénieur passe des services applicatifs vers une fondation de données en strates.",
    },
  },
  "claude-code-product-os": {
    alt: {
      en: "Editorial relay scene showing humans and tools passing work through discovery, delivery, review, and release.",
      fr: "Scène éditoriale de relais montrant des humains et des outils faisant passer le travail par la découverte, la livraison, la revue et la mise en production.",
    },
  },
  "context-engineering-beyond-prompt-engineering": {
    alt: {
      en: "Editorial control room where curated documents and authorised signals pass through a narrow aperture to an agent.",
      fr: "Salle de contrôle éditoriale où des documents sélectionnés et des signaux autorisés passent par une ouverture étroite vers un agent.",
    },
  },
  "coros-apex-4": {
    alt: {
      en: "Sports-manga-inspired trail runner crossing a mountain route beside a rugged watch.",
      fr: "Coureur de trail inspiré du manga sportif franchissant une route de montagne avec une montre robuste.",
    },
  },
  "engineering-2026-ai-redefined-our-job": {
    alt: {
      en: "Comic illustration of an engineer redirecting many automated workstreams across a bounded construction site.",
      fr: "Illustration de bande dessinée montrant un ingénieur réorientant plusieurs flux automatisés dans un chantier délimité.",
    },
  },
  "engineering-documents-age-poorly": {
    alt: {
      en: "Editorial archive scene showing stale documents crumbling beside a maintained reference under review.",
      fr: "Scène d'archive éditoriale montrant des documents obsolètes qui s'effritent à côté d'une référence maintenue en revue.",
    },
  },
  "forest-admin-activity-logs-elasticsearch": {
    alt: {
      en: "Noir archive scene where an enormous stream of activity records becomes a searchable indexed landscape.",
      fr: "Scène d'archive en noir montrant un immense flux de journaux d'activité devenir un paysage indexé et consultable.",
    },
  },
  "heavencraft-first-systems": {
    alt: {
      en: "Pixel-art game world where a small server draws a growing community of players.",
      fr: "Monde de jeu en pixel art où un petit serveur attire une communauté grandissante de joueurs.",
    },
  },
  "idempotency-debounce-jobify-bullmq": {
    alt: {
      en: "Cartoon railway scene where duplicate job packets are merged into one canonical train by a timing gate.",
      fr: "Scène ferroviaire en cartoon où des paquets de jobs en double sont regroupés en un train canonique par une porte temporelle.",
    },
  },
  "jobify-workers-queues-nestjs": {
    alt: {
      en: "Editorial dispatch floor showing job packets moving through runner, worker, and export stations.",
      fr: "Salle d'expédition éditoriale montrant des paquets de jobs traversant des stations de runner, de worker et d'export.",
    },
  },
  "joining-rockfi": {
    alt: {
      en: "Editorial doorway scene of a new engineer entering a city of connected systems and foundations.",
      fr: "Scène éditoriale de seuil montrant un nouvel ingénieur entrant dans une ville de systèmes et de fondations connectés.",
    },
  },
  "nodejs-stream-backpressure-history-export": {
    alt: {
      en: "Technical comic showing a pressured data river passing through bounded gates into a multipart upload pipeline.",
      fr: "Bande dessinée technique montrant une rivière de données sous pression traversant des portes délimitées vers un pipeline d'upload multipart.",
    },
  },
  "polymagine-industry-4-eyewear-2017": {
    alt: {
      en: "Retro-futurist lab scene transforming a scanned face and eyewear mesh into a manufactured frame.",
      fr: "Scène de laboratoire rétrofuturiste transformant un visage scanné et un maillage de lunettes en monture fabriquée.",
    },
  },
  "postgresql-unique-nulls": {
    alt: {
      en: "Technical cartoon showing two nearly identical records separated by a blank nullable field at a uniqueness gate.",
      fr: "Cartoon technique montrant deux enregistrements presque identiques séparés par un champ nullable vide à une porte d'unicité.",
    },
  },
  "rebuilding-cloud-experience-forest-admin": {
    alt: {
      en: "Architectural illustration of a cloud city with a narrow gateway and a visible connection bottleneck.",
      fr: "Illustration architecturale d'une ville cloud avec une passerelle étroite et un goulot d'étranglement de connexion visible.",
    },
  },
  "redis-memory-exhaustion-post-mortem": {
    alt: {
      en: "Cartoon noir post-mortem scene of an overflowing memory vault and a pressure gauge in the red.",
      fr: "Scène de post-mortem en cartoon noir montrant un coffre mémoire débordant et une jauge dans le rouge.",
    },
  },
  "scaling-ci-github-actions-forest-admin": {
    alt: {
      en: "Comic factory scene splitting an overloaded test conveyor into parallel lanes before a finish line.",
      fr: "Scène d'usine en bande dessinée divisant un convoyeur de tests surchargé en voies parallèles avant la ligne d'arrivée.",
    },
  },
  "scim-user-provisioning-forest-admin": {
    alt: {
      en: "Cartoon identity checkpoint where varied documents are normalised before entering one organisation.",
      fr: "Point de contrôle d'identité en cartoon où des documents variés sont normalisés avant d'entrer dans une organisation.",
    },
  },
  "security-authentication-idp-openid-connect": {
    alt: {
      en: "Security illustration of a trusted identity token crossing a guarded bridge between two systems.",
      fr: "Illustration de sécurité montrant un jeton d'identité de confiance traversant un pont gardé entre deux systèmes.",
    },
  },
  "self-service-analytics-that-doesnt-lie": {
    alt: {
      en: "Editorial observatory where charts are connected to definitions, lineage roots, and a governance gate.",
      fr: "Observatoire éditorial où des graphiques sont reliés à des définitions, des racines de lignage et une porte de gouvernance.",
    },
  },
  "spacex-engineering-ambivalence": {
    alt: {
      en: "Split-tone editorial image of an impressive reusable launch vehicle beside a grounded engineering caution.",
      fr: "Image éditoriale en deux tons montrant un impressionnant lanceur réutilisable à côté d'une mise en garde d'ingénierie ancrée dans le réel.",
    },
  },
  "stars-volcanoes-childhood-curiosity": {
    alt: {
      en: "Storybook scene of a child looking between a star-filled sky and a volcanic landscape.",
      fr: "Scène de livre illustré montrant un enfant regardant entre un ciel étoilé et un paysage volcanique.",
    },
  },
  "the-onboarding-matrix-forest-admin": {
    alt: {
      en: "Comic maze scene where a functional path escapes a tangled branching onboarding matrix.",
      fr: "Scène de labyrinthe en bande dessinée où un chemin fonctionnel s'échappe d'une matrice d'onboarding ramifiée et enchevêtrée.",
    },
  },
  "trail-saint-jacques-100k-2026": {
    alt: {
      en: "Sports-manga endurance scene of a runner crossing a long night-to-dawn trail through aid stations toward a distant cathedral.",
      fr: "Scène d'endurance inspirée du manga sportif montrant un coureur traversant un long sentier de la nuit à l'aube, de ravitaillement en ravitaillement, vers une cathédrale lointaine.",
    },
  },
  "unknown-unknowns-software-architecture": {
    alt: {
      en: "Editorial expedition scene where engineers cross foggy architecture with ropes and visible safety checkpoints.",
      fr: "Scène d'expédition éditoriale où des ingénieurs traversent une architecture brumeuse avec des cordes et des points de contrôle de sécurité visibles.",
    },
  },
};

function findAsset(
  assets: Record<string, string>,
  filename: string,
): string | null {
  const entry = Object.entries(assets).find(([path]) => path.endsWith(filename));
  return entry?.[1] ?? null;
}

export function getPostEditorialArt(slug: string): EditorialArtAsset | null {
  const copy = EDITORIAL_ART_COPY[slug];
  if (!copy) {
    return null;
  }

  const avifSmall = findAsset(avifAssets, `${slug}-source-960.avif`);
  const avifLarge = findAsset(avifAssets, `${slug}-source-1600.avif`);
  const webpSmall = findAsset(webpAssets, `${slug}-source-960.webp`);
  const webpLarge = findAsset(webpAssets, `${slug}-source-1600.webp`);
  const fallback = findAsset(jpegAssets, `${slug}-source-1600.jpg`);

  if (!avifSmall || !avifLarge || !webpSmall || !webpLarge || !fallback) {
    return null;
  }

  return {
    ...copy,
    slug,
    avif: { small: avifSmall, large: avifLarge },
    webp: { small: webpSmall, large: webpLarge },
    fallback,
  };
}

export function hasPostEditorialArt(slug: string): boolean {
  return getPostEditorialArt(slug) !== null;
}

export function PostEditorialArt({
  locale,
  slug,
  variant,
}: {
  locale: PostLocale;
  slug: string;
  variant: PostEditorialArtVariant;
}) {
  const art = getPostEditorialArt(slug);
  if (!art) {
    return null;
  }

  const isCard = variant === "card";
  const sizes = isCard
    ? "(max-width: 900px) calc(100vw - 40px), 50vw"
    : "(max-width: 900px) calc(100vw - 40px), 40vw";

  return (
    <div
      className={`post-editorial-art post-editorial-art-${variant}`}
      data-editorial-art={art.slug}
      style={{
        "--editorial-art-position": art.objectPosition ?? "center",
      } as CSSProperties}
    >
      <picture>
        <source
          media="(min-width: 901px)"
          type="image/avif"
          srcSet={`${art.avif.large} 1600w`}
        />
        <source
          type="image/avif"
          srcSet={`${art.avif.small} 960w, ${art.avif.large} 1600w`}
        />
        <source
          media="(min-width: 901px)"
          type="image/webp"
          srcSet={`${art.webp.large} 1600w`}
        />
        <source
          type="image/webp"
          srcSet={`${art.webp.small} 960w, ${art.webp.large} 1600w`}
        />
        <img
          src={art.fallback}
          alt={art.alt[locale]}
          loading={isCard ? "lazy" : "eager"}
          decoding="async"
          sizes={sizes}
        />
      </picture>
    </div>
  );
}
