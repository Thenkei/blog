const RECOVERY_KEY_PREFIX = "blog:preload-error-reload:";

type RecoveryDependencies = {
  storage: Pick<Storage, "getItem" | "setItem">;
  reload: () => void;
};

function recoveryKey(error: Error): string {
  const failureId = error.message.trim() || error.name;
  return `${RECOVERY_KEY_PREFIX}${failureId}`;
}

export function recoverFromPreloadError(
  event: VitePreloadErrorEvent,
  dependencies: RecoveryDependencies = {
    storage: window.sessionStorage,
    reload: () => window.location.reload(),
  },
): boolean {
  const key = recoveryKey(event.payload);

  try {
    if (dependencies.storage.getItem(key)) {
      return false;
    }

    // Persist the attempt before reloading so a genuinely incomplete deploy
    // cannot trap the browser in a reload loop.
    dependencies.storage.setItem(key, "attempted");
  } catch {
    // Without durable per-tab state, a bounded automatic recovery is not
    // possible. Let Vite surface the original import error instead.
    return false;
  }

  event.preventDefault();
  dependencies.reload();
  return true;
}

export function installPreloadErrorRecovery(): () => void {
  const handlePreloadError = (event: VitePreloadErrorEvent) => {
    recoverFromPreloadError(event);
  };

  window.addEventListener("vite:preloadError", handlePreloadError);
  return () => window.removeEventListener("vite:preloadError", handlePreloadError);
}
