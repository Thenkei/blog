import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import "../../src/i18n/config";
import { CopyLinkButtons } from "../../src/features/reading/CopyLinkButtons";

describe("CopyLinkButtons", () => {
  it("keeps section links distinct and copies code instead of a section URL", async () => {
    const article = document.createElement("article");
    article.innerHTML = `
      <div class="post-document">
        <h2>First section</h2>
        <p>Some text.</p>
        <pre><code>const value = 42;\n</code></pre>
        <h2>Second section</h2>
      </div>
      <section class="related-posts">
        <h2>More related posts</h2>
      </section>
    `;
    document.body.append(article);

    const writeText = vi.fn<(value: string) => Promise<void>>().mockResolvedValue(undefined);
    const scrollIntoView = vi.fn();
    (article.querySelector("h2") as HTMLElement).scrollIntoView = scrollIntoView;
    window.history.replaceState({}, "", "#section-1");
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <CopyLinkButtons
        articleRef={{ current: article }}
        contentKey="en:test"
      />,
    );

    await waitFor(() => {
      expect(article.querySelectorAll(".copy-section-button")).toHaveLength(2);
      expect(article.querySelector(".copy-code-button")).toBeInTheDocument();
    });
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" });

    const headings = article.querySelectorAll(".post-document h2");
    const sectionButtons = article.querySelectorAll<HTMLButtonElement>(
      ".copy-section-button",
    );
    expect([...headings].map((heading) => heading.id)).toEqual([
      "section-1",
      "section-2",
    ]);
    expect(sectionButtons[0]?.parentElement).toBe(headings[0]);
    expect(sectionButtons[1]?.parentElement).toBe(headings[1]);
    expect(article.querySelector(".related-posts .copy-section-button")).toBeNull();
    expect(headings[0]).not.toHaveAccessibleName(/Copy link/i);
    expect(sectionButtons[0]).toHaveAccessibleName("Copy link");
    expect(sectionButtons[0]).not.toHaveAttribute("title");
    expect(sectionButtons[0]?.querySelector("svg")).toHaveAttribute(
      "data-copy-icon",
      "link",
    );

    sectionButtons.item(0).click();
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(new URL(writeText.mock.calls[0]?.[0] ?? "").hash).toBe("#section-1");
    expect(sectionButtons[0]).toHaveAccessibleName("Copied");
    expect(sectionButtons[0]).toHaveAttribute("data-copy-state", "copied");
    expect(sectionButtons[0]?.querySelector("svg")).toHaveAttribute(
      "data-copy-icon",
      "check",
    );

    (article.querySelector(".copy-code-button") as HTMLButtonElement).click();
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(2));
    expect(writeText.mock.calls[1]?.[0]).toBe("const value = 42;\n");

    sectionButtons.item(1).click();
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(3));
    expect(new URL(writeText.mock.calls[2]?.[0] ?? "").hash).toBe("#section-2");

    window.history.replaceState({}, "", "/");
  });
});
