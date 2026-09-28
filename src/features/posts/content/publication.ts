// Publication rule shared by the app and scripts/generate-static-artifacts.mjs,
// so the listing, direct routes, RSS and sitemap never disagree on what is live.
// Keep this file to erasable TypeScript: Node imports it without a build step.

export type PublicationFields = {
  draft?: boolean | undefined;
  publishedAt: string;
};

export type PublicationClock = {
  /** Current UTC date, YYYY-MM-DD. */
  today: string;
  /** Show posts dated in the future (dev preview). Drafts stay hidden regardless. */
  includeScheduled: boolean;
};

export function utcToday(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Dates are ISO YYYY-MM-DD, so lexical order is chronological order. */
export function isScheduled(post: PublicationFields, today: string): boolean {
  return post.publishedAt > today;
}

export function isPublished(post: PublicationFields, clock: PublicationClock): boolean {
  if (post.draft) return false;
  return clock.includeScheduled || !isScheduled(post, clock.today);
}
