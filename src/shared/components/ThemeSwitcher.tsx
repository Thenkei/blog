import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import type { ThemeMode } from "../../app/providers/ThemeProvider";

type ThemeSwitcherProps = {
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  labels: {
    appearance: string;
    lightTheme: string;
    darkTheme: string;
    mountainTheme: string;
    rocketTheme: string;
    themeSwitcher: string;
  };
  variant?: "default" | "compact";
};

const THEME_GLYPHS: Record<ThemeMode, string> = {
  light: "○",
  dark: "●",
  mountain: "△",
  rocket: "↗",
};
const THEME_MODES: readonly ThemeMode[] = [
  "light",
  "dark",
  "mountain",
  "rocket",
];

export function ThemeSwitcher({
  themeMode,
  onThemeChange,
  labels,
  variant = "default",
}: ThemeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();
  const themeOptions: Array<{ mode: ThemeMode; label: string }> = [
    { mode: "light", label: labels.lightTheme },
    { mode: "dark", label: labels.darkTheme },
    { mode: "mountain", label: labels.mountainTheme },
    { mode: "rocket", label: labels.rocketTheme },
  ];
  const activeOption =
    themeOptions.find((option) => option.mode === themeMode) ?? {
      mode: "light" as const,
      label: labels.lightTheme,
    };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const selectedIndex = Math.max(THEME_MODES.indexOf(themeMode), 0);
    optionRefs.current[selectedIndex]?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setIsOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, themeMode]);

  const handleOptionKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    optionIndex: number,
  ) => {
    let nextIndex: number | null = null;

    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      nextIndex = (optionIndex + 1) % themeOptions.length;
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      nextIndex =
        (optionIndex - 1 + themeOptions.length) % themeOptions.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = themeOptions.length - 1;
    }

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    optionRefs.current[nextIndex]?.focus();
  };

  const className = `theme-menu-container${variant === "compact" ? " compact" : ""}`;

  return (
    <div className={className} ref={containerRef}>
      <button
        ref={triggerRef}
        className="theme-menu-trigger"
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={`${labels.appearance}: ${activeOption.label}`}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="theme-menu-glyph" aria-hidden="true">
          {THEME_GLYPHS[themeMode]}
        </span>
        <span className="theme-menu-trigger-copy">{labels.appearance}</span>
        <span className="theme-menu-current">{activeOption.label}</span>
        <span className="theme-menu-chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {isOpen ? (
        <div
          className="theme-menu"
          id={menuId}
          role="menu"
          aria-label={labels.themeSwitcher}
        >
          {themeOptions.map((option, optionIndex) => (
            <button
              key={option.mode}
              ref={(element) => {
                optionRefs.current[optionIndex] = element;
              }}
              className={`theme-menu-option ${themeMode === option.mode ? "active" : ""}`}
              onClick={() => {
                onThemeChange(option.mode);
                setIsOpen(false);
                triggerRef.current?.focus();
              }}
              type="button"
              role="menuitemradio"
              aria-checked={themeMode === option.mode}
              onKeyDown={(event) => handleOptionKeyDown(event, optionIndex)}
            >
              <span className="theme-menu-option-glyph" aria-hidden="true">
                {THEME_GLYPHS[option.mode]}
              </span>
              <span>{option.label}</span>
              <span className="theme-menu-option-check" aria-hidden="true">
                {themeMode === option.mode ? "✓" : ""}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
