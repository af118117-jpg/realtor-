(function () {
  "use strict";

  AdminUI.mountPage("dashboard");

  function coverThumbUrl(p) {
    const cover = (p.images || []).find((i) => i.isCover) || (p.images || [])[0];
    if (!cover) return "../assets/images/agent/agent-placeholder.svg";
    if (cover.externalSrc) return `../${cover.externalSrc}`;
    if (cover.mediaId) return AdminDB.objectUrlFor(cover.mediaId) || "../assets/images/agent/agent-placeholder.svg";
    return "../assets/images/agent/agent-placeholder.svg";
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  async function render() {
    const [properties, leads] = await Promise.all([AdminStore.listProperties(), AdminStore.listLeads()]);

    const counts = { total: properties.length, active: 0, draft: 0, sold: 0, rented: 0 };
    properties.forEach((p) => { if (counts[p.status] !== undefined) counts[p.status]++; });

    const stats = [
      { label: "Total Properties", num: counts.total },
      { label: "Active Properties", num: counts.active },
      { label: "Draft Properties", num: counts.draft },
      { label: "Sold Properties", num: counts.sold },
      { label: "Rented Properties", num: counts.rented },
      { label: "Total Leads", num: leads.length },
    ];
    document.getElementById("dashboard-stats").innerHTML = stats.map((s) => `
      <div class="admin-stat"><div class="num">${s.num}</div><div class="label">${s.label}</div></div>
    `).join("");

    const recentProps = [...properties].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5);
    const recentPropsEl = document.getElementById("recent-properties");
    if (!recentProps.length) {
      recentPropsEl.innerHTML = `<div class="admin-empty">No properties yet. <a href="property-editor.html">Add your first property</a>.</div>`;
    } else {
      const thumbs = recentProps.map(coverThumbUrl);
      recentPropsEl.innerHTML = `<div class="admin-table-wrap"><table class="admin-table"><tbody>${
        recentProps.map((p, i) => `
          <tr>
            <td><img class="thumb" src="${thumbs[i]}" alt=""></td>
            <td><a href="property-editor.html?id=${p.id}">${escapeHtml(p.title || "Untitled")}</a><div style="color:var(--color-muted);font-size:0.78rem">${escapeHtml(p.locality)}</div></td>
            <td>${AdminUI.statusBadgeHtml(p.status, ADMIN_CONFIG.statusLabels)}</td>
            <td style="white-space:nowrap">${AdminUI.formatDate(p.updatedAt)}</td>
          </tr>
        `).join("")
      }</tbody></table></div>`;
    }

    const recentLeads = [...leads].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    const recentLeadsEl = document.getElementById("recent-leads");
    if (!recentLeads.length) {
      recentLeadsEl.innerHTML = `<div class="admin-empty">No inquiries yet. Submissions from the website's contact forms land here automatically — see <a href="leads.html">Leads</a>.</div>`;
    } else {
      recentLeadsEl.innerHTML = `<div class="admin-table-wrap"><table class="admin-table"><tbody>${
        recentLeads.map((l) => `
          <tr>
            <td>${escapeHtml(l.name) || "—"}<div style="color:var(--color-muted);font-size:0.78rem">${escapeHtml(l.phone)}</div></td>
            <td>${AdminUI.statusBadgeHtml(l.status, ADMIN_CONFIG.leadStatusLabels)}</td>
            <td style="white-space:nowrap">${AdminUI.formatDate(l.date)}</td>
          </tr>
        `).join("")
      }</tbody></table></div>`;
    }
  }

  render();
})();
