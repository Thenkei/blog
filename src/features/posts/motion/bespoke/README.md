# Bespoke article scenes

A bespoke scene is a short Remotion explainer (8–20 s) that makes **one precise
mechanism of one article** visible: the bug, the protocol exchange, the queue
collapsing, the decision boundary. It replaces the generic three-stage
storyboard for that figure.

Reference implementation: `scenes/postgresql-unique-nulls.tsx`.

## Wiring

- One file per scene: `scenes/<figure-id>.tsx`, `export default defineScene({...})`.
  The file name is the id. It is picked up by `registry.ts` via `import.meta.glob`
  and becomes its own lazily loaded chunk.
- Existing MDX figures switch automatically when a scene file matches their id:
  `<ArticleDiagram visualId>`, `<ArticleMedia mediaId>`, `<InlineArticleDiagram assetId>`,
  `<ConceptMotionFigure assetId>`, `<ImageMotionFigure assetId>`.
- New pin-point figures go anywhere in an article with `<MotionScene id="<figure-id>" />`
  (optional children become the figcaption). Place it at the **same semantic spot in
  `en.mdx` and `fr.mdx`**.

## Contract

- `Stage` is a pure function of `frame` (30 fps). No `useCurrentFrame`, no timers,
  no randomness without a fixed seed: the same function draws the static poster at
  `posterFrame` (reduced motion, print, before the player loads).
- Two canvases, both must be designed: wide `960×420` and compact `540×520` (phones).
  Compact is usually a vertical re-flow, not a scaled-down wide layout. Keep the
  top-left ~48 px free for the kicker (the scene title).
- Minimum text size: 13 px in stage units for labels, 15–16 px for anything the reader
  must read. Mono for measurements, code, verdicts; display font for actors.
- Colours only through `TONE` / `tint()` / `--scene-*` tokens; never `var(--accent-secondary)`
  for success (it equals `hot` in mountain and rocket), use `TONE.ok`. Semantics from
  `ART_DIRECTION.md`: `line` normal step, `ok` correct outcome, `hot` checkpoint /
  boundary / human decision, `danger` failure or escalation. Never convey meaning by
  colour alone: pair it with a word, glyph (✓ ✗ ≠ ≡) or shape.
- `beats` are the narration strip, 3–6 lines, each `{ at, text: { en, fr } }`. Each beat
  says what the reader is seeing *now*, in the article's own vocabulary and facts. The
  beat list is also the accessible text alternative, so together they must tell the
  whole story without the picture. Budget: ≤ 110 characters per beat (French
  included), otherwise the compact narration strip overflows. Use a no-break space
  before French `: ; ? !` (escape it as `\u00a0` inside template literals: ESLint
  rejects a literal one there).
- `title` (short, kicker) and `caption` (one or two sentences, the takeaway) in both
  locales. MDX children passed to asset figures override the caption.
- Every on-stage word is localized (`locale` prop) except code, identifiers and
  protocol names.
- Motion has meaning: something moves because data, time, pressure or responsibility
  moves in the article. Prefer one main direction per scene, a before/after or a replay
  of the same input under a changed rule. Hold the final state ≥ 2 s.
- Facts come from the article. Do not invent numbers, products or claims.

## Design language

The bar is an editorial explainer (think Stripe, Linear, Vercel launch videos), not
a whiteboard wireframe. Reference: `scenes/postgresql-unique-nulls.tsx`.

- **Surfaces, not outlines.** Actors are `Box` cards (raised, soft shadow, tone carried
  by a hairline edge and a top wash). Regions are `Boundary` or `Box variant="ghost"`.
  Never draw your own `<rect stroke=… strokeWidth={2}>` for an actor or panel.
- **Hairlines.** Structural lines are 1–1.5 px in `var(--scene-hairline)`; only the
  path that matters right now gets tone and 2 px. Avoid thick strokes (> 2.5 px).
- **Chips over labels.** Verdicts, measurements and states are `Tag`s; section
  titles inside a card are 11 px mono `caps` in `muted`.
