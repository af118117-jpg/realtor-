import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/asyncHandler";
import { validate } from "../../middleware/validate";
import * as controller from "./properties.controller";
import { propertyListQuerySchema, propertyWriteSchema, statusPatchSchema } from "./properties.schemas";

export const propertiesRouter = Router();

/**
 * @openapi
 * /properties:
 *   get:
 *     summary: List properties (any signed-in role). Filters status, propertyType, listingType, city, featured, verified, agentId, q
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: "{ items, total, page, pageSize }" }
 *   post:
 *     summary: Create a property. Accepts canonical fields and the API v1 aliases (see properties.schemas.ts)
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       201: { description: Created }
 *       409: { description: Slug or reference code already in use }
 * /properties/{id}:
 *   put:
 *     summary: Update a property; fields omitted from the body are left unchanged
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     summary: Delete a property (ADMIN and above)
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       204: { description: Deleted }
 */
propertiesRouter.use(requireAuth);

propertiesRouter.get("/", validate(propertyListQuerySchema, "query"), asyncHandler(controller.list));
propertiesRouter.post("/", validate(propertyWriteSchema), asyncHandler(controller.create));
propertiesRouter.get("/:id", asyncHandler(controller.get));
propertiesRouter.put("/:id", validate(propertyWriteSchema), asyncHandler(controller.update));
propertiesRouter.patch("/:id/status", validate(statusPatchSchema), asyncHandler(controller.patchStatus));
propertiesRouter.post("/:id/duplicate", asyncHandler(controller.duplicate));
propertiesRouter.delete("/:id", requireRole("ADMIN"), asyncHandler(controller.remove));
