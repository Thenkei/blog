# Short films series — covers and films

Prepared on 2026-11-14. Requested by the author: « Faisons une série, ça pourrait être plutôt marrant. L'idée, c'est de réinterpréter les anciens avec des nouveaux articles très courts au format vidéo. Et aussi créer un article qui présente tout ça. » Angles and scripts were delegated; the author has not read the copy or the lines yet.

Each episode retells an older article in a 41–45 s painted cartoon (37–40 s before the dialogue round), published as a very short article (`seriesId: "short-films"`) that links back to the original. The pilot is the Software Factory film (`november-2026-drafts.md`, section « What I Call a Software Factory »); the series introduction embeds it.

| Article | Date | Film id | Source article | Factory folders | Takes |
| --- | --- | --- | --- | --- | --- |
| `short-films-series` | 2026-12-14 | `software-factory-film` (pilot) | — | `blog-software-factory(-en)` | `fr-v3`, `en-v3` |
| `short-film-redis-memory` | 2026-12-16 | `short-film-redis` | `redis-memory-exhaustion-post-mortem` (2021) | `blog-short-redis(-en)` | `fr-v9`, `en-v9` |
| `short-film-postgresql-nulls` | 2026-12-18 | `short-film-nulls` | `postgresql-unique-nulls` (2026) | `blog-short-nulls(-en)` | `fr-v10`, `en-v9` |
| `short-film-ci-lunch-break` | 2026-12-21 | `short-film-ci` | `scaling-ci-github-actions-forest-admin` (2021) | `blog-short-ci(-en)` | `fr-v9`, `en-v9` |

Factory: `videos-factory` repository, branch `feat/blog-short-films` (worktree `videos-factory-worktrees/blog-short-films`, from `feat/blog-software-factory`, not pushed). Series rules: `docs/series-blog-short-films.md` there. Each episode folder keeps its brief (with the claims table mapping every on-screen line to the source article), storyboard and verification, `VOICEOVER.md`, `assets.json` and the image generation records.

## What every episode keeps

- The pilot's cast (the engineer, the cream robots), the blog's night workshop palette, Space Grotesk and Manrope (OFL).
- Painted plates and cels from the Codex CLI's built-in image generation, with the pilot's model sheet and the blog cover as references; many drawings reused from the pilot. Remotion draws all words.
- Procedural local music (one score per episode), one designed beat of silence before the turn, and ElevenLabs sound effects tied to events in the picture (since the enrichment round below).
- The same close card (`SeriesCard.tsx`, identical in every folder): « Petits films » / "Short films", one line from the article, « D'après « titre » (année) ».
- No company logo, product screen or real person in the picture; the company name appears only in a source title.

## Voice

The engineer says four short lines per episode (two before the enrichment round) in the author's cloned voice « Moi même » (ElevenLabs, voice id `dGEvTTk26Y7U9tEw8kBI`, `eleven_multilingual_v2`, seed 1114, default settings, one generation per line), authorised by the author on 2026-11-14: « Oui, tu peux utiliser ma voix clonée pour les épisodes ». The calls ran from the main session (the episode agents' sandbox refused them). Characters billed:

| Episode | French | English |
| --- | --- | --- |
| Redis | « Rien d'anormal aujourd'hui. » (27) · « Le cache ? Il n'était pas censé être critique ! » (47) | "Nothing unusual today." (22) · "The cache? It was never meant to be critical!" (45) |
| NULL | « Des doublons ? J'ai une contrainte d'unicité ! » (46) · « NULLS NOT DISTINCT. Et hop. » (27) | "Duplicates? But I have a uniqueness constraint!" (47) · "NULLS NOT DISTINCT. And just like that." (39) |
| CI | « Toujours pas fini ? » (19) · « Maintenant, je mange tranquille. » (32) | "Still not done?" (15) · "Now I eat in peace." (19) |

Total for the first round: 386 characters.

Added in the enrichment round (same voice and settings; the first-round clips were kept):

| Episode | French | English |
| --- | --- | --- |
| Redis | « Redis est rapide et fiable. » (27) · « Des données de projets supprimés ! » (34) | "Redis is fast and reliable." (27) · "Data from deleted projects!" (27) |
| NULL | « J'ai protégé ma table avec une contrainte d'unicité. » (52) · « Par défaut, NULL est différent de NULL. » (39) | "I protected my table with a uniqueness constraint." (50) · "By default, NULL is not equal to NULL." (38) |
| CI | « Facile sur le papier, non ? » (27) · « Base de données, cache : on rase tout. » (38) | "Easy on paper, right?" (21) · "Database, cache: nuke it all." (29) |

