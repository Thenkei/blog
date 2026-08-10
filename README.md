# Morgan's Blog

A React + TypeScript blog focused on engineering content, with a theme-driven visual system and polished motion design.

## Stack
- React 19
- TypeScript
- Vite 8
- React Router 7
- i18next (EN/FR)
- Vitest + Testing Library

## Run Locally

This repository uses **npm**. The committed `package-lock.json` is the source of truth; do not use Yarn for this project.

Node.js `24.19.0` LTS is pinned in `.nvmrc`. It includes the npm version declared in `package.json`.

```bash
nvm use
npm ci
npm run dev
```

Vite prints the local URL after startup, normally `http://localhost:5173/blog/`.

## Publishing an Article

Each article must have the same slug directory with both `en.mdx` and `fr.mdx`.
The MDX frontmatter drives whether the article is available in the application:

- `draft: true` keeps the article out of the listing, search, topic pages, and
  direct post resolution.
- Remove the `draft` field (or set it to `false`) in both locale files when the
  article is ready to publish.
- Keep `publishedAt` as the date displayed by the application and emitted in
  the generated RSS feed and sitemap.

Before opening the change, run `npm run check` and verify the new article in
both `/en` and `/fr`, including its direct `/posts/<slug>` route. The build
regenerates `public/rss.xml` and `public/sitemap.xml`; include those generated
changes when the publication set changes.

