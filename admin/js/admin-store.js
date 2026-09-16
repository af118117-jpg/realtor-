/**
 * Admin Panel — data layer (properties, leads, settings).
 * ---------------------------------------------------------
 * Backed by the real REST API in server/ (PostgreSQL via Prisma). Every
 * function below is the same seam it always was — callers never talk to the
 * network directly — but the internals are now `fetch()` calls instead of
 * localStorage. See plans/MASTER_PLAN.md (D-28).
 *
 * EVERY FUNCTION HERE IS ASYNC. Callers must `await`.
 *
 * Vocabulary translation: the admin UI speaks lowercase, hyphenated values
 * ("draft", "follow-up", "sale") and the API speaks uppercase, underscored
 * enum values ("DRAFT", "FOLLOW_UP", "SALE"). That translation happens here,
 * at the boundary, so no page had to learn the API's vocabulary.
 */

const AdminStore = (function () {
  "use strict";

  const API = ADMIN_CONFIG.apiBase;

  /* ============================== Plumbing ============================== */

  function toApiEnum(v) {
    return v == null ? v : String(v).toUpperCase().replace(/-/g, "_");
  }

  function fromApiEnum(v) {
    return v == null ? v : String(v).toLowerCase().replace(/_/g, "-");
  }

  class ApiError extends Error {
    constructor(status, message) {
      super(message);
      this.status = status;
    }
  }

  async function apiFetch(path, options) {
    const opts = options || {};
    const method = opts.method || "GET";
    const headers = Object.assign({}, opts.headers);
    if (method !== "GET" && method !== "HEAD") {
      // Required by the API on every state-changing request — a plain
      // cross-site form or injected script cannot set a custom header, which
      // is what makes this a CSRF defense alongside SameSite=Lax cookies.
      headers["X-Admin-Request"] = "1";
    }
    if (opts.json !== undefined) {
      headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(opts.json);
    }

    const res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: opts.body,
      credentials: "include", // sends the httpOnly auth cookies
    });

    if (res.status === 401) {
      // The session is gone (expired or logged out elsewhere). Send the admin
      // back to the login screen rather than leaving a half-broken page.
      if (!location.pathname.endsWith("login.html")) location.replace("login.html");
      throw new ApiError(401, "Not authenticated");
    }
    if (!res.ok) {
      let message = `Request failed (${res.status})`;
      try {
        const body = await res.json();
        if (body && body.error) message = body.error;
      } catch {
        /* response wasn't JSON — keep the generic message */
      }
      throw new ApiError(res.status, message);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  function genId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  /* ============================== Mapping ============================== */

  function propertyFromApi(p) {
    if (!p) return null;
    return {
      id: p.id,
      propertyId: p.propertyId || "",
      title: p.title,
      category: p.category,
      listingType: fromApiEnum(p.listingType),
      price: p.price,
      description: p.description,
      areaValue: p.areaValue,
      areaUnit: p.areaUnit,
      beds: p.beds,
      baths: p.baths,
      parking: p.parking,
      floors: p.floors,
      constructionYear: p.constructionYear,
      locality: p.locality,
      address: p.address,
      mapUrl: p.mapUrl,
      amenities: p.amenities || [],
      images: (p.images || []).map((i) => ({
        mediaId: i.mediaId,
        externalSrc: i.externalSrc,
        isCover: i.isCover,
      })),
      videos: (p.videos || []).map((v) => ({
        type: fromApiEnum(v.type),
        mediaId: v.mediaId,
        url: v.url,
        videoId: v.videoId,
        name: v.name,
        thumbnailUrl: v.thumbnailUrl,
        thumbnailMediaId: v.thumbnailMediaId,
      })),
      documents: (p.documents || []).map((d) => ({
        mediaId: d.mediaId,
        name: d.name,
        size: d.size,
        docType: d.docType,
        isPrivate: d.isPrivate,
      })),
      status: fromApiEnum(p.status),
      featured: p.featured,
      fromPublicSample: p.fromPublicSample,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  function propertyToApi(p) {
    return {
      propertyId: p.propertyId || null,
      title: p.title,
      category: p.category || null,
      listingType: toApiEnum(p.listingType || "sale"),
      price: p.price == null || p.price === "" ? null : Number(p.price),
      description: p.description || null,
      areaValue: p.areaValue == null || p.areaValue === "" ? null : Number(p.areaValue),
      areaUnit: p.areaUnit || null,
      beds: p.beds == null || p.beds === "" ? null : Number(p.beds),
      baths: p.baths == null || p.baths === "" ? null : Number(p.baths),
      parking: p.parking == null || p.parking === "" ? null : Number(p.parking),
      floors: p.floors == null || p.floors === "" ? null : Number(p.floors),
      constructionYear:
        p.constructionYear == null || p.constructionYear === "" ? null : Number(p.constructionYear),
      locality: p.locality || null,
      address: p.address || null,
      mapUrl: p.mapUrl || null,
      amenities: p.amenities || [],
      status: toApiEnum(p.status || "draft"),
      featured: !!p.featured,
      // `position` carries the array order the editor encodes implicitly.
      images: (p.images || []).map((i, idx) => ({
        mediaId: i.mediaId || null,
        externalSrc: i.externalSrc || null,
        isCover: !!i.isCover,
        position: idx,
      })),
      videos: (p.videos || []).map((v, idx) => ({
        type: toApiEnum(v.type || "file"),
        mediaId: v.mediaId || null,
        url: v.url || null,
        videoId: v.videoId || null,
        name: v.name || null,
        thumbnailUrl: v.thumbnailUrl || null,
        thumbnailMediaId: v.thumbnailMediaId || null,
        position: idx,
      })),
      documents: (p.documents || []).map((d) => ({
        mediaId: d.mediaId,
        name: d.name,
        size: d.size == null ? null : Number(d.size),
        docType: d.docType || null,
      })),
    };
  }

  function leadFromApi(l) {
    if (!l) return null;
    return {
      id: l.id,
      name: l.name,
      phone: l.phone,
      email: l.email,
      propertyId: l.propertyId,
      message: l.message,
      status: fromApiEnum(l.status),
      notes: l.notes,
      date: l.date,
      source: l.source,
    };
  }

  function leadToApi(l) {
    return {
      name: l.name,
      phone: l.phone || "",
      email: l.email || null,
      propertyId: l.propertyId || null,
      message: l.message || null,
      status: toApiEnum(l.status || "new"),
      notes: l.notes || null,
    };
  }

  /* ============================= Seeding ============================= */

  /** No-op: seeding now happens once, server-side (server/prisma/seed.ts).
   * Kept so the call at the top of every admin page stays harmless. */
  async function seedIfEmpty() {
    return undefined;
  }

  /* ============================ Properties ============================ */

  async function listProperties() {
    const res = await apiFetch("/properties?pageSize=100");
    return (res.items || []).map(propertyFromApi);
  }

  async function getProperty(id) {
    try {
      return propertyFromApi(await apiFetch(`/properties/${encodeURIComponent(id)}`));
    } catch (err) {
      if (err.status === 404) return null;
      throw err;
    }
  }

  /** Creates or updates (by id). Accepts a partial record on update — the
   * existing row is fetched and merged first, preserving the merge semantics
   * callers have always relied on. Returns the saved record. */
  async function saveProperty(data) {
    if (data.id) {
      const existing = await getProperty(data.id);
      const merged = Object.assign({}, existing || {}, data);
      const saved = await apiFetch(`/properties/${encodeURIComponent(data.id)}`, {
        method: "PUT",
        json: propertyToApi(merged),
      });
      return propertyFromApi(saved);
    }
    const created = await apiFetch("/properties", { method: "POST", json: propertyToApi(data) });
    return propertyFromApi(created);
  }

  async function deleteProperty(id) {
    await apiFetch(`/properties/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  async function duplicateProperty(id) {
    const copy = await apiFetch(`/properties/${encodeURIComponent(id)}/duplicate`, { method: "POST" });
    return propertyFromApi(copy);
  }

  async function setPropertyStatus(id, status) {
    const updated = await apiFetch(`/properties/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      json: { status: toApiEnum(status) },
    });
    return propertyFromApi(updated);
  }

  /* =============================== Leads =============================== */

  async function listLeads() {
    const res = await apiFetch("/leads?pageSize=100");
    return (res.items || []).map(leadFromApi);
  }

  async function getLead(id) {
    try {
      return leadFromApi(await apiFetch(`/leads/${encodeURIComponent(id)}`));
    } catch (err) {
      if (err.status === 404) return null;
      throw err;
    }
  }

  async function saveLead(data) {
    if (data.id) {
      const existing = await getLead(data.id);
      const merged = Object.assign({}, existing || {}, data);
      const saved = await apiFetch(`/leads/${encodeURIComponent(data.id)}`, {
        method: "PUT",
        json: leadToApi(merged),
      });
      return leadFromApi(saved);
    }
    const created = await apiFetch("/leads", { method: "POST", json: leadToApi(data) });
    return leadFromApi(created);
  }

  async function deleteLead(id) {
    await apiFetch(`/leads/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  /* ============================== Settings ============================== */

  async function getSettings() {
    return apiFetch("/settings");
  }

  /** The server performs the same deep merge this function used to do
   * locally, so a partial patch still never clobbers untouched siblings. */
  async function saveSettings(patch) {
    return apiFetch("/settings", { method: "PUT", json: patch });
  }

  return {
    seedIfEmpty,
    listProperties, getProperty, saveProperty, deleteProperty, duplicateProperty, setPropertyStatus,
    listLeads, getLead, saveLead, deleteLead,
    getSettings, saveSettings,
    genId,
    apiFetch,
  };
})();
