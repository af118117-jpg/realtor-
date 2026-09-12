(function () {
  "use strict";

  AdminStore.seedIfEmpty();
  AdminUI.mountPage("leads");

  const searchEl = document.getElementById("lf-search");
  const statusEl = document.getElementById("lf-status");
  const tbody = document.getElementById("leads-tbody");
  const emptyEl = document.getElementById("leads-empty");
  const modal = document.getElementById("lead-modal");

  statusEl.innerHTML += ADMIN_CONFIG.leadStatuses.map((s) => `<option value="${s}">${ADMIN_CONFIG.leadStatusLabels[s]}</option>`).join("");
  document.getElementById("lm-status").innerHTML = ADMIN_CONFIG.leadStatuses.map((s) => `<option value="${s}">${ADMIN_CONFIG.leadStatusLabels[s]}</option>`).join("");
  const propertySelect = document.getElementById("lm-property");
  propertySelect.innerHTML = `<option value="">— None —</option>` +
    AdminStore.listProperties().map((p) => `<option value="${p.id}">${escapeHtml(p.title || p.propertyId || p.id)}</option>`).join("");

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  let editingLeadId = null;

  function matchesFilters(l) {
    const q = searchEl.value.trim().toLowerCase();
    if (q && !`${l.name} ${l.phone} ${l.email}`.toLowerCase().includes(q)) return false;
    if (statusEl.value && l.status !== statusEl.value) return false;
    return true;
  }

  function propertyLabel(id) {
    const p = AdminStore.getProperty(id);
    return p ? (p.title || p.propertyId || "—") : "—";
  }

  function render() {
    const all = AdminStore.listLeads().filter(matchesFilters).sort((a, b) => new Date(b.date) - new Date(a.date));
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

  document.getElementById("lm-save").addEventListener("click", () => {
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
    else payload.date = new Date().toISOString();
    AdminStore.saveLead(payload);
    AdminUI.toast("Inquiry saved.", "success");
    closeModal();
    render();
  });

  tbody.addEventListener("click", async (e) => {
    const row = e.target.closest("tr");
    if (!row) return;
    const id = row.dataset.id;
    if (e.target.closest("[data-lead-edit]")) {
      openModal(AdminStore.getLead(id));
    } else if (e.target.closest("[data-lead-delete]")) {
      const ok = await AdminUI.confirmDialog("Delete this inquiry?", { confirmLabel: "Delete", danger: true });
      if (ok) { AdminStore.deleteLead(id); AdminUI.toast("Inquiry deleted.", "success"); render(); }
    }
  });

  tbody.addEventListener("change", (e) => {
    const select = e.target.closest("select[data-lead-status]");
    if (!select) return;
    const id = select.closest("tr").dataset.id;
    AdminStore.saveLead({ id, status: select.value });
    AdminUI.toast("Status updated.", "success");
  });

  [searchEl, statusEl].forEach((el) => el.addEventListener("input", render));

  render();
})();
