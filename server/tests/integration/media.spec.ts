import { closeTestDb, resetTestDb } from "../setup/testDb";

import request from "supertest";
import { createApp } from "../../src/app";
import { CSRF, setupSuperAdmin, signInAs } from "../setup/helpers";
import { testPrisma } from "../setup/testDb";

const app = createApp();
const agent = request.agent(app);
const FAKE_IMAGE = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]); // JPEG-ish header, content doesn't need to be a real image for this test

describe("media", () => {
  beforeEach(async () => {
    await resetTestDb();
    await setupSuperAdmin(agent);
  });
  afterAll(async () => {
    await closeTestDb();
  });

  it("uploads a file, serves it back, and reports no references", async () => {
    const upload = await agent
      .post("/api/v1/media")
      .set(CSRF)
      .attach("file", FAKE_IMAGE, { filename: "test.jpg", contentType: "image/jpeg" });
    expect(upload.status).toBe(201);
    expect(upload.body.kind).toBe("IMAGE");
    const id = upload.body.id;

    const file = await request(app).get(`/api/v1/media/${id}/file`); // public — images aren't private
    expect(file.status).toBe(200);
    expect(Buffer.compare(file.body as Buffer, FAKE_IMAGE)).toBe(0);

    const refs = await agent.get(`/api/v1/media/${id}/references`);
    expect(refs.body.properties).toEqual([]);
  });

  it("rejects an unsupported file type", async () => {
    const res = await agent
      .post("/api/v1/media")
      .set(CSRF)
      .attach("file", Buffer.from("not a real exe"), { filename: "bad.exe", contentType: "application/x-msdownload" });
    expect(res.status).toBe(400);
  });

  it("warns of references before deleting a media file still attached to a property", async () => {
    const upload = await agent
      .post("/api/v1/media")
      .set(CSRF)
      .attach("file", FAKE_IMAGE, { filename: "cover.jpg", contentType: "image/jpeg" });
    const mediaId = upload.body.id;

    const property = await agent
      .post("/api/v1/properties")
      .set(CSRF)
      .send({ title: "With Media", images: [{ mediaId, isCover: true, position: 0 }] });

    const refs = await agent.get(`/api/v1/media/${mediaId}/references`);
    expect(refs.body.properties).toEqual([{ id: property.body.id, title: "With Media" }]);

    const del = await agent.delete(`/api/v1/media/${mediaId}`).set(CSRF);
    expect(del.status).toBe(204);

    // PropertyMedia cascades on Media delete (schema.prisma) — the now-fileless
    // gallery slot is removed entirely rather than left pointing at nothing.
    const afterDelete = await agent.get(`/api/v1/properties/${property.body.id}`);
    expect(afterDelete.body.images).toEqual([]);
  });

  it("gates a private document behind auth", async () => {
    const upload = await agent
      .post("/api/v1/media")
      .set(CSRF)
      .attach("file", Buffer.from("%PDF-1.4 fake"), { filename: "deed.pdf", contentType: "application/pdf" });
    expect(upload.body.isPrivate).toBe(true);

    const anon = await request(app).get(`/api/v1/media/${upload.body.id}/file`);
    expect(anon.status).toBe(401);

    const authed = await agent.get(`/api/v1/media/${upload.body.id}/file`);
    expect(authed.status).toBe(200);
  });

  it("records the uploader, and lets an EDITOR upload but not delete", async () => {
    const { agent: editor, user } = await signInAs(app, "EDITOR");
    const upload = await editor
      .post("/api/v1/media")
      .set(CSRF)
      .attach("file", FAKE_IMAGE, { filename: "editor.jpg", contentType: "image/jpeg" });
    expect(upload.status).toBe(201);
    expect(upload.body.uploadedById).toBe(user.id);

    const del = await editor.delete(`/api/v1/media/${upload.body.id}`).set(CSRF);
    expect(del.status).toBe(403);
    expect(await testPrisma.media.count({ where: { id: upload.body.id } })).toBe(1);
  });
});
