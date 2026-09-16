import type { Role } from "@prisma/client";
import type { Express } from "express";
import request from "supertest";
import { hashPassword } from "../../src/modules/auth/auth.service";
import { testPrisma } from "./testDb";

export const PASSWORD = "correct horse battery staple";

/** The CSRF header every state-changing admin request must carry. */
export const CSRF = { "X-Admin-Request": "1" } as const;

type Agent = ReturnType<typeof request.agent>;

/** Runs first-run setup through the API, leaving `agent` signed in as the
 * SUPER_ADMIN. Uses the legacy username-only payload the existing admin
 * panel sends, unless an email is given. */
export async function setupSuperAdmin(agent: Agent, body: Record<string, unknown> = { username: "admin" }) {
  const res = await agent.post("/api/v1/auth/setup").set(CSRF).send({ password: PASSWORD, ...body });
  if (res.status !== 201) throw new Error(`setup failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res;
}

/** Creates a user with the given role directly in the database and signs a
 * fresh agent in as them. */
export async function signInAs(app: Express, role: Role, email = `${role.toLowerCase()}@example.com`) {
  const user = await testPrisma.user.create({
    data: { name: role, email, passwordHash: await hashPassword(PASSWORD), role },
  });
  const agent = request.agent(app);
  const res = await agent.post("/api/v1/auth/login").set(CSRF).send({ email, password: PASSWORD });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { agent, user };
}
