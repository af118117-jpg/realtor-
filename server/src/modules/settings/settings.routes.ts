import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/asyncHandler";
import { validate } from "../../middleware/validate";
import * as controller from "./settings.controller";
import { settingsPatchSchema } from "./settings.schemas";

export const settingsRouter = Router();
settingsRouter.use(requireAuth);

settingsRouter.get("/", asyncHandler(controller.get));
settingsRouter.put("/", requireRole("ADMIN"), validate(settingsPatchSchema), asyncHandler(controller.put));
