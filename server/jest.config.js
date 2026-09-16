/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["<rootDir>/tests/**/*.spec.ts"],
  // Points the app's Prisma singleton at the test database before any test
  // module (and therefore any PrismaClient) is loaded.
  setupFiles: ["<rootDir>/tests/setup/env.ts"],
  testTimeout: 30000,
  clearMocks: true,
};
