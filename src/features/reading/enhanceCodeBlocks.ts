import type { LanguageFn } from "highlight.js";

type HighlightLanguageModule = {
  default: LanguageFn;
};

function languageFromClassName(block: HTMLElement): string | null {
  const languageClass = Array.from(block.classList).find((className) =>
    className.startsWith("language-"),
  );

  return languageClass?.slice("language-".length).toLowerCase() ?? null;
}

async function highlightCodeBlocks(
  blocks: HTMLElement[],
  isCancelled: () => boolean,
): Promise<void> {
  if (blocks.length === 0) {
    return;
  }

  const [{ default: hljs }, javascript, typescript, sql, json, bash, yaml, handlebars, plaintext] =
    await Promise.all([
      import("highlight.js/lib/core"),
      import("highlight.js/lib/languages/javascript") as Promise<HighlightLanguageModule>,
      import("highlight.js/lib/languages/typescript") as Promise<HighlightLanguageModule>,
      import("highlight.js/lib/languages/sql") as Promise<HighlightLanguageModule>,
      import("highlight.js/lib/languages/json") as Promise<HighlightLanguageModule>,
      import("highlight.js/lib/languages/bash") as Promise<HighlightLanguageModule>,
      import("highlight.js/lib/languages/yaml") as Promise<HighlightLanguageModule>,
      import("highlight.js/lib/languages/handlebars") as Promise<HighlightLanguageModule>,
      import("highlight.js/lib/languages/plaintext") as Promise<HighlightLanguageModule>,
    ]);

  if (isCancelled()) {
    return;
  }

  hljs.registerLanguage("javascript", javascript.default);
  hljs.registerLanguage("js", javascript.default);
  hljs.registerLanguage("typescript", typescript.default);
  hljs.registerLanguage("ts", typescript.default);
  hljs.registerLanguage("sql", sql.default);
  hljs.registerLanguage("json", json.default);
  hljs.registerLanguage("bash", bash.default);
  hljs.registerLanguage("sh", bash.default);
  hljs.registerLanguage("shell", bash.default);
  hljs.registerLanguage("yaml", yaml.default);
  hljs.registerLanguage("yml", yaml.default);
  hljs.registerLanguage("handlebars", handlebars.default);
  hljs.registerLanguage("hbs", handlebars.default);
  hljs.registerLanguage("text", plaintext.default);
  hljs.registerLanguage("plaintext", plaintext.default);

  blocks.forEach((block) => {
    if (isCancelled()) {
      return;
    }

    const language = languageFromClassName(block);

    // Content can contain a language that this small client bundle does not
    // know yet. Leave it as readable source instead of making Highlight.js
    // emit a warning and falling back implicitly.
    if (language && !hljs.getLanguage(language)) {
      return;
    }

    try {
      block.removeAttribute("data-highlighted");
      hljs.highlightElement(block);
    } catch (error) {
      console.error("Failed to highlight code block", { language, error });
    }
  });
}

export function enhanceCodeBlocks(article: HTMLElement): () => void {
  let cancelled = false;
  const codeBlocks = Array.from(article.querySelectorAll<HTMLElement>("pre code"));

  void highlightCodeBlocks(codeBlocks, () => cancelled).catch((error) => {
    if (!cancelled) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Failed to enhance article code blocks", { message });
    }
  });

  return () => {
    cancelled = true;
  };
}
