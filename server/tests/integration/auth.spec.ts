import { closeTestDb, resetTestDb, testPrisma } from "../setup/testDb";

import request from "supertest";
import { createApp } from "../../src/app";
import { CSRF, PASSWORD, setupSuperAdmin } from "../setup/helpers";

const app = createApp();

describe("auth flow", () => {
  beforeEach(async () => {
    await resetTestDb();
  });
  afterAll(async () => {
    await closeTestDb();
  });

  it("reports setup required when no user exists", async () => {
    const res = await request(app).get("/api/v1/auth/setup-required");
    expect(res.status).toBe(200);
    expect(res.body.setupRequired).toBe(true);
  });

  it("creates the first account as SUPER_ADMIN, reads /me, and rejects a second setup", async () => {
    const agent = request.agent(app);
    const setupRes = await setupSuperAdmin(agent, { email: "Owner@Example.com", name: "Owner" });
    expect(setupRes.body).toMatchObject({ email: "owner@example.com", name: "Owner", role: "SUPER_ADMIN" });
    expect(setupRes.body.passwordHash).toBeUndefined();

    const meRes = await agent.get("/api/v1/auth/me");
    expect(meRes.status).toBe(200);
    expect(meRes.body.email).toBe("owner@example.com");

    const secondSetup = await request(app)
      .post("/api/v1/auth/setup")
      .set(CSRF)
      .send({ email: "someone@example.com", password: "another long password" });
    expect(secondSetup.status).toBe(403);
  });

  it("still accepts the admin panel's username-only setup, with a placeholder email", async () => {
    const agent = request.agent(app);
    const res = await setupSuperAdmin(agent, { username: "admin" });
    expect(res.body.username).toBe("admin");
    expect(res.body.name).toBe("admin");
    expect(res.body.email).toMatch(/^admin\.[0-9a-f]{6}@users\.invalid$/);
  });

  it("never stores the plaintext password", async () => {
    await setupSuperAdmin(request.agent(app), { email: "owner@example.com" });
    const user = await testPrisma.user.findUniqueOrThrow({ where: { email: "owner@example.com" } });
    expect(user.passwordHash).not.toContain(PASSWORD);
    expect(user.passwordHash).toMatch(/^\$2[aby]\$12\$/);
  });

  it("rejects /me without a session cookie", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });

  it("logs in by email (case-insensitive) or by legacy username, and rejects wrong passwords", async () => {
    await setupSuperAdmin(request.agent(app), { email: "owner@example.com", username: "admin" });

    const wrong = await request(app).post("/api/v1/auth/login").set(CSRF).send({ email: "owner@example.com", password: "nope" });
    expect(wrong.status).toBe(401);

    const unknown = await request(app).post("/api/v1/auth/login").set(CSRF).send({ email: "nobody@example.com", password: PASSWORD });
    expect(unknown.status).toBe(401);
    expect(unknown.body.error).toBe(wrong.body.error); // no account enumeration

    const byEmail = await request(app).post("/api/v1/auth/login").set(CSRF).send({ email: "OWNER@example.com", password: PASSWORD });
    expect(byEmail.status).toBe(200);

    const byUsername = await request(app).post("/api/v1/auth/login").set(CSRF).send({ username: "admin", password: PASSWORD });
    expect(byUsername.status).toBe(200);

    const emailInUsernameField = await request(app)
      .post("/api/v1/auth/login")
      .set(CSRF)
      .send({ username: "owner@example.com", password: PASSWORD });
    expect(emailInUsernameField.status).toBe(200);
  });

  it("updates the signed-in user's name and email, rejecting a duplicate email", async () => {
    const agent = request.agent(app);
    await setupSuperAdmin(agent, { username: "admin" });
    await testPrisma.user.create({ data: { name: "Other", email: "taken@example.com", passwordHash: "x", role: "EDITOR" } });

    const ok = await agent.patch("/api/v1/auth/me").set(CSRF).send({ name: "Shamraiz", email: "Real@Example.com" });
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ name: "Shamraiz", email: "real@example.com" });

    const dup = await agent.patch("/api/v1/auth/me").set(CSRF).send({ email: "taken@example.com" });
    expect(dup.status).toBe(409);

    const bad = await agent.patch("/api/v1/auth/me").set(CSRF).send({ email: "not-an-email" });
    expect(bad.status).toBe(400);
  });

  it("requires the X-Admin-Request header on state-changing requests even when authenticated", async () => {
    const agent = request.agent(app);
    await setupSuperAdmin(agent);

    const res = await agent
      .post("/api/v1/auth/change-password")
      // deliberately omitting X-Admin-Request
      .send({ currentPassword: PASSWORD, newPassword: "new password here" });

    expect(res.status).toBe(403);
  });
});
