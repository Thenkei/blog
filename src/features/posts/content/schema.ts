import { z } from "zod";

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value: string): boolean {
  if (!isoDateRegex.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed.toISOString().startsWith(value);
}

export const postFrontmatterSchema = z.object({
  title: z.string().trim().min(1),
  subtitle: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  publishedAt: z.string().refine(isValidIsoDate, "publishedAt must be YYYY-MM-DD"),
  updatedAt: z.string().refine(isValidIsoDate, "updatedAt must be YYYY-MM-DD").optional(),
  readTimeMinutes: z.number().int().positive(),
  tags: z.array(z.string().trim().min(1)).min(1),
  seriesId: z.string().trim().min(1).optional(),
  seriesOrder: z.number().int().positive().optional(),
  draft: z.boolean().optional(),
});
