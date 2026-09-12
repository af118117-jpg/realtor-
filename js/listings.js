/**
 * Listing rendering, filtering, and saved-property (favorites) behavior.
 * Consumes LISTINGS from listings-data.js and REALTOR_CONFIG from config.js.
 */

(function () {
  "use strict";
  if (typeof LISTINGS === "undefined") return;

  // Redraw callbacks, invoked when the admin bridge finishes resolving images.
  const redrawHandlers = [];

  const SAVED_KEY = "rs_saved_listings";
  function getSaved() {
    try { return JSON.parse(localStorage.getItem(SAVED_KEY)) || []; } catch { return []; }
  }
  function toggleSaved(id) {
    const saved = getSaved();
    const idx = saved.indexOf(id);
    if (idx > -1) saved.splice(idx, 1); else saved.push(id);
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(saved)); } catch {}
    return saved.includes(id);
  }

  const heartIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>`;
  const pinIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>`;
  const bedIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 19v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7"/><path d="M3 19v2M21 19v2M3 13V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3"/></svg>`;
  const bathIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3z"/><path d="M4 12V6a2 2 0 0 1 3.5-1.3L9 6"/></svg>`;
  const areaIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h6v6H4zM14 14h6v6h-6z"/><path d="M10 4h4M4 10v4M20 10v4M10 20h4"/></svg>`;

  function areaLabel(item) {
    if (item.areaValue == null || !item.areaUnit) return "";
    return `${item.areaValue.toLocaleString()} ${item.areaUnit}`;
  }

  // A null price means no real price has been supplied. Never invent one.
  function priceLabel(item) {
    if (item.price == null) return "Price on application";
    const suffix = item.priceUnit === "per-month" ? " / month" : "";
    return `${formatPKR(item.price)}${suffix}`;
  }

  function cardTemplate(item) {
    const isSaved = getSaved().includes(item.id);
    const metaBits = [];
    if (item.beds) metaBits.push(`<span>${bedIcon}${item.beds} Beds</span>`);
    if (item.baths) metaBits.push(`<span>${bathIcon}${item.baths} Baths</span>`);
    if (areaLabel(item)) metaBits.push(`<span>${areaIcon}${areaLabel(item)}</span>`);

    // WhatsApp CTA is omitted entirely while the number is [CONTENT REQUIRED],
    // rather than rendering a link that goes nowhere.
    const waHref = buildWhatsAppLink(
      `Hello, I'm interested in "${item.title}" (${item.locality}). Could you share more details?`
    );
    const enquireCta = waHref
      ? `<a class="btn btn-primary btn-sm" href="${waHref}" target="_blank" rel="noopener noreferrer">Enquire</a>`
      : `<a class="btn btn-primary btn-sm" href="${telHref(REALTOR_CONFIG.phone)}">Call to Enquire</a>`;

    return `
    <article class="listing-card" data-reveal data-id="${item.id}">
      <div class="listing-media">
        <img src="${assetUrl(item.image)}" alt="${item.title} — ${item.locality}" loading="lazy" width="800" height="600">
        <span class="listing-tag ${item.demo ? "demo" : ""}">${item.demo ? "Sample listing · " : ""}${item.category}</span>
        <button class="listing-fav ${isSaved ? "is-saved" : ""}" aria-pressed="${isSaved}" aria-label="Save ${item.title} to favorites" data-fav="${item.id}">${heartIcon}</button>
      </div>
      <div class="listing-body">
        <div class="listing-price">${priceLabel(item)}</div>
        <h3 class="listing-title">${item.title}</h3>
        <div class="listing-loc">${pinIcon}<span>${item.locality}</span></div>
        <div class="listing-meta">${metaBits.join("")}</div>
        <div class="listing-cta">
          <a class="btn btn-outline btn-sm" href="/properties/detail?id=${item.id}">View Details</a>
          ${enquireCta}
        </div>
      </div>
    </article>`;
  }

  function bindFavButtons(root) {
    root.querySelectorAll("[data-fav]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const id = btn.getAttribute("data-fav");
        const nowSaved = toggleSaved(id);
        btn.classList.toggle("is-saved", nowSaved);
        btn.setAttribute("aria-pressed", String(nowSaved));
        window.showToast?.(nowSaved ? "Saved to your favorites" : "Removed from favorites");
      });
    });
  }

  function emptyStateTemplate() {
    return `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      <p>No properties match these filters right now.<br>Try a different category, or let us know what you're looking for.</p>
    </div>`;
  }

  function render(grid, items, limit) {
    const list = typeof limit === "number" ? items.slice(0, limit) : items;
    grid.innerHTML = list.length ? list.map(cardTemplate).join("") : emptyStateTemplate();
    // Cards are injected after the initial document pass, so their "View
    // Details" links need resolving too.
    if (typeof applyRouteUrls === "function") applyRouteUrls(grid);
    bindFavButtons(grid);
  }

  /* ---------- Featured grid (index.html) ---------- */
  const featuredGrid = document.querySelector("[data-listing-grid='featured']");
  if (featuredGrid) {
    const drawFeatured = () => render(featuredGrid, LISTINGS.filter((l) => l.featured));
    drawFeatured();
    redrawHandlers.push(drawFeatured);
  }

  /* ---------- Preset grids (/buy, /rent, landing pages) ----------
     A landing page shows a small, pre-filtered slice of the same LISTINGS
     source with no filter UI of its own — the purpose comes from markup
     (data-preset-type) and the cap from data-preset-limit. Featured records
     lead, then newest, so the strongest inventory surfaces first. */
  document.querySelectorAll("[data-listing-grid='preset']").forEach(function (grid) {
    var type = grid.getAttribute("data-preset-type");
    var limit = Number(grid.getAttribute("data-preset-limit")) || 3;
    var items = LISTINGS
      .filter(function (l) { return !type || l.type === type; })
      .sort(function (a, b) {
        return Number(b.featured) - Number(a.featured)
          || String(b.listedAt || "").localeCompare(String(a.listedAt || ""));
      });
    render(grid, items, limit);
    redrawHandlers.push(function () { render(grid, items, limit); });
  });

  /* ---------- Full listings grid with filters (/properties) ----------
     Drives the search page built in the static route scaffold. Filter inputs
     are declared in markup via [data-f="<key>"]; this module reads whatever is
     present, so adding a filter to the page needs no change here beyond a
     matching case in `matches()`.

     A filter whose data has no values is REMOVED from the UI rather than
     rendered empty. That matters most for City: the project has never been
     told which city to attribute a locality to (see D-21 in the master plan —
     "Bahria Town" alone was ambiguous and `city` was reverted to
     [CONTENT REQUIRED]), so City appears only once real records carry an
     explicit `city`. Nothing here derives a city from a locality string. */
  const fullGrid = document.querySelector("[data-listing-grid='all']");
  if (fullGrid) {
    const panel = document.querySelector("[data-filter-panel]");
    const searchInput = document.querySelector("[data-listing-search]");
    const sortSelect = document.querySelector("[data-listing-sort]");
    const countEl = document.querySelector("[data-results-count]");
    const purposeBtns = Array.from(document.querySelectorAll("[data-purpose]"));
    const fields = Array.from(document.querySelectorAll("[data-f]"));
    const field = (key) => fields.find((el) => el.getAttribute("data-f") === key);
    let purpose = "all";

    /* -- Option lists come from the data itself, plus any extra property types
          the admin has configured, so a type added in the admin panel is
          filterable here even before a listing uses it. -- */
    function adminSettings() {
      try { return JSON.parse(localStorage.getItem("rs-admin:settings")) || {}; } catch { return {}; }
    }
    function uniqueValues(key) {
      return [...new Set(LISTINGS.map((l) => l[key]).filter((v) => v != null && v !== ""))].sort();
    }
    function fillSelect(key, values, labelFor) {
      const el = field(key);
      if (!el || el.tagName !== "SELECT") return;
      if (!values.length) {
        // No data for this dimension — remove the whole control rather than
        // leaving a dropdown whose only option is "Any".
        el.closest(".filter-group")?.remove();
        return;
      }
      el.insertAdjacentHTML("beforeend", values
        .map((v) => `<option value="${String(v)}">${labelFor ? labelFor(v) : v}</option>`).join(""));
    }

    const statusLabels = { available: "Available", sold: "Sold", rented: "Rented", "under-offer": "Under offer", reserved: "Reserved" };
    fillSelect("city", uniqueValues("city"));
    fillSelect("locality", uniqueValues("locality"));
    fillSelect("category", [...new Set([
      ...uniqueValues("category"),
      ...((adminSettings().propertyTypes) || []),
    ])].sort());
    fillSelect("status", uniqueValues("status"), (v) => statusLabels[v] || v);
    fillSelect("sizeUnit", uniqueValues("areaUnit"));

    /* -- Filtering -- */
    function val(key) {
      const el = field(key);
      if (!el) return "";
      if (el.type === "checkbox") return el.checked;
      return el.value.trim();
    }

    function matches(l) {
      if (purpose !== "all" && l.type !== purpose) return false;

      const q = (searchInput?.value || "").trim().toLowerCase();
      if (q && !`${l.title} ${l.locality} ${l.category} ${l.city || ""}`.toLowerCase().includes(q)) return false;

      for (const key of ["city", "locality", "category", "status"]) {
        const want = val(key);
        if (want && String(l[key] ?? "") !== want) return false;
      }

      const minBeds = Number(val("beds")); if (minBeds && Number(l.beds || 0) < minBeds) return false;
      const minBaths = Number(val("baths")); if (minBaths && Number(l.baths || 0) < minBaths) return false;

      // A listing with no supplied price cannot be claimed to fall inside a
      // budget, so it drops out as soon as either bound is set — rather than
      // being silently treated as 0 (which would surface it under every
      // "under X" search) or as matching everything.
      const min = Number(val("priceMin")), max = Number(val("priceMax"));
      if ((min || max) && l.price == null) return false;
      if (min && l.price < min) return false;
      if (max && l.price > max) return false;

      // Size only compares within one unit — Marla, Kanal and sq ft have no
      // conversion the client has specified, so mixing them would invent one.
      const unit = val("sizeUnit");
      const sMin = Number(val("sizeMin")), sMax = Number(val("sizeMax"));
      if ((sMin || sMax)) {
        if (!unit) return true;                      // no unit chosen → size filter inactive
        if (l.areaUnit !== unit) return false;
        if (sMin && Number(l.areaValue || 0) < sMin) return false;
        if (sMax && Number(l.areaValue || 0) > sMax) return false;
      }

      if (val("featured") && !l.featured) return false;
      return true;
    }

    function currentItems() {
      const items = LISTINGS.filter(matches);
      const sort = sortSelect?.value || "featured";
      // Listings with no supplied price sort last in both price directions so
      // "Price on application" never masquerades as the cheapest option.
      if (sort === "price-asc") items.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
      else if (sort === "price-desc") items.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
      else if (sort === "newest") items.sort((a, b) => String(b.listedAt || "").localeCompare(String(a.listedAt || "")));
      else items.sort((a, b) => Number(b.featured) - Number(a.featured)
        || String(b.listedAt || "").localeCompare(String(a.listedAt || "")));
      return items;
    }

    function activeFilterCount() {
      let n = purpose !== "all" ? 1 : 0;
      if ((searchInput?.value || "").trim()) n++;
      fields.forEach((el) => {
        if (el.type === "checkbox") { if (el.checked) n++; }
        else if (el.value.trim()) n++;
      });
      return n;
    }

    function refresh() {
      const items = currentItems();
      render(fullGrid, items);
      if (countEl) {
        countEl.innerHTML = items.length
          ? `<strong>${items.length}</strong> ${items.length === 1 ? "property" : "properties"} of ${LISTINGS.length}`
          : `<strong>No properties</strong> match these filters`;
      }
      const badge = document.querySelector("[data-filter-count]");
      if (badge) { const n = activeFilterCount(); badge.textContent = String(n); badge.hidden = n === 0; }
      syncUrl();
    }

    /* -- URL state. Keeps filters shareable and back-button friendly, and is
          what the homepage search widget hands off to. -- */
    function syncUrl() {
      const q = new URLSearchParams();
      if (purpose !== "all") q.set("type", purpose);
      if ((searchInput?.value || "").trim()) q.set("q", searchInput.value.trim());
      fields.forEach((el) => {
        const key = el.getAttribute("data-f");
        if (el.type === "checkbox") { if (el.checked) q.set(key, "1"); }
        else if (el.value.trim()) q.set(key, el.value.trim());
      });
      const qs = q.toString();
      history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
    }

    function applyUrl() {
      const p = new URLSearchParams(window.location.search);
      const t = p.get("type");
      if (t && purposeBtns.some((b) => b.getAttribute("data-purpose") === t)) setPurpose(t, false);
      if (p.get("q") && searchInput) searchInput.value = p.get("q");
      fields.forEach((el) => {
        const key = el.getAttribute("data-f");
        if (!p.has(key)) return;
        if (el.type === "checkbox") el.checked = p.get(key) === "1";
        else el.value = p.get(key);
      });
      // The homepage widget sends the chosen area as `q`; if it names a real
      // locality, promote it to the locality filter so the control reflects it.
      const localitySel = field("locality");
      if (localitySel && p.get("q") && !p.get("locality")) {
        const hit = Array.from(localitySel.options).find((o) => o.value === p.get("q"));
        if (hit) { localitySel.value = hit.value; if (searchInput) searchInput.value = ""; }
      }
    }

    function setPurpose(value, rerender = true) {
      purpose = value;
      purposeBtns.forEach((b) => b.classList.toggle("active", b.getAttribute("data-purpose") === value));
      if (rerender) refresh();
    }

    purposeBtns.forEach((b) => b.addEventListener("click", () => setPurpose(b.getAttribute("data-purpose"))));
    fields.forEach((el) => el.addEventListener(el.tagName === "SELECT" || el.type === "checkbox" ? "change" : "input", refresh));
    searchInput?.addEventListener("input", refresh);
    sortSelect?.addEventListener("change", refresh);
    panel?.addEventListener("submit", (e) => e.preventDefault());

    document.querySelector("[data-filter-reset]")?.addEventListener("click", () => {
      fields.forEach((el) => { if (el.type === "checkbox") el.checked = false; else el.value = ""; });
      if (searchInput) searchInput.value = "";
      setPurpose("all");
    });

    /* -- Mobile filter drawer -- */
    const drawer = document.getElementById("filter-drawer");
    const openBtn = document.querySelector("[data-filter-open]");
    function setDrawer(open) {
      drawer?.classList.toggle("open", open);
      openBtn?.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    }
    openBtn?.addEventListener("click", () => setDrawer(true));
    document.querySelectorAll("[data-filter-close]").forEach((b) => b.addEventListener("click", () => setDrawer(false)));
    drawer?.addEventListener("click", (e) => { if (e.target === drawer) setDrawer(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && drawer?.classList.contains("open")) setDrawer(false); });

    applyUrl();
    refresh();
    redrawHandlers.push(refresh);
  }

  /* ---------- Homepage search widget → /properties handoff (D-13: route not built yet) ---------- */
  const searchForm = document.querySelector("[data-home-search]");
  searchForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(searchForm);
    const q = new URLSearchParams();
    if (data.get("type")) q.set("type", data.get("type"));
    if (data.get("q")) q.set("q", data.get("q"));
    window.location.href = `/properties${q.toString() ? "?" + q.toString() : ""}`;
  });

  /* ---------- Single property page ----------
     Moved to js/property-detail.js when the /properties/detail route was built.
     That module needs __rsListings.render (below) for its "similar properties"
     grid, so it loads AFTER this file — and, importantly, BEFORE js/main.js, so
     the cards and gallery it injects exist by the time main.js binds the
     lightbox and the reveal observer. That ordering is the same trap as D-24. */

  /* The admin bridge resolves uploaded images from IndexedDB asynchronously,
     after these grids have already drawn. Each render path registers itself
     here so it can redraw once the real photographs are available. */
  document.addEventListener("rs:listings-updated", function () {
    redrawHandlers.forEach(function (fn) { try { fn(); } catch (e) {} });
  });

  window.__rsListings = { render, cardTemplate, getSaved, toggleSaved };
})();
