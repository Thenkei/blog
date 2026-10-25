import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { act, render, screen, waitFor } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import "../../src/i18n/config";
import { bespokeSceneIds, hasBespokeScene, loadBespokeScene } from "../../src/features/posts/motion/bespoke/registry";
import { SceneShell } from "../../src/features/posts/motion/bespoke/SceneShell";
import { BespokePoster } from "../../src/features/posts/motion/bespoke/BespokeMotionFigure";
import { MotionScene } from "../../src/shared/components/MotionScene";

const locales = ["en", "fr"] as const;

describe("bespoke article scenes", () => {
  it.each(bespokeSceneIds)("%s has a coherent, localized timeline", async (id) => {
    const scene = await loadBespokeScene(id);
    expect(scene.durationInFrames).toBeGreaterThan(90);
    expect(scene.posterFrame).toBeGreaterThanOrEqual(0);
    expect(scene.posterFrame).toBeLessThan(scene.durationInFrames);
    expect(scene.beats[0].at).toBe(0);
    scene.beats.forEach((beat, index) => {
      expect(beat.at).toBeLessThan(scene.durationInFrames);
      if (index > 0) expect(beat.at).toBeGreaterThan(scene.beats[index - 1]!.at);
    });
    for (const locale of locales) {
      expect(scene.title[locale]).toBeTruthy();
      // The kicker shares the top band with stage content, and the compact
      // narration strip holds ~4 lines at 24px: see bespoke/README.md.
      expect.soft(scene.title[locale].length, `${id} title (${locale}): ${scene.title[locale]}`).toBeLessThanOrEqual(40);
      expect(scene.caption[locale]).toBeTruthy();
      for (const beat of scene.beats) {
        expect(beat.text[locale].trim()).toBeTruthy();
        expect.soft(beat.text[locale].length, `${id} beat @${beat.at} (${locale}): ${beat.text[locale]}`).toBeLessThanOrEqual(110);
      }
    }
    expect(scene.title.fr).not.toBe(scene.title.en);
  });

  it.each(bespokeSceneIds)("%s draws every frame in both canvases", async (id) => {
    const scene = await loadBespokeScene(id);
    const frames = [0, ...scene.beats.map((beat) => beat.at + 15), scene.posterFrame, scene.durationInFrames - 1];
    for (const compact of [false, true]) {
      for (const locale of locales) {
        for (const frame of frames) {
          const html = renderToStaticMarkup(<SceneShell scene={scene} frame={Math.min(frame, scene.durationInFrames - 1)} compact={compact} locale={locale} />);
          expect(html, `${id} f${frame} compact=${compact}`).not.toMatch(/NaN|undefined|\[object Object\]/);
        }
      }
    }
  });

  it("is deterministic: the same frame renders the same picture", async () => {
    for (const id of bespokeSceneIds) {
      const scene = await loadBespokeScene(id);
      const draw = () => renderToStaticMarkup(<SceneShell scene={scene} frame={scene.posterFrame} compact={false} locale="en" />);
      expect(draw(), id).toBe(draw());
    }
  });

  it("resolves every MotionScene id used in the articles", () => {
    const posts = join(process.cwd(), "content", "posts");
    for (const slug of readdirSync(posts)) {
      const ids = locales.map((locale) => [...readFileSync(join(posts, slug, `${locale}.mdx`), "utf8").matchAll(/<MotionScene\s+id="([^"]+)"/g)].map((match) => match[1]));
      expect(ids[0], `${slug}: en and fr place the same scenes`).toEqual(ids[1]);
      for (const id of ids[0]!) expect(hasBespokeScene(id!), `${slug}: ${id}`).toBe(true);
    }
  });

  it("keeps the staff role broad and includes adjacent practices and release communication", async () => {
    const scene = await loadBespokeScene("hat-switching-tax");
    for (const compact of [false, true]) {
      for (const locale of locales) {
        const { Stage } = scene;
        const props = { compact, locale, width: compact ? 540 : 960, height: compact ? 520 : 420 };
        const initial = renderToStaticMarkup(<svg><Stage {...props} frame={0} /></svg>);
        const poster = renderToStaticMarkup(<svg><Stage {...props} frame={scene.posterFrame} /></svg>);
        expect(initial).toContain("Staff engineer");
        expect(initial).toContain(locale === "fr" ? "Cadrer" : "Frame");
        expect(initial).toMatch(locale === "fr" ? /arbitrer/i : /tradeoffs/i);
        expect(initial).toMatch(/delivery/i);
        for (const practice of ["Data engineering", "BI", "Data analyst", "SRE-ish", "Design"]) {
          expect(poster).toContain(practice);
        }
        expect(poster).toContain(locale === "fr" ? "Vidéo factory" : "Video factory");
        expect(poster).toMatch(/[Cc]ommunication/);
        expect(poster).not.toMatch(/8 hats|8 casquettes|en attente|pending|PUBLIÉE|PUBLISHED/);
        expect(scene.durationInFrames - scene.beats.at(-1)!.at).toBeGreaterThanOrEqual(60);
      }
    }
  });

  it("renders the poster with the narration as an ordered text alternative", async () => {
    const scene = await loadBespokeScene("postgresql-unique-nulls");
    render(<BespokePoster scene={scene} locale="fr" />);
    expect(screen.getByRole("figure", { name: /upsert insère deux fois/i })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(scene.beats.length);
    expect(screen.getByText(/NULLS NOT DISTINCT \(PostgreSQL 15\+\)/)).toBeInTheDocument();
  });

  it("shows only arrived reconnect attempts and keeps the counters consistent with the bars", async () => {
    const scene = await loadBespokeScene("websocket-reconnect-jitter");
    const samples = [[0, 0, 0], [69, 0, 0], [70, 24, 1], [160, 24, 9], [scene.posterFrame, 24, 24]] as const;
    for (const compact of [false, true]) {
      for (const locale of locales) {
        for (const [frame, burst, spread] of samples) {
          const html = renderToStaticMarkup(<SceneShell scene={scene} frame={frame} compact={compact} locale={locale} />);
          const dom = new DOMParser().parseFromString(html, "text/html");
          for (const [tone, count] of [["danger", burst], ["ok", spread]] as const) {
            const bars = Array.from(dom.querySelectorAll(`rect[fill="var(--visual-${tone})"]`));
            if (count === 0) expect(bars).toHaveLength(0);
            const drawnCount = bars.reduce((sum, bar) => sum + Number(bar.getAttribute("height")), 0) / (compact ? 3.9 : 6.6);
            expect(drawnCount).toBeCloseTo(count);
            expect(dom.querySelector(`text[fill="var(--visual-${tone})"]`)?.textContent).toBe(`${count} / 24`);
          }
        }
      }
    }
  });

  it("keeps the mobile explanation readable when reduced motion disables playback", async () => {
    const originalMatchMedia = window.matchMedia.bind(window);
    const media = vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      ...originalMatchMedia(query),
      matches: query === "(max-width: 650px)" || query === "(prefers-reduced-motion: reduce)",
    }));
    try {
      const scene = await loadBespokeScene("websocket-reconnect-jitter");
      const view = await act(async () => {
        const rendered = render(<MotionScene id="websocket-reconnect-jitter" />);
        await loadBespokeScene("websocket-reconnect-jitter");
        return rendered;
      });
      try {
        const figure = await screen.findByRole("figure", { name: scene.title.en });
        expect(figure.querySelector("svg")).toHaveAttribute("viewBox", "0 0 540 520");
        expect(figure.querySelectorAll("li")).toHaveLength(scene.beats.length);
        expect(screen.queryByRole("button", { name: /play video/i })).not.toBeInTheDocument();
      } finally {
        view.unmount();
      }
    } finally {
      media.mockRestore();
    }
  });

  it("loads a MotionScene lazily into an accessible figure", async () => {
    // React 19 `use()` suspends; the async act lets the scene chunk resolve.
    const { container } = await act(async () => {
      const view = render(<MotionScene id="postgresql-unique-nulls" />);
      await loadBespokeScene("postgresql-unique-nulls");
      return view;
    });
    expect(await screen.findByRole("figure", { name: /upsert inserted twice/i })).toBeInTheDocument();
    expect(container.querySelector('[data-motion-scene="bespoke"]')).toBeTruthy();
  });

  it("keeps the same figure node when the player replaces the poster", async () => {
    await act(async () => {
      render(<MotionScene id="postgresql-unique-nulls" />);
      await loadBespokeScene("postgresql-unique-nulls");
    });
    const figure = await screen.findByRole("figure", { name: /upsert inserted twice/i });

    // The poster's narration list leaves once the lazy player has mounted.
    await waitFor(() => expect(figure.querySelector(".bespoke-scene-beats")).toBeNull(), { timeout: 5000 });

    expect(figure.isConnected).toBe(true);
    expect(screen.getByRole("figure", { name: /upsert inserted twice/i })).toBe(figure);
  });
});

describe("asset figures with a bespoke scene", () => {
  it("keeps the article's own image and shows its caption once", async () => {
    const { AssetMotionFigure } = await import("../../src/features/posts/motion/AssetMotionFigure");
    const { container } = await act(async () => {
      const view = render(<AssetMotionFigure assetId="polymagine-pipeline"><picture><img src="/hero.jpg" alt="Polymagine workshop" /></picture><figcaption>Mesh in under one second.</figcaption></AssetMotionFigure>);
      await loadBespokeScene("polymagine-pipeline");
      return view;
    });
    await screen.findByRole("figure", { name: /mesh in under one second/i });
    expect(container.querySelector(".bespoke-scene-media img")?.getAttribute("alt")).toBe("Polymagine workshop");
    expect(screen.getAllByText("Mesh in under one second.").length).toBeLessThanOrEqual(2);
    expect(container.querySelector(".bespoke-scene-media figcaption")).toBeNull();
  });
});
