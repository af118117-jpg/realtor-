/**
 * REALTOR SHAMRAIZ — Business Configuration
 * ------------------------------------------
 * Single source of truth for all business details used across the site.
 * Replace every value marked TODO with real information before launch.
 * Never hard-code these values anywhere else — always reference REALTOR_CONFIG.
 */

const REALTOR_CONFIG = {
  // Identity
  agentName: "[CONTENT REQUIRED]", // Brand is "Realtor Shamraiz". Full display name NOT yet supplied — do not guess a surname.
  agentTitle: "[CONTENT REQUIRED]", // Preferred professional title not yet supplied
  brokerage: "[CONTENT REQUIRED]",
  license: "[CONTENT REQUIRED]", // If display is legally required in Pakistan, this becomes mandatory

  // Contact — kept in ONE place, referenced everywhere (nav, footer, forms, concierge)
  // CLIENT-SUPPLIED 2026-09-07. Both numbers given; primary/secondary order NOT specified.
  phone: "+92 333 6413988",
  phoneSecondary: "+92 309 7371787",
  whatsapp: "[CONTENT REQUIRED]", // NOT supplied. Do NOT assume either phone number is on WhatsApp — confirm first.
  // CLIENT-SUPPLIED 2026-09-11 — see docs/CLIENT_COPY.md Submission 2.
  email: "ranasharisahb27@gmail.com",

  // Location — CLIENT-SUPPLIED 2026-09-07, area precision corrected 2026-09-08.
  // "Bahria Town" alone was ambiguous (Bahria Town exists in several Pakistani
  // cities). The client's own YouTube channel (@propertiesbyShamraiz — same
  // business, confirmed by matching phone numbers) consistently titles listings
  // "Bahria Town Rawalpindi." DHA Islamabad is unchanged and still covered.
  // Because coverage now spans two different cities, the earlier single-city
  // guess ("Islamabad", derived from "DHA Islamabad" alone) no longer holds —
  // city is [CONTENT REQUIRED] until the client states it directly.
  city: "[CONTENT REQUIRED]",
  serviceAreas: ["Bahria Town Rawalpindi", "DHA Islamabad"],
  // CLIENT-SUPPLIED 2026-09-11 — see docs/CLIENT_COPY.md Submission 2.
  officeAddress: "Plaza Number 164, Office Number 4 & 5, Bahria Town Phase 8 Business District, Rawalpindi West Ridge, Pakistan",
  geo: null, // [CONTENT REQUIRED] — { lat, lng } needed for LocalBusiness schema
  // CLIENT-SUPPLIED 2026-09-11. `status`: "always" | "custom" | "closed".
  // `customText` is only used when status is "custom" (e.g. "Mon–Sat, 10am–8pm").
  // Never render this object directly — use `businessHoursDisplay` below (or,
  // for admin-overridden values, `formatBusinessHours()`), which resolves it to
  // a display string so "Always Open" is never confused with a fabricated
  // closing time.
  businessHours: { status: "always", customText: "" },
  responseTime: "[CONTENT REQUIRED]", // Stated on every form success screen — must be realistic
  mapEmbedUrl: "", // [CONTENT REQUIRED] — Google Maps embed src
  mapDirectionsUrl: "", // [CONTENT REQUIRED] — Google Maps share/place link

  // Social — leave blank ("") for any channel not in use; nav/footer auto-hide blanks
  // CLIENT-SUPPLIED 2026-09-11 for instagram/facebook/tiktok/youtube — see
  // docs/CLIENT_COPY.md Submission 2. `linkedin` remains unsupplied and stays
  // blank until the client provides one.
  social: {
    instagram: "https://www.instagram.com/realtor_shamraiz_offical?stkn=NGkxcHdmdjlvMHQy",
    facebook: "https://www.facebook.com/share/1EUnTq5J5T/",
    linkedin: "",
    youtube: "https://youtube.com/@propertiesbyshamraiz?si=IoLspndqcBHlCG9m",
    tiktok: "https://www.tiktok.com/@propertiesbyshamraiz?is_from_webapp=1&sender_device=pc",
  },

  // Site meta
  siteName: "Realtor Shamraiz",
  tagline: "[CONTENT REQUIRED]", // Client-supplied copy available — see docs/CLIENT_COPY.md — pending selection
  canonicalUrl: "[CONTENT REQUIRED]", // Live domain not yet supplied

  // Currency / formatting — PKR inferred from stated Pakistan coverage; confirm display convention
  currency: "PKR",
  currencySymbol: "₨",

  // Feature flags
  demoDataNotice: true, // shows a "Demo Content" ribbon on listings until real data is added
};

/** True once a real WhatsApp number has been configured (digits only, country code). */
function hasWhatsApp() {
  return /^\d{8,15}$/.test(String(REALTOR_CONFIG.whatsapp || ""));
}

/**
 * Builds a wa.me deep link with a prefilled message.
 * Returns null while the number is [CONTENT REQUIRED] — callers must hide the
 * WhatsApp CTA rather than render a link that goes nowhere.
 */
