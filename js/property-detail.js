/**
 * Property detail page (/properties/detail?id=…).
 * ---------------------------------------------------------------------------
 * Replaces the minimal [data-property-page] stub that used to live in
 * js/listings.js while this route did not exist.
 *
 * ON THE URL AND noindex
 * The IA specifies `/properties/{category}-{locality}-{id}` as the real,
 * indexable property URL. A static site with no build step cannot emit one
 * folder per slug on its own, so this page serves every property from a single
 * document keyed by `?id=`. That is fine for visitors and for the admin
 * workflow, but it must NOT be indexed: one URL standing in for every listing
 * is precisely the thin/duplicate pattern docs/SEO_STRATEGY.md forbids, and
 * the sample listings carry noindex anyway. The page therefore ships with
 * <meta name="robots" content="noindex"> until real slug pages are generated.
 *
 * TO GET REAL SLUG URLS LATER: emit one `/properties/<slug>/index.html` per
 * published listing (a small Node script over the admin export, or the
 * backend's own renderer), each with its own <title>, description, canonical
 * and RealEstateListing JSON-LD, then drop the noindex. Nothing else on this
 * page needs to change — the render functions below take a record, not a URL.
 *
 * NOTHING HERE INVENTS A FIELD. A record without a description renders no
 * description block; without amenities, no amenities block; without a map URL,
 * no map. Empty is always preferred to placeholder prose on a real business's
 * site (master rule 02).
 */

