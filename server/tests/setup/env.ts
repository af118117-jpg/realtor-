/**
 * Runs before any test module is loaded (jest `setupFiles`), so the app's
 * Prisma singleton is constructed against the TEST database rather than the
 * development one. Doing this inside a test file would be too late: imports
 * are hoisted and the client would already be pointed at DATABASE_URL.
 */
import "dotenv/config";

process.env.NODE_ENV = "test"; // silences request logging, see src/lib/logger.ts

if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}

if (!process.env.DATABASE_URL) {
  throw new Error("Set DATABASE_URL_TEST (or DATABASE_URL) before running tests.");
}
