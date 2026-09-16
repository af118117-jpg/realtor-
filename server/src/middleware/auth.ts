import type { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/apiError";
import { ACCESS_COOKIE } from "../lib/cookies";
import { hasRoleAtLeast } from "../lib/roles";
import { verifyAccessToken, type AccessTokenPayload } from "../modules/auth/auth.service";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** CSRF defense: every state-changing request must carry a custom header.
 * A cross-site `<form>` post or an injected `<img>`/`<script>` cannot set one,
 * and `SameSite=Lax` cookies cover the rest — so no CSRF-token library is
 * needed for this single-admin panel.
 *
 * Deliberately a standalone middleware mounted on the admin routers rather
 * than a check inside `requireAuth`: that way an unauthenticated
 * state-changing route (login, first-run setup) is still covered, instead of
 * silently losing the protection because it doesn't use `requireAuth`.
 * The `/public/*` routes are exempt by design — they are unauthenticated and
 * carry no cookie-derived authority, so there is nothing for CSRF to abuse. */
export function requireAdminRequestHeader(req: Request, _res: Response, next: NextFunction) {
  if (UNSAFE_METHODS.has(req.method) && req.get("X-Admin-Request") !== "1") {
    return next(ApiError.forbidden("Missing required request header"));
  }
  return next();
}

/** Requires a valid access-token cookie. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) return next(ApiError.unauthorized());

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch {
    return next(ApiError.unauthorized("Session expired. Please log in again."));
  }
}

/** Requires the signed-in user's role to be `minimum` or higher
 * (EDITOR < ADMIN < SUPER_ADMIN). Mount after `requireAuth`. */
export function requireRole(minimum: Role) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!hasRoleAtLeast(req.user.role, minimum)) {
      return next(ApiError.forbidden("Your role does not allow this action"));
    }
    return next();
  };
}
