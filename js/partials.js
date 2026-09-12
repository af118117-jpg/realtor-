/**
 * Shared chrome (navbar, mobile drawer, footer, assistant widget, back-to-top).
 * ---------------------------------------------------------------------------
 * WHY THIS FILE EXISTS
 * The route map in docs/INFORMATION_ARCHITECTURE.md defines 19 routes. This is
 * a static site with no build step, so without a shared partial the navbar and
 * footer would be copy-pasted 19 times — and the next time a phone number or a
 * nav item changes, 18 of those copies silently go stale. Everything that
 * appears on every page is defined ONCE here and injected at load.
 *
 * LOAD ORDER MATTERS. This must run:
 *   - AFTER  js/config.js        (REALTOR_CONFIG is read for the footer/CTAs)
 *   - BEFORE js/main.js          (main.js binds .nav-toggle, .back-to-top,
 *                                 [data-config] etc. at load — the elements
 *                                 have to exist by then)
 *   - BEFORE js/ai-concierge.js  (it queries .concierge-launcher / .concierge-panel)
 * It is deliberately a plain synchronous <script> with no defer/async.
 *
 * MARKUP IS UNCHANGED. Every class, attribute and SVG below is copied verbatim
 * from the hand-written chrome in index.html, so css/style.css and every
 * querySelector in js/main.js keep working exactly as before. This file moves
 * that markup; it does not redesign it.
 *
 * URLS ARE ROOT-RELATIVE (`/properties`, not `properties/index.html`), matching
 * the IA's URL conventions and the slugs already hard-coded in js/listings.js.
 * That means THE SITE MUST BE SERVED, not opened from disk — `npx serve` (see
 * .claude/launch.json) or any static host. Opening index.html directly via
 * file:// will load styles and scripts fine but every nav link will fail,
 * because file:// resolves a leading `/` to the drive root (the same quirk
 * documented as D-25 in plans/MASTER_PLAN.md).
 */

