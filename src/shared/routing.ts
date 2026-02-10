import type { PostLocale } from "../features/posts/content";

export function normalizeLocale(value: string | undefined): PostLocale {
  return value === "fr" ? "fr" : "en";
}

export function withLocale(pathname: string, locale: PostLocale): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return `/${locale}`;
  }

  if (segments[0] === "en" || segments[0] === "fr") {
    segments[0] = locale;
    return `/${segments.join("/")}`;
  }

  return `/${locale}/${segments.join("/")}`;
}
