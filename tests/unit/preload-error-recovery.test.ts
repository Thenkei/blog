import { describe, expect, it, vi } from "vitest";
import { recoverFromPreloadError } from "../../src/app/preloadErrorRecovery";

function preloadErrorEvent(message: string): VitePreloadErrorEvent {
  const event = new Event("vite:preloadError", {
    cancelable: true,
  }) as VitePreloadErrorEvent;

  Object.defineProperty(event, "payload", {
    value: new TypeError(message),
  });

  return event;
}

function memoryStorage(): Pick<Storage, "getItem" | "setItem"> {
  const entries = new Map<string, string>();

  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
  };
}

describe("preload error recovery", () => {
  it("reloads once for a failed content-hashed chunk", () => {
    const storage = memoryStorage();
    const reload = vi.fn();
    const firstEvent = preloadErrorEvent(
      "Failed to fetch dynamically imported module: /blog/assets/PostPage-old.js",
    );
    const repeatedEvent = preloadErrorEvent(
      "Failed to fetch dynamically imported module: /blog/assets/PostPage-old.js",
    );

    expect(recoverFromPreloadError(firstEvent, { storage, reload })).toBe(true);
    expect(firstEvent.defaultPrevented).toBe(true);
    expect(reload).toHaveBeenCalledOnce();

    expect(recoverFromPreloadError(repeatedEvent, { storage, reload })).toBe(false);
    expect(repeatedEvent.defaultPrevented).toBe(false);
    expect(reload).toHaveBeenCalledOnce();
  });

  it("allows a later deployment with a different failed chunk to recover", () => {
    const storage = memoryStorage();
    const reload = vi.fn();

    recoverFromPreloadError(preloadErrorEvent("PostPage-old.js"), {
      storage,
      reload,
    });

    expect(
      recoverFromPreloadError(preloadErrorEvent("PostPage-new.js"), {
        storage,
        reload,
      }),
    ).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("does not reload when the attempt cannot be persisted", () => {
    const reload = vi.fn();
    const event = preloadErrorEvent("PostPage-missing.js");
    const storage = {
      getItem: () => {
        throw new Error("storage unavailable");
      },
      setItem: vi.fn(),
    };

    expect(recoverFromPreloadError(event, { storage, reload })).toBe(false);
    expect(event.defaultPrevented).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
