-- Canonical domain model — data-preserving migration from 20260913000000_init.
--
-- Hand-written on purpose: `prisma migrate diff` for this change drops and
-- re-adds every renamed column (beds → bedrooms, category → propertyType, …)
-- and drops the three per-kind media tables outright, which would delete
-- data. This script renames in place and copies rows across instead.
--
-- Also adds CHECK constraints that Prisma's schema language cannot express;
-- they are listed in server/docs/DATABASE.md.
--
-- Runs as one transaction: any failure leaves the database untouched.

BEGIN;

-- ─── New enums ──────────────────────────────────────────────────────────────

CREATE TYPE "PropertyMediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');
CREATE TYPE "VideoProvider" AS ENUM ('FILE', 'YOUTUBE', 'VIMEO');

-- ─── AuditLog (created first so the data changes below can be recorded) ────

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- ─── User: roles, name, email ───────────────────────────────────────────────

-- The enum is recreated rather than extended: a value added with
-- ALTER TYPE … ADD VALUE cannot be used inside the transaction that added it.
CREATE TYPE "Role_new" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EDITOR');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'EDITOR';

ALTER TABLE "User" ADD COLUMN "name" TEXT, ADD COLUMN "email" TEXT;

-- Existing accounts had only a username. Their name becomes that username.
-- Their email becomes the username itself when it already looks like an
-- address, otherwise a placeholder on the reserved `.invalid` TLD (RFC 2606),
-- which can never receive mail. The id suffix keeps it unique. Owners should
-- replace it with a real address.
UPDATE "User"
SET "name" = "username",
    "email" = CASE
        WHEN "username" ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN lower("username")
        ELSE lower(regexp_replace("username", '[^A-Za-z0-9._-]', '', 'g'))
             || '.' || right("id", 6) || '@users.invalid'
    END;

-- The first account ever created becomes the SUPER_ADMIN.
UPDATE "User" SET "role" = 'SUPER_ADMIN'
WHERE "id" = (SELECT "id" FROM "User" WHERE "role" = 'ADMIN' ORDER BY "createdAt" ASC, "id" ASC LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM "User" WHERE "role" = 'SUPER_ADMIN');

ALTER TABLE "User"
    ALTER COLUMN "name" SET NOT NULL,
    ALTER COLUMN "email" SET NOT NULL,
    ALTER COLUMN "username" DROP NOT NULL;

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");

ALTER TABLE "User"
    ADD CONSTRAINT "User_email_lowercase" CHECK ("email" = lower("email")),
    ADD CONSTRAINT "User_email_format" CHECK ("email" ~ '^[^@\s]+@[^@\s]+$'),
    ADD CONSTRAINT "User_name_not_blank" CHECK (length(btrim("name")) > 0);

-- ─── RefreshToken ───────────────────────────────────────────────────────────

CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- ─── Property ───────────────────────────────────────────────────────────────

ALTER TABLE "Property" RENAME COLUMN "category" TO "propertyType";
ALTER TABLE "Property" RENAME COLUMN "beds" TO "bedrooms";
ALTER TABLE "Property" RENAME COLUMN "baths" TO "bathrooms";
ALTER TABLE "Property" RENAME COLUMN "areaValue" TO "area";
ALTER TABLE "Property" RENAME COLUMN "locality" TO "location";
ALTER TABLE "Property" RENAME COLUMN "constructionYear" TO "yearBuilt";
ALTER TABLE "Property" RENAME COLUMN "propertyId" TO "referenceCode";
ALTER INDEX "Property_propertyId_key" RENAME TO "Property_referenceCode_key";

ALTER TABLE "Property" ALTER COLUMN "area" TYPE DECIMAL(12, 2);

ALTER TABLE "Property"
    ADD COLUMN "slug" TEXT,
    ADD COLUMN "currency" VARCHAR(3) NOT NULL DEFAULT 'PKR',
    ADD COLUMN "city" TEXT,
    ADD COLUMN "latitude" DECIMAL(9, 6),
    ADD COLUMN "longitude" DECIMAL(9, 6),
    ADD COLUMN "furnished" BOOLEAN,
    ADD COLUMN "verified" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "agentId" TEXT;

-- Same shape the API already generated on the fly (title-kebab + id suffix),
-- so any slug a visitor has already seen keeps resolving.
UPDATE "Property"
SET "slug" = COALESCE(
        NULLIF(btrim(regexp_replace(regexp_replace(lower("title"), '[^a-z0-9\s_-]', '', 'g'), '[\s_-]+', '-', 'g'), '-'), ''),
        'listing'
    ) || '-' || lower(right("id", 8));

ALTER TABLE "Property" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");

