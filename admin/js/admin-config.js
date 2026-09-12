/**
 * Admin Panel — configuration and constants.
 * -------------------------------------------
 * No backend exists yet. Every admin data key below is local-storage/IndexedDB
 * only and lives in this browser. See admin-store.js for the data layer and
 * docs/MASTER_PLAN.md (D-26) for the architecture decision this follows.
 */

const ADMIN_CONFIG = {
  // localStorage keys — namespaced to avoid any collision with the public
  // site's own `rs:` keys (see docs/DATA_MODEL.md §8).
  keys: {
    credentials: "rs-admin:credentials",
    session: "rs-admin:session",
    properties: "rs-admin:properties",
    leads: "rs-admin:leads",
    settings: "rs-admin:settings",
    seeded: "rs-admin:seeded",
  },

  // IndexedDB (binary media — images/videos/documents live here, not localStorage)
  db: {
    name: "rs-admin-media",
    version: 1,
    store: "media",
  },

  // Session lifetime (sessionStorage already clears on tab close; this caps
  // an idle tab open for days).
  sessionMaxAgeMs: 12 * 60 * 60 * 1000, // 12 hours

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
