# A Video Factory in a Git Repository — cover and films

Prepared on 2026-11-13 for the article scheduled on 2026-11-17.

## Cover

Generated with the Codex CLI's built-in image generation (`codex exec`), 1664 × 936, then run through `npm run optimize:image`. Mapped by slug in `PostEditorialArt.tsx`, shared by both locales.

Assets: `src/assets/images/posts/editorial/video-factory-remotion-agents-source-960.{avif,webp}` and `-source-1600.{avif,webp,jpg}`.

### Final prompt

Use case: stylized-concept. An original editorial blog cover, landscape 16:9, at least 1600x900, exactly 16:9.

Art direction: a detailed inked editorial illustration, clean confident line work with light cross-hatching, flat colours with soft painterly shading, in the spirit of a European graphic novel. Night-time interior, warm lamp light against deep navy and teal shadows, a few small amber and teal light accents. Hand-made feel, not photorealistic, not glossy 3D, not a neon tech network.

Subject: a miniature film studio built on an engineer's wooden desk at night. On the left, an open laptop whose screen shows a simple folder icon; from the laptop a small conveyor belt runs to the right across the desk. Along the belt, six tiny distinct workshop stations, each staffed by one small, simple, friendly desk robot (no two alike, clearly machines, not humans): 1) a writing desk with sheets of paper, 2) a wall of small storyboard cards pinned in a row, 3) a tiny camera on a rig filming a miniature blank application window, 4) a little sound booth with a microphone, 5) a small mixing console with sliders, 6) a single cinema seat facing a small screen where one robot watches attentively. At the far right the belt delivers a finished glowing film frame with a plain play triangle. A desk lamp lights the scene; a mug and a closed notebook sit in the foreground; through a window behind, a quiet town at night.

Composition: the conveyor reads clearly from left to right as one continuous line; the subject occupies the central 75% with breathing room and works under a centred crop to a wide banner as well as a small card. One strong idea readable at thumbnail size: a small assembly line that turns a folder into a film.

Constraints: no lettering, no numbers, no logos, no watermarks, no readable text anywhere (papers, cards and screens carry only abstract marks). No recognisable characters or brands. No human faces in close-up.

## Films

Four films, produced with the factory the article describes. Three are example films for a fictional product ("Ravito") and a fictional race; the opening trailer, added on 2026-11-14, is about the factory itself. None contains a RockFi logo, product interface or data. The wordmark of the Ravito films is a fictional one; the fonts are the factory's system fallbacks. The Ravito trailer and the release film are silent. The explainer is narrated since 2026-11-13. The opening trailer has music and no voice.

| Article id | Factory folder | Takes | Length |
| --- | --- | --- | --- |
| `video-factory-intro` | `videos/blog-demo-intro` | `fr-v2`, `en-v2` | 29 s |
| `video-factory-trailer` | `videos/blog-demo-trailer` | `fr-v2`, `en-v2` | 21.5 s |
| `video-factory-release` | `videos/blog-demo-release` | `fr-v1`, `en-v1` | 25 s |
| `video-factory-explainer` | `videos/blog-demo-explainer` (French), `videos/blog-demo-explainer-en` (English) | `fr-v3`, `en-v4` | 64.2 s, 60.3 s |

The sources live in the `videos-factory` repository, not in this one. The two silent folders render French by default and English with `REMOTION_LOCALE=en`:

```sh
npm run render -- blog-demo-trailer fr-v3
REMOTION_LOCALE=en npm run render -- blog-demo-trailer en-v3
npm run verify -- blog-demo-trailer fr-v3
```

The silent takes passed the factory's `verify` (H.264, 1920 × 1080, 30 fps, exact frame count, no audio stream by design). Stills and contact sheets were inspected; nobody has yet watched the films in real time.

Their web files in `src/assets/videos/posts/video-factory/` are 720p re-encodes, with one poster frame each:

