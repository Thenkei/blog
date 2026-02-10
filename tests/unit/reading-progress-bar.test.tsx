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
    expect(container.querySelector(".clean-progress-light")).toBeTruthy();
  });

  it("renders clean progress variant for dark theme", () => {
    const { container } = renderProgress("dark");
    expect(container.querySelector(".clean-progress-dark")).toBeTruthy();
  });

  it("renders mountain variant and tracks direction changes", async () => {
    const { container } = renderProgress("mountain");

    window.scrollY = 1200;
    window.dispatchEvent(new Event("scroll"));
    window.scrollY = 700;
    window.dispatchEvent(new Event("scroll"));

    const mountainProgress = container.querySelector(".mountain-progress");
    expect(mountainProgress).toBeTruthy();
    await waitFor(() => {
      expect(mountainProgress).toHaveAttribute("data-direction", "up");
    });
    expect(container.querySelectorAll(".mountain-checkpoint").length).toBeGreaterThan(0);
  });

  it("renders rocket variant and enters orbit state near completion", async () => {
    const { container } = renderProgress("rocket");

    window.scrollY = 2100;
    window.dispatchEvent(new Event("scroll"));

    expect(container.querySelector(".rocket-progress")).toBeTruthy();
    await waitFor(() => {
      expect(container.querySelector(".rocket-orbit.active")).toBeTruthy();
    });
  });
});
