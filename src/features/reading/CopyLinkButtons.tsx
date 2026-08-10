import { useEffect, type RefObject } from "react";
import { useTranslation } from "react-i18next";

type CopyLinkButtonsProps = {
  articleRef: RefObject<HTMLElement | null>;
  contentKey: string;
};

type CopyButtonOptions = {
  className: string;
  label: string;
  getValue: () => string;
  icon: "link" | "code";
};

type CopyIcon = CopyButtonOptions["icon"] | "check" | "alert";

function createIcon(kind: CopyIcon): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.dataset.copyIcon = kind;

  const iconPaths: Record<CopyIcon, Array<[string, string]>> = {
    link: [
        ["path", "M10 13a5 5 0 0 0 7.07.07l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15"],
        ["path", "M14 11a5 5 0 0 0-7.07-.07l-2 2A5 5 0 0 0 12 20l1.15-1.15"],
      ],
    code: [
        ["path", "M8 8h11v11H8z"],
        ["path", "M5 16H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1"],
      ],
    check: [["path", "M5 12.5 9.25 17 19 7"]],
    alert: [
      ["path", "M12 8v5"],
      ["path", "M12 17.25h.01"],
      ["path", "M10.3 3.9 2.6 17.25A2 2 0 0 0 4.33 20h15.34a2 2 0 0 0 1.73-2.75L13.7 3.9a2 2 0 0 0-3.4 0Z"],
    ],
  };

  iconPaths[kind].forEach(([tagName, pathData]) => {
    const element = document.createElementNS(
      "http://www.w3.org/2000/svg",
      tagName,
    );
    element.setAttribute("d", pathData);
    element.setAttribute("fill", "none");
    element.setAttribute("stroke", "currentColor");
    element.setAttribute("stroke-width", "1.8");
    element.setAttribute("stroke-linecap", "round");
    element.setAttribute("stroke-linejoin", "round");
    svg.append(element);
  });

  return svg;
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.setAttribute("aria-hidden", "true");
  document.body.append(textarea);
  textarea.select();

  try {
    if (!document.execCommand("copy")) {
      throw new Error("The browser rejected the copy command.");
    }
  } finally {
    textarea.remove();
  }
}

function createCopyButton(
  options: CopyButtonOptions,
  copiedLabel: string,
  failedLabel: string,
  scheduleReset: (callback: () => void) => void,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `copy-link-button ${options.className}`;
  button.setAttribute("aria-label", options.label);

  const label = document.createElement("span");
  label.className = "copy-link-button-label";
  label.textContent = options.label;
  label.setAttribute("aria-live", "polite");

  const setState = (state: "idle" | "copied" | "failed") => {
    const stateLabel = state === "copied"
      ? copiedLabel
      : state === "failed"
        ? failedLabel
        : options.label;
    const icon = state === "copied"
      ? "check"
      : state === "failed"
        ? "alert"
        : options.icon;

    label.textContent = stateLabel;
    button.setAttribute("aria-label", stateLabel);
    button.replaceChildren(createIcon(icon), label);

    if (state === "idle") delete button.dataset.copyState;
    else button.dataset.copyState = state;
  };

  setState("idle");

  button.addEventListener("click", () => {
    if (button.disabled) return;

    button.disabled = true;
    void copyText(options.getValue())
      .then(() => {
        setState("copied");
        scheduleReset(() => {
          setState("idle");
          button.disabled = false;
        });
      })
      .catch(() => {
        setState("failed");
        scheduleReset(() => {
          setState("idle");
          button.disabled = false;
        });
      });
  });

  return button;
}

function ensureUniqueId(
  target: HTMLElement,
  fallback: string,
  usedIds: Set<string>,
): string {
  const base = target.id || fallback;
  let id = base;
  let suffix = 2;

  while (
    usedIds.has(id) ||
    (document.getElementById(id) && document.getElementById(id) !== target)
  ) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }

  target.id = id;
  usedIds.add(id);
  return id;
}

function buildSectionUrl(id: string): string {
  const url = new URL(window.location.href);
  url.hash = id;
  return url.toString();
}

function getCurrentHashId(): string {
  const encodedHash = window.location.hash.slice(1);

  try {
    return decodeURIComponent(encodedHash);
  } catch {
    return encodedHash;
  }
}

export function CopyLinkButtons({ articleRef, contentKey }: CopyLinkButtonsProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const article = articleRef.current;
    if (!article) return;
    const contentRoot = article.querySelector<HTMLElement>(".post-document") ?? article;

    const timers = new Set<number>();
    const scheduleReset = (callback: () => void) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        callback();
      }, 1400);
      timers.add(timer);
    };

    const usedIds = new Set<string>();
    const originalHeadingAriaLabels = new Map<HTMLElement, string | null>();
    const addedCodeBlockClass = new Set<HTMLElement>();
    const headings = Array.from(contentRoot.querySelectorAll<HTMLElement>("h2"));
    headings.forEach((heading, index) => {
      const id = ensureUniqueId(heading, `section-${index + 1}`, usedIds);
      originalHeadingAriaLabels.set(
        heading,
        heading.getAttribute("aria-label"),
      );
      heading.setAttribute("aria-label", heading.textContent?.trim() ?? "");
      heading.classList.add("copy-link-heading");

      const button = createCopyButton(
        {
          className: "copy-section-button",
          label: t("ui.copyLink"),
          icon: "link",
          getValue: () => buildSectionUrl(id),
        },
        t("ui.copied"),
        t("ui.copyFailed"),
        scheduleReset,
      );
      button.dataset.copyTargetId = id;
      heading.append(button);
    });

    const linkedHeading = headings.find((heading) => heading.id === getCurrentHashId());
    linkedHeading?.scrollIntoView({ block: "start" });

    const codeBlocks = Array.from(contentRoot.querySelectorAll<HTMLElement>("pre"));
    codeBlocks.forEach((block) => {
      if (!block.classList.contains("copy-code-block")) {
        block.classList.add("copy-code-block");
        addedCodeBlockClass.add(block);
      }

      const button = createCopyButton(
        {
          className: "copy-code-button",
          label: t("ui.copyCode"),
          icon: "code",
          getValue: () => block.querySelector("code")?.textContent ?? "",
        },
        t("ui.copied"),
        t("ui.copyFailed"),
        scheduleReset,
      );
      block.append(button);
    });

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      contentRoot.querySelectorAll(".copy-link-button").forEach((button) => button.remove());
      contentRoot.querySelectorAll(".copy-link-heading").forEach((heading) => {
        heading.classList.remove("copy-link-heading");
      });
      originalHeadingAriaLabels.forEach((ariaLabel, heading) => {
        if (ariaLabel === null) heading.removeAttribute("aria-label");
        else heading.setAttribute("aria-label", ariaLabel);
      });
      addedCodeBlockClass.forEach((block) => {
        block.classList.remove("copy-code-block");
      });
    };
  }, [articleRef, contentKey, t]);

  return null;
}
