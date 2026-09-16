import { closeTestDb, resetTestDb, testPrisma } from "../setup/testDb";

import request from "supertest";
import { createApp } from "../../src/app";
import { CSRF, setupSuperAdmin, signInAs } from "../setup/helpers";

const app = createApp();
const agent = request.agent(app);
const FAKE_IMAGE = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

describe("properties CRUD", () => {
  beforeEach(async () => {
    await resetTestDb();
    await setupSuperAdmin(agent);
  });
  afterAll(async () => {
    await closeTestDb();
  });

  it("creates a draft with only a title, generating a slug and defaults, then publishes it", async () => {
    const create = await agent.post("/api/v1/properties").set(CSRF).send({ title: "Test Villa" });
    expect(create.status).toBe(201);
    expect(create.body).toMatchObject({ status: "DRAFT", slug: "test-villa", currency: "PKR", verified: false, featured: false });
    const id = create.body.id;

    const publish = await agent.patch(`/api/v1/properties/${id}/status`).set(CSRF).send({ status: "ACTIVE" });
    expect(publish.status).toBe(200);
    expect(publish.body.status).toBe("ACTIVE");
  });

  it("gives a second listing with the same title a distinct slug", async () => {
    const a = await agent.post("/api/v1/properties").set(CSRF).send({ title: "Corner House" });
    const b = await agent.post("/api/v1/properties").set(CSRF).send({ title: "Corner House" });
    expect(a.body.slug).toBe("corner-house");
    expect(b.body.slug).toMatch(/^corner-house-[0-9a-f]{6}$/);
  });

  it("rejects a client-chosen slug that is already taken with 409", async () => {
    await agent.post("/api/v1/properties").set(CSRF).send({ title: "One", slug: "my-listing" });
    const dup = await agent.post("/api/v1/properties").set(CSRF).send({ title: "Two", slug: "my-listing" });
    expect(dup.status).toBe(409);
  });

  it("rejects creating a property with no title", async () => {
    const res = await agent.post("/api/v1/properties").set(CSRF).send({});
    expect(res.status).toBe(400);
  });

  it("stores the canonical model and returns canonical fields plus v1 aliases", async () => {
    const res = await agent
      .post("/api/v1/properties")
      .set(CSRF)
      .send({
        title: "Canonical House",
        propertyType: "House",
        listingType: "SALE",
        price: 45000000,
        currency: "pkr",
        bedrooms: 4,
        bathrooms: 5,
        area: 1,
        areaUnit: "Kanal",
        city: "Islamabad",
        location: "DHA Phase 2",
        address: "Street 1",
        latitude: 33.5651,
        longitude: 73.0169,
        amenities: ["Lawn", "Lawn", "Security"],
        parking: 2,
        furnished: true,
        yearBuilt: 2021,
        featured: true,
        verified: true,
        referenceCode: "RS-100",
      });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      propertyType: "House",
      currency: "PKR",
      bedrooms: 4,
      bathrooms: 5,
      area: 1,
      city: "Islamabad",
      location: "DHA Phase 2",
      latitude: 33.5651,
      longitude: 73.0169,
      amenities: ["Lawn", "Security"],
      furnished: true,
      yearBuilt: 2021,
      verified: true,
      referenceCode: "RS-100",
      // v1 aliases read by the existing admin panel
      category: "House",
      beds: 4,
      baths: 5,
      areaValue: 1,
      locality: "DHA Phase 2",
      constructionYear: 2021,
      propertyId: "RS-100",
    });
    expect(typeof res.body.price).toBe("number");
  });

  it("accepts the admin panel's legacy payload unchanged", async () => {
    const res = await agent
      .post("/api/v1/properties")
      .set(CSRF)
      .send({
        propertyId: null,
        title: "Legacy Villa",
        category: "Villa",
        listingType: "SALE",
        price: 1000,
        description: null,
        areaValue: 10,
        areaUnit: "Marla",
        beds: 3,
        baths: 2,
        parking: null,
        floors: 2,
        constructionYear: 2019,
        locality: "Bahria Town",
        address: null,
        mapUrl: null,
        amenities: [],
        status: "DRAFT",
        featured: false,
        images: [{ mediaId: null, externalSrc: "assets/images/listings/villa.jpg", isCover: true, position: 0 }],
        videos: [{ type: "YOUTUBE", mediaId: null, url: "https://youtu.be/abc", videoId: "abc", name: null, thumbnailUrl: null, thumbnailMediaId: null, position: 0 }],
        documents: [],
      });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ propertyType: "Villa", bedrooms: 3, location: "Bahria Town", yearBuilt: 2019, floors: 2 });
    expect(res.body.images).toEqual([
      expect.objectContaining({ externalSrc: "assets/images/listings/villa.jpg", isCover: true, position: 0 }),
    ]);
    expect(res.body.videos).toEqual([expect.objectContaining({ type: "YOUTUBE", videoId: "abc", url: "https://youtu.be/abc" })]);
    expect(res.body.media.map((m: { type: string }) => m.type)).toEqual(["IMAGE", "VIDEO"]);
  });

  it("replaces images wholesale on update, keeping videos it was not sent", async () => {
    const create = await agent
      .post("/api/v1/properties")
      .set(CSRF)
      .send({
        title: "Test House",
        images: [{ externalSrc: "a.jpg", isCover: true, position: 0 }],
        videos: [{ type: "YOUTUBE", videoId: "xyz" }],
      });
    const id = create.body.id;
    expect(create.body.images).toHaveLength(1);

    const update = await agent
      .put(`/api/v1/properties/${id}`)
      .set(CSRF)
      .send({
        title: "Test House",
        images: [
          { externalSrc: "b.jpg", isCover: true, position: 0 },
          { externalSrc: "c.jpg", isCover: true, position: 1 },
        ],
      });
    expect(update.status).toBe(200);
    expect(update.body.images.map((i: { externalSrc: string }) => i.externalSrc)).toEqual(["b.jpg", "c.jpg"]);
    // only one cover survives
    expect(update.body.images.map((i: { isCover: boolean }) => i.isCover)).toEqual([true, false]);
    // a YouTube id alone is turned into a playable URL, and was not wiped
    expect(update.body.videos).toEqual([expect.objectContaining({ videoId: "xyz", url: "https://www.youtube.com/watch?v=xyz" })]);
  });

  it("leaves fields the client did not send unchanged, but clears explicit nulls", async () => {
    const create = await agent
      .post("/api/v1/properties")
      .set(CSRF)
      .send({ title: "Partial", city: "Lahore", latitude: 31.5, longitude: 74.3, furnished: false, beds: 3 });
    const id = create.body.id;

    // What the legacy panel sends: no city/latitude/furnished — it doesn't know them.
    const update = await agent.put(`/api/v1/properties/${id}`).set(CSRF).send({ title: "Partial", beds: null });
    expect(update.body).toMatchObject({ city: "Lahore", latitude: 31.5, longitude: 74.3, furnished: false, bedrooms: null });
  });

  it("keeps an image's alt text when the legacy panel re-saves the gallery", async () => {
    const create = await agent
      .post("/api/v1/properties")
      .set(CSRF)
      .send({ title: "Alt", media: [{ type: "IMAGE", url: "front.jpg", altText: "Front elevation", isFeatured: true }] });

    const resave = await agent
      .put(`/api/v1/properties/${create.body.id}`)
      .set(CSRF)
      .send({ title: "Alt", images: [{ externalSrc: "front.jpg", isCover: true }] });
    expect(resave.body.media[0].altText).toBe("Front elevation");
  });

  it("validates media references: unknown ids and wrong file kinds are 400, documents are forced private", async () => {
    const unknown = await agent
      .post("/api/v1/properties")
      .set(CSRF)
      .send({ title: "Bad", images: [{ mediaId: "does-not-exist", isCover: true }] });
    expect(unknown.status).toBe(400);

    const doc = await agent
      .post("/api/v1/media")
      .set(CSRF)
      .attach("file", Buffer.from("%PDF-1.4"), { filename: "deed.pdf", contentType: "application/pdf" });
    const docAsImage = await agent.post("/api/v1/properties").set(CSRF).send({ title: "Bad", images: [{ mediaId: doc.body.id }] });
    expect(docAsImage.status).toBe(400);

    const ok = await agent
      .post("/api/v1/properties")
      .set(CSRF)
      .send({ title: "Deeds", documents: [{ mediaId: doc.body.id, name: "Deed" }] });
    expect(ok.status).toBe(201);
    expect(ok.body.documents).toEqual([expect.objectContaining({ mediaId: doc.body.id, isPrivate: true })]);
  });

  it("rejects unsafe URLs and out-of-range values", async () => {
    const js = await agent.post("/api/v1/properties").set(CSRF).send({ title: "X", mapUrl: "javascript:alert(1)" });
    expect(js.status).toBe(400);
    const img = await agent.post("/api/v1/properties").set(CSRF).send({ title: "X", images: [{ externalSrc: "data:image/png;base64,AAA" }] });
    expect(img.status).toBe(400);
    const lat = await agent.post("/api/v1/properties").set(CSRF).send({ title: "X", latitude: 91, longitude: 0 });
    expect(lat.status).toBe(400);
    const half = await agent.post("/api/v1/properties").set(CSRF).send({ title: "X", latitude: 30 });
    expect(half.status).toBe(400);
    const price = await agent.post("/api/v1/properties").set(CSRF).send({ title: "X", price: -1 });
    expect(price.status).toBe(400);
  });

  it("assigns an agent, rejects a non-existent one, and nulls it when the agent is deleted", async () => {
    const agentUser = await testPrisma.user.create({ data: { name: "Agent", email: "agent@example.com", passwordHash: "x", role: "EDITOR" } });
    const res = await agent.post("/api/v1/properties").set(CSRF).send({ title: "Assigned", agentId: agentUser.id });
    expect(res.body.agentId).toBe(agentUser.id);

    const bad = await agent.post("/api/v1/properties").set(CSRF).send({ title: "Ghost", agentId: "nope" });
    expect(bad.status).toBe(400);

    await testPrisma.user.delete({ where: { id: agentUser.id } });
    const after = await agent.get(`/api/v1/properties/${res.body.id}`);
    expect(after.body.agentId).toBeNull();
  });

  it("filters the admin list by city, featured and free text", async () => {
    await agent.post("/api/v1/properties").set(CSRF).send({ title: "Islamabad Villa", city: "Islamabad", featured: true });
    await agent.post("/api/v1/properties").set(CSRF).send({ title: "Lahore Flat", city: "Lahore" });

    const byCity = await agent.get("/api/v1/properties").query({ city: "islamabad" });
    expect(byCity.body.items.map((p: { title: string }) => p.title)).toEqual(["Islamabad Villa"]);
    const featured = await agent.get("/api/v1/properties").query({ featured: "true" });
    expect(featured.body.total).toBe(1);
    const q = await agent.get("/api/v1/properties").query({ q: "flat" });
    expect(q.body.items.map((p: { title: string }) => p.title)).toEqual(["Lahore Flat"]);
  });

  it("duplicates a property as a new unverified draft with its media", async () => {
    const create = await agent
      .post("/api/v1/properties")
      .set(CSRF)
      .send({ title: "Original", status: "ACTIVE", featured: true, verified: true, referenceCode: "R-1", images: [{ externalSrc: "a.jpg", isCover: true }] });
    const id = create.body.id;

    const dup = await agent.post(`/api/v1/properties/${id}/duplicate`).set(CSRF);
    expect(dup.status).toBe(201);
    expect(dup.body).toMatchObject({ title: "Original (Copy)", status: "DRAFT", featured: false, verified: false, referenceCode: null });
    expect(dup.body.id).not.toBe(id);
    expect(dup.body.slug).not.toBe(create.body.slug);
    expect(dup.body.images).toHaveLength(1);
  });

  it("deletes a property", async () => {
    const create = await agent.post("/api/v1/properties").set(CSRF).send({ title: "To Delete" });
    const id = create.body.id;

    const del = await agent.delete(`/api/v1/properties/${id}`).set(CSRF);
    expect(del.status).toBe(204);

    const get = await agent.get(`/api/v1/properties/${id}`);
    expect(get.status).toBe(404);
    expect(await testPrisma.propertyMedia.count({ where: { propertyId: id } })).toBe(0);
  });

  it("lets an EDITOR manage listings but not delete them or change verification", async () => {
    const { agent: editor } = await signInAs(app, "EDITOR");
    const create = await editor.post("/api/v1/properties").set(CSRF).send({ title: "Editor Listing" });
    expect(create.status).toBe(201);

    const verify = await editor.put(`/api/v1/properties/${create.body.id}`).set(CSRF).send({ title: "Editor Listing", verified: true });
    expect(verify.status).toBe(403);

    const del = await editor.delete(`/api/v1/properties/${create.body.id}`).set(CSRF);
    expect(del.status).toBe(403);
  });

  it("rejects all of this without authentication", async () => {
    const res = await request(app).get("/api/v1/properties");
    expect(res.status).toBe(401);
  });

  it("uploaded images are served through the media endpoint", async () => {
    const upload = await agent.post("/api/v1/media").set(CSRF).attach("file", FAKE_IMAGE, { filename: "a.jpg", contentType: "image/jpeg" });
    const res = await agent.post("/api/v1/properties").set(CSRF).send({ title: "With Upload", images: [{ mediaId: upload.body.id, isCover: true }] });
    expect(res.body.media[0].url).toBe(`/api/v1/media/${upload.body.id}/file`);
    expect(res.body.images[0].externalSrc).toBeNull();
  });
});
