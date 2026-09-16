import { kindToDir, resolveMediaKind, sanitizeBaseName } from "../../src/modules/media/media.util";

describe("resolveMediaKind", () => {
  it("classifies known image/video/document mime types", () => {
    expect(resolveMediaKind("image/jpeg")).toBe("IMAGE");
    expect(resolveMediaKind("video/mp4")).toBe("VIDEO");
    expect(resolveMediaKind("application/pdf")).toBe("DOCUMENT");
  });

  it("rejects an unsupported mime type", () => {
    expect(() => resolveMediaKind("application/x-executable")).toThrow();
  });
});

describe("kindToDir", () => {
  it("maps each kind to its storage subdirectory", () => {
    expect(kindToDir("IMAGE")).toBe("images");
    expect(kindToDir("VIDEO")).toBe("videos");
    expect(kindToDir("DOCUMENT")).toBe("documents");
  });
});

describe("sanitizeBaseName", () => {
  it("strips the extension and unsafe characters", () => {
    expect(sanitizeBaseName("My Villa Photo #1.jpg")).toBe("My-Villa-Photo-1");
  });

  it("never returns an empty string", () => {
    expect(sanitizeBaseName("....jpg")).toBe("file");
  });

  it("rejects path traversal attempts down to a safe slug", () => {
    expect(sanitizeBaseName("../../etc/passwd")).not.toContain("..");
    expect(sanitizeBaseName("../../etc/passwd")).not.toContain("/");
  });
});