(function () {
  "use strict";

  var root = document.querySelector("[data-property-page]");
  if (!root || typeof LISTINGS === "undefined") return;

  var notFound = document.querySelector("[data-p-notfound]");
  var params = new URLSearchParams(window.location.search);
  var id = params.get("id");
  var item = LISTINGS.find(function (l) { return l.id === id || l.slug === id; });

  if (!item) {
    root.hidden = true;
    if (notFound) notFound.hidden = false;
    document.title = "Property not found · " + REALTOR_CONFIG.siteName;
    return;
  }

  /* ------------------------------------------------------------------ utils */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function setText(sel, value) {
    document.querySelectorAll(sel).forEach(function (el) { el.textContent = value; });
  }
  function areaLabel(l) {
    if (l.areaValue == null || !l.areaUnit) return "";
    return l.areaValue.toLocaleString() + " " + l.areaUnit;
  }
  function priceLabel(l) {
    if (l.price == null) return "Price on application";
    return formatPKR(l.price) + (l.priceUnit === "per-month" ? " / month" : "");
  }

  /* ------------------------------------------------------------- head fields */
  var title = item.title || "Property";
  document.title = title + " · " + REALTOR_CONFIG.siteName;

  setText("[data-p-title]", title);
  setText("[data-p-crumb]", item.category || "Property");
  setText("[data-p-category]", item.category || "");
  setText("[data-p-area]", item.locality || "");
  setText("[data-p-price]", priceLabel(item));
  setText("[data-p-ref]", String(item.id || "").toUpperCase());

  var statusEl = document.querySelector("[data-p-status]");
  if (statusEl && item.status) {
    var STATUS = { available: "Available", sold: "Sold", rented: "Rented", "under-offer": "Under offer", reserved: "Reserved" };
    statusEl.textContent = STATUS[item.status] || item.status;
    statusEl.hidden = false;
  }
  if (item.demo) {
    var demoFlag = document.querySelector("[data-p-demo-flag]");
    if (demoFlag) demoFlag.hidden = false;
  }
  var formRef = document.querySelector("[data-p-form-ref]");
  if (formRef) formRef.value = title + " (" + String(item.id || "").toUpperCase() + ")";

  // Label above the price. Only the purpose the record states is used; a
  // listing with no stated purpose gets no label rather than a guessed one.
  var PRICE_LABEL = { buy: "Asking price", rent: "Monthly rent", commercial: "Asking price" };
  setText("[data-p-price-label]", item.price == null ? "Price" : (PRICE_LABEL[item.type] || "Price"));

  // At-a-glance facts under the title (beds · baths · area). Same "nothing
  // invented" rule: a missing field is simply left out.
  var keyfacts = document.querySelector("[data-p-keyfacts]");
  if (keyfacts) {
    var facts = [];
    if (item.beds) facts.push("<strong>" + esc(item.beds) + "</strong> " + (item.beds == 1 ? "Bed" : "Beds"));
    if (item.baths) facts.push("<strong>" + esc(item.baths) + "</strong> " + (item.baths == 1 ? "Bath" : "Baths"));
    if (areaLabel(item)) facts.push("<strong>" + esc(item.areaValue.toLocaleString()) + "</strong> " + esc(item.areaUnit));
    keyfacts.innerHTML = facts.map(function (f) { return "<li>" + f + "</li>"; }).join("");
    keyfacts.hidden = !facts.length;
  }

  // Agent card: restate which property the visitor is asking about, so the
  // call/viewing buttons beside it are unambiguous.
  setText("[data-p-agent-title]", title);
  setText("[data-p-agent-price]", priceLabel(item));

  // Mobile action bar (fixed to the bottom under 980px, hidden by CSS above).
  // It steps aside while the agent card or the viewing form is on screen, so
  // the same buttons never show twice and the bar never covers the form.
  var ctaBar = document.querySelector("[data-p-cta-bar]");
  var ctaTargets = [document.querySelector(".agent-card"), document.querySelector("[data-p-viewing-form]")].filter(Boolean);
  if (ctaBar && ctaTargets.length && "IntersectionObserver" in window) {
    document.body.classList.add("has-cta-bar");
    var onScreen = new Set();
    var ctaObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) onScreen.add(en.target); else onScreen.delete(en.target);
      });
      ctaBar.classList.toggle("is-visible", onScreen.size === 0);
    }, { threshold: 0 });
    ctaTargets.forEach(function (t) { ctaObserver.observe(t); });
  }
  document.querySelector("[data-p-cta-bar-viewing]")?.addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelector("[data-p-viewing-form]")?.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("v-name")?.focus({ preventScroll: true });
  });

  /* ----------------------------------------------------------------- gallery */
  // gallery[] falls back to the single cover image. Alt text describes the real
  // subject rather than repeating the title verbatim on every frame.
  //
  // Drawn through a function rather than once inline: for a property added in
  // the admin panel the photographs are blobs in IndexedDB, and js/admin-bridge.js
  // can only resolve those asynchronously. Without a redraw the gallery would
  // render empty for exactly the records that DO have real uploaded photos.
  var gallery = document.querySelector("[data-p-gallery]");

  // Desktop shows a mosaic of at most this many frames; the rest stay in the
  // DOM (hidden by CSS) so the lightbox and the mobile swipe strip reach them.
  var MOSAIC_MAX = 5;

  function renderGallery() {
    if (!gallery) return;
    var images = (item.gallery && item.gallery.length ? item.gallery : [item.image]).filter(Boolean);
    if (!images.length) { gallery.innerHTML = ""; return; }
    var extra = images.length - MOSAIC_MAX;
    gallery.innerHTML = images.map(function (src, i) {
      var alt = title + " — " + (item.locality || "") + (images.length > 1 ? " (image " + (i + 1) + " of " + images.length + ")" : "");
      // The last visible mosaic frame carries a "+N" overlay when photos are
      // held back, so the visitor knows there is more to see.
      var more = (extra > 0 && i === MOSAIC_MAX - 1)
        ? '<span class="gallery-more" aria-hidden="true">+' + extra + " photos</span>" : "";
      return '<div class="gallery-item" data-full="' + esc(assetUrl(src)) + '" data-caption="' + esc(alt) + '">' +
             '<img src="' + esc(assetUrl(src)) + '" alt="' + esc(alt) + '" loading="' + (i === 0 ? "eager" : "lazy") + '"' +
             (i === 0 ? ' fetchpriority="high"' : "") + ' decoding="async" width="1200" height="800">' + more + "</div>";
    }).join("");
    // data-count drives the layout: 1 = single wide frame, 2 = pair,
    // 3+ = lead frame + thumbnails (see .gallery-grid rules in css/style.css).
    gallery.setAttribute("data-count", String(Math.min(images.length, MOSAIC_MAX)));
    gallery.classList.toggle("gallery-grid-lead", images.length > 2);

    var counter = document.querySelector("[data-p-gallery-count]");
    if (counter) {
      counter.textContent = images.length > 1 ? "View all " + images.length + " photos" : "View photo";
      counter.hidden = false;
    }
    syncPosition();
  }

  // "View all photos" opens the lightbox on the first frame.
  document.querySelector("[data-p-gallery-count]")?.addEventListener("click", function () {
    gallery?.querySelector(".gallery-item")?.click();
  });

  // Mobile swipe strip: keep the "1 / N" position badge in sync with scroll.
  // Hidden by CSS on desktop, where the mosaic shows the frames side by side.
  function syncPosition() {
    var positionEl = document.querySelector("[data-p-gallery-position]");
    if (!gallery || !positionEl) return;
    var items = gallery.querySelectorAll(".gallery-item");
    if (items.length < 2) { positionEl.hidden = true; return; }
    var step = items[1].offsetLeft - items[0].offsetLeft || 1;
    var idx = Math.round(gallery.scrollLeft / step);
    positionEl.textContent = Math.min(idx + 1, items.length) + " / " + items.length;
    positionEl.hidden = false;
  }
  if (gallery) {
    gallery.addEventListener("scroll", function () { window.requestAnimationFrame(syncPosition); }, { passive: true });
    window.addEventListener("resize", syncPosition, { passive: true });
  }
  renderGallery();

  // Uploaded images finished resolving — redraw, and rebind the lightbox to the
  // frames that now exist.
  document.addEventListener("rs:listings-updated", function () {
    var fresh = LISTINGS.find(function (l) { return l.id === item.id || l.slug === item.id; });
    if (fresh) item = fresh;
    renderGallery();
    if (window.__rsLightbox && typeof window.__rsLightbox.rebind === "function") {
      window.__rsLightbox.rebind();
    }
  });

  /* ------------------------------------------------------------------- video */
  var videoWrap = document.querySelector("[data-p-video]");
  var videoMount = document.querySelector("[data-p-video-mount]");
  if (videoWrap && videoMount && item.video) {
    videoMount.innerHTML = '<video controls preload="none" playsinline poster="' + esc(assetUrl(item.image || "")) + '">' +
      '<source src="' + esc(assetUrl(item.video)) + '" type="video/mp4"></video>';
    videoWrap.hidden = false;
  }

  /* ------------------------------------------------------------------- specs */
  var specsWrap = document.querySelector("[data-p-specs]");
  if (specsWrap) {
    var specs = [];
    if (item.beds) specs.push(["Bedrooms", item.beds]);
    if (item.baths) specs.push(["Bathrooms", item.baths]);
    if (areaLabel(item)) specs.push(["Area", areaLabel(item)]);
    if (item.category) specs.push(["Type", item.category]);
    if (item.parking) specs.push(["Parking", item.parking]);
    if (item.floors) specs.push(["Floors", item.floors]);
    if (item.constructionYear) specs.push(["Built", item.constructionYear]);
    specsWrap.innerHTML = specs.map(function (s) {
      return '<div class="spec-item"><span class="spec-label">' + esc(s[0]) + '</span>' +
             '<span class="spec-value">' + esc(s[1]) + "</span></div>";
    }).join("");
  }

  /* ------------------------------------------------- description / amenities */
  if (item.summary) {
    setText("[data-p-summary]", item.summary);
    var descBlock = document.querySelector("[data-p-description-block]");
    if (descBlock) descBlock.hidden = false;
  }

  var amenities = item.amenities || [];
  if (amenities.length) {
    var list = document.querySelector("[data-p-amenities]");
    if (list) {
      list.innerHTML = amenities.map(function (a) {
        return '<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
               '<path d="M20 6L9 17l-5-5"/></svg>' + esc(a) + "</li>";
      }).join("");
      document.querySelector("[data-p-amenities-block]").hidden = false;
    }
  }

  /* --------------------------------------------------------------------- map */
  // Only an explicit per-property embed URL is used. No address is guessed and
  // no map is generated from a locality name.
  var mapUrl = item.mapUrl || "";
  if (mapUrl) {
    var mapMount = document.querySelector("[data-p-map]");
    if (mapMount) {
      mapMount.innerHTML = '<iframe src="' + esc(mapUrl) + '" title="Map showing the location of ' +
        esc(title) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>';
      document.querySelector("[data-p-map-block]").hidden = false;
    }
  }

  /* ---------------------------------------------------------------- WhatsApp */
  var waMount = document.querySelector("[data-p-whatsapp-mount]");
  var waLink = buildWhatsAppLink(
    'Hello, I\'m interested in "' + title + '" (' + (item.locality || "") + "). Could you share more details and arrange a viewing?"
  );
  if (waMount && waLink) {
    waMount.innerHTML = '<a class="btn btn-ghost btn-block" href="' + esc(waLink) +
      '" target="_blank" rel="noopener noreferrer">Message on WhatsApp</a>';
  }

  /* ------------------------------------------------------- in-page scrolling */
  document.querySelector("[data-p-scroll-to-form]")?.addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelector("[data-p-viewing-form]")?.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("v-name")?.focus({ preventScroll: true });
  });

  /* ------------------------------------------------------ similar properties */
  // Same locality first, then same category, excluding this record. Capped at
  // three so the section stays a suggestion rather than a second results page.
  var similar = LISTINGS
    .filter(function (l) { return l.id !== item.id; })
    .map(function (l) {
      var score = 0;
      if (l.locality === item.locality) score += 2;
      if (l.category === item.category) score += 2;
      if (l.type === item.type) score += 1;
      return { l: l, score: score };
    })
    .filter(function (s) { return s.score > 0; })
    .sort(function (a, b) { return b.score - a.score; })
    .slice(0, 3)
    .map(function (s) { return s.l; });

  if (similar.length && window.__rsListings) {
    var grid = document.querySelector("[data-p-similar]");
    window.__rsListings.render(grid, similar);
    document.querySelector("[data-p-similar-block]").hidden = false;
  }
})();
