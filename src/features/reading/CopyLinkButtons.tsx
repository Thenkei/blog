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

function createIcon(kind: CopyButtonOptions["icon"]): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");

  const paths: Array<[string, string]> = kind === "link"
    ? [
        ["path", "M10 13a5 5 0 0 0 7.07.07l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15"],
        ["path", "M14 11a5 5 0 0 0-7.07-.07l-2 2A5 5 0 0 0 12 20l1.15-1.15"],
      ]
      : [
        ["path", "M8 8h11v11H8z"],
        ["path", "M5 16H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1"],
      ];

  paths.forEach(([tagName, pathData]) => {
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
  button.title = options.label;

  const label = document.createElement("span");
  label.className = "copy-link-button-label";
  label.textContent = options.label;
  button.append(createIcon(options.icon), label);

  button.addEventListener("click", () => {
    if (button.disabled) return;

    button.disabled = true;
    void copyText(options.getValue())
      .then(() => {
        label.textContent = copiedLabel;
        button.setAttribute("aria-label", copiedLabel);
        button.title = copiedLabel;
        button.dataset.copyState = "copied";
        scheduleReset(() => {
          label.textContent = options.label;
          button.setAttribute("aria-label", options.label);
          button.title = options.label;
          delete button.dataset.copyState;
          button.disabled = false;
        });
      })
      .catch(() => {
        label.textContent = failedLabel;
        button.setAttribute("aria-label", failedLabel);
        button.title = failedLabel;
        button.dataset.copyState = "failed";
        scheduleReset(() => {
          label.textContent = options.label;
          button.setAttribute("aria-label", options.label);
          button.title = options.label;
          delete button.dataset.copyState;
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

export function CopyLinkButtons({ articleRef, contentKey }: CopyLinkButtonsProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const article = articleRef.current;
    if (!article) return;

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
    const headings = Array.from(article.querySelectorAll<HTMLElement>("h2"));
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

    const codeBlocks = Array.from(article.querySelectorAll<HTMLElement>("pre"));
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
      article.querySelectorAll(".copy-link-button").forEach((button) => button.remove());
      article.querySelectorAll(".copy-link-heading").forEach((heading) => {
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
