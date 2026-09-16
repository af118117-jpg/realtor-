/**
 * Applies migrations to the TEST database before the suite runs
 * (wired up as npm's `pretest`). Kept out of the test files themselves so no
 * test ever shells out to Prisma while holding a database connection.
 */
import "dotenv/config";
import { execSync } from "node:child_process";

const url = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
if (!url) {
  console.error("Set DATABASE_URL_TEST (or DATABASE_URL) before running tests.");
  process.exit(1);
}

execSync("npx prisma migrate deploy", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: url, PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: "1" },
});
