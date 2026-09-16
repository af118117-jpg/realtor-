import { Prisma, type MediaKind, type PropertyMediaType, type Role } from "@prisma/client";
import type { z } from "zod";
import { ApiError } from "../../lib/apiError";
import { prisma } from "../../lib/prisma";
import { hasRoleAtLeast } from "../../lib/roles";
import { slugBase, suffixedSlug } from "../../lib/slug";
import type { propertyListQuerySchema, propertyMediaInputSchema, propertyWriteSchema } from "./properties.schemas";

type WriteInput = z.infer<typeof propertyWriteSchema>;
type ListQuery = z.infer<typeof propertyListQuerySchema>;
type MediaInput = z.infer<typeof propertyMediaInputSchema>;

const INCLUDE = {
  media: { orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }] },
} satisfies Prisma.PropertyInclude;

type PropertyWithMedia = Prisma.PropertyGetPayload<{ include: typeof INCLUDE }>;
type MediaRow = PropertyWithMedia["media"][number];
type MediaRowInput = Omit<Prisma.PropertyMediaCreateManyInput, "propertyId" | "id" | "createdAt">;

export const mediaFileUrl = (mediaId: string) => `/api/v1/media/${mediaId}/file`;

const num = (value: Prisma.Decimal | null) => (value == null ? null : Number(value));

/** Scalar fields compared for the audit trail's "changedFields". */
const AUDITED_FIELDS = [
  "title", "slug", "description", "propertyType", "listingType", "status", "price", "currency", "bedrooms",
  "bathrooms", "area", "areaUnit", "city", "location", "address", "latitude", "longitude", "amenities", "parking",
  "furnished", "yearBuilt", "featured", "verified", "agentId", "referenceCode", "floors", "mapUrl",
];

// ─── Serialization ─────────────────────────────────────────────────────────

function serializeMediaItem(m: MediaRow) {
  return {
    id: m.id,
    type: m.type,
    url: m.url ?? (m.mediaId ? mediaFileUrl(m.mediaId) : null),
    mediaId: m.mediaId,
    altText: m.altText,
    isFeatured: m.isFeatured,
    sortOrder: m.sortOrder,
    provider: m.provider,
    externalId: m.externalId,
    name: m.name,
    thumbnailUrl: m.thumbnailUrl ?? (m.thumbnailMediaId ? mediaFileUrl(m.thumbnailMediaId) : null),
    thumbnailMediaId: m.thumbnailMediaId,
    docType: m.docType,
    sizeBytes: m.sizeBytes,
    isPrivate: m.isPrivate,
    createdAt: m.createdAt,
  };
}

/** The API representation: the canonical model, plus the API v1 aliases the
 * existing admin panel reads (`beds`, `category`, `images[]`, …). The aliases
 * are derived from the canonical columns, never stored separately. Prisma's
 * Decimal values become plain numbers here, at the boundary. */