function buildWhatsAppLink(message) {
  if (!hasWhatsApp()) return null;
  const base = `https://wa.me/${REALTOR_CONFIG.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/**
 * SITE BASE URL — resolved at runtime, never assumed.
 * ---------------------------------------------------------------------------
 * The previous version of assetUrl() prepended "/" to every asset path, which
 * only resolves when the project folder happens to BE the web root. It is not
 * the web root when the site is opened from disk (file:// makes "/" the drive
 * root) or when a dev server is started from a directory above the project.
 * That is exactly what broke every property image while the hero video — which
 * still used a plain relative path — kept working.
 *
 * This file always lives at <site root>/js/config.js, so the script's own URL
 * tells us where the site root actually is, whatever it is mounted on. Every
 * runtime-resolved URL is built from that, so the site works served from a
 * domain root, served from a subdirectory, or opened straight off the disk.
 */
var RS_BASE = (function () {
  try {
    var self = document.currentScript;
    if (!self) {
      // Older engines, or config.js loaded in a way that leaves currentScript
      // null: find our own <script> tag by name instead.
      var all = document.getElementsByTagName("script");
      for (var i = all.length - 1; i >= 0; i--) {
        if (/(^|\/)js\/config\.js(\?|$)/.test(all[i].getAttribute("src") || "")) { self = all[i]; break; }
      }
    }
    if (!self || !self.src) return "";
    // .src is fully resolved by the browser, so this works for "js/config.js",
    // "../js/config.js" and "/js/config.js" alike.
    return self.src.replace(/js\/config\.js(\?.*)?$/, "");
  } catch (e) {
    return "";
  }
})();

/** True when the page was opened from disk rather than served over HTTP. */
var RS_IS_FILE = (function () {
  try { return window.location.protocol === "file:"; } catch (e) { return false; }
})();

/**
 * Resolves an asset path (image, video, icon) against the real site root.
 * Absolute URLs, protocol-relative URLs, data: and blob: URLs pass through
 * untouched so admin-entered external URLs and uploaded object URLs keep
 * working. A leading "/" is stripped first — stored data uses site-root-style
 * paths, and RS_BASE is what turns those into something the browser can fetch.
 */
function assetUrl(src) {
  var s = String(src || "");
  if (!s) return s;
  if (/^([a-z]+:)?\/\//i.test(s) || s.startsWith("data:") || s.startsWith("blob:")) return s;
  return RS_BASE + s.replace(/^\.?\//, "");
}

/**
 * Resolves an internal ROUTE against the real site root.
 * Routes are authored root-relative ("/properties") because that is what the
 * IA specifies and what a real deployment uses. This turns them into something
 * that also works from a subdirectory or from disk. When the page was opened
 * from disk, "properties/" is rewritten to "properties/index.html" because
 * file:// has no directory-index behaviour to fall back on.
 */
function routeUrl(href) {
  var h = String(href || "");
  if (!h) return h;
  if (/^([a-z]+:)?\/\//i.test(h) || h.startsWith("mailto:") || h.startsWith("tel:")) return h;
  if (h.startsWith("#")) return h;                       // same-page anchor
  if (!h.startsWith("/")) return h;                      // already relative — leave it
  var hash = "", query = "";
  var hi = h.indexOf("#"); if (hi > -1) { hash = h.slice(hi); h = h.slice(0, hi); }
  var qi = h.indexOf("?"); if (qi > -1) { query = h.slice(qi); h = h.slice(0, qi); }
  var path = h.replace(/^\//, "");
  if (RS_IS_FILE) {
    if (path === "") path = "index.html";
    else if (!/\.[a-z0-9]+$/i.test(path)) path = path.replace(/\/$/, "") + "/index.html";
  }
  return RS_BASE + path + query + hash;
}

/**
 * Rewrites every root-relative internal href inside `root` through routeUrl().
 * Markup stays authored as "/properties" — readable, matching the IA, and
 * correct for a real deployment — while what the browser actually follows is
 * resolved against wherever the site is really mounted.
 * Idempotent: an element is only rewritten once (data-route-resolved).
 */
function applyRouteUrls(root) {
  (root || document).querySelectorAll('a[href^="/"]:not([data-route-resolved])').forEach(function (a) {
    a.setAttribute("href", routeUrl(a.getAttribute("href")));
    a.setAttribute("data-route-resolved", "");
  });
}

/** Strips a display phone number to a tel:-safe form, e.g. "+92 333 6413988" -> "+923336413988". */
function telHref(displayNumber) {
  return `tel:${String(displayNumber).replace(/[^\d+]/g, "")}`;
}

/** Drops trailing zeros so 4.50 -> "4.5" and 4.00 -> "4". */
function trimDecimals(n) {
  return String(Number(n.toFixed(2)));
}

/** Formats a number as the configured currency, e.g. 45000000 -> "₨ 4.5 Crore" */
function formatPKR(amount) {
  if (amount == null) return "Price on application";
  const sym = REALTOR_CONFIG.currencySymbol;
  if (amount >= 10000000) return `${sym} ${trimDecimals(amount / 10000000)} Crore`;
  if (amount >= 100000) return `${sym} ${trimDecimals(amount / 100000)} Lakh`;
  return `${sym} ${amount.toLocaleString()}`;
}

/**
 * Resolves a `businessHours` object ({ status, customText }) to the exact
 * string visitors see. "always" never falls through to a fabricated closing
 * time — that is the whole point of this function existing instead of just
 * rendering `businessHours.customText` directly.
 */
function formatBusinessHours(businessHours) {
  if (!businessHours || !businessHours.status) return "";
  if (businessHours.status === "always") return "Always Open";
  if (businessHours.status === "closed") return "Currently Closed";
  return businessHours.customText || "";
}

REALTOR_CONFIG.businessHoursDisplay = formatBusinessHours(REALTOR_CONFIG.businessHours);
