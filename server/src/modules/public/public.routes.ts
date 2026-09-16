import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { publicLeadLimiter } from "../../middleware/rateLimiters";
import { validate } from "../../middleware/validate";
import * as controller from "./public.controller";
import { publicLeadSchema, publicPropertyListQuerySchema } from "./public.schemas";

export const publicRouter = Router();

/**
 * @openapi
 * /public/properties:
 *   get:
 *     summary: Active listings in the public site's Listing shape (no auth)
 *     responses:
 *       200: { description: OK }
 */
publicRouter.get(
  "/properties",
  validate(publicPropertyListQuerySchema, "query"),
  asyncHandler(controller.listProperties),
);
publicRouter.get("/properties/:id", asyncHandler(controller.getProperty));

/**
 * @openapi
 * /public/settings:
 *   get:
 *     summary: Business details the public site displays (no auth)
 *     responses:
 *       200: { description: OK }
 */
publicRouter.get("/settings", asyncHandler(controller.settings));

/**
 * @openapi
 * /public/leads:
 *   post:
 *     summary: Public lead-capture form submission (rate-limited, honeypot + timing anti-spam)
 *     responses:
 *       201: { description: "Always reports success, even when silently discarded as spam" }
 */
publicRouter.post(
  "/leads",
  publicLeadLimiter,
  validate(publicLeadSchema),
  asyncHandler(controller.submitLead),
);
