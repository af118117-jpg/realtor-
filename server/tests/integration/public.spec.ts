import { closeTestDb, resetTestDb } from "../setup/testDb";

import request from "supertest";
import { createApp } from "../../src/app";
import { CSRF, setupSuperAdmin } from "../setup/helpers";

const app = createApp();
const agent = request.agent(app);

async function loginAsNewAdmin() {
  await setupSuperAdmin(agent);
}

describe("public endpoints", () => {
  beforeEach(async () => {
    await resetTestDb();
    await loginAsNewAdmin();
  });
  afterAll(async () => {
    await closeTestDb();
  });

  it("only returns ACTIVE properties, never draft/archived ones", async () => {
    const draft = await agent.post("/api/v1/properties").set(CSRF).send({ title: "Draft One" });
    await agent
      .post("/api/v1/properties")
      .set(CSRF)
      .send({ title: "Active One", status: "ACTIVE" });

    const res = await request(app).get("/api/v1/public/properties");
    expect(res.status).toBe(200);
    const titles = res.body.map((l: { title: string }) => l.title);
    expect(titles).toContain("Active One");
    expect(titles).not.toContain("Draft One");
    expect(draft.body.status).toBe("DRAFT");
  });

  it("accepts a real public lead submission", async () => {
    const res = await request(app).post("/api/v1/public/leads").send({
      name: "Jane Visitor",
      phone: "03001234567",
      consent: true,
      renderedAt: Date.now() - 10_000,
    });
    expect(res.status).toBe(201);

    const leads = await agent.get("/api/v1/leads");
    expect(leads.body.items.some((l: { name: string }) => l.name === "Jane Visitor")).toBe(true);
  });

  it("silently discards a honeypot-tripped submission (still reports success)", async () => {
    const res = await request(app).post("/api/v1/public/leads").send({
      name: "Bot",
      phone: "0000000000",
      consent: true,
      company: "I am definitely a bot",
    });
    expect(res.status).toBe(201); // never discloses the spam verdict to the caller

    const leads = await agent.get("/api/v1/leads");
    expect(leads.body.items.some((l: { name: string }) => l.name === "Bot")).toBe(false);
  });

  it("rejects a submission without consent", async () => {
    const res = await request(app).post("/api/v1/public/leads").send({ name: "No Consent", phone: "123", consent: false });
    expect(res.status).toBe(400);
  });

  it("serves a published listing by id or slug, without admin-only fields or documents", async () => {
    const doc = await agent
      .post("/api/v1/media")
      .set(CSRF)
      .attach("file", Buffer.from("%PDF-1.4"), { filename: "deed.pdf", contentType: "application/pdf" });
    const created = await agent
      .post("/api/v1/properties")
      .set(CSRF)
      .send({
        title: "Public Villa",
        status: "ACTIVE",
        city: "Islamabad",
        address: "House 7, Street 9",
        referenceCode: "RS-7",
        media: [
          { type: "IMAGE", url: "assets/a.jpg", altText: "Front", isFeatured: true },
          { type: "DOCUMENT", mediaId: doc.body.id, name: "Deed" },
        ],
      });

    const bySlug = await request(app).get(`/api/v1/public/properties/${created.body.slug}`);
    const byId = await request(app).get(`/api/v1/public/properties/${created.body.id}`);
    expect(bySlug.status).toBe(200);
    expect(byId.body.id).toBe(bySlug.body.id);
    expect(bySlug.body).toMatchObject({ slug: "public-villa", city: "Islamabad", image: "assets/a.jpg", gallery: ["assets/a.jpg"] });
    expect(bySlug.body.images).toEqual([{ url: "assets/a.jpg", altText: "Front", isFeatured: true }]);
    const body = JSON.stringify(bySlug.body);
    expect(body).not.toContain("House 7");
    expect(body).not.toContain("RS-7");
    expect(body).not.toContain(doc.body.id);
  });

  it("links a public lead by slug or reference code", async () => {
    const created = await agent.post("/api/v1/properties").set(CSRF).send({ title: "Ref Listing", status: "ACTIVE", referenceCode: "RS-9" });
    await request(app).post("/api/v1/public/leads").send({ name: "By Slug", phone: "1", consent: true, propertyRef: created.body.slug });
    await request(app).post("/api/v1/public/leads").send({ name: "By Ref", phone: "2", consent: true, propertyRef: "RS-9" });

    const leads = await agent.get("/api/v1/leads").query({ propertyId: created.body.id });
    expect(leads.body.items.map((l: { name: string }) => l.name).sort()).toEqual(["By Ref", "By Slug"]);
    expect(leads.body.items[0].source).toBe("public-form");
  });
});
