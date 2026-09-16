(function () {
  "use strict";

  AdminUI.mountPage("leads");

  const searchEl = document.getElementById("lf-search");
  const statusEl = document.getElementById("lf-status");
  const tbody = document.getElementById("leads-tbody");
  const emptyEl = document.getElementById("leads-empty");
  const modal = document.getElementById("lead-modal");
  const propertySelect = document.getElementById("lm-property");

  statusEl.innerHTML += ADMIN_CONFIG.leadStatuses.map((s) => `<option value="${s}">${ADMIN_CONFIG.leadStatusLabels[s]}</option>`).join("");
  document.getElementById("lm-status").innerHTML = ADMIN_CONFIG.leadStatuses.map((s) => `<option value="${s}">${ADMIN_CONFIG.leadStatusLabels[s]}</option>`).join("");

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  let editingLeadId = null;
  // Last lists fetched from the API, so row handlers and the property-name
  // column can resolve without extra round-trips.
  let leadCache = [];
  let propertyCache = [];

  function matchesFilters(l) {
    const q = searchEl.value.trim().toLowerCase();
    if (q && !`${l.name} ${l.phone} ${l.email}`.toLowerCase().includes(q)) return false;
    if (statusEl.value && l.status !== statusEl.value) return false;
    return true;
  }

  function propertyLabel(id) {
    const p = propertyCache.find((x) => x.id === id);
    return p ? (p.title || p.propertyId || "—") : "—";
  }

  let renderToken = 0;

  async function render() {
    const token = ++renderToken;
    let leads;
    try {
      leads = await AdminStore.listLeads();
    } catch (err) {
      if (token !== renderToken) return;
      tbody.innerHTML = "";
      emptyEl.innerHTML = `<div class="admin-empty">Could not load inquiries: ${escapeHtml(err.message)}</div>`;
      return;
    }
    if (token !== renderToken) return;
    leadCache = leads;

    const all = leads.filter(matchesFilters).sort((a, b) => new Date(b.date) - new Date(a.date));
    if (!all.length) {
      tbody.innerHTML = "";
      emptyEl.innerHTML = `<div class="admin-empty">No inquiries logged yet. Click "Log Inquiry" to add one.</div>`;
      return;
    }
    emptyEl.innerHTML = "";
    tbody.innerHTML = all.map((l) => `
      <tr data-id="${l.id}">
        <td>${escapeHtml(l.name) || "—"}</td>
        <td>${escapeHtml(l.phone) || "—"}</td>
        <td>${escapeHtml(l.email) || "—"}</td>
        <td>${escapeHtml(propertyLabel(l.propertyId))}</td>
        <td style="max-width:220px;white-space:normal">${escapeHtml(l.message) || "—"}</td>
        <td style="white-space:nowrap">${AdminUI.formatDate(l.date)}</td>
        <td>
          <select class="pf-status-select" data-lead-status>
            ${ADMIN_CONFIG.leadStatuses.map((s) => `<option value="${s}" ${s === l.status ? "selected" : ""}>${ADMIN_CONFIG.leadStatusLabels[s]}</option>`).join("")}
          </select>
        </td>
        <td style="max-width:180px;white-space:normal">${escapeHtml(l.notes) || "—"}</td>
        <td>
          <div class="admin-row-actions">
            <button class="btn-admin btn-admin-ghost btn-admin-sm" data-lead-edit>Edit</button>
            <button class="btn-admin btn-admin-danger btn-admin-sm" data-lead-delete>Delete</button>
          </div>
        </td>
      </tr>
    `).join("");
  }

  function openModal(lead) {
    editingLeadId = lead ? lead.id : null;
    document.getElementById("lm-name").value = lead?.name || "";
    document.getElementById("lm-phone").value = lead?.phone || "";
    document.getElementById("lm-email").value = lead?.email || "";
    propertySelect.value = lead?.propertyId || "";
    document.getElementById("lm-message").value = lead?.message || "";
    document.getElementById("lm-status").value = lead?.status || "new";
    document.getElementById("lm-notes").value = lead?.notes || "";
    modal.hidden = false;
  }
  function closeModal() { modal.hidden = true; editingLeadId = null; }

  document.getElementById("btn-add-lead").addEventListener("click", () => openModal(null));
  document.getElementById("lm-cancel").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  document.getElementById("lm-save").addEventListener("click", async () => {
    const name = document.getElementById("lm-name").value.trim();
    if (!name) { AdminUI.toast("Please enter a customer name.", "error"); return; }
    const payload = {
      name,
      phone: document.getElementById("lm-phone").value.trim(),
      email: document.getElementById("lm-email").value.trim(),
      propertyId: propertySelect.value,
      message: document.getElementById("lm-message").value.trim(),
      status: document.getElementById("lm-status").value,
      notes: document.getElementById("lm-notes").value.trim(),
    };
    if (editingLeadId) payload.id = editingLeadId;
    try {
      await AdminStore.saveLead(payload);
      AdminUI.toast("Inquiry saved.", "success");
      closeModal();
      await render();
    } catch (err) {
      AdminUI.toast(err.message || "Could not save this inquiry.", "error");
    }
  });

  tbody.addEventListener("click", async (e) => {
    const row = e.target.closest("tr");
    if (!row) return;
    const id = row.dataset.id;
    if (e.target.closest("[data-lead-edit]")) {
      openModal(leadCache.find((l) => l.id === id) || null);
    } else if (e.target.closest("[data-lead-delete]")) {
      const ok = await AdminUI.confirmDialog("Delete this inquiry?", { confirmLabel: "Delete", danger: true });
      if (ok) {
        try {
          await AdminStore.deleteLead(id);
          AdminUI.toast("Inquiry deleted.", "success");
          await render();
        } catch (err) {
          AdminUI.toast(err.message || "Could not delete this inquiry.", "error");
        }
      }
    }
  });

  tbody.addEventListener("change", async (e) => {
    const select = e.target.closest("select[data-lead-status]");
    if (!select) return;
    const id = select.closest("tr").dataset.id;
    try {
      await AdminStore.saveLead({ id, status: select.value });
      AdminUI.toast("Status updated.", "success");
    } catch (err) {
      AdminUI.toast(err.message || "Could not update the status.", "error");
    }
  });

  [searchEl, statusEl].forEach((el) => el.addEventListener("input", render));

  async function bootstrap() {
    propertyCache = await AdminStore.listProperties();
    propertySelect.innerHTML = `<option value="">— None —</option>` +
      propertyCache.map((p) => `<option value="${p.id}">${escapeHtml(p.title || p.propertyId || p.id)}</option>`).join("");
    await render();
  }

  bootstrap();
})();
