// Async because settings are now fetched from the API before the form can be
// populated, and every save is a network write.
(async function () {
  "use strict";

  AdminUI.mountPage("settings");

  function $(id) { return document.getElementById(id); }
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /** Every save goes through here so a failed write always surfaces instead
   * of silently leaving the form showing values the server never stored. */
  async function save(patch, successMessage) {
    try {
      const updated = await AdminStore.saveSettings(patch);
      if (successMessage) AdminUI.toast(successMessage, "success");
      return updated;
    } catch (err) {
      AdminUI.toast(err.message || "Could not save settings.", "error");
      return null;
    }
  }

  /* --------------------------------- Tabs --------------------------------- */
  document.querySelectorAll(".admin-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab").forEach((t) => t.classList.toggle("is-active", t === tab));
      document.querySelectorAll(".admin-tab-panel").forEach((p) => p.classList.toggle("is-active", p.dataset.panel === tab.dataset.tab));
    });
  });

  /* -------------------------------- Profile -------------------------------- */
  let settings = await AdminStore.getSettings();
  $("s-profile-name").value = settings.profile?.name || "";
  $("s-profile-email").value = settings.profile?.email || "";
  $("save-profile").addEventListener("click", async () => {
    const updated = await save(
      { profile: { name: $("s-profile-name").value.trim(), email: $("s-profile-email").value.trim() } },
      "Profile saved.",
    );
    if (updated) settings = updated;
  });

  /* -------------------------------- Business -------------------------------- */
  $("s-biz-name").value = settings.business?.siteName || "";
  $("s-biz-phone").value = settings.business?.phone || "";
  $("s-biz-phone2").value = settings.business?.phoneSecondary || "";
  $("s-biz-email").value = settings.business?.email || "";
  $("s-biz-currency").value = settings.currency || "PKR";
  $("s-biz-address").value = settings.business?.officeAddress || "";

  $("s-social-instagram").value = settings.business?.social?.instagram || "";
  $("s-social-facebook").value = settings.business?.social?.facebook || "";
  $("s-social-tiktok").value = settings.business?.social?.tiktok || "";
  $("s-social-youtube").value = settings.business?.social?.youtube || "";

  const hoursStatusEl = $("s-hours-status");
  const hoursCustomWrap = $("s-hours-custom-wrap");
  const hoursCustomEl = $("s-hours-custom");
  hoursStatusEl.value = settings.business?.businessHours?.status || "always";
  hoursCustomEl.value = settings.business?.businessHours?.customText || "";
  function syncHoursCustomVisibility() { hoursCustomWrap.hidden = hoursStatusEl.value !== "custom"; }
  syncHoursCustomVisibility();
  hoursStatusEl.addEventListener("change", syncHoursCustomVisibility);

  function renderLogo() {
    const preview = $("logo-preview");
    const url = settings.logoMediaId ? AdminDB.objectUrlFor(settings.logoMediaId) : null;
    preview.innerHTML = url ? `<img src="${url}" alt="Logo" style="width:100%;height:100%;object-fit:cover">` : "RS";
  }
  renderLogo();

  $("s-logo-input").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const mediaId = await AdminDB.put({ kind: "image", name: file.name, mimeType: file.type, size: file.size, blob: file });
      const updated = await save({ logoMediaId: mediaId }, "Logo uploaded.");
      if (updated) settings = updated;
      renderLogo();
    } catch (err) {
      AdminUI.toast(err.message || "Logo upload failed.", "error");
    }
  });

  $("save-business").addEventListener("click", async () => {
    const updated = await save({
      business: {
        siteName: $("s-biz-name").value.trim(),
        phone: $("s-biz-phone").value.trim(),
        phoneSecondary: $("s-biz-phone2").value.trim(),
        email: $("s-biz-email").value.trim(),
        officeAddress: $("s-biz-address").value.trim(),
        social: {
          instagram: $("s-social-instagram").value.trim(),
          facebook: $("s-social-facebook").value.trim(),
          tiktok: $("s-social-tiktok").value.trim(),
          youtube: $("s-social-youtube").value.trim(),
        },
        businessHours: {
          status: hoursStatusEl.value,
          customText: hoursCustomEl.value.trim(),
        },
      },
      currency: $("s-biz-currency").value.trim().toUpperCase(),
    }, "Business information saved.");
    if (updated) settings = updated;
  });

  /* -------------------------------- Catalog -------------------------------- */
  function renderChips(listId, items, removeHandler) {
    document.getElementById(listId).innerHTML = items.map((item, i) => `
      <span class="admin-badge admin-badge-active" style="cursor:pointer" data-remove="${i}">${escapeHtml(item)} ✕</span>
    `).join("");
    document.getElementById(listId).querySelectorAll("[data-remove]").forEach((chip) => {
      chip.addEventListener("click", () => removeHandler(Number(chip.dataset.remove)));
    });
  }

  function renderTypes() {
    renderChips("types-list", settings.propertyTypes || [], async (i) => {
      const next = [...settings.propertyTypes];
      next.splice(i, 1);
      const updated = await save({ propertyTypes: next });
      if (updated) settings = updated;
      renderTypes();
    });
  }
  function renderAmenities() {
    renderChips("amenities-list", settings.amenities || [], async (i) => {
      const next = [...settings.amenities];
      next.splice(i, 1);
      const updated = await save({ amenities: next });
      if (updated) settings = updated;
      renderAmenities();
    });
  }
  renderTypes();
  renderAmenities();

  $("add-type").addEventListener("click", async () => {
    const input = $("new-type");
    const val = input.value.trim();
    if (val && !(settings.propertyTypes || []).includes(val)) {
      const updated = await save({ propertyTypes: [...(settings.propertyTypes || []), val] }, "Property type added.");
      if (updated) settings = updated;
      renderTypes();
    }
    input.value = "";
  });
  $("add-amenity-setting").addEventListener("click", async () => {
    const input = $("new-amenity");
    const val = input.value.trim();
    if (val && !(settings.amenities || []).includes(val)) {
      const updated = await save({ amenities: [...(settings.amenities || []), val] }, "Amenity added.");
      if (updated) settings = updated;
      renderAmenities();
    }
    input.value = "";
  });

  /* -------------------------------- Security -------------------------------- */
  $("save-password").addEventListener("click", async () => {
    const current = $("s-current-password").value;
    const next = $("s-new-password").value;
    const confirm = $("s-new-password-confirm").value;
    if (next.length < 12) { AdminUI.toast("New password must be at least 12 characters.", "error"); return; }
    if (next !== confirm) { AdminUI.toast("New passwords do not match.", "error"); return; }
    const ok = await AdminAuth.changePassword(current, next);
    if (!ok) { AdminUI.toast("Current password is incorrect.", "error"); return; }
    AdminUI.toast("Password changed.", "success");
    $("s-current-password").value = "";
    $("s-new-password").value = "";
    $("s-new-password-confirm").value = "";
  });
})();
