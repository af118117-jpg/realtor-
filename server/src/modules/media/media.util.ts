import { env } from "../../config/env";
import { ApiError } from "../../lib/apiError";

export type MediaKind = "IMAGE" | "VIDEO" | "DOCUMENT";

// SVG is deliberately NOT accepted: it is an executable document, and in
// production the API shares an origin with the admin panel, so an uploaded
// SVG served inline could run script against an admin session. Property
// photography has no need for it.
const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_MIME = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const DOCUMENT_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

/** Stored extension is derived from the accepted mime type, never carried over
 * from the client's filename — so an upload can't land on disk as `x.php`. */
const EXTENSION_FOR_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "text/plain": ".txt",
};

export function extensionFor(mimetype: string): string {
  return EXTENSION_FOR_MIME[mimetype] ?? ".bin";
}

/** Storage bucket + validation are derived from the file's own declared
 * mimetype, never from a client-supplied "kind" field — this can't be spoofed
 * into writing a video-sized file into the low-limit document bucket. */
export function resolveMediaKind(mimetype: string): MediaKind {
  if (IMAGE_MIME.has(mimetype)) return "IMAGE";
  if (VIDEO_MIME.has(mimetype)) return "VIDEO";
  if (DOCUMENT_MIME.has(mimetype)) return "DOCUMENT";
  throw ApiError.badRequest(`Unsupported file type: ${mimetype}`);
}

export function kindToDir(kind: MediaKind): "images" | "videos" | "documents" {
  if (kind === "IMAGE") return "images";
  if (kind === "VIDEO") return "videos";
  return "documents";
}

export function maxBytesFor(kind: MediaKind): number {
  const mb = kind === "IMAGE" ? env.MEDIA_MAX_IMAGE_MB : kind === "VIDEO" ? env.MEDIA_MAX_VIDEO_MB : env.MEDIA_MAX_DOCUMENT_MB;
  return mb * 1024 * 1024;
}

/** Strips everything but a short, filesystem-safe slug from an
 * arbitrary client-supplied original filename. */
export function sanitizeBaseName(originalName: string): string {
  const base = originalName.replace(/\.[^./\\]+$/, "");
  const cleaned = base
    .normalize("NFKD")
    .replace(/[^\w-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return cleaned || "file";
}
