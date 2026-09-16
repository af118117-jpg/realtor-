import crypto from "crypto";
import type { User } from "@prisma/client";
import type { Request, Response } from "express";
import { env } from "../../config/env";
import { ApiError } from "../../lib/apiError";
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from "../../lib/cookies";
import { prisma } from "../../lib/prisma";
import { AuditAction, recordAudit } from "../audit/audit.service";
import type { changePasswordSchema, loginSchema, setupSchema, updateProfileSchema } from "./auth.schemas";
import {
  burnPasswordCheck,
  hashPassword,
  issueRefreshToken,
  RefreshTokenReuseError,
  revokeAllRefreshTokens,
  revokeRefreshToken,
  rotateRefreshToken,
  signAccessToken,
  verifyPassword,
} from "./auth.service";
import type { z } from "zod";

/** Constant-time string compare, so a wrong setup token leaks nothing by timing. */
function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

const EMAIL_SHAPE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** The account fields safe to return to the client — never the hash. */
export function publicUser(user: Pick<User, "id" | "name" | "email" | "username" | "role">) {
  return { id: user.id, name: user.name, email: user.email, username: user.username, role: user.role };
}

/** Placeholder address on the reserved `.invalid` TLD (RFC 2606) for an
 * account created from a username alone — same convention as the migration
 * that introduced emails. The owner replaces it via PATCH /auth/me. */
function placeholderEmail(username: string): string {
  const local = username.toLowerCase().replace(/[^a-z0-9._-]/g, "") || "user";
  return `${local}.${crypto.randomBytes(3).toString("hex")}@users.invalid`;
}

export async function setupRequired(_req: Request, res: Response) {
  const count = await prisma.user.count();
  res.json({ setupRequired: count === 0 });
}

export async function setup(req: Request, res: Response) {
  const body: z.infer<typeof setupSchema> = req.body;

  // An unauthenticated endpoint that mints the top-level account is only safe
  // while the window in which it works is genuinely closed. Outside
  // development it additionally requires a pre-shared token, so an attacker
  // who catches the API with an empty user table (fresh deploy, restored
  // database) still cannot claim the panel. The normal path is the seed script.
  if (env.NODE_ENV === "production") {
    if (!env.SETUP_TOKEN) {
      throw ApiError.forbidden("First-run setup is disabled. Create the admin user with the seed script.");
    }
    if (!body.setupToken || !timingSafeEqualStr(body.setupToken, env.SETUP_TOKEN)) {
      throw ApiError.forbidden("Invalid setup token");
    }
  }

  const email =
    body.email ?? (body.username && EMAIL_SHAPE.test(body.username) ? body.username.toLowerCase() : null) ?? placeholderEmail(body.username!);
  const username = body.username && !EMAIL_SHAPE.test(body.username) ? body.username : null;
  const name = body.name ?? body.username ?? email.split("@")[0];
  const passwordHash = await hashPassword(body.password);

  // Serializable so two concurrent setup requests cannot both observe an empty
  // table and each create an account.
  const user = await prisma.$transaction(
    async (tx) => {
      const existing = await tx.user.count();
      if (existing > 0) throw ApiError.forbidden("Setup already completed");
      return tx.user.create({ data: { name, email, username, passwordHash, role: "SUPER_ADMIN" } });
    },
    { isolationLevel: "Serializable" },
  );

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = await issueRefreshToken(user.id);
  setAuthCookies(res, accessToken, refreshToken);

  await recordAudit(req, { action: AuditAction.AUTH_SETUP, entityType: "User", entityId: user.id, actorId: user.id });
  res.status(201).json(publicUser(user));
}

export async function login(req: Request, res: Response) {
  const body: z.infer<typeof loginSchema> = req.body;
  const identifier = (body.email || body.username)!;

  const user = await prisma.user.findFirst({
    where: identifier.includes("@") ? { email: identifier.toLowerCase() } : { username: identifier },
  });

  let ok = false;
  if (user) ok = await verifyPassword(body.password, user.passwordHash);
  else await burnPasswordCheck(body.password);

  if (!user || !ok) {
    await recordAudit(req, {
      action: AuditAction.AUTH_LOGIN_FAILED,
      entityType: "User",
      entityId: user?.id ?? null,
      actorId: null,
      metadata: { identifier: identifier.slice(0, 254) },
    });
    throw ApiError.unauthorized("Invalid email or password");
  }

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = await issueRefreshToken(user.id);
  setAuthCookies(res, accessToken, refreshToken);

  await recordAudit(req, { action: AuditAction.AUTH_LOGIN, entityType: "User", entityId: user.id, actorId: user.id });
  res.json(publicUser(user));
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw ApiError.unauthorized("Session expired. Please log in again.");

  try {
    const { user, refreshToken, expiresAt } = await rotateRefreshToken(token);
    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    setAuthCookies(res, accessToken, refreshToken, expiresAt);
    res.json(publicUser(user));
  } catch (err) {
    if (err instanceof RefreshTokenReuseError) {
      await recordAudit(req, {
        action: AuditAction.AUTH_TOKEN_REUSE,
        entityType: "User",
        entityId: err.userId,
        actorId: null,
        metadata: { outcome: "all sessions revoked" },
      });
    }
    throw err;
  }
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) await revokeRefreshToken(token);
  clearAuthCookies(res);
  await recordAudit(req, { action: AuditAction.AUTH_LOGOUT, entityType: "User", entityId: req.user?.sub });
  res.status(204).send();
}

export async function changePassword(req: Request, res: Response) {
  const { currentPassword, newPassword }: z.infer<typeof changePasswordSchema> = req.body;
  const userId = req.user!.sub;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.unauthorized();
  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) throw ApiError.badRequest("Current password is incorrect");

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  // Changing a password is the standard response to "someone may have my
  // session". Every existing refresh token is therefore revoked, and this
  // browser is handed a fresh pair so the admin isn't logged out mid-task.
  await revokeAllRefreshTokens(user.id);
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = await issueRefreshToken(user.id);
  setAuthCookies(res, accessToken, refreshToken);

  await recordAudit(req, { action: AuditAction.AUTH_PASSWORD_CHANGE, entityType: "User", entityId: user.id });
  res.status(204).send();
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
  if (!user) throw ApiError.unauthorized();
  res.json(publicUser(user));
}

export async function updateProfile(req: Request, res: Response) {
  const body: z.infer<typeof updateProfileSchema> = req.body;
  const before = await prisma.user.findUnique({ where: { id: req.user!.sub } });
  if (!before) throw ApiError.unauthorized();

  // A duplicate email surfaces as a 409 via the central Prisma error mapping.
  const user = await prisma.user.update({
    where: { id: before.id },
    data: { name: body.name, email: body.email },
  });

  await recordAudit(req, {
    action: AuditAction.USER_PROFILE_UPDATE,
    entityType: "User",
    entityId: user.id,
    metadata: { changed: Object.keys(body).filter((k) => body[k as keyof typeof body] !== undefined) },
  });
  res.json(publicUser(user));
}