```sh
ffmpeg -i out/<take>/video.mp4 -an -vf "scale=1280:720:flags=lanczos" \
  -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -movflags +faststart <name>.<locale>.mp4
ffmpeg -ss <seconds> -i out/<take>/video.mp4 -frames:v 1 -vf "scale=1280:720:flags=lanczos" -q:v 3 <name>.<locale>.jpg
```

Poster times: trailer 12.5 s, release 16.5 s.

### Opening trailer

Requested by the author on 2026-11-14 as an introduction film, a trailer on the model of an internal RockFi trailer. Only the cut is borrowed: ink tension, one beat of silence, a reveal on the band entry, three proofs, a close on the final hit, on the bar grid of a 120 BPM track. The copy, the cards and the claims are written for this article from the factory's README, guides and scripts.

The music is the same file as that internal trailer: one ElevenLabs Music generation of 2026-11-13, conformed to the grid, copied unchanged. No generation was run for this film. Two things are open before the article goes live, and both are the author's call: whether a public film should share its music with an internal one or get its own track, and whether the ElevenLabs plan covers public use.

```sh
npm run render -- blog-demo-intro fr-v3
REMOTION_LOCALE=en npm run render -- blog-demo-intro en-v3
npm run verify -- blog-demo-intro fr-v3
```

Both takes passed `verify` (870 frames, AAC, −16.1 LUFS, true peak −3.7 dBFS). The settled frames of every scene and the frames on the beats were inspected in both languages, and the track's silence, band entry and final hit were measured against the cuts. Nobody has watched or listened to them yet.

The web files keep the audio at 128 kb/s, because it is music:

```sh
ffmpeg -i out/<take>/video.mp4 -vf "scale=1280:720:flags=lanczos" \
  -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart intro.<locale>.mp4
ffmpeg -ss 11 -i out/<take>/video.mp4 -frames:v 1 -vf "scale=1280:720:flags=lanczos" -q:v 3 intro.<locale>.jpg
```

The poster is the reveal card, at 11 s. There is no caption file: the film has no speech.

### Narrated explainer

The explainer has one factory folder per language, because the factory keeps one script, one voice manifest and one timeline per video and the two narrations do not have the same length. The scenes, the on-screen copy and the word cues are shared from the French folder.

The voice is generated with ElevenLabs (`eleven_multilingual_v2`) on the author's account, at the author's request. The scripts, the settings, the characters billed and the measurements are in each folder's `VOICEOVER.md` and `assets.json`.

| Language | Voice | Voice id |
| --- | --- | --- |
| French | Stephyra - Premium Documentary & Narration | `QMNPncWXVcTVhJ9rDEQO` |
| English | Alice - Clear, Engaging Educator | `Xb7hH8MSUJpSbSDYk0k2` |

Each element of the diagrams appears on the word that names it. The frames come from the character alignment ElevenLabs returns with the audio.

```sh
npm run render -- blog-demo-explainer fr-v4
REMOTION_LOCALE=en npm run render -- blog-demo-explainer-en en-v5
npm run verify -- blog-demo-explainer fr-v4
node videos/blog-demo-explainer/captions.mjs blog-demo-explainer fr-v4      # out/fr-v4/captions.vtt
```

Both takes passed `verify` (exact frame count, AAC, −16 LUFS, true peak under −1 dBFS). A local whisper.cpp transcript of each final mix contains every word of the script, in order. A fresh read-only review of the rendered films found no blocker and measured every reveal 67 to 100 ms after its word; `fr-v3` and `en-v4` apply three of its picture remarks with the same audio. Nobody has listened to them yet.

The web files keep the audio (AAC, 96 kb/s) and come with a WebVTT caption file per language, generated from the same alignment:

```sh
ffmpeg -i out/<take>/video.mp4 -vf "scale=1280:720:flags=lanczos" \
  -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart explainer.<locale>.mp4
ffmpeg -ss <seconds> -i out/<take>/video.mp4 -frames:v 1 -vf "scale=1280:720:flags=lanczos" -q:v 3 explainer.<locale>.jpg
cp out/<take>/captions.vtt explainer.<locale>.vtt
```

Poster times: 41 s (French), 38.5 s (English).