export function serializeProperty(p: PropertyWithMedia) {
  const ofType = (type: PropertyMediaType) => p.media.filter((m) => m.type === type);

  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description,
    propertyType: p.propertyType,
    listingType: p.listingType,
    status: p.status,
    price: num(p.price),
    currency: p.currency,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    area: num(p.area),
    areaUnit: p.areaUnit,
    city: p.city,
    location: p.location,
    address: p.address,
    latitude: num(p.latitude),
    longitude: num(p.longitude),
    amenities: p.amenities,
    parking: p.parking,
    furnished: p.furnished,
    yearBuilt: p.yearBuilt,
    featured: p.featured,
    verified: p.verified,
    agentId: p.agentId,
    referenceCode: p.referenceCode,
    floors: p.floors,
    mapUrl: p.mapUrl,
    fromPublicSample: p.fromPublicSample,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    media: p.media.map(serializeMediaItem),

    // ── API v1 aliases ──
    propertyId: p.referenceCode,
    category: p.propertyType,
    beds: p.bedrooms,
    baths: p.bathrooms,
    areaValue: num(p.area),
    locality: p.location,
    constructionYear: p.yearBuilt,
    images: ofType("IMAGE").map((m) => ({
      id: m.id,
      mediaId: m.mediaId,
      externalSrc: m.mediaId ? null : m.url,
      altText: m.altText,
      isCover: m.isFeatured,
      position: m.sortOrder,
    })),
    videos: ofType("VIDEO").map((m) => ({
      id: m.id,
      type: m.provider ?? "FILE",
      mediaId: m.mediaId,
      url: m.url,
      videoId: m.externalId,
      name: m.name,
      thumbnailUrl: m.thumbnailUrl,
      thumbnailMediaId: m.thumbnailMediaId,
      position: m.sortOrder,
    })),
    documents: ofType("DOCUMENT").map((m) => ({
      id: m.id,
      mediaId: m.mediaId,
      name: m.name,
      size: m.sizeBytes,
      docType: m.docType,
      isPrivate: m.isPrivate,
    })),
  };
}

export type SerializedProperty = ReturnType<typeof serializeProperty>;

// ─── Input resolution ──────────────────────────────────────────────────────

/** Canonical value if the client sent it (including an explicit null),
 * otherwise the legacy alias. `undefined` means "not sent". */
function pick<T>(canonical: T | undefined, legacy: T | undefined): T | undefined {
  return canonical !== undefined ? canonical : legacy;
}

const blankToNull = (v: string | null | undefined) => (v === undefined ? undefined : v?.trim() ? v.trim() : null);

function scalarData(input: WriteInput) {
  return {
    title: input.title,
    description: input.description,
    listingType: input.listingType,
    status: input.status,
    price: input.price,
    currency: input.currency,
    areaUnit: input.areaUnit,
    city: blankToNull(input.city),
    address: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
    amenities: input.amenities,
    parking: input.parking,
    furnished: input.furnished,
    featured: input.featured,
    verified: input.verified,
    agentId: input.agentId,
    floors: input.floors,
    mapUrl: blankToNull(input.mapUrl),
    propertyType: blankToNull(pick(input.propertyType, input.category)),
    bedrooms: pick(input.bedrooms, input.beds),
    bathrooms: pick(input.bathrooms, input.baths),
    area: pick(input.area, input.areaValue),
    location: pick(input.location, input.locality),
    yearBuilt: pick(input.yearBuilt, input.constructionYear),
    referenceCode: blankToNull(pick(input.referenceCode, input.propertyId)),
  };
}

function videoUrlFor(provider: string | null | undefined, externalId: string | null | undefined): string | null {
  if (!externalId) return null;
  if (provider === "YOUTUBE") return `https://www.youtube.com/watch?v=${encodeURIComponent(externalId)}`;
  if (provider === "VIMEO") return `https://vimeo.com/${encodeURIComponent(externalId)}`;
  return null;
}

function fromCanonical(m: MediaInput, idx: number): MediaRowInput {
  const isVideo = m.type === "VIDEO";
  const isDocument = m.type === "DOCUMENT";
  return {
    type: m.type,
    url: isDocument ? null : (m.url ?? (isVideo && !m.mediaId ? videoUrlFor(m.provider, m.externalId) : null)),
    mediaId: m.mediaId ?? null,
    altText: m.altText ?? null,
    isFeatured: isDocument ? false : m.isFeatured,
    sortOrder: m.sortOrder ?? idx,
    provider: isVideo ? m.provider! : null,
    externalId: isVideo ? (m.externalId ?? null) : null,
    name: m.name ?? null,
    thumbnailUrl: isVideo ? (m.thumbnailUrl ?? null) : null,
    thumbnailMediaId: isVideo ? (m.thumbnailMediaId ?? null) : null,
    docType: isDocument ? (m.docType ?? null) : null,
    sizeBytes: m.sizeBytes ?? null,
    isPrivate: isDocument, // documents always private; never client-controlled
  };
}

