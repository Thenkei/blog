import { useEffect, type RefObject } from "react";
import { useTranslation } from "react-i18next";

type CopyLinkButtonsProps = { articleRef: RefObject<HTMLElement | null>; contentKey: string };

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export function CopyLinkButtons({ articleRef, contentKey }: CopyLinkButtonsProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const article = articleRef.current;
    if (!article) return;

    const addButton = (target: HTMLElement, label: string, index: number) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "copy-link-button";
      button.textContent = label;
      button.setAttribute("aria-label", label);
      button.addEventListener("click", () => {
        const id = target.id || `code-${index + 1}`;
        target.id = id;
        void copyText(`${window.location.origin}${window.location.pathname}#${id}`).then(() => {
          button.textContent = t("ui.copied");
          window.setTimeout(() => { button.textContent = label; }, 1400);
        });
      });
      if (target.tagName === "H2") {
        target.insertAdjacentElement("afterend", button);
      } else {
        target.append(button);
      }
    };

    const headings = Array.from(article.querySelectorAll<HTMLElement>("h2"));
    headings.forEach((heading, index) => addButton(heading, t("ui.copyLink"), index));
    const blocks = Array.from(article.querySelectorAll<HTMLElement>("pre"));
    blocks.forEach((block, index) => addButton(block, t("ui.copyCode"), index));

    return () => article.querySelectorAll(".copy-link-button").forEach((button) => button.remove());
  }, [articleRef, contentKey, t]);

  return null;
}
