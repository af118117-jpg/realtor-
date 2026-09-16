import type { Property, PropertyMedia } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { getSettings } from "../settings/settings.service";
import type { z } from "zod";
import type { publicLeadSchema, publicPropertyListQuerySchema } from "./public.schemas";

const MIN_SUBMIT_MS = 3000; // faster than this is almost certainly scripted, not typed

type PropertyWithImages = Property & { media: PropertyMedia[] };

const PUBLIC_INCLUDE = {
  // Images only: videos are not part of the public listing shape yet, and
  // documents (title deeds, payment records) are never public.
  media: { where: { type: "IMAGE" as const, isPrivate: false }, orderBy: { sortOrder: "asc" as const } },
};

const imageUrl = (m: PropertyMedia) => m.url || `/api/v1/media/${m.mediaId}/file`;

export function publicType(propertyType: string | null, listingType: Property["listingType"]): "buy" | "rent" | "commercial" {
  if (propertyType && /commercial|office|shop/i.test(propertyType)) return "commercial";
  return listingType === "RENT" ? "rent" : "buy";
}

export function publicStatus(status: Property["status"]): "available" | "sold" | "rented" {
  if (status === "SOLD") return "sold";
  if (status === "RENTED") return "rented";
  return "available";
}

/** Pure spam verdict, split out from submitPublicLead so it's unit-testable
 * without a database. true = looks like spam, should be silently discarded. */
export function isSpamSubmission(input: { company?: string | null; renderedAt?: number | null }): boolean {
  const isHoneypotTripped = !!input.company && input.company.length > 0;
  const isTooFast = input.renderedAt != null && Date.now() - input.renderedAt < MIN_SUBMIT_MS;
  return isHoneypotTripped || isTooFast;
}

/** The public site's Listing shape (see js/listings-data.js). Only fields a
 * visitor may see: no street address, agent, reference code, or private
 * media. The keys the site already reads are unchanged; canonical names and
 * newer public fields are added alongside them. */
export function toPublicListing(property: PropertyWithImages) {
  const sorted = [...property.media].sort(
    (a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.sortOrder - b.sortOrder,
  );
  const cover = sorted[0];
  const price = property.price != null ? Number(property.price) : null;
  const area = property.area != null ? Number(property.area) : null;

  return {
    id: property.id,
    slug: property.slug,
    demo: property.fromPublicSample,
    title: property.title,
    type: publicType(property.propertyType, property.listingType),
    category: property.propertyType,
    status: publicStatus(property.status),
    price,
    priceUnit: property.listingType === "RENT" ? "per-month" : "total",
    beds: property.bedrooms,
    baths: property.bathrooms,
    areaValue: area,
    areaUnit: property.areaUnit,
    locality: property.location,
    featured: property.featured,
    listedAt: property.createdAt.toISOString(),
    image: cover ? imageUrl(cover) : null,
    gallery: sorted.map(imageUrl),
    summary: property.description ? property.description.slice(0, 220) : "",

    // Canonical names and newer public fields.
    propertyType: property.propertyType,
    listingType: property.listingType,
    currency: property.currency,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    area,
    city: property.city,
    location: property.location,
    latitude: property.latitude != null ? Number(property.latitude) : null,
    longitude: property.longitude != null ? Number(property.longitude) : null,
    amenities: property.amenities,
    parking: property.parking,
    furnished: property.furnished,
    yearBuilt: property.yearBuilt,
    verified: property.verified,
    images: sorted.map((m) => ({ url: imageUrl(m), altText: m.altText ?? property.title, isFeatured: m.isFeatured })),
  };
}

export async function listPublicProperties(query: z.infer<typeof publicPropertyListQuerySchema>) {
  const properties = await prisma.property.findMany({
    where: { status: "ACTIVE" },
    include: PUBLIC_INCLUDE,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });

  let listings = properties.map(toPublicListing);

  if (query.type) listings = listings.filter((l) => l.type === query.type);
  if (query.category) listings = listings.filter((l) => l.category === query.category);
  if (query.city) listings = listings.filter((l) => l.city?.toLowerCase() === query.city!.toLowerCase());
  if (query.beds != null) listings = listings.filter((l) => (l.beds ?? 0) >= query.beds!);
  if (query.minPrice != null) listings = listings.filter((l) => l.price == null || l.price >= query.minPrice!);
  if (query.maxPrice != null) listings = listings.filter((l) => l.price == null || l.price <= query.maxPrice!);

  return listings;
}

/** The subset of Settings the public site is allowed to see: the business
 * details it already displays (name, phone, address, social, hours,
 * currency). The admin's own profile and anything else stays server-side. */
export async function getPublicSettings() {
  const settings = await getSettings();
  const business = (settings.business as Record<string, unknown>) || {};
  return {
    business: {
      siteName: business.siteName ?? "",
      phone: business.phone ?? "",
      phoneSecondary: business.phoneSecondary ?? "",
      email: business.email ?? "",
      officeAddress: business.officeAddress ?? "",
      social: business.social ?? {},
      businessHours: business.businessHours ?? { status: "always", customText: "" },
    },
    currency: settings.currency ?? "PKR",
    currencySymbol: settings.currencySymbol ?? "₨",
  };
}

/** Looks a published listing up by id or slug. */
export async function getPublicProperty(idOrSlug: string) {
  const property = await prisma.property.findFirst({
    where: { status: "ACTIVE", OR: [{ id: idOrSlug }, { slug: idOrSlug.toLowerCase() }] },
    include: PUBLIC_INCLUDE,
  });
  return property ? toPublicListing(property) : null;
}

/** Returns true if the submission was accepted (and persisted). A "spam"
 * verdict returns false so the caller can still show the visitor a normal
 * success state — never revealing to a bot which check it tripped. */
export async function submitPublicLead(input: z.infer<typeof publicLeadSchema>): Promise<boolean> {
  if (isSpamSubmission(input)) return false;

  // A stale/invalid propertyRef (e.g. a listing that's since been
  // unpublished or deleted) must not fail the whole submission — the lead
  // is still real and worth keeping, just without the property link. The
  // site may refer to a listing by id, slug, or reference code.
  let propertyId: string | null = null;
  if (input.propertyRef) {
    const match = await prisma.property.findFirst({
      where: {
        OR: [{ id: input.propertyRef }, { slug: input.propertyRef.toLowerCase() }, { referenceCode: input.propertyRef }],
      },
      select: { id: true },
    });
    if (match) propertyId = match.id;
  }

  await prisma.lead.create({
    data: {
      name: input.name,
      phone: input.phone,
      email: input.email ? input.email.toLowerCase() : null,
      message: input.message || null,
      propertyId,
      intent: input.intent || null,
      budget: input.budget || null,
      timeline: input.timeline || null,
      locality: input.locality || null,
      consent: input.consent,
      source: "public-form",
      status: "NEW",
    },
  });
  return true;
}
