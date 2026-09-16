import type { CookieOptions, Response } from "express";
import { env } from "../config/env";

export const ACCESS_COOKIE = "rs_access";
export const REFRESH_COOKIE = "rs_refresh";

const base: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

/** `refreshExpiresAt` carries the session's ABSOLUTE expiry through rotation,
 * so refreshing extends nothing — omit it only when starting a new session. */
export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  refreshExpiresAt?: Date,
) {
  res.cookie(ACCESS_COOKIE, accessToken, { ...base, maxAge: env.JWT_ACCESS_TTL_MIN * 60 * 1000 });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...base,
    maxAge: refreshExpiresAt
      ? Math.max(0, refreshExpiresAt.getTime() - Date.now())
      : env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    path: "/api/v1/auth", // refresh token never needs to leave the auth routes
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, { ...base });
  res.clearCookie(REFRESH_COOKIE, { ...base, path: "/api/v1/auth" });
}
