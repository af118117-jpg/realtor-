import fs from "fs";
import type { Request, Response } from "express";
import { ApiError } from "../../lib/apiError";
import { assertWithinKindLimit } from "../../middleware/upload";
import { AuditAction, recordAudit } from "../audit/audit.service";
import * as service from "./media.service";

export async function upload(req: Request, res: Response) {
  const file = req.file;
  if (!file) throw ApiError.badRequest("No file uploaded (expected multipart field 'file')");
  assertWithinKindLimit(file);
  const media = await service.createFromUpload(file, req.user?.sub ?? null);
  await recordAudit(req, {
    action: AuditAction.MEDIA_UPLOAD,
    entityType: "Media",
    entityId: media.id,
    metadata: { kind: media.kind, name: media.name, size: media.size, mimeType: media.mimeType },
  });
  res.status(201).json(media);
}

export async function list(req: Request, res: Response) {
  const kind = req.query.kind as "IMAGE" | "VIDEO" | "DOCUMENT" | undefined;
  res.json(await service.listMedia(kind));
}

export async function get(req: Request, res: Response) {
  res.json(await service.getMediaOrThrow(req.params.id));
}

export async function references(req: Request, res: Response) {
  await service.getMediaOrThrow(req.params.id);
  res.json(await service.findReferences(req.params.id));
}

export async function remove(req: Request, res: Response) {
  const { media, referencedBy } = await service.deleteMedia(req.params.id);
  await recordAudit(req, {
    action: AuditAction.MEDIA_DELETE,
    entityType: "Media",
    entityId: media.id,
    metadata: { kind: media.kind, name: media.name, detachedFromProperties: referencedBy },
  });
  res.status(204).send();
}

/** Streams the file, honoring Range requests (so <video> scrubbing works) —
 * ported from server.js's own Range logic. Private files (documents) are
 * gated by requireAuth on the route; public ones stream with a long cache. */
export async function serveFile(req: Request, res: Response) {
  const media = await service.getMediaOrThrow(req.params.id);
  const absPath = service.absolutePathFor(media.storagePath);

  let stat: fs.Stats;
  try {
    stat = fs.statSync(absPath);
  } catch {
    throw ApiError.notFound("File missing from storage");
  }

  const cacheControl = media.isPrivate ? "no-store" : "public, max-age=31536000, immutable";
  // Documents are never rendered in place — forcing a download keeps anything
  // the browser might otherwise execute out of the page's origin.
  const disposition = media.kind === "DOCUMENT" ? "attachment" : "inline";
  const range = req.headers.range;

  /** Streams a file range, destroying the response rather than crashing the
   * process if the file disappears mid-send (e.g. a concurrent delete). */
  function pipeFile(options?: { start: number; end: number }) {
    const stream = fs.createReadStream(absPath, options);
    stream.on("error", () => res.destroy());
    stream.pipe(res);
  }

  if (range && /^bytes=/.test(range)) {
    const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
    const start = startStr === "" ? 0 : Number(startStr);
    const end = endStr === undefined || endStr === "" ? stat.size - 1 : Number(endStr);

    // Every one of these guards matters: a malformed range like `bytes=5-2`
    // or `bytes=0-abc` used to pass a laxer check, commit a 206 response, and
    // then throw inside createReadStream with the headers already sent.
    const invalid =
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < 0 ||
      end < start ||
      start >= stat.size;

    if (invalid) {
      res.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
      return res.end();
    }

    const safeEnd = Math.min(end, stat.size - 1);
    res.writeHead(206, {
      "Content-Type": media.mimeType,
      "Content-Range": `bytes ${start}-${safeEnd}/${stat.size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": safeEnd - start + 1,
      "Cache-Control": cacheControl,
    });
    return pipeFile({ start, end: safeEnd });
  }

  res.writeHead(200, {
    "Content-Type": media.mimeType,
    "Content-Length": stat.size,
    "Accept-Ranges": "bytes",
    "Cache-Control": cacheControl,
    "Content-Disposition": `${disposition}; filename="${encodeURIComponent(media.name)}"`,
  });
  return pipeFile();
}
