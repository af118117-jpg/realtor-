// One realistic end-to-end walk through the whole system, as described in
// the implementation plan's "Build order" verification step.
import { closeTestDb, resetTestDb } from "../setup/testDb";

import request from "supertest";
import { createApp } from "../../src/app";
import { CSRF, PASSWORD } from "../setup/helpers";

const app = createApp();
const agent = request.agent(app);
const FAKE_IMAGE = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

describe("end-to-end smoke path", () => {
  beforeEach(async () => {
    await resetTestDb();
  });
  afterAll(async () => {
    await closeTestDb();
  });

  it("setup → login → create+publish property → public visibility → public lead → admin sees lead → delete media → logout", async () => {
    // 1. Setup + login
    const setup = await agent.post("/api/v1/auth/setup").set(CSRF).send({ email: "owner@example.com", name: "Owner", password: PASSWORD });
    expect(setup.status).toBe(201);

    // 2. Upload an image
    const upload = await agent
      .post("/api/v1/media")
      .set(CSRF)
      .attach("file", FAKE_IMAGE, { filename: "villa.jpg", contentType: "image/jpeg" });
    expect(upload.status).toBe(201);

    // 3. Create + publish a property with that image
    const property = await agent
      .post("/api/v1/properties")
      .set(CSRF)
      .send({
        title: "Smoke Test Villa",
        status: "ACTIVE",
        listingType: "SALE",
        price: 45000000,
        images: [{ mediaId: upload.body.id, isCover: true, position: 0 }],
      });
    expect(property.status).toBe(201);
    expect(property.body.status).toBe("ACTIVE");

    // 4. Publicly visible, cross-"device" (any unauthenticated client)
    const publicList = await request(app).get("/api/v1/public/properties");
    const found = publicList.body.find((l: { title: string }) => l.title === "Smoke Test Villa");
    expect(found).toBeDefined();
    expect(found.image).toContain(upload.body.id);

    // 5. A real visitor submits a lead against that property
    const lead = await request(app)
      .post("/api/v1/public/leads")
      .send({
        name: "Interested Buyer",
        phone: "03001234567",
        propertyRef: property.body.id,
        consent: true,
        renderedAt: Date.now() - 10_000,
      });
    expect(lead.status).toBe(201);

    // 6. It shows up in the admin CRM, linked to the right property
    const leads = await agent.get("/api/v1/leads");
    const crmLead = leads.body.items.find((l: { name: string }) => l.name === "Interested Buyer");
    expect(crmLead).toBeDefined();
    expect(crmLead.propertyId).toBe(property.body.id);

    // 7. Delete the referenced media — the property survives, minus that image
    const del = await agent.delete(`/api/v1/media/${upload.body.id}`).set(CSRF);
    expect(del.status).toBe(204);
    const afterDelete = await agent.get(`/api/v1/properties/${property.body.id}`);
    expect(afterDelete.body.images).toEqual([]);

    // 8. Logout, then confirm the session is really gone
    const logout = await agent.post("/api/v1/auth/logout").set(CSRF);
    expect(logout.status).toBe(204);
    const meAfterLogout = await agent.get("/api/v1/auth/me");
    expect(meAfterLogout.status).toBe(401);
  });
});
