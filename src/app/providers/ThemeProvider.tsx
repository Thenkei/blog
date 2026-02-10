import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

export type ThemeMode = "light" | "dark" | "mountain" | "rocket";
export type AppliedTheme = ThemeMode;

type ThemeContextValue = {
  themeMode: ThemeMode;
  appliedTheme: AppliedTheme;
  setThemeMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): "dark" | "light" {
  if (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

function getInitialThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const savedMode = localStorage.getItem("themeMode");
  if (
    savedMode === "dark" ||
    savedMode === "light" ||
    savedMode === "mountain" ||
    savedMode === "rocket"
  ) {
    return savedMode;
  }

  if (savedMode === "system") {
    const migratedMode = getSystemTheme();
    localStorage.setItem("themeMode", migratedMode);
    return migratedMode;
  }

  const oldTheme = localStorage.getItem("theme");
  if (
    oldTheme === "dark" ||
    oldTheme === "light" ||
    oldTheme === "mountain" ||
    oldTheme === "rocket"
  ) {
    localStorage.setItem("themeMode", oldTheme);
    localStorage.removeItem("theme");
    return oldTheme;
  }

  const inferredMode = getSystemTheme();
  localStorage.setItem("themeMode", inferredMode);
  return inferredMode;
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getInitialThemeMode);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem("themeMode", mode);
  }, []);

  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
  }, [themeMode]);

  const value = useMemo(
    () => ({
      themeMode,
      appliedTheme: themeMode,
      setThemeMode,
    }),
    [setThemeMode, themeMode],
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
