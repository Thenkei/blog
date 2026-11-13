import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePostKeyboardNavigation } from "../../src/features/posts/hooks/usePostKeyboardNavigation";

function Harness({ count = 3 }: { count?: number }) {
  const { cardRefs } = usePostKeyboardNavigation({ enabled: true, count });

  return (
    <>
      <a href="#elsewhere">Elsewhere</a>
      <input aria-label="Search" />
      <div role="menu">
        <button type="button" role="menuitem">
          Menu item
        </button>
      </div>
      {Array.from({ length: count }, (_, index) => (
        <a
          key={index}
          href={`#post-${index}`}
          ref={(element) => {
            cardRefs.current[index] = element;
          }}
        >
          {`Post ${index}`}
        </a>
      ))}
    </>
  );
}

describe("usePostKeyboardNavigation", () => {
  it("moves real focus through the cards with j and k, wrapping at both ends", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.keyboard("j");
    expect(screen.getByRole("link", { name: "Post 0" })).toHaveFocus();

    await user.keyboard("j");
    expect(screen.getByRole("link", { name: "Post 1" })).toHaveFocus();

    await user.keyboard("k");
    await user.keyboard("k");
    expect(screen.getByRole("link", { name: "Post 2" })).toHaveFocus();

    await user.keyboard("j");
    expect(screen.getByRole("link", { name: "Post 0" })).toHaveFocus();
  });

  it("enters the list from the end with k", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.keyboard("k");
    expect(screen.getByRole("link", { name: "Post 2" })).toHaveFocus();
  });

  it("leaves the arrow keys to the page and to the focused control", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const elsewhere = screen.getByRole("link", { name: "Elsewhere" });
    elsewhere.focus();
    await user.keyboard("{ArrowDown}{ArrowUp}{Enter}");

    expect(elsewhere).toHaveFocus();
  });

  it("stays out of the way inside a field or a menu", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const search = screen.getByRole("textbox", { name: "Search" });
    await user.type(search, "jk");
    expect(search).toHaveValue("jk");
    expect(search).toHaveFocus();

    const menuItem = screen.getByRole("menuitem", { name: "Menu item" });
    menuItem.focus();
    await user.keyboard("j");
    expect(menuItem).toHaveFocus();
  });

  it("ignores j and k combined with a modifier", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.keyboard("{Meta>}k{/Meta}{Control>}j{/Control}");
    expect(document.body).toHaveFocus();
  });
});
