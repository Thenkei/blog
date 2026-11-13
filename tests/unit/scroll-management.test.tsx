import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { useScrollManagement } from "../../src/app/useScrollManagement";

function Layout() {
  useScrollManagement();
  const navigate = useNavigate();

  return (
    <>
      <Link to="/list">List</Link>
      <Link to="/post">Post</Link>
      <Link to="/list?category=ai" replace>
        Filter
      </Link>
      <Link to="/post" replace state={{ preserveScroll: true }}>
        Same page, other language
      </Link>
      <button type="button" onClick={() => void navigate(-1)}>
        Back
      </button>
    </>
  );
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<Layout />} />
      </Routes>
    </MemoryRouter>,
  );
}

/** jsdom has no layout: fake the reader scrolling to a position. */
async function scrollPageTo(top: number) {
  Object.defineProperty(window, "scrollY", { configurable: true, value: top });
  await act(async () => {
    window.dispatchEvent(new Event("scroll"));
    await new Promise((resolve) => window.requestAnimationFrame(resolve));
  });
}

describe("useScrollManagement", () => {
  const scrollTo = vi.fn();

  beforeEach(() => {
    scrollTo.mockClear();
    window.scrollTo = scrollTo;
    window.sessionStorage.clear();
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  });

  afterEach(() => {
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  });

  it("opens a new page at the top instead of inheriting the scroll", async () => {
    const user = userEvent.setup();
    renderAt("/list");
    await scrollPageTo(1800);

    await user.click(screen.getByRole("link", { name: "Post" }));

    expect(scrollTo).toHaveBeenLastCalledWith(0, 0);
  });

  it("returns to the saved position on back", async () => {
    const user = userEvent.setup();
    renderAt("/list");
    await scrollPageTo(1800);
    await user.click(screen.getByRole("link", { name: "Post" }));
    await scrollPageTo(0);
    scrollTo.mockClear();

    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(scrollTo).toHaveBeenCalledWith(0, 1800);
  });

  it("leaves the scroll alone when only the filters change", async () => {
    const user = userEvent.setup();
    renderAt("/list");
    await scrollPageTo(900);
    scrollTo.mockClear();

    await user.click(screen.getByRole("link", { name: "Filter" }));

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("keeps the reader's place when a navigation asks for it", async () => {
    const user = userEvent.setup();
    renderAt("/list");
    await scrollPageTo(2400);
    scrollTo.mockClear();

    await user.click(
      screen.getByRole("link", { name: "Same page, other language" }),
    );

    expect(scrollTo).toHaveBeenCalledWith(0, 2400);
    expect(scrollTo).not.toHaveBeenCalledWith(0, 0);
  });

  it("does not move on a replace to the page already open", async () => {
    // Re-applying the current filters replaces the entry with an identical
    // one; that must not throw the reader back to the top.
    const user = userEvent.setup();
    renderAt("/list");
    await scrollPageTo(1200);
    scrollTo.mockClear();

    await user.click(screen.getByRole("link", { name: "List" }));

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("takes over scroll restoration from the browser while mounted", () => {
    // jsdom does not implement the property.
    Object.defineProperty(window.history, "scrollRestoration", {
      configurable: true,
      writable: true,
      value: "auto",
    });

    const { unmount } = renderAt("/list");
    expect(window.history.scrollRestoration).toBe("manual");

    unmount();
    expect(window.history.scrollRestoration).toBe("auto");

    Reflect.deleteProperty(window.history, "scrollRestoration");
  });
});
