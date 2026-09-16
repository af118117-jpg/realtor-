import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";

export const healthRouter = Router();

/**
 * @openapi
 * /healthz:
 *   get:
 *     summary: Uptime probe (checks DB connectivity)
 *     responses:
 *       200: { description: OK }
 *       503: { description: Database unreachable }
 */
healthRouter.get(
  "/healthz",
  asyncHandler(async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ status: "ok", time: new Date().toISOString() });
    } catch {
      res.status(503).json({ status: "error", detail: "database unreachable" });
    }
  }),
);