(function () {
  "use strict";

  /**
   * The single source of truth for primary navigation. Add a route here and it
   * appears in the desktop nav, the mobile drawer and the footer at once.
   * `pending: true` keeps the data-route-pending marker that flags a route as
   * not yet built — remove it the moment the page exists, never before.
   */
  var NAV = [
    { href: "/properties", label: "Properties" },
    { href: "/buy", label: "Buy" },
    { href: "/sell", label: "Sell" },
    { href: "/rent", label: "Rent" },
    { href: "/invest", label: "Invest" },
    { href: "/market-insights", label: "Insights" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  var FOOTER_COLS = [
    {
      heading: "Property",
      links: [
        { href: "/properties", label: "All Properties" },
        { href: "/buy", label: "Buy" },
        { href: "/sell", label: "Sell" },
        { href: "/rent", label: "Rent" },
        { href: "/invest", label: "Invest" },
      ],
    },
    {
      heading: "Company",
      links: [
        { href: "/about", label: "About" },
        { href: "/market-insights", label: "Market Insights" },
        { href: "/contact", label: "Contact" },
        { href: "/#faq", label: "FAQ" },
      ],
    },
  ];

  var ICON = {
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1.1.4 2.2.8 3.2a2 2 0 0 1-.4 2.1L8.1 10.5a16 16 0 0 0 6 6l1.5-1.4a2 2 0 0 1 2.1-.4c1 .4 2.1.7 3.2.8a2 2 0 0 1 1.1 2.4z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-1 4 8.5 8.5 0 0 1-7.5 4.5 8.4 8.4 0 0 1-4-1L3 21l2-5.5a8.4 8.4 0 0 1-1-4 8.5 8.5 0 0 1 8.5-8.5c4.5 0 8.9 3.3 8.5 8.5z"/></svg>',
    sun: '<svg class="theme-toggle-icon icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
    moon: '<svg class="theme-toggle-icon icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9h3V6h-3a4 4 0 0 0-4 4v2H7v3h3v6h3v-6h3l1-3h-4v-2a1 1 0 0 1 1-1z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3a5 5 0 0 0 5 5"/><path d="M16 3v12.5a4.5 4.5 0 1 1-4.5-4.5c.35 0 .69.03 1 .1"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10.5 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="11" x2="8" y2="16"/><line x1="8" y1="8" x2="8" y2="8"/><line x1="12" y1="11" x2="12" y2="16"/><path d="M12 13a2 2 0 0 1 4 0v3"/></svg>',
  };

  /** Current route, normalised so "/buy" and "/buy/" mark the same nav item. */
  var here = window.location.pathname.replace(/\/index\.html$/, "/").replace(/(.)\/$/, "$1");

  function navAttrs(item) {
    var attrs = item.pending ? " data-route-pending" : "";
    // aria-current is the accessible "you are here" signal; .nav-links already
    // styles [aria-current="page"] with the gold underline.
    if (!item.pending && item.href === here) attrs += ' aria-current="page"';
    return attrs;
  }

  function navLinks(items) {
    return items.map(function (i) {
      return '<a href="' + routeUrl(i.href) + '" data-route-resolved' + navAttrs(i) + ">" + i.label + "</a>";
    }).join("\n      ");
  }

  function header() {
    return [
      '<header class="navbar">',
      '  <div class="container nav-inner">',
      '    <a href="' + routeUrl("/") + '" data-route-resolved class="brand" aria-label="Realtor Shamraiz — home">',
      '      <span class="brand-mark" aria-hidden="true">RS</span>',
      '      <span class="brand-name">Realtor Shamraiz</span>',
      "    </a>",
      '    <nav class="nav-links" aria-label="Primary">',
      "      " + navLinks(NAV),
      "    </nav>",
      '    <div class="nav-actions">',
      '      <button type="button" class="theme-toggle" data-theme-toggle aria-label="Switch to light mode" aria-pressed="false">',
      "        " + ICON.sun + ICON.moon,
      "      </button>",
      '      <a class="nav-assistant" href="' + routeUrl("/ai-assistant") + '" data-route-resolved data-open-assistant>',
      "        " + ICON.chat,
      '        <span class="nav-assistant-label">AI Assistant</span>',
      '        <span class="sr-only">— automated, not a live person</span>',
      "      </a>",
      '      <a class="btn btn-primary btn-sm nav-cta" href="tel:" data-config-href="phone" data-config-href-type="tel">',
      "        " + ICON.phone,
      '        <span class="nav-cta-long">Book a Site Visit</span>',
      '        <span class="nav-cta-short">Call</span>',
      "      </a>",
      '      <button class="nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-drawer">' + ICON.menu + "</button>",
      "    </div>",
      "  </div>",
      "</header>",
      '<div class="mobile-drawer" id="mobile-drawer" role="dialog" aria-modal="true" aria-label="Site navigation">',
      '  <div class="mobile-drawer-panel">',
      '    <div class="mobile-drawer-head">',
      '      <span class="brand-mark" aria-hidden="true">RS</span>',
      '      <button class="mobile-drawer-close" aria-label="Close menu">' + ICON.close + "</button>",
      "    </div>",
      '    <nav aria-label="Mobile primary">',
      "      " + navLinks(NAV),
      "    </nav>",
      '    <div class="mobile-drawer-foot">',
      '      <a class="btn btn-outline btn-block" href="' + routeUrl("/ai-assistant") + '" data-route-resolved data-open-assistant>Ask the AI Assistant</a>',
      '      <a class="btn btn-primary btn-block" href="tel:" data-config-href="phone" data-config-href-type="tel">Call <span data-config="phone"></span></a>',
      '      <a class="btn btn-ghost btn-block" href="tel:" data-config-href="phoneSecondary" data-config-href-type="tel">Call <span data-config="phoneSecondary"></span></a>',
      "    </div>",
      "  </div>",
      "</div>",
    ].join("\n");
  }

  function footerCol(col) {
    return [
      '<div class="footer-col">',
      "  <h4>" + col.heading + "</h4>",
      "  <ul>",
      col.links.map(function (l) {
        return '    <li><a href="' + routeUrl(l.href) + '" data-route-resolved' + (l.pending ? " data-route-pending" : "") + ">" + l.label + "</a></li>";
      }).join("\n"),
      "  </ul>",
      "</div>",
    ].join("\n");
  }

  function footer() {
    // Social anchors are emitted for every platform; js/main.js hides any whose
    // REALTOR_CONFIG value is empty, so an unsupplied channel (LinkedIn today)
    // never renders a dead icon. Do not add a platform here without a real URL.
    var social = ["instagram", "facebook", "tiktok", "youtube", "linkedin"].map(function (p) {
      var label = p.charAt(0).toUpperCase() + p.slice(1);
      if (p === "tiktok") label = "TikTok";
      if (p === "youtube") label = "YouTube";
      if (p === "linkedin") label = "LinkedIn";
      return '<a href="#" data-config-href="social.' + p + '" target="_blank" rel="noopener" aria-label="' + label + '">' + ICON[p] + "</a>";
    }).join("");

    return [
      "<footer>",
      '  <div class="container">',
      '    <div class="footer-grid">',
      '      <div class="footer-col footer-brand">',
      '        <a href="' + routeUrl("/") + '" data-route-resolved class="brand"><span class="brand-mark" aria-hidden="true">RS</span><span data-config="siteName">Realtor Shamraiz</span></a>',
      '        <p data-config="tagline">[CONTENT REQUIRED]</p>',
      '        <p class="footer-areas">Luxury property in Bahria Town Rawalpindi &amp; DHA Islamabad.</p>',
      '        <div class="footer-social">' + social + "</div>",
      "      </div>",
      FOOTER_COLS.map(footerCol).join("\n"),
      '      <div class="footer-col">',
      "        <h4>Contact</h4>",
      "        <ul>",
      '          <li><a href="tel:" data-config-href="phone" data-config-href-type="tel" data-config="phone">Phone</a></li>',
      '          <li><a href="tel:" data-config-href="phoneSecondary" data-config-href-type="tel" data-config="phoneSecondary">Phone</a></li>',
      '          <li><a href="mailto:" data-config-href="email" data-config-href-type="mailto" data-config="email">Email</a></li>',
      '          <li><span data-config="officeAddress">Office address</span></li>',
      "        </ul>",
      "      </div>",
      "    </div>",
      '    <div class="footer-bottom">',
      '      <span>&copy; <span data-year></span> <span data-config="siteName">Realtor Shamraiz</span>. All rights reserved.</span>',
      '      <span data-config="license">License placeholder</span>',
      "    </div>",
      "  </div>",
      "</footer>",
    ].join("\n");
  }

  function widgets() {
    return [
      '<button class="concierge-launcher" aria-expanded="false" aria-controls="concierge-panel" aria-label="Open the AI assistant">',
      '  <span class="concierge-launcher-icon">' + ICON.chat + "</span>",
      "  <span>AI Assistant</span>",
      '  <span class="pulse-dot" aria-hidden="true"></span>',
      "</button>",
      '<div class="concierge-panel" id="concierge-panel" role="dialog" aria-label="AI assistant chat">',
      '  <div class="concierge-head">',
      '    <div class="concierge-head-info">',
      '      <span class="concierge-launcher-icon" style="width:34px;height:34px">' + ICON.chat + "</span>",
      "      <div><strong>AI Assistant</strong><span>● Automated · Not a live person</span></div>",
      "    </div>",
      '    <button class="concierge-close" aria-label="Close chat">' + ICON.close + "</button>",
      "  </div>",
      '  <div class="concierge-body" aria-live="polite"></div>',
      '  <form class="concierge-input-form">',
      '    <div class="concierge-input">',
      '      <input type="text" placeholder="Type a message..." aria-label="Type a message">',
      '      <button type="submit" aria-label="Send message">' + ICON.send + "</button>",
      "    </div>",
      "  </form>",
      '  <p class="concierge-disclaimer">Automated assistant — not a live person. It answers a short list of common questions and hands you to the team for anything else.</p>',
      "</div>",
      '<button class="back-to-top" aria-label="Back to top">' + ICON.up + "</button>",
    ].join("\n");
  }

  /* ---------------------------------------------------------------------
     Mount. A page opts in by placing an empty <div data-partial="header">,
     <div data-partial="footer"> and <div data-partial="widgets"> where each
     block belongs. Missing mounts are simply skipped, so a page can take the
     header without the assistant widget if that ever makes sense.
     --------------------------------------------------------------------- */
  var BLOCKS = { header: header, footer: footer, widgets: widgets };

  Object.keys(BLOCKS).forEach(function (name) {
    var mount = document.querySelector('[data-partial="' + name + '"]');
    if (!mount) return;
    // outerHTML replaces the placeholder entirely so the injected markup sits
    // at the same depth the hand-written version did — .navbar and <footer>
    // must not end up wrapped in a stray div, or their layout rules change.
    mount.outerHTML = BLOCKS[name]();
  });

  // Every remaining root-relative link authored directly in a page body
  // (hero CTAs, card links, footer extras) goes through the same resolver.
  applyRouteUrls(document);

  // Copyright year — was an inline script in index.html keyed to a hard-coded
  // element id; now driven by an attribute so every page gets it for free.
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  window.RS_PARTIALS = { NAV: NAV, ICON: ICON };
})();
