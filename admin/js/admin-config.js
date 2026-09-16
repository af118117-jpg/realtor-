/**
 * Admin Panel — configuration and constants.
 * -------------------------------------------
 * Data now lives in a real backend (see server/). Properties, leads,
 * settings and media are read and written over the REST API below;
 * authentication is performed server-side. See plans/MASTER_PLAN.md (D-28).
 */

const ADMIN_CONFIG = {
  /**
   * Where the backend API lives.
   * In local development the static site is served on :5273 (server.js) and
   * the API runs as a separate process on :4000. In production the API is
   * expected to be reverse-proxied under the same origin at /api/v1, which
   * removes the cross-origin case entirely.
   */
  apiBase:
    location.hostname === "localhost" || location.hostname === "127.0.0.1"
      ? "http://localhost:4000/api/v1"
      : "/api/v1",

  statuses: ["draft", "active", "sold", "rented", "archived"],
  statusLabels: {
    draft: "Draft",
    active: "Active",
    sold: "Sold",
    rented: "Rented",
    archived: "Archived",
  },

  leadStatuses: ["new", "contacted", "follow-up", "interested", "closed"],
  leadStatusLabels: {
    "new": "New",
    "contacted": "Contacted",
    "follow-up": "Follow-up",
    "interested": "Interested",
    "closed": "Closed",
  },

  defaultPropertyTypes: [
    "Villa", "House", "Apartment", "Penthouse", "Studio",
    "Plot", "Commercial Plot", "Office", "Shop",
  ],

  defaultAmenities: [
    "Security", "Park / Green Belt", "Mosque", "Gymnasium", "Swimming Pool",
    "Backup Generator", "Servant Quarter", "Lawn", "Store Room", "Lift",
  ],
};