DROP INDEX "Property_status_idx";
DROP INDEX "Property_listingType_idx";
CREATE INDEX "Property_status_featured_createdAt_idx" ON "Property"("status", "featured", "createdAt");
CREATE INDEX "Property_status_listingType_idx" ON "Property"("status", "listingType");
CREATE INDEX "Property_propertyType_idx" ON "Property"("propertyType");
CREATE INDEX "Property_city_idx" ON "Property"("city");
CREATE INDEX "Property_price_idx" ON "Property"("price");
CREATE INDEX "Property_agentId_idx" ON "Property"("agentId");

ALTER TABLE "Property" ADD CONSTRAINT "Property_agentId_fkey"
    FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Property"
    ADD CONSTRAINT "Property_title_not_blank" CHECK (length(btrim("title")) > 0),
    ADD CONSTRAINT "Property_slug_format" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    ADD CONSTRAINT "Property_currency_format" CHECK ("currency" ~ '^[A-Z]{3}$'),
    ADD CONSTRAINT "Property_price_nonnegative" CHECK ("price" IS NULL OR "price" >= 0),
    ADD CONSTRAINT "Property_area_nonnegative" CHECK ("area" IS NULL OR "area" >= 0),
    ADD CONSTRAINT "Property_bedrooms_nonnegative" CHECK ("bedrooms" IS NULL OR "bedrooms" >= 0),
    ADD CONSTRAINT "Property_bathrooms_nonnegative" CHECK ("bathrooms" IS NULL OR "bathrooms" >= 0),
    ADD CONSTRAINT "Property_parking_nonnegative" CHECK ("parking" IS NULL OR "parking" >= 0),
    ADD CONSTRAINT "Property_floors_nonnegative" CHECK ("floors" IS NULL OR "floors" >= 0),
    ADD CONSTRAINT "Property_yearBuilt_range" CHECK ("yearBuilt" IS NULL OR "yearBuilt" BETWEEN 1800 AND 2100),
    ADD CONSTRAINT "Property_latitude_range" CHECK ("latitude" IS NULL OR "latitude" BETWEEN -90 AND 90),
    ADD CONSTRAINT "Property_longitude_range" CHECK ("longitude" IS NULL OR "longitude" BETWEEN -180 AND 180),
    ADD CONSTRAINT "Property_coordinates_paired" CHECK (("latitude" IS NULL) = ("longitude" IS NULL));

-- ─── Media (file library) ───────────────────────────────────────────────────

ALTER TABLE "Media" ADD COLUMN "uploadedById" TEXT;

DROP INDEX "Media_kind_idx";
CREATE INDEX "Media_kind_createdAt_idx" ON "Media"("kind", "createdAt");
CREATE INDEX "Media_uploadedById_idx" ON "Media"("uploadedById");
CREATE UNIQUE INDEX "Media_storagePath_key" ON "Media"("storagePath");

ALTER TABLE "Media" ADD CONSTRAINT "Media_uploadedById_fkey"
    FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Media"
    ADD CONSTRAINT "Media_size_nonnegative" CHECK ("size" >= 0),
    ADD CONSTRAINT "Media_documents_private" CHECK ("kind" <> 'DOCUMENT' OR "isPrivate");

-- ─── PropertyMedia (replaces PropertyImage / PropertyVideo / PropertyDocument)

CREATE TABLE "PropertyMedia" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "type" "PropertyMediaType" NOT NULL,
    "url" TEXT,
    "mediaId" TEXT,
    "altText" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" "VideoProvider",
    "externalId" TEXT,
    "name" TEXT,
    "thumbnailUrl" TEXT,
    "thumbnailMediaId" TEXT,
    "docType" TEXT,
    "sizeBytes" INTEGER,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PropertyMedia_pkey" PRIMARY KEY ("id")
);

-- Row ids are carried over (cuids are globally unique across the old tables).
-- Rows that pointed at nothing at all (no file and no URL) are not copied:
-- they rendered as broken slots and cannot satisfy the source constraint.
INSERT INTO "PropertyMedia" ("id", "propertyId", "type", "url", "mediaId", "isFeatured", "sortOrder", "isPrivate")
SELECT "id", "propertyId", 'IMAGE', "externalSrc", "mediaId", "isCover", GREATEST("position", 0), false
FROM "PropertyImage"
WHERE "externalSrc" IS NOT NULL OR "mediaId" IS NOT NULL;

INSERT INTO "PropertyMedia" (
    "id", "propertyId", "type", "url", "mediaId", "sortOrder",
    "provider", "externalId", "name", "thumbnailUrl", "thumbnailMediaId", "isPrivate"
)
SELECT
    "id", "propertyId", 'VIDEO',
    COALESCE("url", CASE "type"::text
        WHEN 'YOUTUBE' THEN 'https://www.youtube.com/watch?v=' || "videoId"
        WHEN 'VIMEO' THEN 'https://vimeo.com/' || "videoId"
    END),
    "mediaId", GREATEST("position", 0),
    "type"::text::"VideoProvider", "videoId", "name", "thumbnailUrl", "thumbnailMediaId", false
FROM "PropertyVideo"
WHERE "url" IS NOT NULL OR "mediaId" IS NOT NULL OR "videoId" IS NOT NULL;

