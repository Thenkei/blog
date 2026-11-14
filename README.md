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
- `visibility: rocket` publishes a personal transmission only inside the
  persisted Rocket theme. It stays out of public discovery, RSS, and the
  sitemap, and its direct route resolves only while Rocket is active.
- Omit `visibility` for a normal public article. English and French variants
  must share both visibility and draft status.
- Keep `publishedAt` as the date displayed by the application and emitted in
  the generated RSS feed and sitemap.
- A future `publishedAt` schedules the article. `npm run dev` shows it
  immediately; production hides it from every publication path until that
  day (UTC). The RSS feed and sitemap only list articles live at build time,
  so the deploy workflow also runs daily at 00:05 UTC to add scheduled
  articles on their date. Set `PUBLISH_DATE=YYYY-MM-DD` when running
  `npm run generate:static` to preview the feeds for another day. The rule
  lives in `src/features/posts/content/publication.ts`, shared by the app and
  the generator. Like Rocket visibility, scheduling hides an article from
  discovery; it does not keep its content out of the shipped bundle.
- Add an English and French three-beat sequence in
  `src/features/posts/motion/stories.ts`. The coverage test requires a sequence
  for every slug. Each beat should state a concrete step in the article's
  argument, not repeat the section heading.

Before opening the change, run `npm run check` and verify the new article in
both `/en` and `/fr`, including its direct `/posts/<slug>` route. The build
regenerates `public/rss.xml` and `public/sitemap.xml`; include those generated
changes when the publication set changes.

Rocket visibility is an interface and indexing boundary, not access control.
This is a static client application: MDX chunks still ship with the build and
can be inspected. Content requiring confidentiality needs a server-side
authorization boundary.

