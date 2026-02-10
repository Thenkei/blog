import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme } from "../../src/app/providers/ThemeProvider";

function setMatchMediaPrefersDark(prefersDark: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("prefers-color-scheme") ? prefersDark : false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })),
  });
}

function ThemeProbe() {
  const { themeMode, appliedTheme, setThemeMode } = useTheme();

  return (
    <div>
      <span data-testid="theme-mode">{themeMode}</span>
      <span data-testid="applied-theme">{appliedTheme}</span>
      <button onClick={() => setThemeMode("mountain")} type="button">
        mountain
      </button>
    </div>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses system dark preference on first visit and stores it", () => {
    setMatchMediaPrefersDark(true);

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme-mode")).toHaveTextContent("dark");
    expect(screen.getByTestId("applied-theme")).toHaveTextContent("dark");
    expect(localStorage.getItem("themeMode")).toBe("dark");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("migrates legacy system mode to inferred mode", () => {
    localStorage.setItem("themeMode", "system");
    setMatchMediaPrefersDark(false);

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme-mode")).toHaveTextContent("light");
    expect(localStorage.getItem("themeMode")).toBe("light");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("migrates legacy theme key into themeMode", () => {
    localStorage.setItem("theme", "rocket");
    setMatchMediaPrefersDark(false);

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme-mode")).toHaveTextContent("rocket");
    expect(localStorage.getItem("themeMode")).toBe("rocket");
    expect(localStorage.getItem("theme")).toBeNull();
  });

  it("persists explicit theme updates", () => {
    setMatchMediaPrefersDark(false);

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "mountain" }));

    expect(screen.getByTestId("theme-mode")).toHaveTextContent("mountain");
    expect(localStorage.getItem("themeMode")).toBe("mountain");
    expect(document.documentElement).toHaveAttribute("data-theme", "mountain");
  });
});
