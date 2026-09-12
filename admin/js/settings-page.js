(function () {
  "use strict";

  AdminStore.seedIfEmpty();
  AdminUI.mountPage("settings");

  function $(id) { return document.getElementById(id); }
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* --------------------------------- Tabs --------------------------------- */
  document.querySelectorAll(".admin-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab").forEach((t) => t.classList.toggle("is-active", t === tab));
      document.querySelectorAll(".admin-tab-panel").forEach((p) => p.classList.toggle("is-active", p.dataset.panel === tab.dataset.tab));
    });
  });

  /* -------------------------------- Profile -------------------------------- */
  let settings = AdminStore.getSettings();
  $("s-profile-name").value = settings.profile?.name || "";
  $("s-profile-email").value = settings.profile?.email || "";
  $("save-profile").addEventListener("click", () => {
    settings = AdminStore.saveSettings({ profile: { name: $("s-profile-name").value.trim(), email: $("s-profile-email").value.trim() } });
    AdminUI.toast("Profile saved.", "success");
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

  async function renderLogo() {
    const preview = $("logo-preview");
    if (settings.logoMediaId) {
      const rec = await AdminDB.get(settings.logoMediaId);
      const url = AdminDB.objectUrlFor(rec);
      preview.innerHTML = url ? `<img src="${url}" alt="Logo" style="width:100%;height:100%;object-fit:cover">` : "RS";
    } else {
      preview.textContent = "RS";
    }
  }
  renderLogo();

  $("s-logo-input").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mediaId = await AdminDB.put({ id: "admin-logo", kind: "image", name: file.name, mimeType: file.type, size: file.size, blob: file });
    settings = AdminStore.saveSettings({ logoMediaId: mediaId });
    AdminUI.toast("Logo uploaded.", "success");
    renderLogo();
  });

  $("save-business").addEventListener("click", () => {
    settings = AdminStore.saveSettings({
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
    });
    AdminUI.toast("Business information saved.", "success");
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
    renderChips("types-list", settings.propertyTypes || [], (i) => {
      const next = [...settings.propertyTypes];
      next.splice(i, 1);
      settings = AdminStore.saveSettings({ propertyTypes: next });
      renderTypes();
    });
  }
  function renderAmenities() {
    renderChips("amenities-list", settings.amenities || [], (i) => {
      const next = [...settings.amenities];
      next.splice(i, 1);
      settings = AdminStore.saveSettings({ amenities: next });
      renderAmenities();
    });
  }
  renderTypes();
  renderAmenities();

  $("add-type").addEventListener("click", () => {
    const input = $("new-type");
    const val = input.value.trim();
    if (val && !(settings.propertyTypes || []).includes(val)) {
      settings = AdminStore.saveSettings({ propertyTypes: [...(settings.propertyTypes || []), val] });
      renderTypes();
      AdminUI.toast("Property type added.", "success");
    }
    input.value = "";
  });
  $("add-amenity-setting").addEventListener("click", () => {
    const input = $("new-amenity");
    const val = input.value.trim();
    if (val && !(settings.amenities || []).includes(val)) {
      settings = AdminStore.saveSettings({ amenities: [...(settings.amenities || []), val] });
      renderAmenities();
      AdminUI.toast("Amenity added.", "success");
    }
    input.value = "";
  });

  /* -------------------------------- Security -------------------------------- */
  $("save-password").addEventListener("click", async () => {
    const current = $("s-current-password").value;
    const next = $("s-new-password").value;
    const confirm = $("s-new-password-confirm").value;
    if (next.length < 8) { AdminUI.toast("New password must be at least 8 characters.", "error"); return; }
    if (next !== confirm) { AdminUI.toast("New passwords do not match.", "error"); return; }
    const ok = await AdminAuth.changePassword(current, next);
    if (!ok) { AdminUI.toast("Current password is incorrect.", "error"); return; }
    AdminUI.toast("Password changed.", "success");
    $("s-current-password").value = "";
    $("s-new-password").value = "";
    $("s-new-password-confirm").value = "";
  });
})();
