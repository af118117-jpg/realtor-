// Regression tests for issues found in the 2026-09-13 security review.
import { closeTestDb, resetTestDb } from "../setup/testDb";

import request from "supertest";
import { createApp } from "../../src/app";
import { CSRF } from "../setup/helpers";

const app = createApp();
const agent = request.agent(app);
const PASSWORD = "correct horse battery staple";
const FAKE_IMAGE = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);

/** Creates the admin and returns the refresh-token value the server issued,
 * so a test can replay it the way a thief would. */
async function setupAdmin(): Promise<string> {
  const res = await agent.post("/api/v1/auth/setup").set(CSRF).send({ username: "admin", password: PASSWORD });
  expect(res.status).toBe(201);
  return refreshCookieFrom(res.headers["set-cookie"]);
}

function refreshCookieFrom(setCookie: string | string[] | undefined): string {
  const header = Array.isArray(setCookie) ? setCookie.join("\n") : String(setCookie ?? "");
  return /rs_refresh=([^;]+)/.exec(header)?.[1] ?? "";
}

describe("security regressions", () => {
  beforeEach(async () => {
    await resetTestDb();
  });
  afterAll(async () => {
    await closeTestDb();
  });

  describe("refresh tokens", () => {
    it("revokes the whole token family when an already-rotated token is replayed", async () => {
      const stolenValue = await setupAdmin();
      expect(stolenValue).toBeTruthy();

      // Legitimate rotation — the old token is now revoked.
      const rotated = await agent.post("/api/v1/auth/refresh").set(CSRF);
      expect(rotated.status).toBe(200);

      // An attacker replays the token they captured before that rotation.
      const replay = await request(app)
        .post("/api/v1/auth/refresh")
        .set(CSRF)
        .set("Cookie", `rs_refresh=${stolenValue}`);
      expect(replay.status).toBe(401);

      // The replay must also have killed the session the attacker was racing,
      // so the legitimate holder's current token no longer works either.
      const afterReplay = await agent.post("/api/v1/auth/refresh").set(CSRF);
      expect(afterReplay.status).toBe(401);
    });

    it("does not extend a session's absolute lifetime on rotation", async () => {
      await setupAdmin();
      const before = await agent.post("/api/v1/auth/refresh").set(CSRF);
      const setCookie = String(before.headers["set-cookie"]);
      const maxAge = Number(/rs_refresh=[^;]+;[^]*?Max-Age=(\d+)/i.exec(setCookie)?.[1] ?? 0);
      // Started as 14 days; a rotation moments later must be strictly less,
      // never reset back to the full window.
      expect(maxAge).toBeGreaterThan(0);
      expect(maxAge).toBeLessThan(14 * 24 * 60 * 60);
    });
  });

  describe("password change", () => {
    it("invalidates existing refresh tokens", async () => {
      const oldRefresh = await setupAdmin();

      const changed = await agent
        .post("/api/v1/auth/change-password")
        .set(CSRF)
        .send({ currentPassword: PASSWORD, newPassword: "an even longer password" });
      expect(changed.status).toBe(204);

      const replay = await request(app)
        .post("/api/v1/auth/refresh")
        .set(CSRF)
        .set("Cookie", `rs_refresh=${oldRefresh}`);
      expect(replay.status).toBe(401);
    });
  });

  describe("CSRF header", () => {
    it("is required on unauthenticated state-changing admin routes too", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({ username: "admin", password: PASSWORD });
      expect(res.status).toBe(403);
    });

    it("is NOT required on public routes, which carry no session authority", async () => {
      const res = await request(app)
        .post("/api/v1/public/leads")
        .send({ name: "Visitor", phone: "0300", consent: true, renderedAt: Date.now() - 10_000 });
      expect(res.status).toBe(201);
    });
  });

  describe("media range requests", () => {
    let mediaId = "";

    beforeEach(async () => {
      await setupAdmin();
      const upload = await agent
        .post("/api/v1/media")
        .set(CSRF)
        .attach("file", FAKE_IMAGE, { filename: "photo.jpg", contentType: "image/jpeg" });
      mediaId = upload.body.id;
    });

    it("answers an inverted range with 416 instead of crashing mid-response", async () => {
      const res = await request(app).get(`/api/v1/media/${mediaId}/file`).set("Range", "bytes=5-2");
      expect(res.status).toBe(416);
    });

    it("answers a non-numeric range with 416", async () => {
      const res = await request(app).get(`/api/v1/media/${mediaId}/file`).set("Range", "bytes=0-abc");
      expect(res.status).toBe(416);
    });

    it("serves a valid range", async () => {
      const res = await request(app).get(`/api/v1/media/${mediaId}/file`).set("Range", "bytes=0-3");
      expect(res.status).toBe(206);
      expect(res.headers["content-range"]).toBe(`bytes 0-3/${FAKE_IMAGE.length}`);
    });

    it("clamps an over-long end rather than failing", async () => {
      const res = await request(app).get(`/api/v1/media/${mediaId}/file`).set("Range", "bytes=0-99999");
      expect(res.status).toBe(206);
      expect(res.headers["content-range"]).toBe(`bytes 0-${FAKE_IMAGE.length - 1}/${FAKE_IMAGE.length}`);
    });
  });

  describe("uploads", () => {
    it("rejects SVG, which would be executable if served inline", async () => {
      await setupAdmin();
      const res = await agent
        .post("/api/v1/media")
        .set(CSRF)
        .attach("file", Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>"), {
          filename: "x.svg",
          contentType: "image/svg+xml",
        });
      expect(res.status).toBe(400);
    });

    it("stores an extension derived from the mime type, not the client filename", async () => {
      await setupAdmin();
      const res = await agent
        .post("/api/v1/media")
        .set(CSRF)
        .attach("file", FAKE_IMAGE, { filename: "evil.php", contentType: "image/jpeg" });
      expect(res.status).toBe(201);
      expect(res.body.storagePath).toMatch(/\.jpg$/);
      expect(res.body.storagePath).not.toContain(".php");
    });

    it("serves documents as attachments, never inline", async () => {
      await setupAdmin();
      const upload = await agent
        .post("/api/v1/media")
        .set(CSRF)
        .attach("file", Buffer.from("%PDF-1.4 fake"), { filename: "deed.pdf", contentType: "application/pdf" });
      const res = await agent.get(`/api/v1/media/${upload.body.id}/file`);
      expect(res.headers["content-disposition"]).toMatch(/^attachment/);
    });
  });

  describe("first-run setup", () => {
    it("refuses a second setup once an admin exists", async () => {
      await setupAdmin();
      const res = await request(app)
        .post("/api/v1/auth/setup")
        .set(CSRF)
        .send({ username: "attacker", password: "yet another long password" });
      expect(res.status).toBe(403);
    });

    it("rejects a password shorter than the 12-character minimum", async () => {
      const res = await request(app)
        .post("/api/v1/auth/setup")
        .set(CSRF)
        .send({ username: "admin", password: "short1234" });
      expect(res.status).toBe(400);
    });
  });
});
