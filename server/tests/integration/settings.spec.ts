import { closeTestDb, resetTestDb } from "../setup/testDb";

import request from "supertest";
import { createApp } from "../../src/app";
import { CSRF, setupSuperAdmin, signInAs } from "../setup/helpers";

const app = createApp();
const agent = request.agent(app);

describe("settings", () => {
  beforeEach(async () => {
    await resetTestDb();
    await setupSuperAdmin(agent);
  });
  afterAll(async () => {
    await closeTestDb();
  });

  it("returns sensible defaults before anything is saved", async () => {
    const res = await agent.get("/api/v1/settings");
    expect(res.status).toBe(200);
    expect(res.body.currency).toBe("PKR");
    expect(res.body.business.businessHours.status).toBe("always");
  });

  it("deep-merges a partial business patch without dropping siblings", async () => {
    await agent
      .put("/api/v1/settings")
      .set(CSRF)
      .send({ business: { social: { instagram: "https://instagram.com/x" } } });

    const res = await agent
      .put("/api/v1/settings")
      .set(CSRF)
      .send({ business: { phone: "+92 300 1234567" } });

    expect(res.body.business.phone).toBe("+92 300 1234567");
    expect(res.body.business.social.instagram).toBe("https://instagram.com/x");
  });

  it("lets an EDITOR read settings but not change them", async () => {
    const { agent: editor } = await signInAs(app, "EDITOR");
    expect((await editor.get("/api/v1/settings")).status).toBe(200);
    const put = await editor.put("/api/v1/settings").set(CSRF).send({ business: { phone: "1" } });
    expect(put.status).toBe(403);
  });

  it("requires authentication", async () => {
    const res = await request(app).get("/api/v1/settings");
    expect(res.status).toBe(401);
  });
});