/** Which media types this write replaces, and the new rows for them.
 * `media[]` replaces everything; each legacy array replaces only its own
 * type, so a client that never sends `documents` never wipes them. */
function resolveMediaRows(input: WriteInput, existing: MediaRow[]): { types: PropertyMediaType[]; rows: MediaRowInput[] } {
  if (input.media) {
    return { types: ["IMAGE", "VIDEO", "DOCUMENT"], rows: input.media.map(fromCanonical) };
  }

  const types: PropertyMediaType[] = [];
  const rows: MediaRowInput[] = [];

  if (input.images) {
    types.push("IMAGE");
    // The legacy editor doesn't know about alt text; carry it over from the
    // existing row showing the same picture so a save never erases it.
    const altByKey = new Map(
      existing.filter((m) => m.type === "IMAGE" && m.altText).map((m) => [m.mediaId ?? m.url, m.altText]),
    );
    input.images.forEach((img, idx) => {
      rows.push(
        fromCanonical(
          {
            type: "IMAGE",
            url: img.mediaId ? null : img.externalSrc,
            mediaId: img.mediaId,
            altText: img.altText ?? altByKey.get((img.mediaId ?? img.externalSrc)!) ?? null,
            isFeatured: img.isCover,
            sortOrder: img.position ?? idx,
          },
          idx,
        ),
      );
    });
  }

  if (input.videos) {
    types.push("VIDEO");
    input.videos.forEach((v, idx) => {
      rows.push(
        fromCanonical(
          {
            type: "VIDEO",
            provider: v.type,
            url: v.url,
            mediaId: v.mediaId,
            externalId: v.videoId,
            name: v.name,
            thumbnailUrl: v.thumbnailUrl,
            thumbnailMediaId: v.thumbnailMediaId,
            isFeatured: false,
            sortOrder: v.position ?? idx,
          },
          idx,
        ),
      );
    });
  }

  if (input.documents) {
    types.push("DOCUMENT");
    input.documents.forEach((d, idx) => {
      rows.push(
        fromCanonical(
          { type: "DOCUMENT", mediaId: d.mediaId, name: d.name, docType: d.docType, sizeBytes: d.size, isFeatured: false },
          idx,
        ),
      );
    });
  }

  return { types, rows };
}

/** Keeps at most one featured item per media type — the first one flagged. */
function enforceSingleFeatured(rows: MediaRowInput[]): MediaRowInput[] {
  const seen = new Set<string>();
  return rows.map((row) => {
    if (!row.isFeatured) return row;
    if (seen.has(row.type)) return { ...row, isFeatured: false };
    seen.add(row.type);
    return row;
  });
}

const EXPECTED_KIND: Record<PropertyMediaType, MediaKind> = { IMAGE: "IMAGE", VIDEO: "VIDEO", DOCUMENT: "DOCUMENT" };

/** Every referenced upload must exist and be the right kind of file — so a
 * public gallery can never be pointed at a private document, for example. */
async function assertMediaReferences(tx: Prisma.TransactionClient, rows: MediaRowInput[]) {
  const expectations: Array<{ id: string; kind: MediaKind; field: string }> = [];
  for (const row of rows) {
    if (row.mediaId) expectations.push({ id: row.mediaId, kind: EXPECTED_KIND[row.type], field: `${row.type.toLowerCase()} mediaId` });
    if (row.thumbnailMediaId) expectations.push({ id: row.thumbnailMediaId, kind: "IMAGE", field: "video thumbnailMediaId" });
  }
  if (!expectations.length) return;

  const found = await tx.media.findMany({
    where: { id: { in: [...new Set(expectations.map((e) => e.id))] } },
    select: { id: true, kind: true },
  });
  const kindById = new Map(found.map((m) => [m.id, m.kind]));

  for (const e of expectations) {
    const kind = kindById.get(e.id);
    if (!kind) throw ApiError.badRequest(`Unknown media file referenced by ${e.field}`, { mediaId: e.id });
    if (kind !== e.kind) {
      throw ApiError.badRequest(`${e.field} must reference a ${e.kind.toLowerCase()} file`, { mediaId: e.id, kind });
    }
  }
}

