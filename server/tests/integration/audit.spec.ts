import { closeTestDb, resetTestDb, testPrisma } from "../setup/testDb";

import request from "supertest";
import { createApp } from "../../src/app";
import { CSRF, PASSWORD, setupSuperAdmin, signInAs } from "../setup/helpers";

const app = createApp();
const agent = request.agent(app);

const actions = async () =>
  (await testPrisma.auditLog.findMany({ orderBy: { createdAt: "asc" } })).map((e) => e.action);

describe("audit log", () => {
  beforeEach(async () => {
    await resetTestDb();
    await setupSuperAdmin(agent, { email: "owner@example.com" });
  });
  afterAll(async () => {
    await closeTestDb();
  });

  it("records the important admin actions with actor, entity and request context", async () => {
    const property = await agent.post("/api/v1/properties").set(CSRF).send({ title: "Audited" });
    await agent.put(`/api/v1/properties/${property.body.id}`).set(CSRF).send({ title: "Audited", price: 100 });
    await agent.patch(`/api/v1/properties/${property.body.id}/status`).set(CSRF).send({ status: "ACTIVE" });
    await agent.put("/api/v1/settings").set(CSRF).send({ business: { phone: "+92 300 0000000" } });
    await agent.delete(`/api/v1/properties/${property.body.id}`).set(CSRF);

    expect(await actions()).toEqual([
      "auth.setup",
      "property.create",
      "property.update",
      "property.status_change",
      "settings.update",
      "property.delete",
    ]);

    const update = await testPrisma.auditLog.findFirstOrThrow({ where: { action: "property.update" } });
    expect(update).toMatchObject({ entityType: "Property", entityId: property.body.id, actorEmail: "owner@example.com" });
    expect(update.actorId).toBeTruthy();
    expect(update.metadata).toEqual({ changedFields: ["price"] });
    expect(update.ipAddress).toBeTruthy();

    const status = await testPrisma.auditLog.findFirstOrThrow({ where: { action: "property.status_change" } });
    expect(status.metadata).toEqual({ from: "DRAFT", to: "ACTIVE" });
  });

  it("does not record a no-op update", async () => {
    const property = await agent.post("/api/v1/properties").set(CSRF).send({ title: "Same" });
    await agent.put(`/api/v1/properties/${property.body.id}`).set(CSRF).send({ title: "Same" });
    expect(await actions()).not.toContain("property.update");
  });

  it("records failed logins without the attempted password", async () => {
    await request(app).post("/api/v1/auth/login").set(CSRF).send({ email: "owner@example.com", password: "wrong-password-123" });
    await request(app).post("/api/v1/auth/login").set(CSRF).send({ email: "owner@example.com", password: PASSWORD });

    const failed = await testPrisma.auditLog.findFirstOrThrow({ where: { action: "auth.login_failed" } });
    expect(failed.actorId).toBeNull();
    expect(failed.metadata).toEqual({ identifier: "owner@example.com" });
    expect(JSON.stringify(await testPrisma.auditLog.findMany())).not.toContain("wrong-password-123");
    expect(await actions()).toContain("auth.login");
  });

  it("is readable by ADMIN and above, filterable, and hidden from EDITORs", async () => {
    await agent.post("/api/v1/properties").set(CSRF).send({ title: "One" });

    const all = await agent.get("/api/v1/audit-logs");
    expect(all.status).toBe(200);
    expect(all.body.total).toBeGreaterThanOrEqual(2);

    const prefix = await agent.get("/api/v1/audit-logs").query({ action: "property." });
    expect(prefix.body.items.map((e: { action: string }) => e.action)).toEqual(["property.create"]);

    const { agent: admin } = await signInAs(app, "ADMIN");
    expect((await admin.get("/api/v1/audit-logs")).status).toBe(200);

    const { agent: editor } = await signInAs(app, "EDITOR");
    expect((await editor.get("/api/v1/audit-logs")).status).toBe(403);
  });
});