Total for the enrichment round: 409 characters; 795 for the series so far.

Pronunciation round (2026-11-15). Written as is, the French voice said « nul » for NULL and « Rudy » for Redis (local Whisper transcripts). At the author's request (« corrige les défauts ! », « redis ce dit Ré-DICE en français »), the French lines are now generated from respellings declared in each `VOICEOVER.md` (« Prononciation »): « NULL » → « Neul » and « NULLS » → « Neulles » (NULL `reveal` and `fix`), « Redis » → « Rédice » (Redis `tenants`). The captions and the screen keep the written word. Whisper now hears « null est différent de null », « Null, not distinct. Et hop ! » and « Redis est rapide et fiable. ». Billed: 124 characters for NULL (one reveal, three fix generations, two of them tests) and 85 for Redis (two tests, one kept); 1,004 for the series so far.

## Enrichment round (2026-11-14)

Requested by the author after the first takes: « Je suis persuadé qu'on peut aller un peu plus loin dans ces petits films d'animation et faire générer plus de plates ou d'images à codex afin d'avoir des choses un peu plus riches. D'ailleurs, il peut aussi y avoir un peu plus de discours au besoin. Tu peux aussi ajouter des effets spéciaux avec ElevenLab. » The series rule went from 20–30 s to 20–40 s and from two or three lines to two to five.

| Episode | Length | New plates | New cels | Effects (generations, seconds billed) |
| --- | --- | --- | --- | --- |
| Redis | 40.0 s | the desk with the Redis room on a shelf, an unplugged alarm bell, a floor-level view of the room, a corner of dusty boxes | the tenants huddled, the engineer holding a dusty box (shut and talking) | 11, 12.3 s: box plop, robot chirps, cardboard creak, cricket, box groan, crunches, power-down, torch click, broom, boxes tossed, vacuum seal |
| NULL | 37.0 s | an archive room full of identical robots, the board in close-up, the plaque in close-up, the doorway in close-up | the doorman in close-up (comparing, arms crossed), the doorman with a raised stamp, the engineer relieved | 9, 10.1 s: roll, whoosh, robot crowd, cards spilling, servo, engraving, chair creak, stamp (the first stamp came back almost silent and is unused; the second is used) |
| CI | 38.5 s | a lunch corner, the build lamp in close-up, an aisle | the engineer in close-up (neutral; pleased and determined, each with a talking drawing), eating and chewing, chasing with a butterfly net (two drawings) | 11, 10.3 s: bite, chair, paper burst, parcel, trip clatter, failure buzz, ghost, net swish, stitching, broom, robot cheer |

- Images: Codex CLI, the model logged as `gpt-6-astra`, same references, style block and no-text rule as the first batches; each one looked at in full and on a film frame, none regenerated. Records in each episode's `art-requests/records/`, files in `assets.json`.
- Effects: `scripts/sfx-elevenlabs.mjs` (`eleven_text_to_sound_v2`, `mp3_44100_128`, prompt influence 0.3 unless noted, `--duration` set on every call). Generated once in the French folder, copied to the English one; trimmed, levelled and peak-limited per episode before the mix (`public/audio/sfx/`), cued in `video.json`. The procedural effects they replace were removed from the scores. Prompts, durations and cues are in each episode's `assets.json` and `elevenlabs-requests.md`. Total: 31 generations, 32.7 s billed.
- The CI talking drawings are now built from their shut drawing plus the mouth only (`art-requests/mouth-patch.mjs`), so his head no longer shifts when he speaks.
- Loudness: the first renders landed near −17 LUFS, held down by effects landing on musical hits under the true-peak ceiling. Each episode capped its effects, lowered the cues that summed with a hit, and lowered its score's limiter; the final masters measure −16.1 LUFS.

## Defect and animation round (2026-11-15)

The author read the list of known compromises and answered « corrige les défauts ! » (« pas grave pour la taille »), then, while it ran: « Et c'est toujours pas ouf niveau animation. Tu peux demander à codex de nouvelles images ».

Defects fixed:

