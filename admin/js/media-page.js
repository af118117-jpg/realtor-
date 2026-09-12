(function () {
  "use strict";

  AdminStore.seedIfEmpty();
  AdminUI.mountPage("media");

  let activeKind = "image";
  const grid = document.getElementById("media-grid");
  const emptyEl = document.getElementById("media-empty");
  const countMeta = document.getElementById("media-count-meta");

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function findReferences(mediaId) {
    const refs = [];
    AdminStore.listProperties().forEach((p) => {
      const inImages = (p.images || []).some((i) => i.mediaId === mediaId);
      const inVideos = (p.videos || []).some((v) => v.mediaId === mediaId || v.thumbnailMediaId === mediaId);
      const inDocs = (p.documents || []).some((d) => d.mediaId === mediaId);
      if (inImages || inVideos || inDocs) refs.push(p.title || p.propertyId || p.id);
    });
    return refs;
  }

  // Switching tabs quickly (or delete-then-switch) fires overlapping async
  // render() calls — AdminDB.all() awaits IndexedDB, so they can resolve out
  // of order. Guard with a token so only the most recently started call is
  // allowed to paint, matching the same fix in properties-page.js.
  let renderToken = 0;

  async function render() {
    const token = ++renderToken;
    const kindAtStart = activeKind;
    const items = (await AdminDB.all()).filter((m) => m.kind === kindAtStart).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
    const refs = findReferences(id);
    const message = refs.length
      ? `This file is used by ${refs.length} propert${refs.length === 1 ? "y" : "ies"} (${escapeHtml(refs.join(", "))}). Deleting it will leave a broken image/link there. Delete anyway?`
      : "Delete this file permanently?";
    const ok = await AdminUI.confirmDialog(message, { confirmLabel: "Delete", danger: true });
    if (!ok) return;
    await AdminDB.remove(id);
    AdminUI.toast("File deleted.", "success");
    render();
  });

  render();
})();
