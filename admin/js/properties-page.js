(function () {
  "use strict";

  AdminUI.mountPage("properties");

  const searchEl = document.getElementById("pf-search");
  const statusEl = document.getElementById("pf-status");
  const typeEl = document.getElementById("pf-type");
  const listingTypeEl = document.getElementById("pf-listing-type");
  const tbody = document.getElementById("properties-tbody");
  const emptyEl = document.getElementById("properties-empty");
  const countMeta = document.getElementById("properties-count-meta");

  // Populated by bootstrap() before anything renders.
  let settings = {};
  // Last list fetched from the API, so row actions and filters can read a
  // property without a second round-trip.
  let cache = [];

  statusEl.innerHTML += ADMIN_CONFIG.statuses.map((s) => `<option value="${s}">${ADMIN_CONFIG.statusLabels[s]}</option>`).join("");

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function coverThumbUrl(p) {
    const cover = (p.images || []).find((i) => i.isCover) || (p.images || [])[0];
    if (!cover) return "../assets/images/agent/agent-placeholder.svg";
    if (cover.externalSrc) return `../${cover.externalSrc}`;
    if (cover.mediaId) return AdminDB.objectUrlFor(cover.mediaId) || "../assets/images/agent/agent-placeholder.svg";
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

  function renderRow(p) {
    const thumb = coverThumbUrl(p);
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
  // filters back-to-back), and each render() awaits the API — so calls can
  // resolve out of order. A render token makes a stale call a no-op instead of
  // overwriting the table with results for a filter state that's no longer
  // current.
  let renderToken = 0;

  async function render() {
    const token = ++renderToken;
    let list;
    try {
      list = await AdminStore.listProperties();
    } catch (err) {
      if (token !== renderToken) return;
      emptyEl.innerHTML = `<div class="admin-empty">Could not load properties: ${escapeHtml(err.message)}</div>`;
      tbody.innerHTML = "";
      return;
    }
    if (token !== renderToken) return; // a newer render started while we awaited — discard this one
    cache = list;

    const all = list.filter(matchesFilters).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    countMeta.textContent = `${all.length} of ${list.length} properties`;

    if (!all.length) {
      tbody.innerHTML = "";
      emptyEl.innerHTML = `<div class="admin-empty">No properties match. <a href="property-editor.html">Add a property</a> or adjust your filters.</div>`;
      return;
    }
    emptyEl.innerHTML = "";
    tbody.innerHTML = all.map(renderRow).join("");
  }

  tbody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const id = btn.closest("tr").dataset.id;
    const p = cache.find((x) => x.id === id);
    if (!p) return;

    try {
      if (btn.dataset.act === "duplicate") {
        await AdminStore.duplicateProperty(id);
        AdminUI.toast("Property duplicated as a draft.", "success");
        await render();
      } else if (btn.dataset.act === "publish") {
        await AdminStore.setPropertyStatus(id, "active");
        AdminUI.toast("Property published.", "success");
        await render();
      } else if (btn.dataset.act === "unpublish") {
        await AdminStore.setPropertyStatus(id, "draft");
        AdminUI.toast("Property unpublished.", "success");
        await render();
      } else if (btn.dataset.act === "delete") {
        const ok = await AdminUI.confirmDialog(`Delete "${escapeHtml(p.title) || "this property"}"? This cannot be undone.`, { confirmLabel: "Delete", danger: true });
        if (ok) {
          await AdminStore.deleteProperty(id);
          AdminUI.toast("Property deleted.", "success");
          await render();
        }
      }
    } catch (err) {
      AdminUI.toast(err.message || "That action failed.", "error");
    }
  });

  tbody.addEventListener("change", async (e) => {
    const select = e.target.closest("select[data-act='set-status']");
    if (!select) return;
    const id = select.closest("tr").dataset.id;
    try {
      await AdminStore.setPropertyStatus(id, select.value);
      AdminUI.toast(`Status set to ${ADMIN_CONFIG.statusLabels[select.value]}.`, "success");
      await render();
    } catch (err) {
      AdminUI.toast(err.message || "Could not update the status.", "error");
    }
  });

  [searchEl, statusEl, typeEl, listingTypeEl].forEach((el) => el.addEventListener("input", render));

  async function bootstrap() {
    settings = await AdminStore.getSettings();
    typeEl.innerHTML += (settings.propertyTypes || ADMIN_CONFIG.defaultPropertyTypes)
      .map((t) => `<option value="${t}">${t}</option>`).join("");
    await render();
  }

  bootstrap();
})();
