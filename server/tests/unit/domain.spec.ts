import { hasRoleAtLeast } from "../../src/lib/roles";
import { slugBase, SLUG_PATTERN, suffixedSlug } from "../../src/lib/slug";
import { changedFields, sanitizeMetadata } from "../../src/modules/audit/audit.service";
import {
  resolveLeadStatusUpdate,
  toCanonicalLeadStatus,
  toLegacyLeadStatus,
} from "../../src/modules/leads/leads.status";
import { isSafeMediaUrl } from "../../src/modules/properties/properties.schemas";

describe("role hierarchy", () => {
  it("orders EDITOR < ADMIN < SUPER_ADMIN", () => {
    expect(hasRoleAtLeast("SUPER_ADMIN", "ADMIN")).toBe(true);
    expect(hasRoleAtLeast("ADMIN", "ADMIN")).toBe(true);
    expect(hasRoleAtLeast("EDITOR", "ADMIN")).toBe(false);
    expect(hasRoleAtLeast(undefined, "EDITOR")).toBe(false);
  });
});

describe("slugs", () => {
  it("kebab-cases titles, folds accents, and drops punctuation", () => {
    expect(slugBase("[CONTENT REQUIRED] — Sample Villa Listing")).toBe("content-required-sample-villa-listing");
    expect(slugBase("Café  Owner's   House")).toBe("cafe-owners-house");
    expect(slugBase("!!!")).toBe("listing");
  });

  it("always produces what the database CHECK accepts", () => {
    for (const title of ["  A--B__C  ", "ÀÉÎ", "x".repeat(300), "-leading and trailing-", suffixedSlug("Dup")]) {
      expect(slugBase(title)).toMatch(SLUG_PATTERN);
    }
    expect(suffixedSlug("Corner House")).toMatch(/^corner-house-[0-9a-f]{6}$/);
  });
});

describe("lead status vocabularies", () => {
  it("maps legacy input to canonical storage", () => {
    expect(toCanonicalLeadStatus("FOLLOW_UP")).toBe("CONTACTED");
    expect(toCanonicalLeadStatus("INTERESTED")).toBe("QUALIFIED");
    expect(toCanonicalLeadStatus("LOST")).toBe("LOST");
  });

  it("projects canonical values onto the legacy list", () => {
    expect(toLegacyLeadStatus("QUALIFIED")).toBe("INTERESTED");
    expect(toLegacyLeadStatus("LOST")).toBe("CLOSED");
    expect(toLegacyLeadStatus("NEW")).toBe("NEW");
  });

  it("keeps the current status when a legacy client re-submits its projection", () => {
    expect(resolveLeadStatusUpdate("LOST", { status: "CLOSED" })).toBe("LOST");
    expect(resolveLeadStatusUpdate("QUALIFIED", { status: "INTERESTED" })).toBe("QUALIFIED");
    expect(resolveLeadStatusUpdate("LOST", { status: "NEW" })).toBe("NEW");
    expect(resolveLeadStatusUpdate("LOST", { pipelineStatus: "CLOSED" })).toBe("CLOSED");
    expect(resolveLeadStatusUpdate("CONTACTED", {})).toBe("CONTACTED");
  });
});

describe("audit metadata", () => {
  it("redacts secret-looking keys at any depth and truncates long strings", () => {
    const out = sanitizeMetadata({
      password: "hunter2",
      nested: { refreshToken: "abc", passwordHash: "$2a$", ok: "fine" },
      long: "x".repeat(600),
    }) as Record<string, any>;
    expect(out.password).toBe("[redacted]");
    expect(out.nested).toEqual({ refreshToken: "[redacted]", passwordHash: "[redacted]", ok: "fine" });
    expect(out.long.length).toBeLessThanOrEqual(501);
  });

  it("lists only the fields whose values changed", () => {
    expect(changedFields({ a: 1, b: [1], c: null }, { a: 1, b: [2], c: undefined }, ["a", "b", "c"])).toEqual(["b"]);
  });
});

describe("media URL safety", () => {
  it.each([
    ["https://example.com/a.jpg", true],
    ["assets/images/listings/villa.jpg", true],
    ["/api/v1/media/abc/file", true],
    ["javascript:alert(1)", false],
    ["data:image/png;base64,AAAA", false],
    ["//evil.example/a.jpg", false],
    ["JaVaScRiPt:alert(1)", false],
  ])("%s → %s", (url, expected) => {
    expect(isSafeMediaUrl(url)).toBe(expected);
  });
});
