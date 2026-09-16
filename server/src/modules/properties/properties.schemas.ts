import { z } from "zod";

/*
 * Property input accepts two vocabularies for the same fields:
 *
 *   canonical (database)   legacy (API v1, sent by the existing admin panel)
 *   propertyType           category
 *   bedrooms / bathrooms   beds / baths
 *   area                   areaValue
 *   location               locality
 *   yearBuilt              constructionYear
 *   referenceCode          propertyId
 *   media[]                images[] + videos[] + documents[]
 *
 * When both are present the canonical one wins. On update, a field that is
 * absent (undefined) is left unchanged; an explicit null clears it.
 */

/** http(s) URLs, or site-relative asset paths such as
 * "assets/images/listings/villa.jpg". Rejects javascript:, data:, and
 * protocol-relative "//host" URLs. */
export function isSafeMediaUrl(value: string): boolean {
  if (value.startsWith("//")) return false;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(value)?.[1];
  if (!scheme) return !/[\s<>"']/.test(value);
  if (!/^https?$/i.test(scheme)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

const mediaUrl = z.string().trim().max(2048).refine(isSafeMediaUrl, "URL must be http(s) or a site-relative path");
const id = z.string().trim().min(1).max(64);
const optionalText = (max: number) => z.string().trim().max(max).nullish();
const count = z.number().int().nonnegative().max(1000).nullish();

// ─── Canonical media item ──────────────────────────────────────────────────

export const propertyMediaInputSchema = z
  .object({
    type: z.enum(["IMAGE", "VIDEO", "DOCUMENT"]),
    url: mediaUrl.nullish(),
    mediaId: id.nullish(),
    altText: optionalText(300),
    isFeatured: z.boolean().default(false),
    sortOrder: z.number().int().nonnegative().optional(),
    provider: z.enum(["FILE", "YOUTUBE", "VIMEO"]).nullish(),
    externalId: optionalText(100),
    name: optionalText(300),
    thumbnailUrl: mediaUrl.nullish(),
    thumbnailMediaId: id.nullish(),
    docType: optionalText(100),
    sizeBytes: z.number().int().nonnegative().nullish(),
  })
  .superRefine((m, ctx) => {
    if (m.type === "DOCUMENT" && !m.mediaId) {
      ctx.addIssue({ code: "custom", path: ["mediaId"], message: "A document must reference an uploaded file" });
    }
    if (m.type === "VIDEO" && !m.provider) {
      ctx.addIssue({ code: "custom", path: ["provider"], message: "A video needs a provider (FILE, YOUTUBE or VIMEO)" });
    }
    if (m.type !== "DOCUMENT" && !m.url && !m.mediaId && !(m.type === "VIDEO" && m.externalId)) {
      ctx.addIssue({ code: "custom", path: ["url"], message: "Provide a url or an uploaded mediaId" });
    }
  });

// ─── Legacy media items (API v1) ────────────────────────────────────────────

// `position` is optional — admin/js/property-editor-page.js encodes order via
// array position alone; the service falls back to the array index.
const legacyImageSchema = z
  .object({
    mediaId: id.nullish(),
    externalSrc: mediaUrl.nullish(),
    altText: optionalText(300),
    isCover: z.boolean().default(false),
    position: z.number().int().nonnegative().optional(),
  })
  .refine((i) => i.mediaId || i.externalSrc, { message: "An image needs a mediaId or externalSrc" });

const legacyVideoSchema = z
  .object({
    type: z.enum(["FILE", "YOUTUBE", "VIMEO"]),
    mediaId: id.nullish(),
    url: mediaUrl.nullish(),
    videoId: optionalText(100),
    name: optionalText(300),
    thumbnailUrl: mediaUrl.nullish(),
    thumbnailMediaId: id.nullish(),
    position: z.number().int().nonnegative().optional(),
  })
  .refine((v) => v.mediaId || v.url || v.videoId, { message: "A video needs a mediaId, url or videoId" });

const legacyDocumentSchema = z.object({
  mediaId: id,
  name: z.string().trim().min(1).max(300),
  size: z.number().int().nonnegative().nullish(),
  docType: optionalText(100),
  // Documents are always private — the API never honors a client attempt to
  // override that, so there is deliberately no isPrivate field here.
});

// ─── Property ───────────────────────────────────────────────────────────────

export const propertyStatusEnum = z.enum(["DRAFT", "ACTIVE", "SOLD", "RENTED", "ARCHIVED"]);
export const listingTypeEnum = z.enum(["SALE", "RENT"]);

const slugInput = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug may contain lowercase letters, digits and single hyphens");

// title is the only hard requirement to save (draft or publish), matching the
// admin editor's own validation.
export const propertyWriteSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    slug: slugInput.nullish(),
    description: z.string().max(20000).nullish(),
    listingType: listingTypeEnum.optional(),
    status: propertyStatusEnum.optional(),
    price: z.number().nonnegative().max(1e12).nullish(),
    currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Currency must be a 3-letter ISO code").optional(),
    areaUnit: optionalText(30),
    city: optionalText(100),
    address: optionalText(500),
    latitude: z.number().min(-90).max(90).nullish(),
    longitude: z.number().min(-180).max(180).nullish(),
    amenities: z
      .array(z.string().trim().max(100))
      .max(100)
      .transform((list) => [...new Set(list.filter(Boolean))])
      .optional(),
    parking: count,
    furnished: z.boolean().nullish(),
    featured: z.boolean().optional(),
    verified: z.boolean().optional(),
    agentId: id.nullish(),
    floors: count,
    mapUrl: z.string().trim().max(2048).refine((v) => v === "" || isSafeMediaUrl(v), "URL must be http(s)").nullish(),

    // canonical ↔ legacy pairs
    propertyType: optionalText(100),
    category: optionalText(100),
    bedrooms: count,
    beds: count,
    bathrooms: count,
    baths: count,
    area: z.number().nonnegative().max(1e10).nullish(),
    areaValue: z.number().nonnegative().max(1e10).nullish(),
    location: optionalText(200),
    locality: optionalText(200),
    yearBuilt: z.number().int().min(1800).max(2100).nullish(),
    constructionYear: z.number().int().min(1800).max(2100).nullish(),
    referenceCode: optionalText(50),
    propertyId: optionalText(50),

    media: z.array(propertyMediaInputSchema).max(200).optional(),
    images: z.array(legacyImageSchema).max(100).optional(),
    videos: z.array(legacyVideoSchema).max(50).optional(),
    documents: z.array(legacyDocumentSchema).max(50).optional(),
  })
  .refine((p) => (p.latitude == null) === (p.longitude == null), {
    message: "latitude and longitude must be provided together",
    path: ["latitude"],
  });

export const propertyListQuerySchema = z.object({
  status: propertyStatusEnum.optional(),
  propertyType: z.string().max(100).optional(),
  category: z.string().max(100).optional(), // legacy alias of propertyType
  listingType: listingTypeEnum.optional(),
  city: z.string().max(100).optional(),
  featured: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  verified: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  agentId: z.string().max(64).optional(),
  q: z.string().max(200).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
});

export const statusPatchSchema = z.object({ status: propertyStatusEnum });
