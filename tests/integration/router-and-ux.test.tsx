import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HelmetProvider } from "react-helmet-async";
import { MDXProvider } from "@mdx-js/react";
import { MemoryRouter } from "react-router-dom";
import "../../src/i18n/config";
import { ThemeProvider } from "../../src/app/providers/ThemeProvider";
import { AppRouter } from "../../src/app/router";
import { ArticleDiagram } from "../../src/shared/components/PostVisual";
import { enhanceCodeBlocks } from "../../src/features/reading/enhanceCodeBlocks";

const lazyContentTimeout = 3_000;

function renderApp(initialPath: string) {
  return render(
    <HelmetProvider>
      <ThemeProvider>
        <MDXProvider components={{ ArticleDiagram }}>
          <MemoryRouter initialEntries={[initialPath]}>
            <AppRouter />
          </MemoryRouter>
        </MDXProvider>
      </ThemeProvider>
    </HelmetProvider>,
  );
}

async function waitForPostHeading(name: string) {
  return waitFor(
    () => screen.getByText(name, { selector: "h2" }),
    { timeout: lazyContentTimeout },
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

describe("routing and UX", () => {
  async function selectTheme(
    user: ReturnType<typeof userEvent.setup>,
    themeName: string,
  ) {
    await user.click(
      screen.getByRole("button", { name: /Appearance:|Apparence:/i }),
    );
    await user.click(
      screen.getByRole("menuitemradio", { name: themeName }),
    );
  }

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
    expect(await waitForPostHeading("The Plot Twist")).toBeInTheDocument();
  });

  it("updates post content and table of contents on locale switch", async () => {
    renderApp("/en/posts/postgresql-unique-nulls");

    expect(await waitForPostHeading("The Plot Twist")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "FR" }));

    expect(await waitForPostHeading("Le dénouement")).toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: "Le dénouement" }),
    ).toBeInTheDocument();
  });

  it("supports keyboard navigation on post list", async () => {
    renderApp("/en");
    await screen.findByText(/Latest Posts/i);

    const [firstPostCard] = await screen.findAllByRole("link", {
      name: / - Read post/i,
    });
    const firstCardLabel = firstPostCard?.getAttribute("aria-label") ?? "";
    const expectedPostTitle = firstCardLabel.replace(
      /\s*-\s*Read post\s*$/i,
      "",
    );
    expect(expectedPostTitle.length).toBeGreaterThan(0);

    window.scrollTo = vi.fn();
    const user = userEvent.setup();
    await user.keyboard("j");
    await user.keyboard("{Enter}");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: expectedPostTitle,
      }),
    ).toBeInTheDocument();
  });

  it("opens post when clicking anywhere on a post card", async () => {
    renderApp("/en");
    const user = userEvent.setup();

    const cardLink = await screen.findByRole("link", {
      name: /2017: When We Built the Future of Eyewear in Less Than a Second - Read post/i,
    });

    expect(cardLink).toHaveClass("post-card");
    expect(within(cardLink).getByRole("list", { name: "Tags" })).toBeInTheDocument();

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

  it("hydrates discovery filters from a shareable query string", async () => {
    renderApp("/en?q=BullMQ&sort=oldest");

    expect(
      await screen.findByText(/Idempotency and Debounce in BullMQ/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/From Smart to Sport: Why I Traded My Apple Watch/i),
    ).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Oldest first")).toBeInTheDocument();
  });

  it("renders durable topic and about pages", async () => {
    const topicView = renderApp("/en/topics/architecture");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Architecture" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Idempotency and Debounce in BullMQ/i),
    ).toBeInTheDocument();
    const topicCards = topicView.container.querySelectorAll(".post-card");
    expect(topicCards.length).toBeGreaterThan(0);
    expect(
      [...topicCards].every((card) => card.querySelector(".post-card-body")),
    ).toBe(true);

    topicView.unmount();
    renderApp("/en/about");
    expect(
      await screen.findByRole("heading", { level: 1, name: "About Morgan" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "GitHub" })).toHaveLength(2);
  });

  it("adds completion and copy controls to post pages", async () => {
    renderApp("/en/posts/jobify-workers-queues-nestjs");
    expect(
      await screen.findByRole("heading", { level: 2, name: "Next recommended" }),
    ).toBeInTheDocument();
    expect((await screen.findAllByRole("button", { name: "Copy link" })).length).toBeGreaterThan(0);
    expect((await screen.findAllByRole("button", { name: "Copy code" })).length).toBeGreaterThan(0);
  });

  it("renders the themed inline document diagram", async () => {
    renderApp("/en/posts/engineering-documents-age-poorly");

    await screen.findByRole("heading", {
      level: 1,
      name: "Why Most Engineering Documents Age Poorly",
    });

    expect(
      await screen.findByRole("img", {
        name: /engineering document lifecycle/i,
      }),
    ).toBeInTheDocument();
  });

  it("highlights supported code fences after the article is ready", async () => {
    renderApp("/en/posts/jobify-workers-queues-nestjs");

    await screen.findByRole("heading", {
      level: 1,
      name: "Jobify over BullMQ: a production pattern for jobs, workers, and queues (with NestJS)",
    });

    await waitFor(() => {
      expect(
        document.querySelector("pre code.language-typescript .hljs-keyword"),
      ).toBeInTheDocument();
    });
  });

  it("highlights YAML and Handlebars fences used by older posts", async () => {
    const article = document.createElement("article");
    article.innerHTML = `
      <pre><code class="language-yaml">jobs:\n  test:\n    runs-on: ubuntu-latest</code></pre>
      <pre><code class="language-handlebars">{{#if enabled}}active{{/if}}</code></pre>
    `;
    document.body.append(article);
    const stopEnhancing = enhanceCodeBlocks(article);

    try {
      await waitFor(() => {
        expect(article.querySelector("pre code.language-yaml")).toHaveAttribute(
          "data-highlighted",
          "yes",
        );
        expect(
          article.querySelector("pre code.language-handlebars"),
        ).toHaveAttribute("data-highlighted", "yes");
      });
    } finally {
      stopEnhancing();
      article.remove();
    }
  });

  it("supports four explicit themes and keeps selection across navigation", async () => {
    renderApp("/en");
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", { name: /Appearance:/i }),
    );
    expect(
      await screen.findByRole("menuitemradio", { name: "Light" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: "Dark" })).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: "Mountain" })).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: "Rocket" })).toBeInTheDocument();

    await user.click(screen.getByRole("menuitemradio", { name: "Mountain" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "mountain");
    expect(document.querySelector(".mountain-camera-shell")).toBeTruthy();

    const cardLink = await screen.findByRole("link", {
      name: /2017: When We Built the Future of Eyewear in Less Than a Second - Read post/i,
    });
    await user.click(cardLink);

    expect(document.documentElement).toHaveAttribute("data-theme", "mountain");
    expect(
      screen.getByRole("button", { name: "Appearance: Mountain" }),
    ).toBeInTheDocument();
  });

  it("supports directional keyboard navigation and closes the appearance menu", async () => {
    renderApp("/en");
    const user = userEvent.setup();
    const trigger = await screen.findByRole("button", { name: /Appearance:/i });

    await user.click(trigger);
    const options = screen.getAllByRole("menuitemradio");
    const selectedIndex = options.findIndex(
      (option) => option.getAttribute("aria-checked") === "true",
    );
    expect(selectedIndex).toBeGreaterThanOrEqual(0);
    expect(options[selectedIndex]).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(options[(selectedIndex + 1) % options.length]).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    await user.click(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("renders simple hero on home for light and dark themes", async () => {
    renderApp("/en");
    const user = userEvent.setup();

    await screen.findByRole("button", { name: /Appearance:/i });
    await selectTheme(user, "Light");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(document.querySelector(".simple-theme-hero")).toBeTruthy();

    await selectTheme(user, "Dark");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(document.querySelector(".simple-theme-hero")).toBeTruthy();
  });

  it("renders rocket camera shell on home when rocket theme is selected", async () => {
    renderApp("/en");
    const user = userEvent.setup();

    await screen.findByRole("button", { name: /Appearance:/i });
    await selectTheme(user, "Rocket");

    expect(document.documentElement).toHaveAttribute("data-theme", "rocket");
    expect(document.querySelector(".rocket-camera-shell")).toBeTruthy();
  });

  it("reveals the personal logbook only inside the Rocket theme", async () => {
    renderApp("/en");
    const user = userEvent.setup();

    await screen.findByText(/Latest Posts/i);
    expect(screen.queryByRole("heading", { name: "Logbook" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Signal detected/i }),
    ).not.toBeInTheDocument();

    await selectTheme(user, "Rocket");

    expect(
      await screen.findByRole("link", {
        name: "Signal detected // 3 personal transmissions",
      }),
    ).toHaveAttribute("href", "#rocket-logbook");
    expect(
      screen.getByRole("heading", { level: 2, name: "Logbook" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /Between Stars and Volcanoes - Transmission 001 - visible only here - Read post/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Transmission 001")).toBeInTheDocument();
  });

  it("treats a Rocket transmission as absent outside Rocket", async () => {
    renderApp("/en/posts/stars-volcanoes-childhood-curiosity");

    expect(await screen.findByText(/Latest Posts/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Between Stars and Volcanoes" }),
    ).not.toBeInTheDocument();
  });

  it("guards a Rocket transmission when the active theme changes", async () => {
    localStorage.setItem("themeMode", "rocket");
    renderApp("/en/posts/stars-volcanoes-childhood-curiosity");
    const user = userEvent.setup();

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Between Stars and Volcanoes",
      }),
    ).toBeInTheDocument();
    expect(await waitForPostHeading("Looking up")).toBeInTheDocument();
    await waitFor(() => {
      expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
        "content",
        "noindex,nofollow,noarchive",
      );
    });

    await selectTheme(user, "Light");

    expect(await screen.findByText(/Latest Posts/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Between Stars and Volcanoes" }),
    ).not.toBeInTheDocument();
  });

  it("preserves the active locale switch inside the Rocket logbook", async () => {
    localStorage.setItem("themeMode", "rocket");
    renderApp("/fr/posts/heavencraft-first-systems");
    const user = userEvent.setup();

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /HeavenCraft : quand mon code/i,
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "EN" }));

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /HeavenCraft: When My Code Met Its First Real Players/i,
      }),
    ).toBeInTheDocument();
  });

  it("keeps global header links on the active French locale", async () => {
    renderApp("/fr");

    const navigation = await screen.findByRole("navigation", {
      name: "Navigation principale",
    });
    expect(within(navigation).getByRole("link", { name: "Thèmes" })).toHaveAttribute(
      "href",
      "/fr/topics",
    );
    expect(within(navigation).getByRole("link", { name: "À propos" })).toHaveAttribute(
      "href",
      "/fr/about",
    );
    expect(screen.getByRole("link", { name: "Le blog de Morgan" })).toHaveAttribute(
      "href",
      "/fr",
    );
  });

  it("keeps the French shell on the topics index", async () => {
    renderApp("/fr/topics");

    const navigation = await screen.findByRole("navigation", {
      name: "Navigation principale",
    });
    expect(within(navigation).getByRole("link", { name: "Thèmes" })).toHaveAttribute(
      "href",
      "/fr/topics",
    );
    expect(screen.getByRole("link", { name: "Le blog de Morgan" })).toHaveAttribute(
      "href",
      "/fr",
    );
    expect(screen.getByRole("button", { name: /Apparence:/i })).toBeInTheDocument();
  });
});
