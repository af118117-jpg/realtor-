// Database-level guarantees: these hold even for writes that bypass the API
// (scripts, a future service, a manual SQL fix), so they are tested directly
// against Prisma rather than through HTTP.
import { Prisma } from "@prisma/client";
import { closeTestDb, resetTestDb, testPrisma as db } from "../setup/testDb";

async function expectRejected(promise: Promise<unknown>, pattern: RegExp) {
  await expect(promise).rejects.toThrow(pattern);
}

const user = (email: string, extra: Partial<Prisma.UserCreateInput> = {}) =>
  db.user.create({ data: { name: "U", email, passwordHash: "hash", ...extra } });

const property = (slug: string, extra: Partial<Prisma.PropertyUncheckedCreateInput> = {}) =>
  db.property.create({ data: { title: "T", slug, ...extra } });

describe("database constraints", () => {
  beforeEach(async () => {
    await resetTestDb();
  });
  afterAll(async () => {
    await closeTestDb();
  });

  describe("User", () => {
    it("defaults new users to the least-privileged role", async () => {
      expect((await user("a@example.com")).role).toBe("EDITOR");
    });

    it("enforces unique email and unique username", async () => {
      await user("a@example.com", { username: "alpha" });
      await expectRejected(user("a@example.com"), /Unique constraint/);
      await expectRejected(user("b@example.com", { username: "alpha" }), /Unique constraint/);
    });

    it("allows many users without a username", async () => {
      await user("a@example.com");
      await expect(user("b@example.com")).resolves.toBeDefined();
    });

    it("stores emails lower-case only, and requires an @", async () => {
      await expectRejected(user("Mixed@Example.com"), /User_email_lowercase/);
      await expectRejected(user("no-at-sign"), /User_email_format/);
    });
  });

  describe("Property", () => {
    it("enforces a unique, well-formed slug", async () => {
      await property("villa-one");
      await expectRejected(property("villa-one"), /Unique constraint/);
      await expectRejected(property("Not A Slug"), /Property_slug_format/);
    });

    it("enforces a unique reference code", async () => {
      await property("a", { referenceCode: "PROP-1" });
      await expectRejected(property("b", { referenceCode: "PROP-1" }), /Unique constraint/);
    });

    it.each([
      ["negative price", { price: -1 }, /Property_price_nonnegative/],
      ["negative area", { area: -5 }, /Property_area_nonnegative/],
      ["negative bedrooms", { bedrooms: -1 }, /Property_bedrooms_nonnegative/],
      ["lower-case currency", { currency: "pkr" }, /Property_currency_format/],
      ["latitude out of range", { latitude: 95, longitude: 10 }, /Property_latitude_range/],
      ["latitude without longitude", { latitude: 30 }, /Property_coordinates_paired/],
      ["implausible year", { yearBuilt: 1200 }, /Property_yearBuilt_range/],
      ["blank title", { title: "   " }, /Property_title_not_blank/],
    ])("rejects %s", async (_label, data, pattern) => {
      await expectRejected(property("x", data as Partial<Prisma.PropertyUncheckedCreateInput>), pattern);
    });

    it("cascades media on delete and detaches (not deletes) leads", async () => {
      const p = await property("with-children");
      await db.propertyMedia.create({ data: { propertyId: p.id, type: "IMAGE", url: "a.jpg" } });
      const lead = await db.lead.create({ data: { name: "L", phone: "1", propertyId: p.id } });

      await db.property.delete({ where: { id: p.id } });

      expect(await db.propertyMedia.count()).toBe(0);
      expect((await db.lead.findUniqueOrThrow({ where: { id: lead.id } })).propertyId).toBeNull();
    });

    it("rejects an agentId that is not a user", async () => {
      await expectRejected(property("ghost", { agentId: "no-such-user" }), /Foreign key constraint/);
    });
  });

  describe("PropertyMedia", () => {
    it("requires a url or an uploaded file", async () => {
      const p = await property("p");
      await expectRejected(db.propertyMedia.create({ data: { propertyId: p.id, type: "IMAGE" } }), /PropertyMedia_has_source/);
    });

    it("keeps documents private and providers on videos only", async () => {
      const p = await property("p");
      const file = await db.media.create({
        data: { kind: "DOCUMENT", name: "d.pdf", mimeType: "application/pdf", size: 1, storagePath: "documents/d.pdf", isPrivate: true },
      });
      await expectRejected(
        db.propertyMedia.create({ data: { propertyId: p.id, type: "DOCUMENT", mediaId: file.id, isPrivate: false } }),
        /PropertyMedia_documents_private/,
      );
      await expectRejected(
        db.propertyMedia.create({ data: { propertyId: p.id, type: "IMAGE", url: "a.jpg", provider: "YOUTUBE" } }),
        /PropertyMedia_provider_only_for_video/,
      );
      await expectRejected(
        db.propertyMedia.create({ data: { propertyId: p.id, type: "VIDEO", url: "https://youtu.be/x" } }),
        /PropertyMedia_provider_only_for_video/,
      );
    });

    it("is removed when its uploaded file is deleted; a deleted thumbnail is only unlinked", async () => {
      const p = await property("p");
      const video = await db.media.create({ data: { kind: "VIDEO", name: "v.mp4", mimeType: "video/mp4", size: 1, storagePath: "videos/v.mp4" } });
      const thumb = await db.media.create({ data: { kind: "IMAGE", name: "t.jpg", mimeType: "image/jpeg", size: 1, storagePath: "images/t.jpg" } });
      const item = await db.propertyMedia.create({
        data: { propertyId: p.id, type: "VIDEO", provider: "FILE", mediaId: video.id, thumbnailMediaId: thumb.id },
      });

      await db.media.delete({ where: { id: thumb.id } });
      expect((await db.propertyMedia.findUniqueOrThrow({ where: { id: item.id } })).thumbnailMediaId).toBeNull();

      await db.media.delete({ where: { id: video.id } });
      expect(await db.propertyMedia.count()).toBe(0);
    });
  });

  describe("Media, Lead, AuditLog, Settings", () => {
    it("never stores a public document file", async () => {
      await expectRejected(
        db.media.create({ data: { kind: "DOCUMENT", name: "d", mimeType: "application/pdf", size: 1, storagePath: "documents/x", isPrivate: false } }),
        /Media_documents_private/,
      );
    });

    it("rejects a duplicate storage path", async () => {
      const data = { kind: "IMAGE" as const, name: "a", mimeType: "image/jpeg", size: 1, storagePath: "images/same.jpg" };
      await db.media.create({ data });
      await expectRejected(db.media.create({ data }), /Unique constraint/);
    });

    it("defaults a lead to NEW from source admin, and rejects a blank name", async () => {
      const lead = await db.lead.create({ data: { name: "L", phone: "1" } });
      expect(lead).toMatchObject({ status: "NEW", source: "admin" });
      await expectRejected(db.lead.create({ data: { name: " ", phone: "1" } }), /Lead_name_not_blank/);
    });

    it("keeps the audit trail when the actor account is deleted", async () => {
      const actor = await user("actor@example.com");
      const entry = await db.auditLog.create({
        data: { actorId: actor.id, actorEmail: actor.email, action: "property.delete", entityType: "Property" },
      });
      await db.user.delete({ where: { id: actor.id } });
      expect(await db.auditLog.findUniqueOrThrow({ where: { id: entry.id } })).toMatchObject({
        actorId: null,
        actorEmail: "actor@example.com",
      });
    });

    it("allows only the single settings row", async () => {
      await db.settings.create({ data: { id: 1, data: {} } });
      await expectRejected(db.settings.create({ data: { id: 2, data: {} } }), /Settings_single_row/);
    });

    it("removes a user's refresh tokens with the user", async () => {
      const u = await user("t@example.com");
      await db.refreshToken.create({ data: { tokenHash: "h", userId: u.id, expiresAt: new Date(Date.now() + 1000) } });
      await db.user.delete({ where: { id: u.id } });
      expect(await db.refreshToken.count()).toBe(0);
    });
  });
});
