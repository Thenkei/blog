import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import "../../src/i18n/config";
import { ParallaxHero } from "../../src/shared/components/ParallaxHero";
import type { ThemeMode } from "../../src/app/providers/ThemeProvider";

const labels = {
  lightTheme: "Light",
  darkTheme: "Dark",
  mountainTheme: "Mountain",
  rocketTheme: "Rocket",
  themeSwitcher: "Theme selector",
};

function renderHero(themeMode: ThemeMode) {
  return render(
    <MemoryRouter initialEntries={["/en"]}>
      <ParallaxHero
        themeMode={themeMode}
        onThemeChange={vi.fn()}
        title="Morgan's Blog"
        subtitle="Engineering / Running / Evolution"
        labels={labels}
        onTitleClick={vi.fn()}
      />
    </MemoryRouter>,
  );
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

  it("renders sticky multiplane shell with exactly three mountain depth layers", () => {
    const { container } = renderHero("mountain");

    expect(container.querySelector(".mountain-camera-shell")).toBeTruthy();
    expect(container.querySelector(".mountain-camera-sticky")).toBeTruthy();
    expect(container.querySelector(".mountain-camera-stage")).toBeTruthy();
    expect(container.querySelectorAll(".mountain-layer")).toHaveLength(3);
    expect(container.querySelector(".mountain-layer-sky")).toBeTruthy();
    expect(container.querySelector(".mountain-layer-far")).toBeTruthy();
    expect(container.querySelector(".mountain-layer-near")).toBeTruthy();
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
  });
});
