/**
 * Admin → public property bridge.
 * ---------------------------------------------------------------------------
 * WHAT THIS FIXES
 * The admin panel has had a full property image pipeline since it was built —
 * multi-file upload, drag-and-drop, cover selection, videos and documents, all
 * stored as real blobs in IndexedDB (admin/js/admin-db.js). None of it ever
 * reached the public site: the frontend rendered exclusively from the static
 * js/listings-data.js, and nothing anywhere read `rs-admin:properties`. So a
 * property added in the admin panel, with photographs attached, was invisible
 * to visitors. This module is the missing connection.
 *
 * HOW IT WORKS, AND ITS ONE BIG LIMITATION
 * There is still no backend (see D-26). This reads the SAME-BROWSER admin
 * store, exactly like the business-info bridge already in js/main.js (D-27):
 *   - localStorage["rs-admin:properties"]  → the records
 *   - IndexedDB "rs-admin-media"           → the uploaded image blobs
 * Both are origin-scoped, and /admin lives on the same origin as the public
 * site, so the public pages can read them. That makes "add a property in the
 * admin panel, see it on the site" genuinely true — BUT ONLY IN THE BROWSER
 * THAT UPLOADED IT. A visitor on any other device or browser still sees
 * js/listings-data.js. Real cross-device publishing needs a backend; this is
 * the seam that backend will replace, not a substitute for it.
 *
 * WHAT IT DELIBERATELY DOES NOT EXPOSE (see master requirement 20)
 *   - Only `status: "active"` records are published. Drafts, archived records
 *     and anything not explicitly published stay invisible.
 *   - Documents are never surfaced. admin-db.js flags them isPrivate, and
 *     title deeds / payment records are not public material.
 *   - No admin credentials, no admin UI, no write path. This module reads.
 */

(function () {
  "use strict";

  if (typeof LISTINGS === "undefined") return;

  var KEY = "rs-admin:properties";
  var DB_NAME = "rs-admin-media";
  var DB_STORE = "media";

  function readAdminProperties() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  var admin = readAdminProperties();
  if (!admin) return; // nothing in the admin store — static data stands untouched

  /* ------------------------------------------------------------ mapping ---- */

  /** Categories that belong under the "Commercial" purpose tab rather than Buy. */
  var COMMERCIAL = /(commercial|office|shop|plaza|warehouse)/i;

  function publicType(rec) {
    if (rec.listingType === "rent") return "rent";
    if (COMMERCIAL.test(rec.category || "")) return "commercial";
    return "buy";
  }

  function publicStatus(rec) {
    // The admin lifecycle (draft/active/sold/rented/archived) is not the same
    // vocabulary the public cards use. Only published states are mapped.
    if (rec.status === "sold") return "sold";
    if (rec.status === "rented") return "rented";
    return "available";
  }

  function slugify(s) {
    return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  /** Image entries are either an uploaded blob (mediaId) or a plain path. */
  function staticSources(rec) {
    return (rec.images || [])
      .slice()
      .sort(function (a, b) { return Number(b.isCover) - Number(a.isCover); })
      .map(function (img) { return img.externalSrc || null; });
  }

  function toPublic(rec) {
    var sources = staticSources(rec).filter(Boolean);
    return {
      id: rec.id,
      slug: slugify(rec.category) + "-" + slugify(rec.locality) + "-" + slugify(rec.propertyId || rec.id),
      demo: false,                       // real admin-entered inventory
      title: rec.title || "",
      type: publicType(rec),
      category: rec.category || "",
      status: publicStatus(rec),
      price: rec.price == null || rec.price === "" ? null : Number(rec.price),
      priceUnit: rec.listingType === "rent" ? "per-month" : "total",
      beds: rec.beds == null || rec.beds === "" ? null : Number(rec.beds),
      baths: rec.baths == null || rec.baths === "" ? null : Number(rec.baths),
      areaValue: rec.areaValue == null || rec.areaValue === "" ? null : Number(rec.areaValue),
      areaUnit: rec.areaUnit || "",
      locality: rec.locality || "",
      city: rec.city || "",
      featured: !!rec.featured,
      listedAt: (rec.createdAt || "").slice(0, 10),
      image: sources[0] || "",
      gallery: sources,
      summary: rec.description || "",
      amenities: rec.amenities || [],
      mapUrl: rec.mapUrl || "",
      // Kept so the async pass below can swap in object URLs for uploads.
      _mediaIds: (rec.images || [])
        .slice()
        .sort(function (a, b) { return Number(b.isCover) - Number(a.isCover); })
        .map(function (img) { return img.mediaId || null; }),
    };
  }

  var published = admin.filter(function (r) { return r.status === "active"; }).map(toPublic);
  if (!published.length) return; // admin store exists but nothing is published yet

  // LISTINGS is a const array — mutate in place rather than reassigning, so
  // every module that already holds a reference to it sees the same data.
  LISTINGS.length = 0;
  published.forEach(function (p) { LISTINGS.push(p); });

  /* -------------------------------------------------- uploaded image blobs -- */
  /* Records whose images were uploaded (rather than pointed at a path) carry a
     mediaId instead of a URL. Those live in IndexedDB and can only be read
     asynchronously, so the page renders first with whatever static paths exist
     and swaps in the uploads when they resolve. */

  var needsMedia = published.some(function (p) {
    return p._mediaIds.some(Boolean);
  });
  if (!needsMedia) return;

  function openDb() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(DB_NAME);
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
      // If the store does not exist yet the admin panel has never run here.
      req.onupgradeneeded = function () { try { req.transaction.abort(); } catch (e) {} };
    });
  }

  function getBlob(db, id) {
    return new Promise(function (resolve) {
      try {
        var tx = db.transaction(DB_STORE, "readonly").objectStore(DB_STORE);
        var r = tx.get(id);
        r.onsuccess = function () { resolve(r.result || null); };
        r.onerror = function () { resolve(null); };
      } catch (e) {
        resolve(null);
      }
    });
  }

  openDb()
    .then(function (db) {
      if (!db || !db.objectStoreNames.contains(DB_STORE)) return;
      var jobs = [];
      published.forEach(function (p) {
        p._mediaIds.forEach(function (mid, i) {
          if (!mid) return;
          jobs.push(
            getBlob(db, mid).then(function (rec) {
              if (!rec || !rec.blob) return;
              var url = URL.createObjectURL(rec.blob);
              // Uploaded images take the slot their cover-order implies.
              p.gallery[i] = url;
              if (i === 0) p.image = url;
            })
          );
        });
      });
      return Promise.all(jobs);
    })
    .then(function () {
      published.forEach(function (p) {
        p.gallery = p.gallery.filter(Boolean);
        if (!p.image) p.image = p.gallery[0] || "";
      });
      // Tell the already-rendered grids to redraw with the resolved images.
      document.dispatchEvent(new CustomEvent("rs:listings-updated"));
    })
    .catch(function () {
      /* IndexedDB unavailable (private mode, blocked storage). Records still
         render — just without their uploaded photographs, which the image
         fallback in js/main.js handles visibly rather than silently. */
    });

  window.__rsAdminBridge = { count: published.length };
})();
