/**
 * Admin → public property bridge.
 * ---------------------------------------------------------------------------
 * WHAT THIS DOES
 * Replaces the static demo records in js/listings-data.js with the real,
 * published inventory from the backend (GET /api/v1/public/properties), so a
 * property added in the admin panel appears on the public site.
 *
 * This used to read the admin panel's own localStorage + IndexedDB, which
 * meant a property was only visible in the very browser that created it. With
 * a real backend behind it (see plans/MASTER_PLAN.md D-28) that limitation is
 * gone: any visitor, on any device, sees the same inventory.
 *
 * WHAT IT DELIBERATELY DOES NOT EXPOSE (see master requirement 20)
 *   - Only published (`ACTIVE`) properties are returned by that endpoint.
 *     Drafts, archived and unpublished records never leave the server.
 *   - Documents are never surfaced — title deeds and payment records are not
 *     public material, and the public endpoint does not include them at all.
 *   - No admin credentials, no admin UI, no write path. This module reads.
 *
 * FAILURE BEHAVIOUR
 * If the API is unreachable (offline, backend not running, or the page was
 * opened straight from disk), the static demo listings stay exactly as they
 * are — the site degrades to its previous behaviour rather than emptying out.
 */

(function () {
  "use strict";

  if (typeof LISTINGS === "undefined") return;
  if (typeof RS_API_BASE === "undefined" || !RS_API_BASE) return; // file:// or no API configured

  function resolveMediaPath(src) {
    // Uploaded media comes back as an API-relative path; static assets come
    // back as the same site-relative paths the demo data already uses.
    return typeof apiUrl === "function" ? apiUrl(src) : src;
  }

  function normalize(listing) {
    var gallery = (listing.gallery || []).map(resolveMediaPath).filter(Boolean);
    return {
      id: listing.id,
      slug: listing.slug,
      demo: !!listing.demo,
      title: listing.title || "",
      type: listing.type,
      category: listing.category || "",
      status: listing.status,
      price: listing.price == null ? null : Number(listing.price),
      priceUnit: listing.priceUnit,
      beds: listing.beds == null ? null : Number(listing.beds),
      baths: listing.baths == null ? null : Number(listing.baths),
      areaValue: listing.areaValue == null ? null : Number(listing.areaValue),
      areaUnit: listing.areaUnit || "",
      locality: listing.locality || "",
      featured: !!listing.featured,
      listedAt: (listing.listedAt || "").slice(0, 10),
      image: resolveMediaPath(listing.image) || gallery[0] || "",
      gallery: gallery,
      summary: listing.summary || "",
    };
  }

  fetch(RS_API_BASE + "/public/properties", { credentials: "omit" })
    .then(function (res) {
      if (!res.ok) throw new Error("Request failed: " + res.status);
      return res.json();
    })
    .then(function (data) {
      if (!Array.isArray(data) || !data.length) return; // nothing published — static data stands
      var published = data.map(normalize);

      // LISTINGS is a const array — mutate in place rather than reassigning,
      // so every module already holding a reference sees the same data.
      LISTINGS.length = 0;
      published.forEach(function (p) { LISTINGS.push(p); });

      window.__rsAdminBridge = { count: published.length };
      // Tell any already-rendered grid to redraw with the real inventory.
      document.dispatchEvent(new CustomEvent("rs:listings-updated"));
    })
    .catch(function () {
      /* Backend unreachable — the static demo listings in js/listings-data.js
         remain in place, which is the same experience the site had before a
         backend existed. */
    });
})();
