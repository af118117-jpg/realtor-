import fs from "fs";
import path from "path";
import { STORAGE_ROOT } from "../../middleware/upload";
import { ApiError } from "../../lib/apiError";
import { prisma } from "../../lib/prisma";
import { kindToDir, resolveMediaKind } from "./media.util";

export async function createFromUpload(file: Express.Multer.File, uploadedById: string | null) {
  const kind = resolveMediaKind(file.mimetype);
  // Always stored with forward slashes so a database written on Windows still
  // resolves if the app later runs on Linux (or in the Docker image).
  const storagePath = `${kindToDir(kind)}/${file.filename}`;
  return prisma.media.create({
    data: {
      kind,
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storagePath,
      isPrivate: kind === "DOCUMENT", // documents are always private
      uploadedById,
    },
  });
}

export async function listMedia(kind?: "IMAGE" | "VIDEO" | "DOCUMENT") {
  return prisma.media.findMany({
    where: kind ? { kind } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function getMediaOrThrow(id: string) {
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) throw ApiError.notFound("Media not found");
  return media;
}

export function absolutePathFor(storagePath: string): string {
  return path.join(STORAGE_ROOT, storagePath);
}

/** Mirrors media-page.js's client-side "used by N properties" check —
 * server-side, so it's authoritative rather than advisory. */
export async function findReferences(mediaId: string) {
  const rows = await prisma.propertyMedia.findMany({
    where: { OR: [{ mediaId }, { thumbnailMediaId: mediaId }] },
    select: { property: { select: { id: true, title: true } } },
  });

  const byId = new Map<string, { id: string; title: string }>();
  for (const row of rows) byId.set(row.property.id, row.property);
  return { properties: Array.from(byId.values()) };
}

export async function deleteMedia(id: string) {
  const media = await getMediaOrThrow(id);
  const { properties } = await findReferences(id);
  await prisma.media.delete({ where: { id } }); // cascades/nulls references per schema.prisma

  const abs = absolutePathFor(media.storagePath);
  fs.unlink(abs, (err) => {
    if (err && err.code !== "ENOENT") {
      // Best-effort: the DB row is already gone; a lingering orphaned file on
      // disk is a cleanup nuisance, not a correctness problem worth failing
      // the request over.
      // eslint-disable-next-line no-console
      console.error(`Failed to remove media file ${abs}:`, err.message);
    }
  });
  return { media, referencedBy: properties.map((p) => p.id) };
}
