// bcryptjs (pure JS) rather than bcrypt (native): identical hash format, but
// no node-gyp build step — which also keeps a critical-severity `tar` chain
// (via @mapbox/node-pre-gyp) out of the dependency tree entirely.
import type { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { ApiError } from "../../lib/apiError";
import { prisma } from "../../lib/prisma";

export interface AccessTokenPayload {
  sub: string;
  role: Role;
}

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** A real bcrypt hash of a random string. Comparing against it when the
 * account does not exist makes a failed login take the same time either way,
 * so response timing does not reveal which emails have accounts. */
const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString("hex"), BCRYPT_ROUNDS);

export async function burnPasswordCheck(password: string): Promise<void> {
  await bcrypt.compare(password, DUMMY_HASH);
}

/** Thrown when an already-rotated refresh token is presented again. Carries
 * the owner so the caller can audit it; the response is an ordinary 401. */
export class RefreshTokenReuseError extends ApiError {
  constructor(public readonly userId: string) {
    super(401, "Session expired. Please log in again.");
  }
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: `${env.JWT_ACCESS_TTL_MIN}m` });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

/** HMAC rather than a bare SHA-256: the secret acts as a pepper, so a leaked
 * database dump alone does not let an attacker match stolen refresh tokens
 * against stored hashes. */
function hashToken(token: string): string {
  return crypto.createHmac("sha256", env.JWT_REFRESH_SECRET).update(token).digest("hex");
}

function randomToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

/** Issues a brand-new opaque refresh token for a user and stores only its hash. */
export async function issueRefreshToken(userId: string): Promise<string> {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { tokenHash: hashToken(token), userId, expiresAt },
  });
  return token;
}

/** Revokes every live refresh token for a user. Used when a token is replayed
 * (below) and after a password change. */
export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Verifies a refresh token, rotates it (issues + persists a replacement, marks
 * this one revoked), and returns the user + new token.
 *
 * Two properties a plain stateless JWT cannot give:
 *  - **Replay detection.** Presenting an already-revoked token means either an
 *    attacker is using a stolen copy or the legitimate holder is using one the
 *    attacker already rotated. Either way the chain is compromised, so every
 *    token for that user is revoked and both parties must log in again.
 *  - **An absolute lifetime.** The replacement inherits the original's
 *    `expiresAt` instead of getting a fresh window, so rotation cannot extend
 *    a session indefinitely. */
export async function rotateRefreshToken(token: string) {
  const tokenHash = hashToken(token);
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });

  if (!record) throw ApiError.unauthorized("Session expired. Please log in again.");

  if (record.revokedAt) {
    await revokeAllRefreshTokens(record.userId);
    throw new RefreshTokenReuseError(record.userId);
  }

  if (record.expiresAt < new Date()) {
    throw ApiError.unauthorized("Session expired. Please log in again.");
  }

  const newToken = randomToken();
  const newHash = hashToken(newToken);

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date(), replacedByTokenHash: newHash },
    }),
    prisma.refreshToken.create({
      data: { tokenHash: newHash, userId: record.userId, expiresAt: record.expiresAt },
    }),
  ]);

  return { user: record.user, refreshToken: newToken, expiresAt: record.expiresAt };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