async function writeMedia(tx: Prisma.TransactionClient, propertyId: string, input: WriteInput, existing: MediaRow[]) {
  const { types, rows } = resolveMediaRows(input, existing);
  if (!types.length) return;

  const finalRows = enforceSingleFeatured(rows);
  await assertMediaReferences(tx, finalRows);
  await tx.propertyMedia.deleteMany({ where: { propertyId, type: { in: types } } });
  if (finalRows.length) {
    await tx.propertyMedia.createMany({ data: finalRows.map((row) => ({ ...row, propertyId })) });
  }
}

function isSlugConflict(err: unknown): boolean {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== "P2002") return false;
  const target = err.meta?.target;
  return Array.isArray(target) ? target.includes("slug") : String(target ?? "").includes("slug");
}

/** Only ADMIN and above may grant or revoke the "verified" badge. */
function assertMayChangeVerified(role: Role | undefined, requested: boolean | undefined, current: boolean) {
  if (requested !== undefined && requested !== current && !hasRoleAtLeast(role, "ADMIN")) {
    throw ApiError.forbidden("Only an admin can change a property's verified status");
  }
}

// ─── Queries & commands ────────────────────────────────────────────────────

export async function listProperties(query: ListQuery) {
  const where: Prisma.PropertyWhereInput = {};
  if (query.status) where.status = query.status;
  const propertyType = query.propertyType ?? query.category;
  if (propertyType) where.propertyType = propertyType;
  if (query.listingType) where.listingType = query.listingType;
  if (query.city) where.city = { equals: query.city, mode: "insensitive" };
  if (query.featured !== undefined) where.featured = query.featured;
  if (query.verified !== undefined) where.verified = query.verified;
  if (query.agentId) where.agentId = query.agentId;
  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: "insensitive" } },
      { location: { contains: query.q, mode: "insensitive" } },
      { city: { contains: query.q, mode: "insensitive" } },
      { referenceCode: { contains: query.q, mode: "insensitive" } },
      { slug: { contains: query.q.toLowerCase() } },
    ];
  }

  const [items, total] = await prisma.$transaction([
    prisma.property.findMany({
      where,
      include: INCLUDE,
      orderBy: { updatedAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.property.count({ where }),
  ]);

  return { items: items.map(serializeProperty), total, page: query.page, pageSize: query.pageSize };
}

async function findWithMedia(id: string) {
  const property = await prisma.property.findUnique({ where: { id }, include: INCLUDE });
  if (!property) throw ApiError.notFound("Property not found");
  return property;
}

export async function getProperty(id: string) {
  return serializeProperty(await findWithMedia(id));
}

export async function createProperty(input: WriteInput, actorRole?: Role) {
  assertMayChangeVerified(actorRole, input.verified, false);
  const data = scalarData(input);
  const requestedSlug = input.slug ?? null;

  // A generated slug starts as the plain title; if another listing already
  // has it, retry with a short random suffix. A slug the client chose is
  // never silently changed — a clash is reported as 409.
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = requestedSlug ?? (attempt === 0 ? slugBase(input.title) : suffixedSlug(input.title));
    try {
      const result = await prisma.$transaction(async (tx) => {
        const created = await tx.property.create({
          data: {
            ...data,
            slug,
            listingType: data.listingType ?? "SALE",
            status: data.status ?? "DRAFT",
            amenities: data.amenities ?? [],
            featured: data.featured ?? false,
            verified: data.verified ?? false,
          },
        });
        await writeMedia(tx, created.id, input, []);
        return tx.property.findUniqueOrThrow({ where: { id: created.id }, include: INCLUDE });
      });
      return serializeProperty(result);
    } catch (err) {
      if (!requestedSlug && isSlugConflict(err)) continue;
      throw err;
    }
  }
  throw ApiError.conflict("Could not generate a unique slug; please supply one");
}

/** Full update. Fields absent from the body are left as they are (so an
 * older client that doesn't know a newer field can't erase it); explicit
 * nulls clear. Returns the before/after snapshots for auditing. */
export async function updateProperty(id: string, input: WriteInput, actorRole?: Role) {
  const before = await findWithMedia(id);
  assertMayChangeVerified(actorRole, input.verified, before.verified);

  const result = await prisma.$transaction(async (tx) => {
    await tx.property.update({
      where: { id },
      data: { ...scalarData(input), slug: input.slug ?? undefined },
    });
    await writeMedia(tx, id, input, before.media);
    return tx.property.findUniqueOrThrow({ where: { id }, include: INCLUDE });
  });

  const after = serializeProperty(result);
  const previous = serializeProperty(before);
  return { property: after, changedFields: changedScalarFields(previous, after) };
}

function changedScalarFields(before: SerializedProperty, after: SerializedProperty): string[] {
  const b = before as unknown as Record<string, unknown>;
  const a = after as unknown as Record<string, unknown>;
  const fields = AUDITED_FIELDS.filter((k) => JSON.stringify(b[k] ?? null) !== JSON.stringify(a[k] ?? null));
  if (JSON.stringify(before.media.map(({ createdAt, id: _id, ...m }) => m)) !== JSON.stringify(after.media.map(({ createdAt, id: _id, ...m }) => m))) {
    fields.push("media");
  }
  return fields;
}

export async function setPropertyStatus(id: string, status: NonNullable<WriteInput["status"]>) {
  const before = await findWithMedia(id);
  const result = await prisma.property.update({ where: { id }, data: { status }, include: INCLUDE });
  return { property: serializeProperty(result), previousStatus: before.status };
}

export async function deleteProperty(id: string) {
  const property = await findWithMedia(id);
  await prisma.property.delete({ where: { id } });
  return { title: property.title, slug: property.slug };
}

export async function duplicateProperty(id: string) {
  const original = await findWithMedia(id);

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const title = `${original.title} (Copy)`;
        const copy = await tx.property.create({
          data: {
            title,
            slug: attempt === 0 ? slugBase(title) : suffixedSlug(title),
            description: original.description,
            propertyType: original.propertyType,
            listingType: original.listingType,
            status: "DRAFT",
            price: original.price,
            currency: original.currency,
            bedrooms: original.bedrooms,
            bathrooms: original.bathrooms,
            area: original.area,
            areaUnit: original.areaUnit,
            city: original.city,
            location: original.location,
            address: original.address,
            latitude: original.latitude,
            longitude: original.longitude,
            amenities: original.amenities,
            parking: original.parking,
            furnished: original.furnished,
            yearBuilt: original.yearBuilt,
            agentId: original.agentId,
            floors: original.floors,
            mapUrl: original.mapUrl,
            // A copy is a new, unpublished listing: not featured, not
            // verified, no reference code, not a demo row.
            featured: false,
            verified: false,
            referenceCode: null,
            fromPublicSample: false,
          },
        });

        if (original.media.length) {
          await tx.propertyMedia.createMany({
            data: original.media.map(({ id: _id, propertyId: _p, createdAt: _c, ...m }) => ({ ...m, propertyId: copy.id })),
          });
        }
        return tx.property.findUniqueOrThrow({ where: { id: copy.id }, include: INCLUDE });
      });
      return serializeProperty(result);
    } catch (err) {
      if (isSlugConflict(err)) continue;
      throw err;
    }
  }
  throw ApiError.conflict("Could not generate a unique slug for the copy");
}
