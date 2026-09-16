/**
 * Admin Panel — authentication.
 * ---------------------------------------------------------------------------
 * This is now REAL authentication. Credentials are verified by the backend
 * (server/src/modules/auth), passwords are bcrypt-hashed in PostgreSQL, and
 * the session is a pair of httpOnly cookies the browser cannot read — so a
 * "no" can no longer be bypassed from DevTools the way the previous
 * client-side gate could. See plans/MASTER_PLAN.md (D-28).
 *
 * EVERY FUNCTION HERE IS ASYNC except getSession()/currentUsername(), which
 * read a display-only cached username.
 */

const AdminAuth = (function () {
  "use strict";

  const API = ADMIN_CONFIG.apiBase;
  const USERNAME_CACHE_KEY = "rs-admin:username";

  async function request(path, options) {
    const opts = options || {};
    const method = opts.method || "GET";
    const headers = {};
    if (method !== "GET") headers["X-Admin-Request"] = "1";
    if (opts.json !== undefined) headers["Content-Type"] = "application/json";

    const res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: opts.json !== undefined ? JSON.stringify(opts.json) : undefined,
      credentials: "include",
    });
    return res;
  }

  function cacheUsername(username) {
    try {
      sessionStorage.setItem(USERNAME_CACHE_KEY, username || "");
    } catch {
      /* private mode / storage disabled — the name is display-only */
    }
  }

  function readCachedUsername() {
    try {
      return sessionStorage.getItem(USERNAME_CACHE_KEY) || "";
    } catch {
      return "";
    }
  }

  /** True once the one-time admin account exists on the server. */
  async function hasCredentials() {
    try {
      const res = await request("/auth/setup-required");
      if (!res.ok) return false;
      const body = await res.json();
      return !body.setupRequired;
    } catch {
      return false;
    }
  }

  /** First-run account creation. Logs in on success. */
  async function setupCredentials(username, password) {
    const res = await request("/auth/setup", {
      method: "POST",
      json: { username: String(username).trim(), password },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Could not create the admin account.");
    }
    const user = await res.json();
    cacheUsername(user.username);
    return user;
  }

  async function verifyLogin(username, password) {
    const res = await request("/auth/login", {
      method: "POST",
      json: { username: String(username).trim(), password },
    });
    if (!res.ok) return false;
    const user = await res.json();
    cacheUsername(user.username);
    return true;
  }

  async function changePassword(currentPassword, newPassword) {
    const res = await request("/auth/change-password", {
      method: "POST",
      json: { currentPassword, newPassword },
    });
    return res.ok;
  }

  /** The session is established by the server's cookies at login time; this
   * only records the username for the topbar. Kept for call-site compatibility. */
  function startSession(username) {
    cacheUsername(username);
  }

  function getSession() {
    const username = readCachedUsername();
    return username ? { username } : null;
  }

  async function isAuthenticated() {
    try {
      const res = await request("/auth/me");
      if (!res.ok) return false;
      const user = await res.json();
      cacheUsername(user.username);
      return true;
    } catch {
      return false;
    }
  }

  function endSession() {
    try {
      sessionStorage.removeItem(USERNAME_CACHE_KEY);
    } catch {
      /* nothing to clear */
    }
  }

  async function logout() {
    try {
      await request("/auth/logout", { method: "POST" });
    } catch {
      /* log out locally even if the network call fails */
    }
    endSession();
    window.location.href = "login.html";
  }

  /** Call at the very top of every protected page. Returns a promise that
   * resolves true when the session is valid; redirects to login otherwise. */
  async function requireAuth() {
    const ok = await isAuthenticated();
    if (!ok) {
      endSession();
      window.location.replace("login.html");
      return false;
    }
    return true;
  }

  return {
    hasCredentials, setupCredentials, verifyLogin, changePassword,
    startSession, getSession, isAuthenticated, endSession, logout, requireAuth,
    currentUsername: () => readCachedUsername(),
  };
})();
