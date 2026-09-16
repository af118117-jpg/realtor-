import crypto from "crypto";
import fs from "fs";
import multer, { type FileFilterCallback } from "multer";
import path from "path";
import type { Request } from "express";
import { env } from "../config/env";
import { ApiError } from "../lib/apiError";
import { extensionFor, kindToDir, maxBytesFor, resolveMediaKind, sanitizeBaseName } from "../modules/media/media.util";

const STORAGE_ROOT = path.isAbsolute(env.MEDIA_STORAGE_DIR)
  ? env.MEDIA_STORAGE_DIR
  : path.join(process.cwd(), env.MEDIA_STORAGE_DIR);

for (const dir of ["images", "videos", "documents"]) {
  fs.mkdirSync(path.join(STORAGE_ROOT, dir), { recursive: true });
}

export { STORAGE_ROOT };

const storage = multer.diskStorage({
  destination: (_req: Request, file, cb) => {
    try {
      const kind = resolveMediaKind(file.mimetype);
      cb(null, path.join(STORAGE_ROOT, kindToDir(kind)));
    } catch (err) {
      cb(err as Error, "");
    }
  },
  filename: (_req, file, cb) => {
    try {
      // Extension comes from the accepted mime type, not the client's
      // filename, so nothing executable-looking can be written to disk.
      const ext = extensionFor(file.mimetype);
      cb(null, `${crypto.randomUUID()}-${sanitizeBaseName(file.originalname)}${ext}`);
    } catch (err) {
      cb(err as Error, "");
    }
  },
});

function fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
  try {
    resolveMediaKind(file.mimetype); // throws for anything not on the allowlist
    cb(null, true);
  } catch (err) {
    cb(err as Error);
  }
}

// A single global ceiling sized to the largest allowed kind (video). The
// tighter per-kind limits (images/documents) are enforced immediately after
// upload in media.service.ts, since multer's own `limits` can't vary per file.
const GLOBAL_MAX_BYTES = Math.max(
  env.MEDIA_MAX_IMAGE_MB,
  env.MEDIA_MAX_VIDEO_MB,
  env.MEDIA_MAX_DOCUMENT_MB,
) * 1024 * 1024;

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: GLOBAL_MAX_BYTES, files: 1 },
});

export function assertWithinKindLimit(file: Express.Multer.File): void {
  const kind = resolveMediaKind(file.mimetype);
  const max = maxBytesFor(kind);
  if (file.size > max) {
    fs.unlink(file.path, () => undefined);
    const mb = Math.round(max / (1024 * 1024));
    throw ApiError.badRequest(`File exceeds the ${mb}MB limit for this file type.`);
  }
}
