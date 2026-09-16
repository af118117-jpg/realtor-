import crypto from "crypto";

const MAX_BASE_LENGTH = 80;

/** Same format the database enforces (Property_slug_format CHECK). */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Kebab-cases a title into a URL-safe slug base: accents are folded
 * ("Café" → "cafe"), punctuation is dropped, runs of spaces/underscores/
 * hyphens become one hyphen. Never returns an empty string. */
export function slugBase(title: string): string {
  const base = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_BASE_LENGTH)
    .replace(/-+$/g, "");
  return base || "listing";
}

/** A slug with a short random suffix, used when the plain base is taken. */
export function suffixedSlug(title: string): string {
  return `${slugBase(title)}-${crypto.randomBytes(3).toString("hex")}`;
}