## Quality Gates
```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Design System (2026 Redesign)

The full art-direction reference is documented in [`ART_DIRECTION.md`](./ART_DIRECTION.md).

### Theme Model
The app uses four explicit themes:
- `light`
- `dark`
- `mountain`
- `rocket`

Theme state is managed in `/Users/sinkneath/github/blog/src/app/providers/ThemeProvider.tsx`.

Behavior:
- First visit derives initial theme from OS preference (`dark` or `light`)
- Explicit user choice is persisted in `localStorage.themeMode`
- Legacy values are migrated (`themeMode=system`, legacy `theme` key)

### Theme Tokens
All visual tokens live in `/Users/sinkneath/github/blog/src/styles/tokens.css`:
- colors, surfaces, borders, shadows
- typography tokens
- motion tokens (durations/easing)
- theme-specific hero/progress/switcher variables

### Motion Architecture
Animation primitives are centralized in `/Users/sinkneath/github/blog/src/styles/animations.css`.

Key points:
- shared keyframes and timing via tokens
- reduced motion support via `prefers-reduced-motion`
- no duplicated motion primitives across component styles

### Hero + Background System
Hero layering is implemented in `/Users/sinkneath/github/blog/src/shared/components/ParallaxHero.tsx` and `/Users/sinkneath/github/blog/src/styles/base.css`.

Design intent:
- `light` / `dark`: clean atmospheric depth, restrained decoration
- `mountain`: trail-focused environmental mood
- `rocket`: space/engineering mood with stronger glow/star treatment

### Mountain Multiplane Camera
The mountain homepage hero follows a complete trail journey from the foreground trailhead to the high pass.

Core architecture:
- a `100svh` sticky stage inside a bounded long-scroll shell (`100svh + clamp(760px, 120svh, 1400px)` on desktop)
- three SVG depth planes:
  - `mountain_camera_sky.svg` (alpine light and atmosphere)
  - `mountain_camera_far.svg` (snow-capped midground)
  - `mountain_camera_near.svg` (foreground terrain and trail bed)
- a vector route and runner overlay whose geometry follows the trail embedded in the foreground artwork
- one normalized scroll driver in `src/shared/components/parallax/useCinematicScroll.ts`, shared by both cinematic themes

Scene choreography:
- continuous, eased camera depth and atmosphere changes with no hard reveal threshold
- the route draws from the lower foreground to the pass while the runner advances along it
- summit light, typography, foreground clearance, and content handoff are coordinated over the full scroll range

Fallbacks:
- compact and portrait layouts keep a meaningful physical scrub distance and reframe the trail/pass
- `prefers-reduced-motion: reduce`: complete static poster with the route and destination visible

### Rocket Multiplane Camera
The rocket homepage hero presents a complete launch-to-arrival sequence with SVG layers and a viewport-relative trajectory.

Core architecture:
- the same bounded sticky-stage and normalized-scroll architecture as Mountain
- layered SVG scene:
  - `rocket_camera_space.svg` (nebula and multi-depth star field)
  - `rocket_camera_planet.svg` (ringed planet with front/back occlusion)
  - `rocket_camera_asteroids.svg` (three depth bands)
  - `rocket_camera_ship.svg` (detailed ship and unclipped exhaust)
- vector contrail and arrival marker overlays complete the trajectory

Scene choreography:
- the ship enters off-canvas, crosses the scene, boosts, and exits fully beyond the upper-right boundary at every supported width
- continuous title, planet, asteroid, exhaust, arrival, and content-handoff phases avoid the previous late-scene stall
- transform/opacity-driven motion keeps the full-screen layers compositor-friendly

Fallbacks:
- compact and portrait layouts use dedicated composition and trajectory values
- `prefers-reduced-motion: reduce`: complete static poster with a visible route and arrival state

### Reading Progress Variants
Implemented in `/Users/sinkneath/github/blog/src/features/reading/ReadingProgressBar.tsx` and `/Users/sinkneath/github/blog/src/styles/reading.css`.

Variants:
- `light` / `dark`: minimal clean rail + marker
- `mountain`: animated trail runner tied to article progress
- `rocket`: the canonical cinematic ship launches linearly from the viewport bottom while boost power changes independently; at `100%` it completes one orbit around the moon and parks above it

The Rocket variant uses a single `requestAnimationFrame`-coalesced scroll driver, preserves the article's direct progress-to-position mapping, and exposes semantic `progressbar` values. Reduced-motion mode keeps the completed orbital composition without time-based motion.

## UI Components Updated for Themes
- `/Users/sinkneath/github/blog/src/shared/components/ThemeSwitcher.tsx`
  - accessible appearance button opening a 4-option radio menu
- `/Users/sinkneath/github/blog/src/shared/components/PostVisual.tsx`
  - localized SVG system for card, header, and inline article diagrams
- `/Users/sinkneath/github/blog/src/shared/components/PostHeader.tsx`
- `/Users/sinkneath/github/blog/src/shared/components/ParallaxHero.tsx`
- `/Users/sinkneath/github/blog/src/features/posts/PostListPage.tsx`
- `/Users/sinkneath/github/blog/src/features/posts/PostPage.tsx`

## Internationalization
Locale files:
- `/Users/sinkneath/github/blog/src/i18n/locales/en.json`
- `/Users/sinkneath/github/blog/src/i18n/locales/fr.json`

Theme labels include `lightTheme`, `darkTheme`, `mountainTheme`, `rocketTheme`, and `themeSwitcher`.

## Testing Coverage
Relevant tests for the redesign:
- `/Users/sinkneath/github/blog/tests/integration/router-and-ux.test.tsx`
  - verifies 4-theme selector and persistence across navigation
- `/Users/sinkneath/github/blog/tests/unit/theme-provider.test.tsx`
  - theme initialization + migration behavior
- `/Users/sinkneath/github/blog/tests/unit/reading-progress-bar.test.tsx`
  - variant rendering, theme isolation, semantic progress, launch, and orbit behavior
- `/Users/sinkneath/github/blog/tests/unit/reading-progress-state.test.ts`
  - article mapping, linear Rocket travel, independent boost envelope, and completion threshold

Run all tests:
```bash
npm run test
```

## Post Image Workflow
When adding a new blog visual, place the source image under `src/assets/images/posts/` and generate responsive variants:

```bash
npm run optimize:image -- --input src/assets/images/posts/my-post-hero.png --widths 960,1600 --remove-source
```

The optimizer generates:
- `-960.avif`
- `-1600.avif`
- `-960.webp`
- `-1600.webp`
- `-1600.jpg` (fallback)

Use these in MDX with `<picture>` and `srcSet` so browsers download the smallest viable asset.
