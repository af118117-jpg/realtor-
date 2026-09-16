import { deepMerge, defaultSettings } from "../../src/modules/settings/settings.service";

describe("settings deepMerge", () => {
  it("patches business.phone without wiping business.social", () => {
    const base = defaultSettings() as any;
    base.business.social.instagram = "https://instagram.com/example";

    const merged = deepMerge(base, { business: { phone: "+92 300 0000000" } }) as any;

    expect(merged.business.phone).toBe("+92 300 0000000");
    expect(merged.business.social.instagram).toBe("https://instagram.com/example");
  });

  it("merges nested businessHours without dropping siteName", () => {
    const base = defaultSettings() as any;
    const merged = deepMerge(base, { business: { businessHours: { status: "closed" } } }) as any;

    expect(merged.business.businessHours.status).toBe("closed");
    expect(merged.business.siteName).toBe("Realtor Shamraiz");
  });

  it("replaces arrays wholesale rather than merging them", () => {
    const base = defaultSettings() as any;
    const merged = deepMerge(base, { amenities: ["Custom Amenity"] }) as any;

    expect(merged.amenities).toEqual(["Custom Amenity"]);
  });

  it("merges profile independently of business", () => {
    const base = defaultSettings() as any;
    const merged = deepMerge(base, { profile: { name: "Shamraiz" } }) as any;

    expect(merged.profile.name).toBe("Shamraiz");
    expect(merged.profile.email).toBe("");
  });
});
