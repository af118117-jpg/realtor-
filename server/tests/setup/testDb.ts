/**
 * Test-database helpers.
 *
 * Migrations are applied once before the suite runs (see the `pretest` script
 * in package.json), not from inside a test — shelling out to Prisma while a
 * test already holds a database connection is a good way to deadlock.
 *
 * The app's own Prisma singleton is reused rather than creating a second
 * client, so the whole suite needs exactly one connection.
 */
import { prisma } from "../../src/lib/prisma";

export { prisma as testPrisma };

/** Empties every app table, children before parents. Call from a
 * `beforeEach` so tests never leak state into one another; `--runInBand`
 * keeps this safe (no parallel writers). */
export async function resetTestDb(): Promise<void> {
  await prisma.auditLog.deleteMany();
  await prisma.propertyMedia.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.property.deleteMany();
  await prisma.media.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}

export async function closeTestDb(): Promise<void> {
  await prisma.$disconnect();
}
