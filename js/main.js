/**
 * Global site behavior: navbar state, mobile drawer, smooth scroll active-link,
 * scroll reveal, back-to-top, toast notifications, testimonial carousel, lightbox.
 * Keep this module framework-free and dependency-free.
 */

(function () {
  "use strict";

  /* ---------- Navbar scroll state ---------- */
  const navbar = document.querySelector(".navbar");
  function updateNavbarState() {
    if (!navbar) return;
    navbar.classList.toggle("is-scrolled", window.scrollY > 24);
  }
  updateNavbarState();
  window.addEventListener("scroll", updateNavbarState, { passive: true });

  /* ---------- Mobile drawer ---------- */
  const navToggle = document.querySelector(".nav-toggle");
  const drawer = document.querySelector(".mobile-drawer");
  const drawerClose = document.querySelector(".mobile-drawer-close");
  // The drawer is a modal dialog (aria-modal="true"), so keyboard focus has to
  // move into it on open, stay inside it while open, and return to the menu
  // button on close.
  function drawerFocusables() {
    return Array.from(drawer?.querySelectorAll("a[href], button:not([disabled])") || [])
      .filter((el) => el.offsetParent !== null && getComputedStyle(el).display !== "none");
  }
  function openDrawer() {
    drawer?.classList.add("open");
    navToggle?.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    drawerClose?.focus({ preventScroll: true });
  }
  function closeDrawer() {
    if (!drawer?.classList.contains("open")) return;
    drawer.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    if (drawer.contains(document.activeElement)) navToggle?.focus({ preventScroll: true });
  }
  navToggle?.addEventListener("click", openDrawer);
  drawerClose?.addEventListener("click", closeDrawer);
  drawer?.addEventListener("click", (e) => { if (e.target === drawer) closeDrawer(); });
  drawer?.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeDrawer));
  document.addEventListener("keydown", (e) => {
    if (!drawer?.classList.contains("open")) return;
    if (e.key === "Escape") { closeDrawer(); return; }
    if (e.key !== "Tab") return;
    const items = drawerFocusables();
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  // Resizing past the desktop breakpoint with the drawer open would leave the
  // page scroll-locked behind a menu that no longer exists.
  window.matchMedia("(min-width: 1101px)").addEventListener?.("change", (mq) => { if (mq.matches) closeDrawer(); });

  /* ---------- Active nav link on scroll (single-page sections) ---------- */
  const sections = document.querySelectorAll("main section[id]");
  const navAnchors = document.querySelectorAll('.nav-links a[href*="#"], .mobile-drawer nav a[href*="#"]');
  if (sections.length && navAnchors.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.getAttribute("id");
          navAnchors.forEach((a) => {
            const hrefId = a.getAttribute("href").split("#")[1];
            a.classList.toggle("active", hrefId === id);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
  }

  /* ---------- Scroll reveal ----------
     Elements start at opacity 0 and fade in when scrolled into view. Property
     cards are rendered AFTER this script runs (the grid is redrawn once the
     backend's listings arrive), so registration has to be repeatable: an
     element created later must still be picked up, or it stays invisible
     forever — the failure mode recorded as D-24. `observeReveals()` is
     therefore re-run on `rs:listings-updated`, and skips anything already
     registered. */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  function observeReveals() {
    document.querySelectorAll("[data-reveal]:not([data-reveal-observed])").forEach((el) => {
      el.setAttribute("data-reveal-observed", "");
      // Stagger siblings in a grid (cards, value tiles) by column position so a
      // row settles left to right instead of popping in as one block. Capped
      // at three steps so a long list never waits noticeably.
      const siblings = el.parentElement ? Array.from(el.parentElement.children).filter((c) => c.hasAttribute("data-reveal")) : [];
      if (siblings.length > 1) el.style.setProperty("--reveal-delay", (siblings.indexOf(el) % 3) * 80 + "ms");
      revealObserver.observe(el);
    });
  }

  observeReveals();
  document.addEventListener("rs:listings-updated", observeReveals);
  // Fired by js/listings.js every time a grid re-renders (filters, sort, reset).
  document.addEventListener("rs:content-rendered", observeReveals);

  /* ---------- Back to top ---------- */
  const backToTop = document.querySelector(".back-to-top");
  function updateBackToTop() {
    backToTop?.classList.toggle("visible", window.scrollY > 600);
  }
  updateBackToTop();
  window.addEventListener("scroll", updateBackToTop, { passive: true });
  backToTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- Hero background video (desktop + motion-safe only) ---------- */
  const heroVideo = document.querySelector("[data-hero-video]");
  if (heroVideo && window.innerWidth >= 768 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    heroVideo.addEventListener("canplay", () => heroVideo.classList.add("is-active"), { once: true });
    heroVideo.preload = "auto";
    heroVideo.load();
    heroVideo.play().catch(() => {}); // autoplay can be blocked; the poster image stays visible either way
  }

  /* ---------- Concierge launcher reveal (D-23, mobile only via CSS) ---------- */
  const conciergeLauncher = document.querySelector(".concierge-launcher");
  function updateConciergeLauncher() {
    conciergeLauncher?.classList.toggle("visible", window.scrollY > 600);
  }
  updateConciergeLauncher();
  window.addEventListener("scroll", updateConciergeLauncher, { passive: true });

  /* ---------- Toasts ---------- */
  function showToast(message, opts = {}) {
    let stack = document.querySelector(".toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      stack.setAttribute("aria-live", "polite");
      document.body.appendChild(stack);
    }
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
      <span>${message}</span>`;
    stack.appendChild(toast);
    const ttl = opts.duration || 3200;
    setTimeout(() => {
      toast.classList.add("leaving");
      setTimeout(() => toast.remove(), 250);
    }, ttl);
  }
  window.showToast = showToast;

  /* ---------- Testimonial carousel ---------- */
  const carousel = document.querySelector(".testimonial-carousel");
  if (carousel) {
    const track = carousel.querySelector(".testimonial-slides");
    const slides = carousel.querySelectorAll(".testimonial-slide");
    const dotsWrap = carousel.querySelector(".testimonial-dots");
    const prevBtn = carousel.querySelector(".testimonial-arrow.prev");
    const nextBtn = carousel.querySelector(".testimonial-arrow.next");
    let index = 0;
    let timer = null;

    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "testimonial-dot" + (i === 0 ? " active" : "");
      dot.setAttribute("aria-label", `Go to testimonial ${i + 1}`);
      dot.addEventListener("click", () => goTo(i));
      dotsWrap?.appendChild(dot);
    });

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      dotsWrap?.querySelectorAll(".testimonial-dot").forEach((d, di) => d.classList.toggle("active", di === index));
      resetTimer();
    }
    function resetTimer() {
      if (timer) clearInterval(timer);
      timer = setInterval(() => goTo(index + 1), 6500);
    }
    prevBtn?.addEventListener("click", () => goTo(index - 1));
    nextBtn?.addEventListener("click", () => goTo(index + 1));
    carousel.addEventListener("mouseenter", () => timer && clearInterval(timer));
    carousel.addEventListener("mouseleave", resetTimer);
    resetTimer();
  }

  /* ---------- Lightbox gallery ---------- */
  const lightbox = document.querySelector(".lightbox");
  if (lightbox) {
    let galleryItems = Array.from(document.querySelectorAll("[data-lightbox] .gallery-item, .gallery-item[data-full]"));
    const lbImg = lightbox.querySelector("img");
    const lbCaption = lightbox.querySelector(".lightbox-caption");
    const lbClose = lightbox.querySelector(".lightbox-close");
    const lbPrev = lightbox.querySelector(".lightbox-prev");
    const lbNext = lightbox.querySelector(".lightbox-next");
    let lbIndex = 0;

    function openLightbox(i) {
      lbIndex = i;
      const item = galleryItems[lbIndex];
      const full = item.dataset.full || item.querySelector("img")?.src;
      const caption = item.dataset.caption || item.querySelector("img")?.alt || "";
      lbImg.src = full;
      lbImg.alt = caption;
      lbCaption.textContent = caption;
      lightbox.classList.add("open");
      document.body.style.overflow = "hidden";
    }
    function closeLightbox() {
      lightbox.classList.remove("open");
      document.body.style.overflow = "";
    }
    function bindGalleryItems() {
      // Re-queried on each call: the property gallery is re-rendered when the
      // admin bridge resolves uploaded images, which replaces these elements.
      galleryItems = Array.from(document.querySelectorAll("[data-lightbox] .gallery-item, .gallery-item[data-full]"));
      galleryItems.forEach((item, i) => {
        if (item.dataset.lightboxBound) return;
        item.dataset.lightboxBound = "1";
        item.addEventListener("click", () => openLightbox(i));
        item.setAttribute("tabindex", "0");
        item.setAttribute("role", "button");
        item.setAttribute("aria-label", "Open image " + (i + 1) + " in lightbox");
        item.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLightbox(i); } });
      });
    }
    bindGalleryItems();
    window.__rsLightbox = { rebind: bindGalleryItems };
    lbClose?.addEventListener("click", closeLightbox);
    lbPrev?.addEventListener("click", () => openLightbox((lbIndex - 1 + galleryItems.length) % galleryItems.length));
    lbNext?.addEventListener("click", () => openLightbox((lbIndex + 1) % galleryItems.length));
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") lbPrev?.click();
      if (e.key === "ArrowRight") lbNext?.click();
    });
  }

  /**
   * ---------- Admin-panel business info ----------
   * Business details edited in `admin/settings.html` are stored server-side
   * and served to the public site by GET /api/v1/public/settings, so an edit
   * made on one device is visible to every visitor — the cross-device gap
   * D-27 documented is closed (see plans/MASTER_PLAN.md D-28). Values found
   * there take priority over the js/config.js defaults.
   *
   * If the API is unreachable (offline, or the page was opened from disk)
   * the js/config.js defaults stand, exactly as before.
   */
  function applyBusinessSettings(settings) {
    if (typeof REALTOR_CONFIG === "undefined" || !settings) return;
    const biz = settings.business || {};
    ["siteName", "phone", "phoneSecondary", "email", "officeAddress"].forEach((key) => {
      if (biz[key]) REALTOR_CONFIG[key] = biz[key];
    });
    if (biz.social) {
      Object.keys(biz.social).forEach((platform) => {
        if (biz.social[platform]) REALTOR_CONFIG.social[platform] = biz.social[platform];
      });
    }
    if (biz.businessHours && biz.businessHours.status) {
      REALTOR_CONFIG.businessHours = biz.businessHours;
    }
    if (settings.currency) REALTOR_CONFIG.currency = settings.currency;
    if (settings.currencySymbol) REALTOR_CONFIG.currencySymbol = settings.currencySymbol;
    REALTOR_CONFIG.businessHoursDisplay = formatBusinessHours(REALTOR_CONFIG.businessHours);
  }

  function loadBusinessSettings() {
    if (typeof RS_API_BASE === "undefined" || !RS_API_BASE) return Promise.resolve();
    return fetch(RS_API_BASE + "/public/settings", { credentials: "omit" })
      .then((res) => (res.ok ? res.json() : null))
      .then(applyBusinessSettings)
      .catch(() => undefined); // backend down — config.js defaults stand
  }

  /* ---------- Populate business info from config wherever data-config is present ---------- */
  function populateBusinessInfo() {
    if (typeof REALTOR_CONFIG === "undefined") return;
    document.querySelectorAll("[data-config]").forEach((el) => {
      const path = el.getAttribute("data-config").split(".");
      let value = REALTOR_CONFIG;
      for (const key of path) value = value?.[key];
      // Booleans are feature flags, not display text. Previously these were written
      // straight into the DOM, so the sample-data badge rendered the string "true".
      if (typeof value === "boolean") { el.hidden = !value; return; }
      if (value === undefined || value === null || value === "") {
        el.closest("[data-config-hide-empty]")?.remove();
        return;
      }
      // This pass only ever writes text. href is owned by the data-config-href pass
      // below — an anchor carrying both attributes used to keep its placeholder label.
      el.textContent = value;
    });
    // Feature flags: the element is shown only while the flag is truthy.
    document.querySelectorAll("[data-config-flag]").forEach((el) => {
      const path = el.getAttribute("data-config-flag").split(".");
      let value = REALTOR_CONFIG;
      for (const key of path) value = value?.[key];
      el.hidden = !value;
    });
    document.querySelectorAll("[data-config-href]").forEach((el) => {
      const path = el.getAttribute("data-config-href").split(".");
      let value = REALTOR_CONFIG;
      for (const key of path) value = value?.[key];
      if (!value) { el.style.display = "none"; return; }
      // A value still holding the [CONTENT REQUIRED] token is not a usable link target.
      if (String(value).includes("[CONTENT REQUIRED]")) { el.style.display = "none"; return; }
      if (el.getAttribute("data-config-href-type") === "tel") el.setAttribute("href", telHref(value));
      else if (el.getAttribute("data-config-href-type") === "mailto") el.setAttribute("href", `mailto:${value}`);
      else if (el.getAttribute("data-config-href-type") === "whatsapp") {
        const wa = buildWhatsAppLink(el.getAttribute("data-wa-message") || "");
        if (!wa) { el.style.display = "none"; return; } // hide until a real number is configured
        el.setAttribute("href", wa);
      }
      else el.setAttribute("href", value);
    });
    document.title = document.title.replace("Realtor Shamraiz", REALTOR_CONFIG.siteName);
  }

  // Populate once, after any server-side business settings have been applied,
  // so the page never renders a config default and then visibly swaps it.
  loadBusinessSettings().then(populateBusinessInfo);

  /* ---------- Image fallback ----------
     An image that fails to load must not leave a broken-image glyph and a
     collapsed card on a property site. This marks the element so CSS can show
     a neutral branded tile at the same dimensions, keeping layout stable.
     It deliberately does NOT substitute a different photograph — showing some
     other property's picture in place of the missing one would misrepresent
     the listing. The alt text remains the accessible description either way.
     Listens in the CAPTURE phase because `error` from <img> does not bubble. */
  document.addEventListener(
    "error",
    function (e) {
      var el = e.target;
      if (!el || el.tagName !== "IMG" || el.dataset.fallbackApplied) return;
      el.dataset.fallbackApplied = "1";
      el.classList.add("img-missing");
      // Keep the box occupied without fetching anything else.
      el.removeAttribute("src");
      var holder = el.closest(".listing-media, .gallery-item, .split-media, .area-card");
      if (holder) holder.classList.add("has-missing-image");
      if (window.console && console.warn) {
        console.warn("[Realtor Shamraiz] image failed to load:", el.getAttribute("alt") || "(no alt)");
      }
    },
    true
  );

  document.documentElement.classList.add("js-ready");
})();
