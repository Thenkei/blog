# Morgan's Blog

A React + TypeScript blog focused on engineering content, with a theme-driven visual system and polished motion design.

## Stack
- React 19
- TypeScript
- Vite 6
- React Router 7
- i18next (EN/FR)
- Vitest + Testing Library

## Run Locally
```bash
npm install
npm run dev
```

## Quality Gates
```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Design System (2026 Redesign)

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
The mountain homepage hero uses a dedicated multiplane camera path inspired by theatrical staged depth.

Core architecture:
- sticky camera shell (`~240vh`) with a sticky stage viewport (`100vh`)
- three SVG depth planes:
  - `mountain_camera_sky.svg` (background, ~`0.1x` speed)
  - `mountain_camera_far.svg` (midground, ~`0.3x` speed)
  - `mountain_camera_near.svg` (foreground/trail, `0.8x` baseline with late boost toward `1.0x`)
- progress timeline and CSS vars are driven by `/Users/sinkneath/github/blog/src/shared/components/parallax/useMultiplaneCamera.ts` using `requestAnimationFrame` and passive scroll listeners

Scene choreography:
- near-plane horizontal drift and scale for running/flying sensation
- atmospheric shift tied to camera progress
- reveal threshold at `progress >= 0.78`, toggling `.mountain-camera-clearance` to lift/fade foreground and expose content

Fallbacks:
- mobile (`<=720px`): reduced amplitudes and shorter timeline intensity
- `prefers-reduced-motion: reduce`: static composition, no camera choreography

### Rocket Multiplane Camera
The rocket homepage hero uses a separate sticky multiplane camera with SVG layers and a trajectory-driven ship pass.

Core architecture:
- sticky camera shell (`~240vh`) with a sticky stage viewport (`100vh`)
- layered SVG scene:
  - `rocket_camera_space.svg` (deep space background, ~`0.1x`)
  - `rocket_camera_planet.svg` (planet/rings midground, ~`0.3x`)
  - `rocket_camera_asteroids.svg` (foreground asteroid field, `0.82x` baseline with late boost toward `1.0x`)
  - `rocket_camera_ship.svg` (ship element on animated trajectory)
- progress timeline and CSS vars are driven by `/Users/sinkneath/github/blog/src/shared/components/parallax/useRocketCamera.ts` via `requestAnimationFrame` + passive scroll listeners

Scene choreography:
- rocket crosses the scene on a curved path while rotating through the pass
- asteroid drift adds lateral depth against vertical camera motion
- reveal threshold at `progress >= 0.8` toggles `.rocket-camera-clearance` to fade foreground/ship and hand off to content

Fallbacks:
- mobile (`<=720px`): reduced travel, reduced drift amplitudes, smaller ship footprint
- `prefers-reduced-motion: reduce`: static layered scene with no camera choreography

### Reading Progress Variants
Implemented in `/Users/sinkneath/github/blog/src/features/reading/ReadingProgressBar.tsx` and `/Users/sinkneath/github/blog/src/styles/reading.css`.

Variants:
- `light` / `dark`: minimal clean rail + marker
- `mountain`: runner + trail checkpoints + altitude badge
- `rocket`: telemetry rail + rocket + orbit completion state

## UI Components Updated for Themes
- `/Users/sinkneath/github/blog/src/shared/components/ThemeSwitcher.tsx`
  - segmented 4-option selector with radio semantics
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
  - variant rendering and state behavior

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