- Voice: the respellings above (« null », « Ré-dice »). The factory's `scripts/prepare-voice.mjs` measured each clip but normalised it with a one-pass `loudnorm` that stopped at its true-peak ceiling, so short lines came out up to 3 dB quiet (Redis `tenants` −21.0 LUFS, NULL `reveal` −21.3, CI English `rules` −20.8). It now applies the gain to −18 LUFS from its own measurement, then a peak limiter at −1.5 dBFS; the lines measure −18.0 to −19.0 LUFS. Whisper on the English CI mix now hears « Database cache nuke it all », which it skipped before.
- Colour: the green despill had turned teal objects navy (antenna bulbs, bow ties, the desk lamp and mugs, a folder). Each episode now keeps the original colour of those objects inside masked, hue-limited boxes (`art-requests/fixes.json`) or keys them with an edge-only despill, including the pilot drawings it reuses (re-keyed from the pilot's originals). The published pilot film is unchanged.
- Redis: the talking dusty-box drawing is now the shut drawing with only the mouth patched in (no more flicker); one mug at a time in the office; the fallen queues robot stays inside the room, clear of the outage pills; he turns to look before the weekend line; the second shot of the fixes lasts 1.5 s instead of 1 s.
- NULL: teal bow tie and bulbs everywhere; the cards spilling are two clatters cued on the four cards that hit the floor, with the score dipping under them; the close-card stamp is heard over a dip of the ring-out; the « ≠ » is built from the code face's own « = » and « / » (no fallback font); the twins pass behind the doorman.
- CI: one mug at a time (the desk's mug painted out in the close); the shards carry no number (the article gives ten shards and names `test_chunk_1` and `test_chunk_5`, not an order); the two running drawings with the net now match in scale and the net's hoop is see-through.

Animation: the actions are now drawn as pose sequences held on twos and threes instead of one drawing moved by a transform. Every pose is a Codex image edit of the existing drawing (with the model sheet and the blog cover as references), registered on its base over a part that does not move (`art-requests/register.mjs`); blinks, mouths and head turns are patched onto their pose. All were used on the first generation.

| Episode | New drawings | What moves now |
| --- | --- | --- |
| Redis | 21 | the tenants roll in, wave, bow and salute; the neighbours turn nervous as the box grows; he lowers and lifts his mug around his line; the huddle jumps and shivers; each tenant startles, then lands crushed on its crunch; the broom robot sweeps on a three-drawing cycle and holds up its stopwatch |
| NULL | 18 | the robots roll, brake and hold up their cards; the doorman taps his clipboard, raises the cards, waves the twins through, folds his arms and shakes his head, winds up and slams the stamp on the contact frames; robots drop into the crowd; the engineer scratches his head and leans back |
| CI | 28 | he rubs his hands, points at the lamp, waits bored, blinks; bites and chews; lands in his chair and slumps; thumbs-up; the bench robots work, panic and cheer; worker 7 stumbles and lands dizzy; the ghost shoots up and floats; a four-drawing run with the net raised, swung and following through; the orchestrator taps, sews and beams; the broom sweeps; he sips and lowers his mug |

Final takes: Redis `fr-v9`/`en-v9` (−16.1 LUFS, −2.0/−2.1 dBTP, review kit 29/29), NULL `fr-v10`/`en-v9` (−16.0/−16.1 LUFS, −1.6/−1.8 dBTP, 22/22), CI `fr-v9`/`en-v9` (−16.1/−16.0 LUFS, −1.6 dBTP, 28/28). Same lengths, lines, cuts and effect cues as the enriched cuts. Whisper on the Redis web files hears the four lines in each language (« cache » comes out « cash », the same sound in French).

## Web files and covers

- Films in `src/assets/videos/posts/short-films/<redis|nulls|ci>/`: `film.{fr,en}.mp4` (540p, H.264 CRF 42, HE-AAC 32 kb/s, `+faststart`; 340–400 KB for the first 27–30 s cuts, 556–584 KB for the 37–40 s enriched cuts, about 15 KB per second either way), posters `film.{fr,en}.jpg` (540p, about 120 KB), captions `film.{fr,en}.vtt` (four cues each).
- Compression, at the author's request on 2026-11-14 (« tu peux t'autoriser de changer la qualité des vidéos afin de les compresser … gagner 5 fois la taille des fichiers »): the first web files (720p, CRF 32, AAC 96 kb/s) were about 2 MB each. Tried on the Redis film: lower frame rates (15, 20, 24 fps) did not lower the bitrate, since every frame of a camera push is new; a denoise pass made it worse; SVT-AV1 and x265 gave larger files than x264 at a similar look; 720p at CRF 44 smeared the painted hatching. 540p at CRF 42 with `-tune animation` and `aq-mode=3` kept the line work and the text legible (the smallest « NULL » pills on the NULL board are soft but readable), 5.1–5.3× smaller. HE-AAC (`aac_at`, Apple AudioToolbox, profile 4) at 32 kb/s keeps the music and the voice clean; the web files measure −16.2 to −16.8 LUFS, sample peak −0.7 dBFS at most. WebKit (Playwright `webkit-2227`) plays them (`canPlayType` « probably » for `avc1.64001E, mp4a.40.5`). The Software Factory film's web files were re-encoded the same way (2.6 MB → 0.5 MB). Total for the eight files: 17 MB → 3.5 MB.

```sh
ffmpeg -i out/<take>/video.mp4 -vf "scale=960:540:flags=lanczos" \
  -c:v libx264 -preset veryslow -tune animation -crf 42 -x264-params aq-mode=3 -pix_fmt yuv420p \
  -af "aresample=192000,alimiter=limit=0.708:attack=1:release=50:level=0,aresample=48000" \
  -c:a aac_at -profile:a 4 -b:a 32k -movflags +faststart film.<locale>.mp4
ffmpeg -ss <poster s> -i out/<take>/video.mp4 -frames:v 1 -vf "scale=960:540:flags=lanczos" -q:v 4 film.<locale>.jpg
cp out/<take>/captions.vtt film.<locale>.vtt
```

Posters at 20.5 s (Redis), 19.5 s (NULL), 6.2 s (CI) in the enriched cuts (17.0 s, 11.5 s and 6.7 s before). Since the defect and animation round, a limiter at −3 dBFS (on a 192 kHz resample) runs before the HE-AAC encode: without it, the English CI file reached +0.2 dBFS after encoding although its master sits at −1.6 dBTP. Web files of the current takes: Redis 591/589 KB, NULL 566/565 KB, CI 599/597 KB (the author, 2026-11-15: « pas grave pour la taille »), −16.3 to −16.4 LUFS; sample peak −1.0 dBFS at most, except three samples at −0.1 dBFS on one card clatter of the English NULL file (11.38 s), a codec overshoot that a lower limiter (−4.5 dBFS) did not remove.

- Episode covers: a text-free 1920 × 1080 still from each French take (`out/<take>/cover.png`), run through `npm run optimize:image -- --widths 960,1600 --remove-source`. Replaced in the defect round so the teal objects match the films: Redis `fr-v9` (the box room, same frame as before), NULL `fr-v10` (the doorman's close-up with his two cards, instead of the earlier composite of the hall whose bow tie read blue; alt text rewritten), CI `fr-v9` (the desk, lamp teal).
- Series cover (`short-films-series`): generated with the Codex CLI's built-in image generation, 1672 × 941, first generation, model sheet and blog cover as references. Prompt: an engineer cranking a small vintage film projector on a workbench in the night workshop, three cream robots on stools watching a small framed screen, one holding popcorn; same art direction and constraints block as the other covers (no lettering, exactly one human and three robots).

## Verification

- Each delivered take passed the factory's `verify` (H.264 1920 × 1080, AAC, −16.0 to −16.3 LUFS, true peak ≤ −1.6 dBTP; the web files measure −16.0 to −16.3 LUFS) and its review kit (every on-screen line read by OCR on its frame and found in the script; no one-frame change, no blank frame; silences only where designed and at the end).
- Mouth drawings checked against the voice clips frame by frame by the episode agents.
- Looked at by the main agent: contact sheets of the three French films, the three close cards side by side, the episode covers and posters, the four articles in the dev server (video, poster and caption track present, no console error).
- The close cards were aligned afterwards by the main agent: one `SeriesCard.tsx` in every folder, which made the last takes (Redis `v4`, NULL `fr-v5`/`en-v4`, CI `v4`). Redis `v2`/`v3` had failed `verify` on loudness (−17.1 LUFS); its score's limiter now sits at −9 dB like NULL's.
- Enriched takes (Redis `fr-v6`/`en-v6`, NULL `fr-v7`/`en-v6`, CI `fr-v6`/`en-v6`): `verify` passes on all six (−16.1 LUFS, true peak −1.6 to −1.9 dBTP); review kit Redis 29/29, NULL 22/22, CI 28/28 in each language; silences only where designed and at the end; mouths checked against the new clips by the episode agents; contact sheets and posters looked at by the main agent. `compare` cannot align a take whose first scene changed length; the unchanged scenes were compared by hand (encoder noise only).
- Defect and animation takes (Redis `fr-v9`/`en-v9`, NULL `fr-v10`/`en-v9`, CI `fr-v9`/`en-v9`): `verify` and the review kit pass on all six (numbers in the section above); `compare` against the previous takes shows the picture changing only where drawings or colours changed and the audio only under the louder lines; every new drawing looked at next to its base and every animated scene as a frame strip by the episode agents; strips of the NULL check/upsert and CI chase scenes, the posters and the new covers looked at by the main agent.
- Fixed in the defect round (2026-11-15): the blue bow tie and bulbs, the Redis dusty-box flicker, the quiet spill and close stamp in NULL, the fallback « ≠ », the two mugs, the invented shard order, the CI net drawings' scale, the French « nul » and « Rudy ».
- Known compromises: the pilot film still has its navy lamp and mug and two mugs in its wide shot (published, not re-rendered). Poses are whole-drawing swaps in Redis, so a body redraws slightly at each pose change; rolling robots have one leaning drawing, no wheel cycle; in the chase his head does not advance perfectly evenly from drawing to drawing; the CI lunch insert is a mirrored plate (window on the other side from the wide shot); in the NULL French mix, Whisper hears the fix line as « Null, null distinct. Et hop ! » (the clip alone gives « Null, not distinct »; ducking the band further did not change it).
- Not done: nobody has watched the films in real time or listened to them (the effects were judged by measurement and spectrograms, not by ear); no fresh reviewer agent was run. Transcripts (local Whisper, `mlx-community/whisper-large-v3-turbo`) were run on the CI and NULL masters and the Redis web files.

## Dialogue round (2026-11-15)

Requested by the author: « quand le personnage parle, les animations ne sont vraiment pas folles […] je pense qu'on peut un peu améliorer les dialogues (sans doute en utilisant les skills d'Eleven Labs) » and « On peut jouer sur les intonations, mettre des balises dans les voix de Eleven Labs afin de rajouter un certain réalisme et de la profondeur ».

- Voice: all lines regenerated with `eleven_v4` (language code per locale, stability 0.4, similarity 0.8, seed 1114), with audio tags inside each line (`[pleased] … [chuckles] …`, `[confused] … [shouting] …`). The factory's `scripts/voice-elevenlabs.mjs` now takes `--language`, sends only stability and similarity to v4, and strips the tags from the saved text and alignment; captions never show them. Lines slightly longer and more spoken (« Allez, on y met tout ! », « Ni hier, d'ailleurs. », « Mais… », « Pire… »). Exceptions: NULL French `fix` keeps the multilingual v2 clip (six v4 takes could not say « NULLS NOT DISTINCT » or « Et hop »); CI French `rules` is sent as « Bases de données » (same sound; « Base » came out as « Baisse »). 2,108 characters billed in all, tests included.
- Lip sync: per speaking head, a Codex-made mouth set (closed, slight, wide, round, spread, F/V) plus blinks, patched in the mouth or eye box only, driven by the ElevenLabs character alignment gated by the clip's level (`audio/visemes.mjs` → `src/visemes.json`). 2–4 Codex acting poses per on-screen line, keyed on the tags and stressed words. Codex jobs: Redis 31, NULL 18, CI 28; none regenerated for quality.
- Takes: Redis fr-v10/en-v10 (44.0 s), NULL fr-v11/en-v10 (41.0 s; `check`, `reveal`, `fix` stay off screen over their proof), CI fr-v11/en-v11 (44.5 s; all four lines on screen). Masters −16.0 to −16.3 LUFS, ≤ −1.6 dBTP; review kits pass.
- Local transcripts of the six mixes (mlx-whisper): every line heard (« cache » written « cash »; NULL French fix « Null, mode distinct. Et hop ! »).
- Web: same recipe; NULL uses AAC-LC 64 kb/s because HE-AAC overshot to +1.3 dBFS on a transient at 30.6 s (master −2.1 dBTP). Sizes: Redis 634/631 KB, NULL 790/788 KB, CI 667/663 KB; −16.2 to −16.6 LUFS. Posters at 27.6 s (Redis shout), 17.2 s (NULL pointing), 17.3 s (CI chuckle). Covers unchanged.
- Known compromises: the cut to the pilot's frazzled drawing after the Redis shout changes the head size; some Codex poses redraw the face slightly; mouth shapes come from letters, not phonemes; a few prepared clips sit at −18.6 to −19.4 LUFS because the voice limiter holds their peaks. Not done: real-time viewing and listening, a fresh `video-reviewer` pass.