- **Hierarchy through restraint.** At any moment one thing is in tone at full
  strength; the rest is neutral or `dim()`-med. Colour is an event, not decoration.
- **Code is an editor.** Use `CodeBlock` (dark editor panel in every theme, syntax
  colouring, typing caret). Title = a real-looking file name or context, as written.
- **Space.** 40 px outer margin wide, 20 px compact; 16–24 px gutters; align to a
  simple column grid. Leave air: a sparse, well-aligned stage reads as expensive.
- **Theme personality is automatic.** `Backdrop` draws paper / console / contours /
  stars per theme and the CSS tunes shadows and glow. Scenes use only `TONE`, `tint()`
  and the `--scene-*` tokens (`--scene-card`, `--scene-hairline`, `--scene-ink`,
  `--scene-ink-soft`); never `--surface-raised`, `--divider` or hex colours.
  For a playful per-theme touch, wrap purely decorative extras in
  `className="scene-only-light|dark|mountain|rocket"` (e.g. a summit flag in mountain,
  an orbit trail in rocket). Information must never live in a single theme.

## Motion language

- **Entrances**: `enter(frame, at)` / `<Enter>` (expo-out rise + fade, 18 f). Cascade
  siblings with `stagger(i, start, 4–6)`. Nothing pops in at full opacity on one frame.
- **Moves between states**: `ease()` (in-out). **Reveals / arrivals**: `easeOut()`.
  **Verdicts**: `pop()` spring on the chip or glyph, once.
- **Things travel**: data is a `Comet` along a path, a record is a card that flies to
  its destination (see the ghost row in the reference), a link carrying traffic is a
  `Wire` with `flow={frame}`. Prefer showing the object moving over an arrow appearing.
- **Attention**: `focus` on the deciding actor, `dim()` on the rest, `Pulse` once where
  something just happened. `Camera` only for slow drifts (zoom ≤ 1.06, it is clamped to
  the stage); never crop content to create emphasis.
- **Numbers count**: `Counter`, `Meter` fill with `easeOut`; thresholds via `Meter limit`.
- **Rhythm**: 3–6 beats, each with one clear action; 10–20 frames of overlap between
  an exit and the next entrance; hold the final state ≥ 2 s. Replays (before/after)
  should reuse the exact same positions so the change is the only thing that moves.

## Toolkit (`primitives.tsx`)

Timing: `ease` (Infinity-safe), `easeOut`, `pop`, `during`, `stagger`, `lerp`, `along`,
`curve` (quadratic Bézier), `hash` (seeded noise). Layout: `textWidth`, `tagWidth`.
Choreography: `enter`/`Enter` (pass extra fades as its `opacity` option: it owns the
group's opacity), `Camera`, `dim`, `Flight` (a chip/record flying to its destination). Type: `Text` (`caps` for
eyebrows), `Counter`. Surfaces: `Box` (`focus`, `fill`, `variant`), `Boundary`
(`labelAt`, `keepCase`). Signals: `Wire` (`flow`), `Arrow`, `Dot`, `Comet`, `Pulse` (`once` for a single ring), `Tag`,
`Checkpoint`. Instruments: `Meter`, `Axis`. Code: `CodeBlock` (typed lines via
`appearAt` at `typeRate` frames/char, indentation preserved, syntax colouring).
Don't use `caps` on text containing identifiers (`onError` would render `ONERROR`). Colour: `TONE`, `tint(tone, %)`.
Local helpers belong in the scene file; promote to `primitives.tsx` only when a second
scene needs them. `Stage` is a component, so `react-hooks` lint applies: derive values
with `map`/`reduce` instead of mutating `let` accumulators.

## Preview

With `npm run dev`, open `/blog/scene-lab.html?id=<figure-id>`: renders the midpoint of each beat,
the poster frame and the last frame side by side. Parameters: `frame=12,90`,
`compact=1`, `locale=fr`, `theme=light|dark|mountain|rocket`, `play=1` (live player).
Check all four themes and both canvases before shipping a scene.
