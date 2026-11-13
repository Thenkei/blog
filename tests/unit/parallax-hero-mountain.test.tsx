import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import "../../src/i18n/config";
import { ParallaxHero } from "../../src/shared/components/ParallaxHero";
import type { ThemeMode } from "../../src/app/providers/ThemeProvider";

function heroForTheme(themeMode: ThemeMode) {
  return (
    <MemoryRouter initialEntries={["/en"]}>
      <ParallaxHero
        themeMode={themeMode}
        title="Morgan's Blog"
        subtitle="Engineering / Running / Evolution"
      />
    </MemoryRouter>
  );
}

function renderHero(themeMode: ThemeMode) {
  return render(heroForTheme(themeMode));
}

describe("ParallaxHero themed cameras", () => {
  it("renders simple static hero for light theme", () => {
    const { container } = renderHero("light");

    expect(container.querySelector(".simple-theme-hero")).toBeTruthy();
    expect(container.querySelector(".mountain-camera-shell")).toBeFalsy();
    expect(container.querySelector(".rocket-camera-shell")).toBeFalsy();
  });

  it("renders simple static hero for dark theme", () => {
    const { container } = renderHero("dark");

    expect(container.querySelector(".simple-theme-hero")).toBeTruthy();
    expect(container.querySelector(".mountain-camera-shell")).toBeFalsy();
    expect(container.querySelector(".rocket-camera-shell")).toBeFalsy();
  });

  it("renders sticky multiplane shell with exactly three mountain depth layers", async () => {
    const { container } = renderHero("mountain");

    expect(container.querySelector(".mountain-camera-shell")).toBeTruthy();
    expect(container.querySelector(".mountain-camera-sticky")).toBeTruthy();
    expect(container.querySelector(".mountain-camera-stage")).toBeTruthy();
    // The title never waits for the scene, which loads on demand.
    expect(container.querySelector(".hero-title")).toBeTruthy();
    await waitFor(() => {
      expect(container.querySelectorAll(".mountain-layer")).toHaveLength(3);
    });
    expect(container.querySelector(".mountain-layer-sky")).toBeTruthy();
    expect(container.querySelector(".mountain-layer-far")).toBeTruthy();
    expect(container.querySelector(".mountain-layer-near")).toBeTruthy();
    expect(container.querySelector(".mountain-trail-journey")).toBeTruthy();
    expect(container.querySelector(".mountain-route-line")).toBeTruthy();
    expect(container.querySelector(".mountain-cinematic-runner")).toBeTruthy();
  });

  it("keeps the trail and the runner inside the plane of the slope they sit on", async () => {
    const { container } = renderHero("mountain");
    await waitFor(() => {
      expect(container.querySelector(".mountain-layer-near")).toBeTruthy();
    });
    const near = container.querySelector(".mountain-layer-near");

    // Drawn in the terrain's own coordinate system, they cannot drift apart
    // from it when the camera moves or the frame changes shape.
    expect(near?.querySelector(".mountain-route-line")).toBeTruthy();
    expect(near?.querySelector(".mountain-cinematic-runner")).toBeTruthy();
    expect(near?.querySelector(".mountain-pass")).toBeTruthy();
    expect(near?.querySelectorAll(".mountain-checkpoint")).toHaveLength(2);

    const viewBoxes = Array.from(
      container.querySelectorAll(".mountain-layer > svg"),
    ).map((svg) => svg.getAttribute("viewBox"));
    expect(new Set(viewBoxes).size).toBe(1);
  });

  it("is decorative: every mountain plane is hidden from assistive technology", async () => {
    const { container } = renderHero("mountain");
    await waitFor(() => {
      expect(container.querySelectorAll(".mountain-layer")).toHaveLength(3);
    });

    container.querySelectorAll(".mountain-layer").forEach((layer) => {
      expect(layer.getAttribute("aria-hidden")).toBe("true");
    });
    expect(container.querySelector(".hero-title")?.textContent).toBe(
      "Morgan's Blog",
    );
  });

  it("renders sticky rocket camera shell with layered scene", () => {
    const { container } = renderHero("rocket");

    expect(container.querySelector(".rocket-camera-shell")).toBeTruthy();
    expect(container.querySelector(".rocket-camera-sticky")).toBeTruthy();
    expect(container.querySelector(".rocket-camera-stage")).toBeTruthy();
    expect(container.querySelector(".rocket-layer-space")).toBeTruthy();
    expect(container.querySelector(".rocket-layer-planet")).toBeTruthy();
    expect(container.querySelector(".rocket-layer-asteroids")).toBeTruthy();
    expect(container.querySelector(".rocket-layer-ship")).toBeTruthy();
    expect(container.querySelector(".rocket-flight-journey")).toBeTruthy();
    expect(container.querySelector(".rocket-flight-line")).toBeTruthy();
    expect(container.querySelector(".rocket-arrival")).toBeTruthy();
  });

  it("keeps a stable hook order while switching between every hero mode", () => {
    const { container, rerender } = renderHero("light");

    rerender(heroForTheme("mountain"));
    expect(container.querySelector(".mountain-camera-stage")).toBeTruthy();

    rerender(heroForTheme("rocket"));
    expect(container.querySelector(".rocket-camera-stage")).toBeTruthy();

    rerender(heroForTheme("dark"));
    expect(container.querySelector(".simple-theme-hero")).toBeTruthy();
  });
});
