import { hashPassword, signAccessToken, verifyAccessToken, verifyPassword } from "../../src/modules/auth/auth.service";

describe("access tokens", () => {
  it("round-trips a signed payload", () => {
    const token = signAccessToken({ sub: "user-1", role: "ADMIN" });
    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe("user-1");
    expect(decoded.role).toBe("ADMIN");
  });

  it("rejects a tampered token", () => {
    const token = signAccessToken({ sub: "user-1", role: "ADMIN" });
    const tampered = token.slice(0, -2) + "xx";
    expect(() => verifyAccessToken(tampered)).toThrow();
  });
});

describe("password hashing", () => {
  it("verifies a correct password and rejects an incorrect one", async () => {
    const hash = await hashPassword("correct horse battery staple");
    await expect(verifyPassword("correct horse battery staple", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong password", hash)).resolves.toBe(false);
  });
});
