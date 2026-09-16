import type { Prisma } from "@prisma/client";
import type { Request } from "express";
import { logger } from "../../lib/logger";
import { prisma } from "../../lib/prisma";
import type { auditListQuerySchema } from "./audit.schemas";
import type { z } from "zod";

/** Audited actions. Dotted `entity.verb` so the log reads naturally and can
 * be filtered by prefix. */
export const AuditAction = {
  AUTH_SETUP: "auth.setup",
  AUTH_LOGIN: "auth.login",
  AUTH_LOGIN_FAILED: "auth.login_failed",
  AUTH_LOGOUT: "auth.logout",
  AUTH_PASSWORD_CHANGE: "auth.password_change",
  AUTH_TOKEN_REUSE: "auth.refresh_token_reuse",
  USER_PROFILE_UPDATE: "user.profile_update",
  PROPERTY_CREATE: "property.create",
  PROPERTY_UPDATE: "property.update",
  PROPERTY_STATUS_CHANGE: "property.status_change",
  PROPERTY_DUPLICATE: "property.duplicate",
  PROPERTY_DELETE: "property.delete",
  LEAD_CREATE: "lead.create",
  LEAD_UPDATE: "lead.update",
  LEAD_STATUS_CHANGE: "lead.status_change",
  LEAD_DELETE: "lead.delete",
  MEDIA_UPLOAD: "media.upload",
  MEDIA_DELETE: "media.delete",
  SETTINGS_UPDATE: "settings.update",
} as const;

export type AuditActionValue = (typeof AuditAction)[keyof typeof AuditAction];

const SECRET_KEY = /pass(word)?|token|secret|hash|cookie|authorization/i;
const MAX_STRING = 500;

/** Deep-copies metadata with anything secret-looking removed and long
 * strings truncated. The audit log is read by admins; it must never become a
 * second place credentials end up. */
export function sanitizeMetadata(value: unknown, depth = 0): unknown {
  if (value == null || depth > 5) return value == null ? value : "[truncated]";
  if (typeof value === "string") return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value;
  if (typeof value !== "object") return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => sanitizeMetadata(v, depth + 1));

  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value)) {
    out[key] = SECRET_KEY.test(key) ? "[redacted]" : sanitizeMetadata(v, depth + 1);
  }
  return out;
}

export interface AuditEntry {
  action: AuditActionValue;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  /** Overrides the actor taken from `req.user` (e.g. during login, before
   * the request carries a session). Pass `null` for "no known actor". */
  actorId?: string | null;
}

/** Records an audit entry. Best-effort by design: a failure to write the
 * log is itself logged loudly, but never turns a successful admin action
 * into an error response. */
export async function recordAudit(req: Request | null, entry: AuditEntry): Promise<void> {
  try {
    const actorId = entry.actorId !== undefined ? entry.actorId : (req?.user?.sub ?? null);
    const actor = actorId
      ? await prisma.user.findUnique({ where: { id: actorId }, select: { email: true } })
      : null;

    await prisma.auditLog.create({
      data: {
        actorId: actor ? actorId : null,
        actorEmail: actor?.email ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        metadata: entry.metadata ? (sanitizeMetadata(entry.metadata) as Prisma.InputJsonValue) : undefined,
        ipAddress: req?.ip ?? null,
        userAgent: req?.get("user-agent")?.slice(0, 256) ?? null,
      },
    });
  } catch (err) {
    logger.error({ err, action: entry.action, entityId: entry.entityId }, "Failed to write audit log entry");
  }
}

/** Names of the scalar fields whose values differ between two snapshots.
 * Values themselves are not logged — only which fields changed. */
export function changedFields(before: Record<string, unknown>, after: Record<string, unknown>, keys: string[]): string[] {
  return keys.filter((k) => JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null));
}

export async function listAuditLogs(query: z.infer<typeof auditListQuerySchema>) {
  const where: Prisma.AuditLogWhereInput = {};
  if (query.action) where.action = query.action.endsWith(".") ? { startsWith: query.action } : query.action;
  if (query.entityType) where.entityType = query.entityType;
  if (query.entityId) where.entityId = query.entityId;
  if (query.actorId) where.actorId = query.actorId;
  if (query.from || query.to) where.createdAt = { gte: query.from, lte: query.to };

  const [items, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { items, total, page: query.page, pageSize: query.pageSize };
}
