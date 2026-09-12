/**
 * Admin Panel — shared chrome (sidebar/topbar) and small UI helpers.
 * The nav list is built once here rather than duplicated per page — see
 * TECH_ARCHITECTURE.md's "shared shell" concern, same reasoning applied here.
 */

const AdminUI = (function () {
  "use strict";

  const NAV_ITEMS = [
    { key: "dashboard", label: "Dashboard", href: "index.html", icon: "grid" },
    { key: "properties", label: "Properties", href: "properties.html", icon: "home" },
    { key: "leads", label: "Leads / Inquiries", href: "leads.html", icon: "inbox" },
    { key: "media", label: "Media Library", href: "media.html", icon: "image" },
    { key: "settings", label: "Settings", href: "settings.html", icon: "settings" },
  ];

  const ICONS = {
    grid: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13l3.5 7v7H2v-7z"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.14.31.33.58.56.79" />',
  };

  function iconSvg(name) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">${ICONS[name] || ""}</svg>`;
  }

  function renderSidebar(activeKey) {
    const el = document.getElementById("admin-sidebar");
    if (!el) return;
    const items = NAV_ITEMS.map((item) => {
      const active = item.key === activeKey ? ' aria-current="page" class="is-active"' : "";
      return `<a href="${item.href}"${active}>${iconSvg(item.icon)}<span>${item.label}</span></a>`;
    }).join("");
    el.innerHTML = `
      <a href="index.html" class="admin-brand">
        <span class="admin-brand-mark">RS</span>
        <span>Realtor Shamraiz<small>Admin</small></span>
      </a>
      <nav aria-label="Admin">${items}</nav>
      <div class="admin-sidebar-foot">
        <a href="../index.html#home" target="_blank" rel="noopener">View Website ↗</a>
        <button type="button" id="admin-logout-btn">Log Out</button>
      </div>
    `;
    document.getElementById("admin-logout-btn")?.addEventListener("click", () => AdminAuth.logout());

    const toggle = document.getElementById("admin-menu-toggle");
    toggle?.addEventListener("click", () => el.classList.toggle("open"));
  }

  function renderTopbarUser() {
    const el = document.getElementById("admin-current-user");
    if (el) el.textContent = AdminAuth.currentUsername() || "Admin";
  }

  // Toggle lives in the topbar (not the sidebar) — inserted here rather than
  // hand-added to every admin/*.html so every page picks it up the same way
  // the nav list already does. js/theme.js (loaded pre-paint) wires the click
  // handler and keeps aria-pressed/aria-label in sync once this exists in the DOM.
  function renderThemeToggle() {
    const actions = document.querySelector(".admin-topbar-actions");
    if (!actions || actions.querySelector("[data-theme-toggle]")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-toggle";
    btn.setAttribute("data-theme-toggle", "");
    btn.setAttribute("aria-label", "Switch to light mode");
    btn.setAttribute("aria-pressed", "false");
    btn.innerHTML = `
      <svg class="theme-toggle-icon icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
      <svg class="theme-toggle-icon icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`;
    actions.insertBefore(btn, actions.firstChild);
    // Deliberately no click/aria wiring here: js/theme.js's own DOMContentLoaded
    // pass finds every [data-theme-toggle] (this one included, since admin-ui.js
    // runs as a parser-inserted body script and so finishes before that event
    // fires) and wires it once. Wiring it again here would double-toggle per click.
  }

  /* ---------------------------- Toasts ---------------------------- */
  function toast(message, kind = "info") {
    let host = document.getElementById("admin-toast-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "admin-toast-host";
      host.className = "admin-toast-host";
      document.body.appendChild(host);
    }
    const note = document.createElement("div");
    note.className = `admin-toast admin-toast-${kind}`;
    note.textContent = message;
    host.appendChild(note);
    requestAnimationFrame(() => note.classList.add("is-in"));
    setTimeout(() => {
      note.classList.remove("is-in");
      setTimeout(() => note.remove(), 250);
    }, 3200);
  }

  /* ------------------------- Confirm dialog ------------------------- */
  function confirmDialog(message, { confirmLabel = "Confirm", danger = false } = {}) {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "admin-modal-overlay";
      overlay.innerHTML = `
        <div class="admin-modal" role="alertdialog" aria-modal="true">
          <p>${message}</p>
          <div class="admin-modal-actions">
            <button type="button" class="btn-admin btn-admin-ghost" data-act="cancel">Cancel</button>
            <button type="button" class="btn-admin ${danger ? "btn-admin-danger" : "btn-admin-primary"}" data-act="ok">${confirmLabel}</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay || e.target.dataset.act === "cancel") {
          overlay.remove();
          resolve(false);
        } else if (e.target.dataset.act === "ok") {
          overlay.remove();
          resolve(true);
        }
      });
    });
  }

  /* ---------------------------- Formatting ---------------------------- */
  function formatCurrency(amount, settings) {
    if (amount == null || amount === "") return "Price on application";
    const sym = (settings && settings.currencySymbol) || "₨";
    const n = Number(amount);
    if (n >= 10000000) return `${sym} ${trimZeros(n / 10000000)} Crore`;
    if (n >= 100000) return `${sym} ${trimZeros(n / 100000)} Lakh`;
    return `${sym} ${n.toLocaleString()}`;
  }
  function trimZeros(n) {
    return String(Number(n.toFixed(2)));
  }

  function formatDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d)) return "—";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function statusBadgeHtml(status, labels) {
    const label = (labels && labels[status]) || status;
    return `<span class="admin-badge admin-badge-${status}">${label}</span>`;
  }

  function mountPage(activeKey) {
    renderSidebar(activeKey);
    renderTopbarUser();
    renderThemeToggle();
  }

  return { mountPage, toast, confirmDialog, formatCurrency, formatDate, statusBadgeHtml };
})();