INSERT INTO "PropertyMedia" ("id", "propertyId", "type", "mediaId", "sortOrder", "name", "docType", "sizeBytes", "isPrivate")
SELECT "id", "propertyId", 'DOCUMENT', "mediaId",
       (ROW_NUMBER() OVER (PARTITION BY "propertyId" ORDER BY "id") - 1)::int,
       "name", "docType", "size", true
FROM "PropertyDocument";

-- At most one featured item per property and type: keep the first in order.
UPDATE "PropertyMedia" pm SET "isFeatured" = false
WHERE pm."isFeatured" AND EXISTS (
    SELECT 1 FROM "PropertyMedia" o
    WHERE o."propertyId" = pm."propertyId" AND o."type" = pm."type" AND o."isFeatured"
      AND (o."sortOrder", o."id") < (pm."sortOrder", pm."id")
);

CREATE INDEX "PropertyMedia_propertyId_type_sortOrder_idx" ON "PropertyMedia"("propertyId", "type", "sortOrder");
CREATE INDEX "PropertyMedia_mediaId_idx" ON "PropertyMedia"("mediaId");
CREATE INDEX "PropertyMedia_thumbnailMediaId_idx" ON "PropertyMedia"("thumbnailMediaId");

ALTER TABLE "PropertyMedia" ADD CONSTRAINT "PropertyMedia_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PropertyMedia" ADD CONSTRAINT "PropertyMedia_mediaId_fkey"
    FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PropertyMedia" ADD CONSTRAINT "PropertyMedia_thumbnailMediaId_fkey"
    FOREIGN KEY ("thumbnailMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PropertyMedia"
    ADD CONSTRAINT "PropertyMedia_has_source" CHECK ("url" IS NOT NULL OR "mediaId" IS NOT NULL),
    ADD CONSTRAINT "PropertyMedia_sortOrder_nonnegative" CHECK ("sortOrder" >= 0),
    ADD CONSTRAINT "PropertyMedia_sizeBytes_nonnegative" CHECK ("sizeBytes" IS NULL OR "sizeBytes" >= 0),
    ADD CONSTRAINT "PropertyMedia_provider_only_for_video" CHECK (("type" = 'VIDEO') = ("provider" IS NOT NULL)),
    ADD CONSTRAINT "PropertyMedia_documents_private" CHECK ("type" <> 'DOCUMENT' OR "isPrivate");

DROP TABLE "PropertyDocument";
DROP TABLE "PropertyVideo";
DROP TABLE "PropertyImage";
DROP TYPE "VideoType";

-- ─── Lead ───────────────────────────────────────────────────────────────────

-- The status vocabulary changes; record every lead whose value is remapped so
-- the original is never silently lost.
INSERT INTO "AuditLog" ("id", "action", "entityType", "entityId", "metadata")
SELECT gen_random_uuid()::text, 'lead.status_migrated', 'Lead', "id",
       jsonb_build_object(
           'from', "status"::text,
           'to', CASE "status"::text WHEN 'FOLLOW_UP' THEN 'CONTACTED' ELSE 'QUALIFIED' END,
           'migration', '20260914000000_canonical_domain_model'
       )
FROM "Lead"
WHERE "status"::text IN ('FOLLOW_UP', 'INTERESTED');

CREATE TYPE "LeadStatus_new" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED', 'LOST');
ALTER TABLE "Lead" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Lead" ALTER COLUMN "status" TYPE "LeadStatus_new" USING (
    CASE "status"::text
        WHEN 'FOLLOW_UP' THEN 'CONTACTED'
        WHEN 'INTERESTED' THEN 'QUALIFIED'
        ELSE "status"::text
    END
)::"LeadStatus_new";
DROP TYPE "LeadStatus";
ALTER TYPE "LeadStatus_new" RENAME TO "LeadStatus";
ALTER TABLE "Lead" ALTER COLUMN "status" SET DEFAULT 'NEW';

UPDATE "Lead" SET "source" = 'admin' WHERE "source" IS NULL;
ALTER TABLE "Lead" ALTER COLUMN "source" SET DEFAULT 'admin', ALTER COLUMN "source" SET NOT NULL;

-- `date` always equalled `createdAt` (nothing ever set it independently).
ALTER TABLE "Lead" DROP COLUMN "date";

DROP INDEX "Lead_status_idx";
CREATE INDEX "Lead_status_createdAt_idx" ON "Lead"("status", "createdAt");
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");
CREATE INDEX "Lead_email_idx" ON "Lead"("email");
CREATE INDEX "Lead_phone_idx" ON "Lead"("phone");

ALTER TABLE "Lead" ADD CONSTRAINT "Lead_name_not_blank" CHECK (length(btrim("name")) > 0);

-- ─── AuditLog / Settings constraints ────────────────────────────────────────

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Settings" ADD CONSTRAINT "Settings_single_row" CHECK ("id" = 1);

COMMIT;
