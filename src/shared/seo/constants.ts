const env = import.meta.env as Record<string, unknown>;
const configuredSiteUrl = env.VITE_SITE_URL;

export const SITE_URL = (
  typeof configuredSiteUrl === "string" && configuredSiteUrl.length > 0
    ? configuredSiteUrl
    : "https://thenkei.github.io/blog"
).replace(/\/$/, "");

export const SITE_NAME = "Morgan's Blog";
