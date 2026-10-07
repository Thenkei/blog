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
  "websockets-games-to-30000-connections": {
    alt: {
      en: "An illustrated home desk with a card game and dice, connected by luminous traces to a server room and many distant browser windows.",
      fr: "Un bureau illustré avec un jeu de cartes et des dés, relié par des tracés lumineux à une salle de serveurs et de nombreuses fenêtres de navigateur au loin.",
    },
  },
  "agent-battle-2026": {
    alt: {
      en: "Manga-inspired scene of an engineer choosing between three distinct routes for AI-assisted work.",
      fr: "Scène inspirée du manga montrant un ingénieur choisissant entre trois itinéraires pour un travail assisté par IA.",
    },
  },
  "frontier-model-race-2026": {
    alt: {
      en: "Editorial technical landscape where several luminous model routes converge toward a shifting frontier while an engineer observes from the map edge.",
      fr: "Paysage technique éditorial où plusieurs trajectoires lumineuses de modèles convergent vers une frontière mouvante tandis qu'un ingénieur observe depuis le bord de la carte.",
    },
  },
  "ai-force-multiplier": {
    alt: {
      en: "Editorial illustration of an engineer directing several controlled workstreams across a layered technical landscape.",
      fr: "Illustration éditoriale d'un ingénieur dirigeant plusieurs flux de travail contrôlés dans un paysage technique en strates.",
    },
  },
  "ai-is-not-immaterial": {
    alt: {
      en: "Editorial Earth seen from orbit, split between mining scars and a growing shell of data centres, chips, and power infrastructure.",
      fr: "Terre éditoriale vue depuis l'orbite, partagée entre les cicatrices des mines et une coque croissante de data centers, de puces et d'infrastructures électriques.",
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
  "better-handoffs-ai-engineering": {
    alt: {
      en: "Editorial control-room scene where several small agents pass a luminous investigation dossier through a human review gate to an engineer.",
      fr: "Scène de salle de contrôle éditoriale où plusieurs petits agents transmettent un dossier d'investigation lumineux à travers un point de revue humaine vers un ingénieur.",
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
  "data-platform-ingestion-drift": {
    alt: {
      en: "Painted architectural cutaway where varied records collect in a raw layer and a slotted gate stops a malformed tile before a refined terrace.",
      fr: "Coupe architecturale peinte où des enregistrements variés s'accumulent dans une couche brute et une grille arrête un élément mal formé avant une terrasse raffinée.",
    },
  },
  "data-platform-reverse-etl-freshness": {
    alt: {
      en: "Painted cutaway of a data route passing several clocks toward an application screen, with an older tile diverted into a separate branch.",
      fr: "Vue en coupe peinte d'un flux de données traversant plusieurs horloges vers un écran applicatif, avec un élément ancien dévié vers une branche séparée.",
    },
  },
  "data-platform-tests-as-contracts": {
    alt: {
      en: "Painted testing station where a lowered barrier stops a cracked record beneath a reconciliation balance while a complete set remains sheltered above.",
      fr: "Station de contrôle peinte où une barrière abaissée arrête un enregistrement fissuré sous une balance de réconciliation tandis qu'un ensemble complet reste protégé en hauteur.",
    },
  },
  "data-platform-terraform-access-and-flows": {
    alt: {
      en: "Painted architectural section connecting a declared role graph to physical access doors, with a closed coral branch and a protected key compartment.",
      fr: "Coupe architecturale peinte reliant un graphe de rôles déclaré à des portes d'accès, avec une branche corail fermée et un compartiment à clé protégé.",
    },
  },
  "data-platform-retrospective": {
    alt: {
      en: "An engineer studies five exposed platform modules joined by coral coupling plates, crossed by a teal flow beneath a separate control pavilion.",
      fr: "Un ingénieur observe cinq modules de plateforme en coupe reliés par des plaques corail et traversés par un flux turquoise sous un pavillon de contrôle séparé.",
    },
  },
  "engineer-life-late-2026": {
    alt: {
      en: "Comic illustration of an engineer at a terminal surrounded by code, a release announcement, milestone cards, and feedback, with a neglected coffee mug on the desk.",
      fr: "Illustration de bande dessinée montrant un ingénieur devant son terminal, entouré de code, d'une annonce de release, de jalons et de retours, avec une tasse de café oubliée sur le bureau.",
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
  "internal-tools-are-a-product": {
    alt: {
      en: "Disconnected back-office screens converge on a central engine and a unified operations workspace.",
      fr: "Des écrans de back office disparates convergent vers un moteur central et un espace de travail unifié.",
    },
  },
  "internal-tools-built-with-agents": {
    alt: {
      en: "Abstract code modules surround a governed engine while an engineer reviews a gradual rollout.",
      fr: "Des modules de code abstraits entourent un moteur gouverné tandis qu'une ingénieure vérifie un déploiement progressif.",
    },
  },
  "internal-tools-consistency-by-default": {
    alt: {
      en: "Three operations workspaces share a central kit of consistent interface components.",
      fr: "Trois espaces de travail opérationnels partagent un kit central de composants d'interface cohérents.",
    },
  },
  "internal-tools-core-engine": {
    alt: {
      en: "A central engine connects read-only database replicas and a separate route through service gates.",
      fr: "Un moteur central relie des réplicas de lecture à un chemin distinct passant par les services.",
    },
  },
  "internal-tools-governance-by-construction": {
    alt: {
      en: "A guarded data stream passes through a masking screen while an audit trail enters an archive below.",
      fr: "Un flux de données traverse un écran de masquage tandis qu'une trace d'audit rejoint une archive en contrebas.",
    },
  },
  "internal-tools-query-language": {
    alt: {
      en: "One query route crosses several data islands in batches before reaching a single result.",
      fr: "Une route de requête traverse plusieurs îlots de données par lots avant d'atteindre un résultat unique.",
    },
  },
  "internal-tools-still-believe": {
    alt: {
      en: "A workshop fades into dusk while a small amber light in its central engine still illuminates a route into the darkness.",
      fr: "Un atelier s'efface dans le crépuscule tandis qu'une petite lumière ambrée dans son moteur central éclaire encore un chemin dans l'obscurité.",
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
