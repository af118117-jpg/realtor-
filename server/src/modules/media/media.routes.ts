import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../../lib/apiError";
import { ACCESS_COOKIE } from "../../lib/cookies";
import { requireAuth, requireRole } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/asyncHandler";
import { upload } from "../../middleware/upload";
import { validate } from "../../middleware/validate";
import { verifyAccessToken } from "../auth/auth.service";
import * as controller from "./media.controller";
import * as service from "./media.service";
import { mediaListQuerySchema } from "./media.schemas";

export const mediaRouter = Router();

/** Public documents don't exist by design (media.service.ts always marks
 * DOCUMENT kind private), but this stays kind-agnostic so serving logic
 * doesn't silently drift from that rule if it ever changes. */
async function gateFile(req: Request, _res: Response, next: NextFunction) {
  try {
    const media = await service.getMediaOrThrow(req.params.id);
    if (!media.isPrivate) return next();

    const token = req.cookies?.[ACCESS_COOKIE];
    if (!token) return next(ApiError.unauthorized());
    req.user = verifyAccessToken(token);
    return next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    return next(ApiError.unauthorized("Session expired. Please log in again."));
  }
}

mediaRouter.get("/:id/file", asyncHandler(gateFile), asyncHandler(controller.serveFile));

mediaRouter.use(requireAuth);
mediaRouter.post("/", upload.single("file"), asyncHandler(controller.upload));
mediaRouter.get("/", validate(mediaListQuerySchema, "query"), asyncHandler(controller.list));
mediaRouter.get("/:id/references", asyncHandler(controller.references));
mediaRouter.get("/:id", asyncHandler(controller.get));
mediaRouter.delete("/:id", requireRole("ADMIN"), asyncHandler(controller.remove));
