import { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../lib/apiError";
import { logger } from "../lib/logger";

/** Maps database-level rejections to client errors. The constraint that fired
 * is named (it's schema, not data) but no raw driver message is passed on. */
function fromPrismaError(err: unknown): ApiError | null {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[] | string | undefined) ?? [];
      const fields = Array.isArray(target) ? target : [target];
      return ApiError.conflict("A record with this value already exists", { fields });
    }
    if (err.code === "P2003") return ApiError.badRequest("Referenced record does not exist");
    if (err.code === "P2025") return ApiError.notFound();
  }
  // CHECK constraint violations (SQLSTATE 23514) are not mapped to a known
  // Prisma code; they surface with the constraint name in the message.
  if (
    (err instanceof Prisma.PrismaClientUnknownRequestError || err instanceof Prisma.PrismaClientKnownRequestError) &&
    /23514|violates check constraint/i.test(err.message)
  ) {
    const constraint = /constraint "([^"]+)"/.exec(err.message)?.[1];
    return ApiError.badRequest("Value violates a data constraint", constraint ? { constraint } : undefined);
  }
  return null;
}

/** Centralized error handler. Never leaks internals (stack traces, raw
 * driver/DB errors, file paths) to the client — only ApiError's own message
 * and Zod validation issues are ever surfaced. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.flatten(),
    });
  }

  const mapped = fromPrismaError(err);
  if (mapped) {
    logger.warn({ err, path: req.path, method: req.method }, "Database rejected request");
    return res.status(mapped.status).json({ error: mapped.message, details: mapped.details });
  }

  if (err instanceof ApiError) {
    if (err.status >= 500) logger.error({ err }, "Server error");
    return res.status(err.status).json({ error: err.message, details: err.details });
  }

  logger.error({ err, path: req.path, method: req.method }, "Unhandled error");
  return res.status(500).json({ error: "Internal server error" });
}
