import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useRef } from "react";
import { ThemeProvider, type ThemeMode } from "../../src/app/providers/ThemeProvider";
import { ReadingProgressBar } from "../../src/features/reading/ReadingProgressBar";

const ARTICLE_TOP = 500;
const ARTICLE_HEIGHT = 2400;

function mountScrollableArticleRect(article: HTMLElement) {
  Object.defineProperty(article, "getBoundingClientRect", {
    configurable: true,
    value: () => {
      const top = ARTICLE_TOP - window.scrollY;
      return {
        top,
        bottom: top + ARTICLE_HEIGHT,
        left: 0,
        right: 900,
        width: 900,
        height: ARTICLE_HEIGHT,
        x: 0,
        y: top,
        toJSON: () => ({}),
      };
    },
  });
}

function ProgressHarness() {
  const articleRef = useRef<HTMLElement | null>(null);

  return (
    <>
      <article
        ref={(element) => {
          articleRef.current = element;
          if (element) {
            mountScrollableArticleRect(element);
          }
        }}
      >
        content
      </article>
      <ReadingProgressBar articleRef={articleRef} contentKey="post:test" />
    </>
  );
}

function renderProgress(theme: ThemeMode) {
  localStorage.setItem("themeMode", theme);
  return render(
    <ThemeProvider>
      <ProgressHarness />
    </ThemeProvider>,
  );
}

describe("ReadingProgressBar", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      writable: true,
      value: 1000,
    });
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      writable: true,
      value: 0,
    });
  });

  it("renders clean progress variant for light theme", () => {
    const { container } = renderProgress("light");
    const lightProgress = container.querySelector(".clean-progress-light");
    expect(lightProgress).toBeTruthy();
    expect(lightProgress).toHaveAttribute("data-progress-placement", "top");
  });

  it("renders clean progress variant for dark theme", () => {
    const { container } = renderProgress("dark");
    const darkProgress = container.querySelector(".clean-progress-dark");
    expect(darkProgress).toBeTruthy();
    expect(darkProgress).toHaveAttribute("data-progress-placement", "top");
  });

  it("renders mountain variant and tracks direction changes", async () => {
    const { container } = renderProgress("mountain");

    window.scrollY = 1200;
    window.dispatchEvent(new Event("scroll"));
    window.scrollY = 700;
    window.dispatchEvent(new Event("scroll"));

    const mountainProgress = container.querySelector(".mountain-progress");
    expect(mountainProgress).toBeTruthy();
    expect(mountainProgress).toHaveAttribute("data-progress-placement", "top");
    await waitFor(() => {
      expect(mountainProgress).toHaveAttribute("data-direction", "up");
    });
    expect(container.querySelector(".mountain-runner-icon")).toBeTruthy();
    expect(container.querySelector(".runner-leg-front")).toBeTruthy();
    expect(container.querySelector(".runner-leg-back")).toBeTruthy();
    expect(container.querySelector(".runner-leg-front-upper")).toBeTruthy();
    expect(container.querySelector(".runner-leg-front-foot")).toBeTruthy();
    expect(container.querySelector(".runner-leg-back-upper")).toBeTruthy();
    expect(container.querySelector(".runner-leg-back-foot")).toBeTruthy();
    expect(container.querySelector(".mountain-progress-track")).toBeNull();
    expect(container.querySelector(".mountain-progress-fill")).toBeNull();
    expect(container.querySelector(".mountain-progress-glow")).toBeNull();
    expect(container.querySelector(".mountain-progress-checkpoints")).toBeNull();
    expect(container.querySelector(".mountain-progress-altitude")).toBeNull();
  });

  it("runs mountain runner between 0 and 100 progress and stops at boundaries", async () => {
    const { container } = renderProgress("mountain");

    const mountainProgress = container.querySelector(".mountain-progress");
    expect(mountainProgress).toBeTruthy();
    expect(mountainProgress).toHaveAttribute("data-running", "false");

    window.scrollY = 1200;
    window.dispatchEvent(new Event("scroll"));
    await waitFor(() => {
      expect(mountainProgress).toHaveAttribute("data-running", "true");
    });

    window.scrollY = 2100;
    window.dispatchEvent(new Event("scroll"));
    await waitFor(() => {
      expect(mountainProgress).toHaveAttribute("data-running", "false");
    });
  });

  it("keeps mountain runner stopped when progress is clamped at start", () => {
    const { container } = renderProgress("mountain");
    const mountainProgress = container.querySelector(".mountain-progress");
    expect(mountainProgress).toBeTruthy();

    window.scrollY = 200;
    window.dispatchEvent(new Event("scroll"));

    expect(mountainProgress).toHaveAttribute("data-running", "false");
    expect(mountainProgress).toHaveAttribute("data-direction", "down");
  });

  it("renders rocket variant and enters orbit state near completion", async () => {
    const { container } = renderProgress("rocket");

    window.scrollY = 2100;
    window.dispatchEvent(new Event("scroll"));

    const rocketProgress = container.querySelector(".rocket-progress");
    expect(rocketProgress).toBeTruthy();
    expect(rocketProgress).toHaveAttribute("data-progress-placement", "right");
    expect(container.querySelector(".rocket-progress-track")).toBeNull();
    expect(container.querySelector(".rocket-progress-fill")).toBeNull();
    expect(container.querySelector(".rocket-progress-checkpoints")).toBeNull();
    expect(container.querySelector(".rocket-progress-readout")).toBeNull();
    await waitFor(() => {
      expect(container.querySelector(".rocket-orbit.active")).toBeTruthy();
    });
  });
});
