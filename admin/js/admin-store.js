/**
 * Admin Panel — data layer (properties, leads, settings).
 * ---------------------------------------------------------
 * Backed by localStorage today. Every function here is the seam a real
 * backend/API gets wired into later — callers never touch localStorage
 * directly, so swapping AdminStore's internals for `fetch()` calls will not
 * require changing any page. See docs/plans/MASTER_PLAN.md (D-26).
 *
 * Scope note: this store holds ADMIN-entered data only. It never receives
 * public-site visitor form submissions — docs/SECURITY_PLAN.md §3.2 forbids
 * writing real lead/visitor data to localStorage, and that rule is unchanged
 * by this panel. Leads here are added by the admin (e.g. logging a phone
 * call) until a backend exists to receive real submissions.
 */

const AdminStore = (function () {
  "use strict";

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function genId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  /* ============================= Seeding ============================= */

  /** Converts a public-site LISTINGS record into the admin schema, once, on first run. */
  function seedIfEmpty() {
    if (read(ADMIN_CONFIG.keys.seeded, false)) return;
    const existing = read(ADMIN_CONFIG.keys.properties, null);
    if (!existing && typeof LISTINGS !== "undefined") {
      const seeded = LISTINGS.map((l) => ({
        id: genId("adm"),
        propertyId: l.id.toUpperCase(),
        title: l.title,
        category: l.category,
        listingType: l.type === "rent" ? "rent" : "sale",
        price: l.price,
        description: l.summary || "",
        areaValue: l.areaValue,
        areaUnit: l.areaUnit,
        beds: l.beds,
        baths: l.baths,
        parking: null,
        floors: null,
        constructionYear: null,
        locality: l.locality,
        address: "",
        mapUrl: "",
        amenities: [],
        images: (l.gallery || [l.image]).filter(Boolean).map((src, i) => ({
          mediaId: null,
          externalSrc: src, // pre-existing public-site asset path, not an uploaded blob
          isCover: i === 0,
        })),
        videos: [],
        documents: [],
        status: "active",
        featured: !!l.featured,
        fromPublicSample: true,
        createdAt: (l.listedAt || new Date().toISOString()) + "T00:00:00.000Z",
        updatedAt: (l.listedAt || new Date().toISOString()) + "T00:00:00.000Z",
      }));
      write(ADMIN_CONFIG.keys.properties, seeded);
    } else if (!existing) {
      write(ADMIN_CONFIG.keys.properties, []);
    }
    if (!read(ADMIN_CONFIG.keys.leads, null)) write(ADMIN_CONFIG.keys.leads, []);
    if (!read(ADMIN_CONFIG.keys.settings, null)) {
      const cfg = typeof REALTOR_CONFIG !== "undefined" ? REALTOR_CONFIG : {};
      write(ADMIN_CONFIG.keys.settings, {
        profile: { name: "", email: "" },
        business: {
          siteName: cfg.siteName || "Realtor Shamraiz",
          phone: cfg.phone || "",
          phoneSecondary: cfg.phoneSecondary || "",
          email: cfg.email || "",
          officeAddress: cfg.officeAddress || "",
          social: {
            instagram: cfg.social?.instagram || "",
            facebook: cfg.social?.facebook || "",
            tiktok: cfg.social?.tiktok || "",
            youtube: cfg.social?.youtube || "",
          },
          businessHours: {
            status: cfg.businessHours?.status || "always",
            customText: cfg.businessHours?.customText || "",
          },
        },
        currency: cfg.currency || "PKR",
        currencySymbol: cfg.currencySymbol || "₨",
        propertyTypes: ADMIN_CONFIG.defaultPropertyTypes.slice(),
        amenities: ADMIN_CONFIG.defaultAmenities.slice(),
      });
    }
    write(ADMIN_CONFIG.keys.seeded, true);
  }

  /* ============================ Properties ============================ */

  function listProperties() {
    return read(ADMIN_CONFIG.keys.properties, []);
  }

  function getProperty(id) {
    return listProperties().find((p) => p.id === id) || null;
  }

  /** Creates or updates (by id). Returns the saved record. */
  function saveProperty(data) {
    const all = listProperties();
    const now = new Date().toISOString();
    if (data.id) {
      const idx = all.findIndex((p) => p.id === data.id);
      const merged = { ...(all[idx] || {}), ...data, updatedAt: now };
      if (idx >= 0) all[idx] = merged; else all.push(merged);
      write(ADMIN_CONFIG.keys.properties, all);
      return merged;
    }
    const record = { ...data, id: genId("adm"), createdAt: now, updatedAt: now };
    all.push(record);
    write(ADMIN_CONFIG.keys.properties, all);
    return record;
  }

  function deleteProperty(id) {
    write(ADMIN_CONFIG.keys.properties, listProperties().filter((p) => p.id !== id));
  }

  function duplicateProperty(id) {
    const src = getProperty(id);
    if (!src) return null;
    const now = new Date().toISOString();
    const copy = {
      ...src,
      id: genId("adm"),
      propertyId: src.propertyId ? `${src.propertyId}-COPY` : "",
      title: `${src.title} (Copy)`,
      status: "draft",
      featured: false,
      createdAt: now,
      updatedAt: now,
    };
    const all = listProperties();
    all.push(copy);
    write(ADMIN_CONFIG.keys.properties, all);
    return copy;
  }

  function setPropertyStatus(id, status) {
    return saveProperty({ id, status });
  }

  /* =============================== Leads =============================== */

  function listLeads() {
    return read(ADMIN_CONFIG.keys.leads, []);
  }

  function getLead(id) {
    return listLeads().find((l) => l.id === id) || null;
  }

  function saveLead(data) {
    const all = listLeads();
    const now = new Date().toISOString();
    if (data.id) {
      const idx = all.findIndex((l) => l.id === data.id);
      const merged = { ...(all[idx] || {}), ...data };
      if (idx >= 0) all[idx] = merged; else all.push(merged);
      write(ADMIN_CONFIG.keys.leads, all);
      return merged;
    }
    const record = { status: "new", notes: "", date: now, ...data, id: genId("lead") };
    all.push(record);
    write(ADMIN_CONFIG.keys.leads, all);
    return record;
  }

  function deleteLead(id) {
    write(ADMIN_CONFIG.keys.leads, listLeads().filter((l) => l.id !== id));
  }

  /* ============================== Settings ============================== */

  function getSettings() {
    return read(ADMIN_CONFIG.keys.settings, {});
  }

  function saveSettings(patch) {
    const current = getSettings();
    const merged = {
      ...current,
      ...patch,
      profile: { ...current.profile, ...(patch.profile || {}) },
      business: { ...current.business, ...(patch.business || {}) },
    };
    write(ADMIN_CONFIG.keys.settings, merged);
    return merged;
  }

  return {
    seedIfEmpty,
    listProperties, getProperty, saveProperty, deleteProperty, duplicateProperty, setPropertyStatus,
    listLeads, getLead, saveLead, deleteLead,
    getSettings, saveSettings,
    genId,
  };
})();