## Quality Gates
```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

The article motion uses Remotion's client-side Player. It loads only when the
figure enters the viewport, plays once, and offers replay and scrubbing. Narrow
screens use a vertical composition. Readers who request reduced motion see the
same three beats as a static figure. A failed Player load also falls back to
that figure, so the article text remains available.

## Design System (2026 Redesign)

The full art-direction reference is documented in [`ART_DIRECTION.md`](./ART_DIRECTION.md).

### Theme Model
The app uses four explicit themes:
- `light`
- `dark`
- `mountain`
- `rocket`

Theme state is managed in `src/app/providers/ThemeProvider.tsx`.

Behavior:
- First visit derives initial theme from OS preference (`dark` or `light`)
- Explicit user choice is persisted in `localStorage.themeMode`
- Legacy values are migrated (`themeMode=system`, legacy `theme` key)

### Theme Tokens
All visual tokens live in `src/styles/tokens.css`:
- colors, surfaces, borders, shadows
- typography tokens
- motion tokens (durations/easing)
- theme-specific hero/progress/switcher variables

### Motion Architecture
Animation primitives are centralized in `src/styles/animations.css`.

Key points:
- shared keyframes and timing via tokens
- reduced motion support via `prefers-reduced-motion`
- no duplicated motion primitives across component styles

### Hero + Background System
Hero layering is implemented in `src/shared/components/ParallaxHero.tsx` and `src/styles/base.css`.

Design intent:
- `light` / `dark`: clean atmospheric depth, restrained decoration
- `mountain`: trail-focused environmental mood
- `rocket`: space/engineering mood with stronger glow/star treatment

### Mountain Multiplane Camera
The mountain homepage hero is an alpine valley at first light, with one trail climbing from the foreground trailhead to a pass. Scrolling runs the trail and brings the sun up.

Core architecture:
- a `100svh` sticky stage inside a bounded long-scroll shell (`100svh + clamp(760px, 120svh, 1400px)` on desktop)
- three inline-SVG depth planes in `src/shared/components/parallax/MountainScene.tsx`:
  - sky (stars, dawn glow, sun, clouds)
  - far (two hazy ranges, the main massif with lit faces and snow, valley mist)
  - near (forested hill, the slope, the trail, the runner, foreground trees)
- one coordinate system for all three planes: a `1920 × 1080` scene fitted to the stage height and anchored bottom-right. The trail and the runner are drawn inside the near plane, so they stay on the slope whatever the camera or the aspect ratio does. Artwork continues past the left and bottom edges of the viewBox, so ultra-wide screens and upward camera travel never uncover an edge
- geometry (ridges, lit faces, snow, trees, trail) is generated by `scripts/generate-mountain-scene.mjs` from a few control points and committed as `mountainSceneGeometry.ts`; re-run the script to change the art
- one normalized scroll driver in `src/shared/components/parallax/useCinematicScroll.ts`, shared by both cinematic themes

Scene choreography (`useMultiplaneCamera.ts`):
- continuous, eased camera depth with no hard reveal threshold
- the runner follows the real trail path (`getPointAtLength`), faces the direction of travel on switchbacks and leans partly with the slope; the lit part of the route always ends at the runner
- `--mountain-dawn` goes from first light to sunrise: stars fade, the sun rises behind the pass, summits and the slope pick up warm light, the runner's headlamp goes out
- the title stays fully readable in open sky for the whole journey

Framing and fallbacks:
- compact and portrait layouts look at the right-hand part of the same scene under a taller sky; the run starts where the trail enters the frame
- `prefers-reduced-motion: reduce`: a complete static poster, mid-climb, with the whole route and the pass visible

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

### Editorial Cover Artwork

The blog uses two complementary visual languages:

- `PostEditorialArt` provides article-specific raster artwork for post-list cards,
  article headers, and Rocket Logbook cards. The current set uses polished,
  original editorial illustration, including manga-inspired, cartoon, pixel-art,
  sports, and pop-culture-adjacent visual language.
- `PostVisual` and `ArticleDiagram` remain the technical SVG system for figures
  inside the article body: architecture, protocols, workflows, security,
  reliability, and other concepts that require precise system relationships.

The cover image establishes one memorable focal idea related to the article. It
is not generic decoration and does not replace a technical explanation.
Editorial influences must remain original: do not copy recognizable characters,
logos, franchise assets, or legible text from an existing work.

### Article Motion and Meme Figures

`src/shared/components/ArticleMedia.tsx` provides localized, article-only SVG
figures for moments where time, pressure, repetition, or a handoff is the idea:

- SSE polling versus an open stream, plus reconnect storms;
- Redis memory pressure and backpressure propagation;
- debounce trigger storms;
- CI artifact reconciliation and AI code-review meme panels;
- the Product OS loop and document lifecycle.

These figures do not appear in post cards or headers. They use the same visual
tokens as the technical diagrams, include accessible `title`, `desc`, and
captions, and stop time-based animation under `prefers-reduced-motion`. The
meme-style figures are original compositions, not copied internet memes or
franchise imagery. Use `<ArticleMedia mediaId="..." />` only when motion adds
information or gives a dense section a deliberate pause.

### Rendered Films

`src/shared/components/ArticleVideo.tsx` embeds a rendered MP4 in an article:
`<ArticleVideo id="...">caption</ArticleVideo>`. Each film has one export and
one poster per locale under `src/assets/videos/posts/<article>/<name>.<locale>.mp4`
and `.jpg`, because its on-screen copy is part of the picture. The component
owns the id registry, the accessible title and a one-sentence description of
what happens on screen, shown in the caption for readers who do not play it.

The element uses `preload="none"`, so only the poster loads until the reader
presses play; it never autoplays. Keep films short, silent or meaningful when
muted, and around 720p. A film without a `sound` entry in the registry is
silent and marked muted. `sound: "music"` and `sound: "voice"` play with their
sound on. A film with a voice also needs a `<name>.<locale>.vtt` caption file
next to each MP4, offered as a captions track the reader turns on. They build into `assets/videos/`, which the service
worker neither precaches nor serves from cache: the `assets/posts/` cache does
not answer the range requests a video makes.

`src/shared/components/PostEditorialArt.tsx` owns the slug-to-artwork mapping,
localized alt text, responsive `<picture>` sources, and card/header behavior.
Mapped artwork is used by the standard post list, the Rocket Logbook, and the
article header. The mapping is deliberately separate from frontmatter so that
the editorial cover can evolve without changing the article content contract.
The current mapping covers all 29 post slugs; draft visibility rules still
control whether a prepared cover appears publicly.

For each mapped slug, the component expects these generated files in
`src/assets/images/posts/editorial/`:

- `<slug>-source-960.avif`
- `<slug>-source-1600.avif`
- `<slug>-source-960.webp`
- `<slug>-source-1600.webp`
- `<slug>-source-1600.jpg`

Cards use lazy loading and a compact crop; article headers use eager loading and
a wider crop. Every cover needs English and French alt text, and the same slug
must resolve in both locales. A draft article may have artwork prepared while
remaining absent from public discovery until its frontmatter is published.

### Reading Progress Variants
Implemented in `src/features/reading/ReadingProgressBar.tsx` and `src/styles/reading.css`.

Variants:
- `light` / `dark`: a thin line flush under the sticky header, with a small marker
- `mountain`: a small mountain in the right margin with a switchback trail; the hero's runner climbs it as the article is read and reaches the summit flag at `100%`. Below `1100px` wide it becomes the same thin line under the header, so the article keeps its full width
- `rocket`: the canonical cinematic ship launches linearly from the viewport bottom while boost power changes independently; lift-off emits expanding dust rings and particles, then at `100%` the ship enters a continuous orbit around the moon

The header is sticky, so the top variants hang from its bottom edge. `GlobalHeader` publishes its measured height as `--global-header-height`; anything pinned below the header should use that token rather than a fixed offset.

The Rocket variant uses a single `requestAnimationFrame`-coalesced scroll driver, preserves the article's direct progress-to-position mapping, and exposes semantic `progressbar` values. Engine power rises from a restrained lift-off to a late-flight peak before settling for approach. Launch particles replay only after the reader returns to the launch point; the completed orbit moves slowly across its upper arc and accelerates around the lower arc. Reduced-motion mode suppresses the burst and keeps the completed orbital composition without time-based motion.

## UI Components Updated for Themes
- `src/shared/components/ThemeSwitcher.tsx`
  - accessible appearance button opening a 4-option radio menu
- `src/shared/components/PostVisual.tsx`
  - localized technical SVG system for card, header, and inline article diagrams
- `src/shared/components/PostEditorialArt.tsx`
  - localized responsive editorial covers for cards and article headers
- `src/shared/components/ArticleMedia.tsx`
  - localized motion figures for article-only mechanisms and deliberate meme-style pauses
- `src/shared/components/PostHeader.tsx`
- `src/shared/components/ParallaxHero.tsx`
- `src/features/posts/PostListPage.tsx`
- `src/features/posts/PostPage.tsx`

## Navigation and Reading Behaviour

- **Scroll position** is owned by `src/app/useScrollManagement.ts`. A new page
  opens at the top; back, forward and reload return to where the reader was,
  once the lazy route is tall enough; filter changes, in-page anchors and a
  language switch keep the current position. Browser restoration is switched
  off because it runs before lazy content exists.
- **Unknown addresses** render `src/features/not-found/NotFoundPage.tsx`
  (`noindex`). An address without a locale (`/about`, `/posts/<slug>`) is
  redirected to the same page in the reader's language. A Rocket transmission
  opened outside Rocket still goes back to the listing.
- **Keyboard**: `j` / `k` move focus through the post cards and Enter opens the
  focused one. Arrow keys are not intercepted. A skip link is the first tab
  stop, and the table of contents is a button-driven disclosure (Escape and an
  outside click close it; hovering opens it with a mouse).
- **Links in articles** go through `src/app/mdxComponents.tsx`. Write links to
  another post as `../posts/<slug>`: they are routed inside the app in the
  active locale. External links open in a new tab.
- **Tables in articles** are wrapped in a scrollable region automatically, so a
  wide table never widens the page on a phone.
- **Article figures** (diagrams, motion scenes) are loaded on demand from
  `mdxComponents.tsx`; the home, topic and about pages do not download them.

## Typography

`src/styles/fonts.css` self-hosts the three families of the art direction
(Space Grotesk, Manrope, IBM Plex Mono) from the `@fontsource` packages, Latin
subsets only. Nothing is requested from a third party, and the service worker
precaches the files. The stacks in `tokens.css` list the system fallbacks shown
while a font loads.

## Internationalization
Locale files:
- `src/i18n/locales/en.json`
- `src/i18n/locales/fr.json`

Theme labels include `lightTheme`, `darkTheme`, `mountainTheme`, `rocketTheme`, and `themeSwitcher`.

`<html lang>` follows the locale in the URL. The saved theme is applied by a
small inline script in `index.html` before the first paint; keep its colour
map in sync with `--bg-color` in `tokens.css` and `THEME_COLORS` in
`ThemeProvider.tsx`.

## Testing Coverage
Relevant tests for the redesign:
- `tests/integration/router-and-ux.test.tsx`
  - verifies 4-theme selector and persistence across navigation
- `tests/unit/theme-provider.test.tsx`
  - theme initialization + migration behavior
- `tests/unit/reading-progress-bar.test.tsx`
  - variant rendering, theme isolation, semantic progress, launch, and orbit behavior
- `tests/unit/reading-progress-state.test.ts`
  - article mapping, linear Rocket travel, independent boost envelope, and completion threshold
- `tests/unit/post-editorial-art.test.tsx`
  - complete slug registration, localized alt text, responsive sources, loading behavior, and unknown-slug fallback
- `tests/unit/scroll-management.test.tsx`
  - top on a new page, restoration on back, untouched on filters and language switch
- `tests/unit/post-keyboard-navigation.test.tsx`
  - `j` / `k` focus movement, arrow keys and fields left alone
- `tests/unit/article-links.test.ts`
  - post links resolved to in-app routes, external links left to the browser

Run all tests:
```bash
npm run test
```

## Post Image Workflow

When adding editorial cover artwork, place the source image under
`src/assets/images/posts/editorial/`, using a `-source.png` suffix. Generate
responsive variants and remove the large source from the repository:

```bash
npm run optimize:image -- \
  --input src/assets/images/posts/editorial/my-post-slug-source.png \
  --widths 960,1600 \
  --remove-source
```

The optimizer generates:
- `-960.avif`
- `-1600.avif`
- `-960.webp`
- `-1600.webp`
- `-1600.jpg` (fallback)

`PostEditorialArt` consumes these files through Vite's eager asset glob. Add a
localized alt-text entry for the slug in
`src/shared/components/PostEditorialArt.tsx`; do not wire the generated image
directly into individual MDX files.

Use `PostVisual`/`ArticleDiagram` for precise technical SVGs that belong inside
the reasoning of an article. Keep the technical figure and the editorial cover
conceptually related, but do not force the cover to reproduce the diagram.
