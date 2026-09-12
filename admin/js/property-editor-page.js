(function () {
  "use strict";

  AdminStore.seedIfEmpty();
  AdminUI.mountPage("properties");

  const settings = AdminStore.getSettings();
  const params = new URLSearchParams(window.location.search);
  let editingId = params.get("id") || null;
  let existing = editingId ? AdminStore.getProperty(editingId) : null;

  // In-memory working state for media (persisted only on Save Draft / Publish).
  const state = {
    images: existing ? JSON.parse(JSON.stringify(existing.images || [])) : [],
    videos: existing ? JSON.parse(JSON.stringify(existing.videos || [])) : [],
    documents: existing ? JSON.parse(JSON.stringify(existing.documents || [])) : [],
    customAmenities: [],
  };

  /* ------------------------------- Setup ------------------------------- */

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function $(id) { return document.getElementById(id); }

  const categorySelect = $("f-category");
  categorySelect.innerHTML = (settings.propertyTypes || ADMIN_CONFIG.defaultPropertyTypes)
    .map((t) => `<option value="${t}">${t}</option>`).join("");

  const localityList = $("locality-options");
  const serviceAreas = (typeof REALTOR_CONFIG !== "undefined" ? REALTOR_CONFIG.serviceAreas : []) || [];
  localityList.innerHTML = serviceAreas.map((a) => `<option value="${a}">`).join("");

  const amenitiesGrid = $("amenities-grid");
  const defaultAmenities = settings.amenities || ADMIN_CONFIG.defaultAmenities;
  const propertyAmenities = (existing && existing.amenities) || [];
  amenitiesGrid.innerHTML = defaultAmenities.map((a) => `
    <label><input type="checkbox" value="${escapeHtml(a)}" ${propertyAmenities.includes(a) ? "checked" : ""}> ${escapeHtml(a)}</label>
  `).join("");
  state.customAmenities = propertyAmenities.filter((a) => !defaultAmenities.includes(a));

  function renderCustomAmenities() {
    $("custom-amenities-list").innerHTML = state.customAmenities.map((a, i) => `
      <span class="admin-badge admin-badge-active" style="cursor:pointer" data-remove-amenity="${i}" title="Remove">${escapeHtml(a)} ✕</span>
    `).join("");
  }
  renderCustomAmenities();

  $("btn-add-amenity").addEventListener("click", () => {
    const input = $("f-custom-amenity");
    const val = input.value.trim();
    if (val && !state.customAmenities.includes(val) && !defaultAmenities.includes(val)) {
      state.customAmenities.push(val);
      renderCustomAmenities();
    }
    input.value = "";
  });
  $("custom-amenities-list").addEventListener("click", (e) => {
    const idx = e.target.dataset.removeAmenity;
    if (idx == null) return;
    state.customAmenities.splice(Number(idx), 1);
    renderCustomAmenities();
  });

  function collectAmenities() {
    const checked = Array.from(amenitiesGrid.querySelectorAll("input:checked")).map((i) => i.value);
    return [...checked, ...state.customAmenities];
  }

  /* ------------------------------ Populate ------------------------------ */

  if (existing) {
    $("editor-title").textContent = "Edit Property";
    $("editor-title-tag").textContent = `Edit — ${existing.title || "Property"} | Admin | Realtor Shamraiz`;
    $("f-title").value = existing.title || "";
    $("f-property-id").value = existing.propertyId || "";
    categorySelect.value = existing.category || categorySelect.options[0]?.value || "";
    $("f-listing-type").value = existing.listingType || "sale";
    $("f-price").value = existing.price ?? "";
    $("f-description").value = existing.description || "";
    $("f-area-value").value = existing.areaValue ?? "";
    $("f-area-unit").value = existing.areaUnit || "";
    $("f-beds").value = existing.beds ?? "";
    $("f-baths").value = existing.baths ?? "";
    $("f-parking").value = existing.parking ?? "";
    $("f-floors").value = existing.floors ?? "";
    $("f-year").value = existing.constructionYear ?? "";
    $("f-locality").value = existing.locality || "";
    $("f-address").value = existing.address || "";
    $("f-map-url").value = existing.mapUrl || "";
    $("f-featured").checked = !!existing.featured;
    $("editor-status-meta").textContent = `Status: ${ADMIN_CONFIG.statusLabels[existing.status]} · Last updated ${AdminUI.formatDate(existing.updatedAt)}`;
  } else {
    $("editor-status-meta").textContent = "Not yet saved";
  }

  /* -------------------------------- Tabs -------------------------------- */

  function setActiveTab(name) {
    document.querySelectorAll(".admin-tab").forEach((t) => t.classList.toggle("is-active", t.dataset.tab === name));
    document.querySelectorAll(".admin-tab-panel").forEach((p) => p.classList.toggle("is-active", p.dataset.panel === name));
    if (name === "preview") renderPreview();
  }
  document.querySelectorAll(".admin-tab").forEach((t) => t.addEventListener("click", () => setActiveTab(t.dataset.tab)));
  if (params.get("tab") === "preview") setActiveTab("preview");

  /* -------------------------------- Images -------------------------------- */

  async function resolveMediaUrl(item) {
    if (item.externalSrc) return `../${item.externalSrc}`;
    if (item.mediaId) {
      const rec = await AdminDB.get(item.mediaId);
      return AdminDB.objectUrlFor(rec) || "";
    }
    return "";
  }

  // Rapid consecutive actions (e.g. deleting two thumbnails quickly) can fire
  // renderImages() again before an in-flight call's IndexedDB lookups finish;
  // a token stops the slower, now-stale call from overwriting a newer render.
  let imagesRenderToken = 0;

  async function renderImages() {
    const token = ++imagesRenderToken;
    const grid = $("image-thumb-grid");
    if (!state.images.length) {
      grid.innerHTML = `<p class="hint">No images uploaded yet.</p>`;
      return;
    }
    const urls = await Promise.all(state.images.map(resolveMediaUrl));
    if (token !== imagesRenderToken) return;
    grid.innerHTML = state.images.map((img, i) => `
      <div class="admin-thumb" draggable="true" data-index="${i}">
        ${img.isCover ? '<span class="cover-flag">Cover</span>' : ""}
        <img src="${urls[i]}" alt="">
        <div class="admin-thumb-bar">
          <button type="button" data-img-act="cover" data-index="${i}" title="Set as cover">★</button>
          <button type="button" data-img-act="left" data-index="${i}" title="Move left">←</button>
          <button type="button" data-img-act="right" data-index="${i}" title="Move right">→</button>
          <button type="button" data-img-act="delete" data-index="${i}" title="Delete">🗑</button>
        </div>
      </div>
    `).join("");
  }

  $("image-input").addEventListener("change", async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const mediaId = await AdminDB.put({ kind: "image", name: file.name, mimeType: file.type, size: file.size, blob: file });
      state.images.push({ mediaId, isCover: state.images.length === 0 });
    }
    e.target.value = "";
    renderImages();
  });

  $("image-thumb-grid").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-img-act]");
    if (!btn) return;
    const i = Number(btn.dataset.index);
    const act = btn.dataset.imgAct;
    if (act === "cover") {
      state.images.forEach((img, idx) => { img.isCover = idx === i; });
    } else if (act === "left" && i > 0) {
      [state.images[i - 1], state.images[i]] = [state.images[i], state.images[i - 1]];
    } else if (act === "right" && i < state.images.length - 1) {
      [state.images[i + 1], state.images[i]] = [state.images[i], state.images[i + 1]];
    } else if (act === "delete") {
      const wasCover = state.images[i].isCover;
      state.images.splice(i, 1);
      if (wasCover && state.images[0]) state.images[0].isCover = true;
    }
    renderImages();
  });

  let dragFromIndex = null;
  $("image-thumb-grid").addEventListener("dragstart", (e) => {
    const thumb = e.target.closest(".admin-thumb");
    if (!thumb) return;
    dragFromIndex = Number(thumb.dataset.index);
  });
  $("image-thumb-grid").addEventListener("dragover", (e) => e.preventDefault());
  $("image-thumb-grid").addEventListener("drop", (e) => {
    e.preventDefault();
    const thumb = e.target.closest(".admin-thumb");
    if (!thumb || dragFromIndex == null) return;
    const toIndex = Number(thumb.dataset.index);
    const [moved] = state.images.splice(dragFromIndex, 1);
    state.images.splice(toIndex, 0, moved);
    dragFromIndex = null;
    renderImages();
  });

  /* -------------------------------- Videos -------------------------------- */

  function parseYouTubeId(url) {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
    return m ? m[1] : null;
  }
  function parseVimeoId(url) {
    const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return m ? m[1] : null;
  }

  async function generateVideoThumbnail(blob) {
    try {
      return await new Promise((resolve) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.muted = true;
        video.src = URL.createObjectURL(blob);
        const timeout = setTimeout(() => resolve(null), 4000);
        video.addEventListener("loadeddata", () => {
          video.currentTime = Math.min(1, (video.duration || 1) / 2);
        });
        video.addEventListener("seeked", () => {
          clearTimeout(timeout);
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 320;
          canvas.height = video.videoHeight || 180;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((thumbBlob) => resolve(thumbBlob), "image/jpeg", 0.8);
        });
        video.addEventListener("error", () => { clearTimeout(timeout); resolve(null); });
      });
    } catch {
      return null;
    }
  }

  let videosRenderToken = 0;

  async function renderVideos() {
    const token = ++videosRenderToken;
    const grid = $("video-thumb-grid");
    if (!state.videos.length) {
      grid.innerHTML = `<p class="hint">No videos added yet.</p>`;
      return;
    }
    const cards = await Promise.all(state.videos.map(async (v, i) => {
      let thumbUrl = v.thumbnailUrl || "";
      if (!thumbUrl && v.thumbnailMediaId) {
        const rec = await AdminDB.get(v.thumbnailMediaId);
        thumbUrl = AdminDB.objectUrlFor(rec) || "";
      }
      const label = v.type === "file" ? (v.name || "Uploaded video") : v.type === "youtube" ? "YouTube" : "Vimeo";
      return `
        <div class="admin-thumb" data-index="${i}">
          ${thumbUrl ? `<img src="${thumbUrl}" alt="">` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--color-muted);font-size:0.75rem">${label}</div>`}
          <div class="admin-thumb-bar">
            <label style="background:rgba(11,14,19,0.75);border:1px solid var(--color-border-soft);border-radius:6px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;cursor:pointer" title="Set thumbnail">
              🖼<input type="file" accept="image/*" data-video-thumb-input="${i}" style="display:none">
            </label>
            <button type="button" data-video-act="delete" data-index="${i}" title="Delete">🗑</button>
          </div>
        </div>`;
    }));
    if (token !== videosRenderToken) return;
    grid.innerHTML = cards.join("");
  }

  $("video-input").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mediaId = await AdminDB.put({ kind: "video", name: file.name, mimeType: file.type, size: file.size, blob: file });
    const entry = { type: "file", mediaId, name: file.name, thumbnailUrl: "", thumbnailMediaId: null };
    const thumbBlob = await generateVideoThumbnail(file);
    if (thumbBlob) entry.thumbnailMediaId = await AdminDB.put({ kind: "image", name: "auto-thumbnail.jpg", mimeType: "image/jpeg", size: thumbBlob.size, blob: thumbBlob });
    state.videos.push(entry);
    e.target.value = "";
    renderVideos();
  });

  $("btn-add-youtube").addEventListener("click", () => {
    const input = $("f-youtube-url");
    const id = parseYouTubeId(input.value.trim());
    if (!id) { AdminUI.toast("That doesn't look like a valid YouTube URL.", "error"); return; }
    state.videos.push({ type: "youtube", url: input.value.trim(), videoId: id, thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg` });
    input.value = "";
    renderVideos();
  });

  $("btn-add-vimeo").addEventListener("click", () => {
    const input = $("f-vimeo-url");
    const id = parseVimeoId(input.value.trim());
    if (!id) { AdminUI.toast("That doesn't look like a valid Vimeo URL.", "error"); return; }
    state.videos.push({ type: "vimeo", url: input.value.trim(), videoId: id, thumbnailUrl: "" });
    input.value = "";
    renderVideos();
  });

  $("video-thumb-grid").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-video-act='delete']");
    if (!btn) return;
    state.videos.splice(Number(btn.dataset.index), 1);
    renderVideos();
  });

  $("video-thumb-grid").addEventListener("change", async (e) => {
    const input = e.target.closest("input[data-video-thumb-input]");
    if (!input || !input.files?.[0]) return;
    const i = Number(input.dataset.videoThumbInput);
    const mediaId = await AdminDB.put({ kind: "image", name: input.files[0].name, mimeType: input.files[0].type, size: input.files[0].size, blob: input.files[0] });
    state.videos[i].thumbnailMediaId = mediaId;
    state.videos[i].thumbnailUrl = "";
    renderVideos();
  });

  /* ------------------------------ Documents ------------------------------ */

  function fmtSize(bytes) {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function renderDocs() {
    const list = $("doc-list");
    if (!state.documents.length) {
      list.innerHTML = `<p class="hint">No documents uploaded yet.</p>`;
      return;
    }
    list.innerHTML = state.documents.map((d, i) => `
      <div class="admin-doc-row">
        <span class="name">📄 ${escapeHtml(d.name)} <span class="hint">· ${escapeHtml(d.docType)} · ${fmtSize(d.size)} · Private</span></span>
        <button type="button" class="btn-admin btn-admin-danger btn-admin-sm" data-doc-delete="${i}">Delete</button>
      </div>
    `).join("");
  }

  $("doc-input").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mediaId = await AdminDB.put({ kind: "document", name: file.name, mimeType: file.type, size: file.size, blob: file, isPrivate: true });
    state.documents.push({ mediaId, name: file.name, size: file.size, docType: $("f-doc-type").value, isPrivate: true });
    e.target.value = "";
    renderDocs();
  });

  $("doc-list").addEventListener("click", (e) => {
    const idx = e.target.dataset.docDelete;
    if (idx == null) return;
    state.documents.splice(Number(idx), 1);
    renderDocs();
  });

  /* -------------------------------- Preview -------------------------------- */

  function readFormValues() {
    return {
      title: $("f-title").value.trim(),
      propertyId: $("f-property-id").value.trim(),
      category: categorySelect.value,
      listingType: $("f-listing-type").value,
      price: $("f-price").value === "" ? null : Number($("f-price").value),
      description: $("f-description").value.trim(),
      areaValue: $("f-area-value").value === "" ? null : Number($("f-area-value").value),
      areaUnit: $("f-area-unit").value.trim(),
      beds: $("f-beds").value === "" ? null : Number($("f-beds").value),
      baths: $("f-baths").value === "" ? null : Number($("f-baths").value),
      parking: $("f-parking").value === "" ? null : Number($("f-parking").value),
      floors: $("f-floors").value === "" ? null : Number($("f-floors").value),
      constructionYear: $("f-year").value === "" ? null : Number($("f-year").value),
      locality: $("f-locality").value.trim(),
      address: $("f-address").value.trim(),
      mapUrl: $("f-map-url").value.trim(),
      amenities: collectAmenities(),
      featured: $("f-featured").checked,
      images: state.images,
      videos: state.videos,
      documents: state.documents,
    };
  }

  async function renderPreview() {
    const v = readFormValues();
    const cover = v.images.find((i) => i.isCover) || v.images[0];
    const coverUrl = cover ? await resolveMediaUrl(cover) : "../assets/images/agent/agent-placeholder.svg";
    const priceStr = AdminUI.formatCurrency(v.price, settings);
    const facts = [
      v.beds != null ? `${v.beds} Beds` : null,
      v.baths != null ? `${v.baths} Baths` : null,
      v.areaValue != null ? `${v.areaValue} ${v.areaUnit || ""}`.trim() : null,
      v.parking != null ? `${v.parking} Parking` : null,
      v.floors != null ? `${v.floors} Floors` : null,
      v.constructionYear ? `Built ${v.constructionYear}` : null,
    ].filter(Boolean);

    $("preview-mount").innerHTML = `
      <div class="admin-preview-card">
        <img class="admin-preview-hero" src="${coverUrl}" alt="">
        <div class="admin-preview-body">
          <p class="hint">${escapeHtml(v.propertyId) || "No Property ID"} · ${escapeHtml(v.category) || "Type not set"} · ${v.listingType === "rent" ? "For Rent" : "For Sale"}</p>
          <h2 style="margin-top:0.3rem">${escapeHtml(v.title) || "Untitled property"}</h2>
          <p style="color:var(--color-gold-bright);font-family:var(--font-display);font-size:1.4rem;margin-top:0.4rem">${priceStr}</p>
          <p class="hint">${escapeHtml(v.locality) || "Location not set"}${v.address ? " · " + escapeHtml(v.address) : ""}</p>
          <div class="admin-preview-facts">${facts.map((f) => `<span>${escapeHtml(f)}</span>`).join("")}</div>
          <p style="color:var(--color-ivory-dim);white-space:pre-line">${escapeHtml(v.description) || "No description yet."}</p>
          ${v.amenities.length ? `<div style="margin-top:var(--space-3)"><strong style="font-size:0.85rem">Amenities:</strong> <span class="hint">${v.amenities.map(escapeHtml).join(", ")}</span></div>` : ""}
          ${v.mapUrl ? `<p class="hint" style="margin-top:var(--space-2)">Map: <a href="${escapeHtml(v.mapUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(v.mapUrl)}</a></p>` : ""}
          <p class="hint" style="margin-top:var(--space-3)">${v.images.length} image(s) · ${v.videos.length} video(s) · ${v.documents.length} document(s) attached</p>
        </div>
      </div>`;
  }

  /* --------------------------------- Save --------------------------------- */

  async function saveWithStatus(status) {
    const v = readFormValues();
    if (!v.title) {
      AdminUI.toast("Please add a property title before saving.", "error");
      setActiveTab("details");
      $("f-title").focus();
      return;
    }
    const saved = AdminStore.saveProperty({ id: editingId || undefined, ...v, status });
    editingId = saved.id;
    existing = saved;
    $("editor-status-meta").textContent = `Status: ${ADMIN_CONFIG.statusLabels[saved.status]} · Last updated ${AdminUI.formatDate(saved.updatedAt)}`;
    AdminUI.toast(status === "active" ? "Property published." : "Draft saved.", "success");
    if (!params.get("id")) {
      const url = new URL(window.location.href);
      url.searchParams.set("id", saved.id);
      window.history.replaceState({}, "", url);
    }
  }

  $("btn-save-draft").addEventListener("click", () => saveWithStatus("draft"));
  $("btn-publish").addEventListener("click", () => saveWithStatus("active"));
  $("btn-preview").addEventListener("click", () => setActiveTab("preview"));

  /* --------------------------------- Init --------------------------------- */

  renderImages();
  renderVideos();
  renderDocs();
})();
