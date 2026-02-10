import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import "../../src/i18n/config";
import { ThemeProvider } from "../../src/app/providers/ThemeProvider";
import { AppRouter } from "../../src/app/router";

function renderApp(initialPath: string) {
  return render(
    <HelmetProvider>
      <ThemeProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <AppRouter />
        </MemoryRouter>
      </ThemeProvider>
    </HelmetProvider>,
  );
}

describe("routing and UX", () => {
  it("resolves /en route", async () => {
    renderApp("/en");
    expect(await screen.findByText(/Latest Posts/i)).toBeInTheDocument();
  });

  it("redirects legacy ?post query to canonical post route", async () => {
    renderApp("/en?post=postgresql-unique-nulls");
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /ON CONFLICT DO UPDATE with nullable columns/i,
      }),
    ).toBeInTheDocument();
  });

  it("updates post content and table of contents on locale switch", async () => {
    renderApp("/en/posts/postgresql-unique-nulls");

    expect(
      await screen.findByRole("heading", { level: 2, name: "The Thing" }),
    ).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "FR" }));

    expect(
      await screen.findByRole("heading", { level: 2, name: "Le truc" }),
    ).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Le truc" })).toBeInTheDocument();
  });

  it("supports keyboard navigation on post list", async () => {
    renderApp("/en");
    await screen.findByText(/Latest Posts/i);

    window.scrollTo = vi.fn();
    const user = userEvent.setup();
    await user.keyboard("j");
    await user.keyboard("{Enter}");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /2017: When We Built the Future of Eyewear in Less Than a Second/i,
      }),
    ).toBeInTheDocument();
  });

  it("opens post when clicking anywhere on a post card", async () => {
    renderApp("/en");
    const user = userEvent.setup();

    const cardLink = await screen.findByRole("link", {
      name: /2017: When We Built the Future of Eyewear in Less Than a Second - Read post/i,
    });

    await user.click(cardLink);

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /2017: When We Built the Future of Eyewear in Less Than a Second/i,
      }),
    ).toBeInTheDocument();
  });

  it("filters posts with local search", async () => {
    renderApp("/en");
    const user = userEvent.setup();

    const input = await screen.findByPlaceholderText(
      /Search by title, summary, or tag/i,
    );
    await user.type(input, "BullMQ");

    await waitFor(() => {
      expect(
        screen.getByText(/Idempotency and Debounce in BullMQ/i),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(/From Smart to Sport: Why I Traded My Apple Watch/i),
      ).not.toBeInTheDocument();
    });
  });

  it("supports four explicit themes and keeps selection across navigation", async () => {
    renderApp("/en");
    const user = userEvent.setup();

    expect(await screen.findByRole("radio", { name: "Light" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Dark" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Mountain" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Rocket" })).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Mountain" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "mountain");
    expect(document.querySelector(".mountain-camera-shell")).toBeTruthy();

    const cardLink = await screen.findByRole("link", {
      name: /2017: When We Built the Future of Eyewear in Less Than a Second - Read post/i,
    });
    await user.click(cardLink);

    expect(document.documentElement).toHaveAttribute("data-theme", "mountain");
    expect(screen.getByRole("radio", { name: "Mountain" })).toHaveAttribute("aria-checked", "true");
  });

  it("renders simple hero on home for light and dark themes", async () => {
    renderApp("/en");
    const user = userEvent.setup();

    await user.click(await screen.findByRole("radio", { name: "Light" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(document.querySelector(".simple-theme-hero")).toBeTruthy();

    await user.click(screen.getByRole("radio", { name: "Dark" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(document.querySelector(".simple-theme-hero")).toBeTruthy();
  });

  it("renders rocket camera shell on home when rocket theme is selected", async () => {
    renderApp("/en");
    const user = userEvent.setup();

    await user.click(await screen.findByRole("radio", { name: "Rocket" }));

    expect(document.documentElement).toHaveAttribute("data-theme", "rocket");
    expect(document.querySelector(".rocket-camera-shell")).toBeTruthy();
  });
});
