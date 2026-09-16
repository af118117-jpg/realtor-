import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/asyncHandler";
import { authLimiter } from "../../middleware/rateLimiters";
import { validate } from "../../middleware/validate";
import * as controller from "./auth.controller";
import { changePasswordSchema, loginSchema, setupSchema, updateProfileSchema } from "./auth.schemas";

export const authRouter = Router();

/**
 * @openapi
 * /auth/setup-required:
 *   get:
 *     summary: Whether the one-time admin setup still needs to run
 *     responses:
 *       200: { description: "{ setupRequired: boolean }" }
 */
authRouter.get("/setup-required", asyncHandler(controller.setupRequired));

/**
 * @openapi
 * /auth/setup:
 *   post:
 *     summary: Create the first account as SUPER_ADMIN (fails once any user exists)
 *     responses:
 *       201: { description: Created }
 *       403: { description: Setup already completed }
 */
authRouter.post("/setup", authLimiter, validate(setupSchema), asyncHandler(controller.setup));

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in with email (or legacy username) and receive httpOnly auth cookies
 *     responses:
 *       200: { description: OK }
 *       401: { description: Invalid credentials }
 */
authRouter.post("/login", authLimiter, validate(loginSchema), asyncHandler(controller.login));
authRouter.post("/refresh", authLimiter, asyncHandler(controller.refresh));
authRouter.post("/logout", requireAuth, asyncHandler(controller.logout));
authRouter.post(
  "/change-password",
  requireAuth,
  validate(changePasswordSchema),
  asyncHandler(controller.changePassword),
);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Current authenticated user
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 */
authRouter.get("/me", requireAuth, asyncHandler(controller.me));

/**
 * @openapi
 * /auth/me:
 *   patch:
 *     summary: Update the signed-in user's name and/or email
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Updated user }
 *       409: { description: Email already in use }
 */
authRouter.patch("/me", requireAuth, validate(updateProfileSchema), asyncHandler(controller.updateProfile));
