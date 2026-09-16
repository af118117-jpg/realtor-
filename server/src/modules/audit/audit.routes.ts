import { Router, type Request, type Response } from "express";
import type { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/asyncHandler";
import { validate } from "../../middleware/validate";
import { auditListQuerySchema } from "./audit.schemas";
import { listAuditLogs } from "./audit.service";

export const auditRouter = Router();
auditRouter.use(requireAuth, requireRole("ADMIN"));

/**
 * @openapi
 * /audit-logs:
 *   get:
 *     summary: Audit trail of important admin actions (ADMIN and above)
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - { in: query, name: action, schema: { type: string }, description: 'Exact action or a prefix ending in "."' }
 *       - { in: query, name: entityType, schema: { type: string } }
 *       - { in: query, name: entityId, schema: { type: string } }
 *       - { in: query, name: actorId, schema: { type: string } }
 *       - { in: query, name: from, schema: { type: string, format: date-time } }
 *       - { in: query, name: to, schema: { type: string, format: date-time } }
 *     responses:
 *       200: { description: "{ items, total, page, pageSize }" }
 *       403: { description: Role below ADMIN }
 */
auditRouter.get(
  "/",
  validate(auditListQuerySchema, "query"),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await listAuditLogs(req.query as unknown as z.infer<typeof auditListQuerySchema>));
  }),
);
