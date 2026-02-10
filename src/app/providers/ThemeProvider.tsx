import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

export type ThemeMode = "system" | "dark" | "light" | "rocket";
export type AppliedTheme = "dark" | "light" | "rocket";

type ThemeContextValue = {
  themeMode: ThemeMode;
  appliedTheme: AppliedTheme;
  setThemeMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): Exclude<AppliedTheme, "rocket"> {
  if (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

function computeAppliedTheme(mode: ThemeMode): AppliedTheme {
  if (mode === "system") {
    return getSystemTheme();
  }
  return mode;
}

function getInitialThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "system";
  }

  const savedMode = localStorage.getItem("themeMode");
  if (savedMode === "system" || savedMode === "dark" || savedMode === "light" || savedMode === "rocket") {
    return savedMode;
  }

  const oldTheme = localStorage.getItem("theme");
  if (oldTheme === "dark" || oldTheme === "light") {
    localStorage.setItem("themeMode", oldTheme);
    localStorage.removeItem("theme");
    return oldTheme;
  }

  return "system";
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getInitialThemeMode);
  const [appliedTheme, setAppliedTheme] = useState<AppliedTheme>(() =>
    computeAppliedTheme(getInitialThemeMode()),
  );

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem("themeMode", mode);
  }, []);

  useEffect(() => {
    const nextAppliedTheme = computeAppliedTheme(themeMode);
    setAppliedTheme(nextAppliedTheme);
    document.documentElement.setAttribute("data-theme", nextAppliedTheme);
  }, [themeMode]);

  useEffect(() => {
    if (themeMode !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (event: MediaQueryListEvent) => {
      const nextAppliedTheme: AppliedTheme = event.matches ? "dark" : "light";
      setAppliedTheme(nextAppliedTheme);
      document.documentElement.setAttribute("data-theme", nextAppliedTheme);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [themeMode]);

  const value = useMemo(
    () => ({
      themeMode,
      appliedTheme,
      setThemeMode,
    }),
    [appliedTheme, setThemeMode, themeMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return context;
}
