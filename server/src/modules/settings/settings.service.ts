import { prisma } from "../../lib/prisma";

const SETTINGS_ID = 1;

type JsonRecord = Record<string, unknown>;

function isPlainObject(v: unknown): v is JsonRecord {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Same semantics as the current admin/js/admin-store.js `saveSettings()`:
 * a shallow spread at the top level, with `profile` and `business` merged one
 * level deeper (so patching `business.phone` alone doesn't wipe out
 * `business.social`). Arrays (propertyTypes, amenities) are replaced wholesale
 * when provided, matching how settings-page.js already sends them. */
export function deepMerge(base: JsonRecord, patch: JsonRecord): JsonRecord {
  const result: JsonRecord = { ...base, ...patch };
  for (const key of ["profile", "business"]) {
    if (isPlainObject(base[key]) || isPlainObject(patch[key])) {
      result[key] = {
        ...(isPlainObject(base[key]) ? base[key] : {}),
        ...(isPlainObject(patch[key]) ? patch[key] : {}),
      };
      // one further level for business.social / business.businessHours
      if (key === "business") {
        const baseBiz = isPlainObject(base[key]) ? (base[key] as JsonRecord) : {};
        const patchBiz = isPlainObject(patch[key]) ? (patch[key] as JsonRecord) : {};
        const merged = result[key] as JsonRecord;
        for (const nestedKey of ["social", "businessHours"]) {
          if (isPlainObject(baseBiz[nestedKey]) || isPlainObject(patchBiz[nestedKey])) {
            merged[nestedKey] = {
              ...(isPlainObject(baseBiz[nestedKey]) ? baseBiz[nestedKey] : {}),
              ...(isPlainObject(patchBiz[nestedKey]) ? patchBiz[nestedKey] : {}),
            };
          }
        }
      }
    }
  }
  return result;
}

export function defaultSettings(): JsonRecord {
  return {
    profile: { name: "", email: "" },
    business: {
      siteName: "Realtor Shamraiz",
      phone: "",
      phoneSecondary: "",
      email: "",
      officeAddress: "",
      social: { instagram: "", facebook: "", tiktok: "", youtube: "" },
      businessHours: { status: "always", customText: "" },
    },
    currency: "PKR",
    currencySymbol: "₨",
    propertyTypes: ["Villa", "House", "Apartment", "Penthouse", "Studio", "Plot", "Commercial Plot", "Office", "Shop"],
    amenities: [
      "Security",
      "Park/Green Belt",
      "Mosque",
      "Gymnasium",
      "Swimming Pool",
      "Backup Generator",
      "Servant Quarter",
      "Lawn",
      "Store Room",
      "Lift",
    ],
    logoMediaId: null,
  };
}

export async function getSettings(): Promise<JsonRecord> {
  const row = await prisma.settings.findUnique({ where: { id: SETTINGS_ID } });
  if (!row) return defaultSettings();
  return row.data as JsonRecord;
}

export async function patchSettings(patch: JsonRecord): Promise<JsonRecord> {
  const current = await getSettings();
  const merged = deepMerge(current, patch);
  await prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, data: merged as never },
    update: { data: merged as never },
  });
  return merged;
}
