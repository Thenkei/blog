import { fireEvent, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRef } from "react";
import "../../src/i18n/config";
import {
  ThemeProvider,
  type ThemeMode,
  useTheme,
} from "../../src/app/providers/ThemeProvider";
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

function ProgressThemeSwitchHarness() {
  const { setThemeMode } = useTheme();

  return (
    <>
      <button type="button" onClick={() => setThemeMode("mountain")}>
        Mountain
      </button>
      <ProgressHarness />
    </>
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

  it("renders a minimal percentage progress variant for light theme", () => {
    const { container } = renderProgress("light");
    expect(container.querySelector(".clean-progress-light")).toHaveAttribute(
      "role",
      "progressbar",
    );
    expect(container.querySelector(".clean-progress-label")).toHaveTextContent(
      "Reading 0%",
    );
  });

  it("renders a minimal percentage progress variant for dark theme", () => {
    const { container } = renderProgress("dark");
    expect(container.querySelector(".clean-progress-dark")).toHaveAttribute(
      "role",
      "progressbar",
    );
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
    expect(
      container.querySelector(".mountain-progress-checkpoints"),
    ).toBeNull();
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

  it("reuses the cinematic ship and exposes semantic Rocket progress", () => {
    const { container } = renderProgress("rocket");
    const rocketProgress = container.querySelector(".rocket-progress");
    const progressLabel = container.querySelector(".rocket-progress-label");

    expect(rocketProgress).toHaveAttribute("role", "progressbar");
    expect(rocketProgress).toHaveAttribute("aria-valuenow", "0");
    expect(rocketProgress).toHaveAttribute(
      "aria-labelledby",
      progressLabel?.id,
    );
    expect(rocketProgress).toHaveAttribute("data-flight-phase", "ignition");
    expect(rocketProgress).toHaveAttribute("data-orbiting", "false");
    expect(rocketProgress).toHaveAttribute("data-orbit-motion", "continuous");
    expect(rocketProgress).toHaveAttribute("data-launch-sequence", "0");
    expect(
      container.querySelectorAll(".rocket-progress-launch-ring"),
    ).toHaveLength(2);
    expect(
      container.querySelectorAll(".rocket-progress-dust-particle"),
    ).toHaveLength(8);
    expect(container.querySelector(".rocket-ship-vector")).toBeTruthy();
    expect(container.querySelector(".rocket-ship-exhaust-main")).toBeTruthy();
    expect(
      container.querySelector('[data-artwork-source="rocket-camera-ship"]'),
    ).toBeTruthy();
    expect(container.querySelector(".rocket-body")).toBeNull();
  });

  it("emits one launch burst per departure from the launch point", async () => {
    const { container } = renderProgress("rocket");
    const rocketProgress = container.querySelector(".rocket-progress");

    expect(rocketProgress).toHaveAttribute("data-launch-sequence", "0");

    window.scrollY = 1200;
    window.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      expect(rocketProgress).toHaveAttribute("data-launch-sequence", "1");
    });
    const firstBurst = container.querySelector(
      ".rocket-progress-launch-effects",
    );
    expect(firstBurst).toHaveAttribute("data-launch-sequence", "1");

    window.scrollY = 1650;
    window.dispatchEvent(new Event("scroll"));
    await waitFor(() => {
      expect(rocketProgress).toHaveAttribute("aria-valuenow", "75");
    });
    expect(rocketProgress).toHaveAttribute("data-launch-sequence", "1");
    expect(
      container.querySelector(".rocket-progress-launch-effects"),
    ).toBe(firstBurst);

    window.scrollY = 200;
    window.dispatchEvent(new Event("scroll"));
    await waitFor(() => {
      expect(rocketProgress).toHaveAttribute("aria-valuenow", "0");
    });
    expect(rocketProgress).toHaveAttribute("data-launch-sequence", "1");

    window.scrollY = 1200;
    window.dispatchEvent(new Event("scroll"));
    await waitFor(() => {
      expect(rocketProgress).toHaveAttribute("data-launch-sequence", "2");
    });
    expect(
      container.querySelector(".rocket-progress-launch-effects"),
    ).not.toBe(firstBurst);
  });

  it("does not fake a launch when Rocket mounts mid-article", async () => {
    window.scrollY = 1200;
    const { container } = renderProgress("rocket");
    const rocketProgress = container.querySelector(".rocket-progress");

    await waitFor(() => {
      expect(rocketProgress).toHaveAttribute("aria-valuenow", "50");
    });
    expect(rocketProgress).toHaveAttribute("data-started", "true");
    expect(rocketProgress).toHaveAttribute("data-launch-sequence", "0");
  });

  it("keeps linear travel while changing boost power", async () => {
    const { container } = renderProgress("rocket");
    const rocketProgress = container.querySelector<HTMLElement>(
      ".rocket-progress",
    );

    expect(rocketProgress).toBeTruthy();

    window.scrollY = 1200;
    window.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      expect(rocketProgress).toHaveAttribute("aria-valuenow", "50");
    });
    expect(rocketProgress?.style.getPropertyValue("--reading-progress")).toBe(
      "50",
    );
    expect(rocketProgress).toHaveAttribute("data-flight-phase", "boost");
    expect(
      Number(rocketProgress?.style.getPropertyValue("--rocket-boost")),
    ).toBeGreaterThan(0.64);
  });

  it("enters orbit only at completion and exits when scrolling back", async () => {
    const { container } = renderProgress("rocket");
    const rocketProgress = container.querySelector(".rocket-progress");

    window.scrollY = 2098;
    window.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      expect(rocketProgress).toHaveAttribute("data-flight-phase", "approach");
    });
    expect(rocketProgress).toHaveAttribute("data-orbiting", "false");

    window.scrollY = 2100;
    window.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      expect(rocketProgress).toHaveAttribute("data-orbiting", "true");
    });
    expect(rocketProgress).toHaveAttribute("data-flight-phase", "orbit");
    expect(rocketProgress).toHaveAttribute("data-orbit-motion", "continuous");

    window.scrollY = 1650;
    window.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      expect(rocketProgress).toHaveAttribute("data-orbiting", "false");
    });
    expect(rocketProgress).toHaveAttribute("data-flight-phase", "approach");
  });

  it("removes Rocket-only artwork when the theme changes", async () => {
    localStorage.setItem("themeMode", "rocket");
    const { container, getByRole } = render(
      <ThemeProvider>
        <ProgressThemeSwitchHarness />
      </ThemeProvider>,
    );

    expect(container.querySelector(".rocket-ship-vector")).toBeTruthy();
    fireEvent.click(getByRole("button", { name: "Mountain" }));

    await waitFor(() => {
      expect(container.querySelector(".rocket-progress")).toBeNull();
    });
    expect(container.querySelector(".mountain-progress")).toBeTruthy();
    expect(container.querySelector(".rocket-ship-vector")).toBeNull();
    expect(container.querySelector(".rocket-progress-launch-effects")).toBeNull();
  });

  it("cancels a pending progress frame when unmounted", () => {
    const requestFrame = vi
      .spyOn(window, "requestAnimationFrame")
      .mockReturnValue(41);
    const cancelFrame = vi
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation(() => undefined);

    try {
      const { unmount } = renderProgress("rocket");

      window.scrollY = 1200;
      window.dispatchEvent(new Event("scroll"));
      expect(requestFrame).toHaveBeenCalledTimes(1);

      unmount();
      expect(cancelFrame).toHaveBeenCalledWith(41);
    } finally {
      requestFrame.mockRestore();
      cancelFrame.mockRestore();
    }
  });

  it("exposes a stable completion mode when reduced motion is preferred", async () => {
    const originalMatchMedia = window.matchMedia.bind(window);
    const removeEventListener = vi.fn();

    window.matchMedia = vi.fn((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    }));

    try {
      const { container, unmount } = renderProgress("rocket");
      const rocketProgress = container.querySelector(".rocket-progress");

      expect(rocketProgress).toHaveAttribute("data-reduced-motion", "true");
      expect(rocketProgress).toHaveAttribute("data-orbit-motion", "parked");

      window.scrollY = 2100;
      window.dispatchEvent(new Event("scroll"));
      await waitFor(() => {
        expect(rocketProgress).toHaveAttribute("data-orbiting", "true");
      });

      unmount();
      expect(removeEventListener).toHaveBeenCalledWith(
        "change",
        expect.any(Function),
      );
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });
});
