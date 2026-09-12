/**
 * Admin Panel — access gate.
 * ---------------------------------------------------------------------------
 * IMPORTANT — read before relying on this for anything:
 * This is a CLIENT-SIDE ONLY gate. The "password" is checked by JavaScript
 * running in the visitor's own browser against a hash stored in this same
 * browser's localStorage. Anyone with DevTools access to this machine (or to
 * the deployed site's browser console, if this is ever put on a public host
 * as-is) can read the stored hash or simply skip the check entirely — a
 * static site has no server to actually enforce a "no" once JavaScript is
 * running on the client. Do NOT treat this as real security, and do NOT
 * deploy this admin panel to a public host until a real backend performs
 * authentication and authorization server-side. See the Security tab in
 * Settings and plans/MASTER_PLAN.md (D-26) for the same disclosure.
 *
 * What this DOES do: keep the panel out of casual reach on a shared machine,
 * and give the eventual backend integration a ready-made seam (verifyLogin /
 * requireAuth) to swap for a real API call.
 */

const AdminAuth = (function () {
  "use strict";

  function toHex(buffer) {
    return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function randomSalt() {
    return toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
  }

  async function hash(password, salt) {
    const data = new TextEncoder().encode(`${salt}:${password}`);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return toHex(digest);
  }

  function getCredentials() {
    try {
      const raw = localStorage.getItem(ADMIN_CONFIG.keys.credentials);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function hasCredentials() {
    return !!getCredentials();
  }

  async function setupCredentials(username, password) {
    const salt = randomSalt();
    const hashed = await hash(password, salt);
    const record = { username: username.trim(), salt, hash: hashed, createdAt: new Date().toISOString() };
    localStorage.setItem(ADMIN_CONFIG.keys.credentials, JSON.stringify(record));
    return record;
  }

  async function verifyLogin(username, password) {
    const creds = getCredentials();
    if (!creds) return false;
    if (creds.username.toLowerCase() !== username.trim().toLowerCase()) return false;
    const attempt = await hash(password, creds.salt);
    return attempt === creds.hash;
  }

  async function changePassword(currentPassword, newPassword) {
    const creds = getCredentials();
    if (!creds) return false;
    const ok = await verifyLogin(creds.username, currentPassword);
    if (!ok) return false;
    await setupCredentials(creds.username, newPassword);
    return true;
  }

  function startSession(username) {
    sessionStorage.setItem(ADMIN_CONFIG.keys.session, JSON.stringify({ username, loginAt: Date.now() }));
  }

  function getSession() {
    try {
      const raw = sessionStorage.getItem(ADMIN_CONFIG.keys.session);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function isAuthenticated() {
    const session = getSession();
    if (!session) return false;
    if (Date.now() - session.loginAt > ADMIN_CONFIG.sessionMaxAgeMs) {
      endSession();
      return false;
    }
    const creds = getCredentials();
    return !!creds && creds.username === session.username;
  }

  function endSession() {
    sessionStorage.removeItem(ADMIN_CONFIG.keys.session);
  }

  function logout() {
    endSession();
    window.location.href = "login.html";
  }

  /** Call at the very top of every protected page, before other markup renders. */
  function requireAuth() {
    if (!hasCredentials() || !isAuthenticated()) {
      window.location.replace("login.html");
      return false;
    }
    return true;
  }

  return {
    hasCredentials, setupCredentials, verifyLogin, changePassword,
    startSession, getSession, isAuthenticated, endSession, logout, requireAuth,
    currentUsername: () => (getSession() || {}).username || (getCredentials() || {}).username || "",
  };
})();
