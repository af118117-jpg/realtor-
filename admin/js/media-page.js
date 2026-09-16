(function () {
  "use strict";

  AdminUI.mountPage("media");

  let activeKind = "image";
  const grid = document.getElementById("media-grid");
  const emptyEl = document.getElementById("media-empty");
  const countMeta = document.getElementById("media-count-meta");

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /** Which properties still use this file. The server owns this check now
   * (GET /media/:id/references), so it stays correct even if another device
   * attached the file to a property a moment ago. */
  async function findReferences(mediaId) {
    const properties = await AdminDB.references(mediaId);
    return properties.map((p) => p.title || p.id);
  }

  // Switching tabs quickly (or delete-then-switch) fires overlapping async
  // render() calls — AdminDB.all() awaits IndexedDB, so they can resolve out
  // of order. Guard with a token so only the most recently started call is
  // allowed to paint, matching the same fix in properties-page.js.
  let renderToken = 0;

  async function render() {
    const token = ++renderToken;
    const kindAtStart = activeKind;
    // The API returns kinds as uppercase enum values ("IMAGE"); the tabs use
    // the UI's lowercase vocabulary ("image").
    const items = (await AdminDB.all())
      .filter((m) => String(m.kind).toLowerCase() === kindAtStart)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (token !== renderToken) return; // a newer render started while we awaited — discard this one
    countMeta.textContent = `${items.length} file(s)`;
    if (!items.length) {
      grid.innerHTML = "";
      emptyEl.innerHTML = `<div class="admin-empty">No ${kindAtStart}s uploaded yet. Upload from a property's editor page.</div>`;
      return;
    }
    emptyEl.innerHTML = "";
    grid.innerHTML = items.map((m) => {
      const url = AdminDB.objectUrlFor(m);
      const preview = kindAtStart === "image"
        ? `<img src="${url}" alt="">`
        : kindAtStart === "video"
          ? `<video src="${url}" muted></video>`
          : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--color-muted);font-size:2rem">📄</div>`;
      return `
        <div class="admin-thumb" data-id="${m.id}" title="${escapeHtml(m.name)}">
          ${preview}
          <div class="admin-thumb-bar" style="justify-content:flex-end">
            <button type="button" data-delete-media title="Delete">🗑</button>
          </div>
        </div>`;
    }).join("");
  }

  document.querySelectorAll(".admin-tab[data-kind]").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab[data-kind]").forEach((t) => t.classList.toggle("is-active", t === tab));
      activeKind = tab.dataset.kind;
      render();
    });
  });

  grid.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-delete-media]");
    if (!btn) return;
    const id = btn.closest(".admin-thumb").dataset.id;
    const refs = await findReferences(id);
    const message = refs.length
      ? `This file is used by ${refs.length} propert${refs.length === 1 ? "y" : "ies"} (${escapeHtml(refs.join(", "))}). Deleting it will remove it from ${refs.length === 1 ? "that property" : "those properties"} too. Delete anyway?`
      : "Delete this file permanently?";
    const ok = await AdminUI.confirmDialog(message, { confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try {
      await AdminDB.remove(id);
      AdminUI.toast("File deleted.", "success");
    } catch (err) {
      AdminUI.toast(err.message || "Could not delete this file.", "error");
    }
    render();
  });

  render();
})();
