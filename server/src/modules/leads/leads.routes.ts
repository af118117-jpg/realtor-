import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/asyncHandler";
import { validate } from "../../middleware/validate";
import * as controller from "./leads.controller";
import { leadListQuerySchema, leadStatusPatchSchema, leadWriteSchema } from "./leads.schemas";

export const leadsRouter = Router();

/**
 * @openapi
 * /leads:
 *   get:
 *     summary: List leads. `status` filter accepts legacy or canonical values; `pipelineStatus` canonical only
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: "{ items, total, page, pageSize } — each lead has status (v1 legacy vocabulary) and pipelineStatus (NEW|CONTACTED|QUALIFIED|CLOSED|LOST)" }
 * /leads/{id}:
 *   delete:
 *     summary: Delete a lead (ADMIN and above)
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       204: { description: Deleted }
 */
leadsRouter.use(requireAuth);

leadsRouter.get("/", validate(leadListQuerySchema, "query"), asyncHandler(controller.list));
leadsRouter.post("/", validate(leadWriteSchema), asyncHandler(controller.create));
leadsRouter.get("/:id", asyncHandler(controller.get));
leadsRouter.put("/:id", validate(leadWriteSchema), asyncHandler(controller.update));
leadsRouter.patch("/:id/status", validate(leadStatusPatchSchema), asyncHandler(controller.patchStatus));
leadsRouter.delete("/:id", requireRole("ADMIN"), asyncHandler(controller.remove));
