/**
 * Admin Panel — media store (images/videos/documents).
 * ------------------------------------------------------------------------
 * Files now live on the server (server/storage/, served through the API)
 * instead of this browser's IndexedDB, so an upload made on one device is
 * visible on every other one. The function names and shapes are unchanged so
 * existing pages keep working — the one behavioural difference is that
 * `objectUrlFor()` returns an API URL rather than a blob: URL, which every
 * <img>/<video> src binding handles identically.
 *
 * EVERY FUNCTION HERE IS ASYNC (objectUrlFor stays synchronous).
 */

const AdminDB = (function () {
  "use strict";

  const API = ADMIN_CONFIG.apiBase;

  /**
   * Uploads a File/Blob. Accepts the same record shape as before —
   * { kind, name, mimeType, size, blob, propertyId, isPrivate } — though the
   * server derives kind/mimeType/size from the file itself, and marks
   * documents private automatically. Returns the generated media id.
   */
  async function put(record) {
    const form = new FormData();
    const filename = record.name || "upload";
    form.append("file", record.blob, filename);

    const res = await fetch(`${API}/media`, {
      method: "POST",
      headers: { "X-Admin-Request": "1" },
      body: form, // no Content-Type — the browser sets the multipart boundary
      credentials: "include",
    });

    if (res.status === 401) {
      location.replace("login.html");
      throw new Error("Not authenticated");
    }
    if (!res.ok) {
      let message = `Upload failed (${res.status})`;
      try {
        const body = await res.json();
        if (body && body.error) message = body.error;
      } catch {
        /* not JSON */
      }
      throw new Error(message);
    }

    const media = await res.json();
    return media.id;
  }

  async function get(id) {
    if (!id) return null;
    try {
      return await AdminStore.apiFetch(`/media/${encodeURIComponent(id)}`);
    } catch (err) {
      if (err.status === 404) return null;
      throw err;
    }
  }

  async function remove(id) {
    await AdminStore.apiFetch(`/media/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  async function all() {
    return AdminStore.apiFetch("/media");
  }

  /** Which properties (if any) still reference this file. Used to warn before
   * a delete — the check is now authoritative because the server owns it. */
  async function references(id) {
    const res = await AdminStore.apiFetch(`/media/${encodeURIComponent(id)}/references`);
    return (res && res.properties) || [];
  }

  /** A URL the browser can load the file from. Accepts a media record (as
   * before) or a bare media id. */
  function objectUrlFor(mediaRecordOrId) {
    if (!mediaRecordOrId) return null;
    const id = typeof mediaRecordOrId === "string" ? mediaRecordOrId : mediaRecordOrId.id;
    if (!id) return null;
    return `${API}/media/${encodeURIComponent(id)}/file`;
  }

  return { put, get, remove, all, references, objectUrlFor };
})();
