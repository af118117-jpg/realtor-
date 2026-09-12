(function () {
  "use strict";

  AdminStore.seedIfEmpty();
  AdminUI.mountPage("properties");

  const settings = AdminStore.getSettings();
  const searchEl = document.getElementById("pf-search");
  const statusEl = document.getElementById("pf-status");
  const typeEl = document.getElementById("pf-type");
  const listingTypeEl = document.getElementById("pf-listing-type");
  const tbody = document.getElementById("properties-tbody");
  const emptyEl = document.getElementById("properties-empty");
  const countMeta = document.getElementById("properties-count-meta");

  statusEl.innerHTML += ADMIN_CONFIG.statuses.map((s) => `<option value="${s}">${ADMIN_CONFIG.statusLabels[s]}</option>`).join("");
  typeEl.innerHTML += (settings.propertyTypes || ADMIN_CONFIG.defaultPropertyTypes).map((t) => `<option value="${t}">${t}</option>`).join("");

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  async function coverThumbUrl(p) {
    const cover = (p.images || []).find((i) => i.isCover) || (p.images || [])[0];
    if (!cover) return "../assets/images/agent/agent-placeholder.svg";
    if (cover.externalSrc) return `../${cover.externalSrc}`;
    if (cover.mediaId) {
      const rec = await AdminDB.get(cover.mediaId);
      return AdminDB.objectUrlFor(rec) || "../assets/images/agent/agent-placeholder.svg";
    }
    return "../assets/images/agent/agent-placeholder.svg";
  }

  function matchesFilters(p) {
    const q = searchEl.value.trim().toLowerCase();
    if (q) {
      const hay = `${p.title} ${p.propertyId} ${p.locality} ${p.address}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (statusEl.value && p.status !== statusEl.value) return false;
    if (typeEl.value && p.category !== typeEl.value) return false;
    if (listingTypeEl.value && p.listingType !== listingTypeEl.value) return false;
    return true;
  }

  async function renderRow(p) {
    const thumb = await coverThumbUrl(p);
    return `
      <tr data-id="${p.id}">
        <td><img class="thumb" src="${thumb}" alt=""></td>
        <td>${escapeHtml(p.propertyId) || "—"}</td>
        <td>${escapeHtml(p.title) || "Untitled"}${p.fromPublicSample ? '<div style="font-size:0.72rem;color:var(--color-warning)">Sample listing</div>' : ""}</td>
        <td>${escapeHtml(p.category) || "—"}</td>
        <td style="text-transform:capitalize">${p.listingType || "—"}</td>
        <td>${AdminUI.formatCurrency(p.price, settings)}</td>
        <td>${escapeHtml(p.locality) || "—"}</td>
        <td>
          <select class="pf-status-select" data-act="set-status" aria-label="Status for ${escapeHtml(p.title)}">
            ${ADMIN_CONFIG.statuses.map((s) => `<option value="${s}" ${s === p.status ? "selected" : ""}>${ADMIN_CONFIG.statusLabels[s]}</option>`).join("")}
          </select>
        </td>
        <td style="white-space:nowrap">${AdminUI.formatDate(p.createdAt)}</td>
        <td>
          <div class="admin-row-actions">
            <a class="btn-admin btn-admin-ghost btn-admin-sm" href="property-editor.html?id=${p.id}&tab=preview">View</a>
            <a class="btn-admin btn-admin-ghost btn-admin-sm" href="property-editor.html?id=${p.id}">Edit</a>
            <button class="btn-admin btn-admin-ghost btn-admin-sm" data-act="duplicate">Duplicate</button>
            <button class="btn-admin btn-admin-ghost btn-admin-sm" data-act="${p.status === "active" ? "unpublish" : "publish"}">${p.status === "active" ? "Unpublish" : "Publish"}</button>
            <button class="btn-admin btn-admin-danger btn-admin-sm" data-act="delete">Delete</button>
          </div>
        </td>
      </tr>`;
  }

  // Filter inputs fire in quick succession (typing, or resetting several
  // filters back-to-back), and each render() awaits per-row thumbnail lookups
  // — so calls can resolve out of order. A render token makes a stale call a
  // no-op instead of overwriting the table with results for a filter state
  // that's no longer current.
  let renderToken = 0;

  async function render() {
    const token = ++renderToken;
    const all = AdminStore.listProperties().filter(matchesFilters).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    const total = AdminStore.listProperties().length;
    if (!all.length) {
      if (token !== renderToken) return;
      tbody.innerHTML = "";
      emptyEl.innerHTML = `<div class="admin-empty">No properties match. <a href="property-editor.html">Add a property</a> or adjust your filters.</div>`;
      countMeta.textContent = `${all.length} of ${total} properties`;
      return;
    }
    const rows = await Promise.all(all.map(renderRow));
    if (token !== renderToken) return; // a newer render started while we awaited — discard this one
    emptyEl.innerHTML = "";
    tbody.innerHTML = rows.join("");
    countMeta.textContent = `${all.length} of ${total} properties`;
  }

  tbody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const id = btn.closest("tr").dataset.id;
    const p = AdminStore.getProperty(id);
    if (!p) return;

    if (btn.dataset.act === "duplicate") {
      AdminStore.duplicateProperty(id);
      AdminUI.toast("Property duplicated as a draft.", "success");
      render();
    } else if (btn.dataset.act === "publish") {
      AdminStore.setPropertyStatus(id, "active");
      AdminUI.toast("Property published.", "success");
      render();
    } else if (btn.dataset.act === "unpublish") {
      AdminStore.setPropertyStatus(id, "draft");
      AdminUI.toast("Property unpublished.", "success");
      render();
    } else if (btn.dataset.act === "delete") {
      const ok = await AdminUI.confirmDialog(`Delete "${escapeHtml(p.title) || "this property"}"? This cannot be undone.`, { confirmLabel: "Delete", danger: true });
      if (ok) {
        AdminStore.deleteProperty(id);
        AdminUI.toast("Property deleted.", "success");
        render();
      }
    }
  });

  tbody.addEventListener("change", (e) => {
    const select = e.target.closest("select[data-act='set-status']");
    if (!select) return;
    const id = select.closest("tr").dataset.id;
    AdminStore.setPropertyStatus(id, select.value);
    AdminUI.toast(`Status set to ${ADMIN_CONFIG.statusLabels[select.value]}.`, "success");
    render();
  });

  [searchEl, statusEl, typeEl, listingTypeEl].forEach((el) => el.addEventListener("input", render));

  render();
})();
