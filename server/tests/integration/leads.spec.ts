import { closeTestDb, resetTestDb, testPrisma } from "../setup/testDb";

import request from "supertest";
import { createApp } from "../../src/app";
import { CSRF, setupSuperAdmin, signInAs } from "../setup/helpers";

const app = createApp();
const agent = request.agent(app);

describe("admin leads CRM", () => {
  beforeEach(async () => {
    await resetTestDb();
    await setupSuperAdmin(agent);
  });
  afterAll(async () => {
    await closeTestDb();
  });

  it("creates a manually-logged lead defaulting to NEW with source admin", async () => {
    const res = await agent.post("/api/v1/leads").set(CSRF).send({ name: "Ali Raza", phone: "0300..." });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ status: "NEW", pipelineStatus: "NEW", source: "admin" });
    expect(res.body.date).toBe(res.body.createdAt);
  });

  it("updates a lead's status via the dedicated patch route", async () => {
    const create = await agent.post("/api/v1/leads").set(CSRF).send({ name: "Ali Raza", phone: "0300" });
    const res = await agent.patch(`/api/v1/leads/${create.body.id}/status`).set(CSRF).send({ status: "CONTACTED" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CONTACTED");
  });

  describe("status vocabulary (canonical vs. the admin panel's legacy list)", () => {
    it("stores legacy values as their canonical equivalents", async () => {
      const followUp = await agent.post("/api/v1/leads").set(CSRF).send({ name: "A", status: "FOLLOW_UP" });
      const interested = await agent.post("/api/v1/leads").set(CSRF).send({ name: "B", status: "INTERESTED" });

      expect(followUp.body).toMatchObject({ pipelineStatus: "CONTACTED", status: "CONTACTED" });
      expect(interested.body).toMatchObject({ pipelineStatus: "QUALIFIED", status: "INTERESTED" });
      const stored = await testPrisma.lead.findUniqueOrThrow({ where: { id: interested.body.id } });
      expect(stored.status).toBe("QUALIFIED");
    });

    it("accepts canonical values including LOST, shown to the legacy panel as CLOSED", async () => {
      const lost = await agent.post("/api/v1/leads").set(CSRF).send({ name: "C", pipelineStatus: "LOST" });
      expect(lost.body).toMatchObject({ pipelineStatus: "LOST", status: "CLOSED" });
    });

    it("does not let a legacy re-save turn a LOST lead into CLOSED", async () => {
      const lost = await agent.post("/api/v1/leads").set(CSRF).send({ name: "C", pipelineStatus: "LOST" });
      // The panel re-submits exactly what it was shown.
      const resave = await agent
        .put(`/api/v1/leads/${lost.body.id}`)
        .set(CSRF)
        .send({ name: "C", phone: "", status: "CLOSED", notes: "called back" });
      expect(resave.body).toMatchObject({ pipelineStatus: "LOST", notes: "called back" });
    });

    it("filters by either vocabulary", async () => {
      await agent.post("/api/v1/leads").set(CSRF).send({ name: "Q", pipelineStatus: "QUALIFIED" });
      await agent.post("/api/v1/leads").set(CSRF).send({ name: "N" });

      const legacy = await agent.get("/api/v1/leads").query({ status: "INTERESTED" });
      const canonical = await agent.get("/api/v1/leads").query({ pipelineStatus: "QUALIFIED" });
      expect(legacy.body.items.map((l: { name: string }) => l.name)).toEqual(["Q"]);
      expect(canonical.body.items.map((l: { name: string }) => l.name)).toEqual(["Q"]);
    });

    it("rejects an unknown status", async () => {
      const res = await agent.post("/api/v1/leads").set(CSRF).send({ name: "X", status: "MAYBE" });
      expect(res.status).toBe(400);
    });
  });

  it("filters by status and free-text query", async () => {
    await agent.post("/api/v1/leads").set(CSRF).send({ name: "Ali Raza", phone: "111" });
    await agent.post("/api/v1/leads").set(CSRF).send({ name: "Sana Khan", phone: "222", status: "CLOSED" });

    const byStatus = await agent.get("/api/v1/leads").query({ status: "CLOSED" });
    expect(byStatus.body.items).toHaveLength(1);
    expect(byStatus.body.items[0].name).toBe("Sana Khan");

    const byQuery = await agent.get("/api/v1/leads").query({ q: "ali" });
    expect(byQuery.body.items).toHaveLength(1);
    expect(byQuery.body.items[0].name).toBe("Ali Raza");
  });

  it("links a lead to a property, rejects a missing property, and survives the property's deletion", async () => {
    const property = await agent.post("/api/v1/properties").set(CSRF).send({ title: "Linked" });
    const lead = await agent.post("/api/v1/leads").set(CSRF).send({ name: "Buyer", propertyId: property.body.id });
    expect(lead.body.propertyId).toBe(property.body.id);

    const bad = await agent.post("/api/v1/leads").set(CSRF).send({ name: "Buyer", propertyId: "missing" });
    expect(bad.status).toBe(400);

    await agent.delete(`/api/v1/properties/${property.body.id}`).set(CSRF);
    const after = await agent.get(`/api/v1/leads/${lead.body.id}`);
    expect(after.status).toBe(200);
    expect(after.body.propertyId).toBeNull();
  });

  it("deletes a lead (ADMIN and above only)", async () => {
    const create = await agent.post("/api/v1/leads").set(CSRF).send({ name: "To Delete", phone: "1" });

    const { agent: editor } = await signInAs(app, "EDITOR");
    const denied = await editor.delete(`/api/v1/leads/${create.body.id}`).set(CSRF);
    expect(denied.status).toBe(403);

    const del = await agent.delete(`/api/v1/leads/${create.body.id}`).set(CSRF);
    expect(del.status).toBe(204);
    const get = await agent.get(`/api/v1/leads/${create.body.id}`);
    expect(get.status).toBe(404);
  });
});
