import { z } from "zod";

const PASSWORD_MIN = "Password must be at least 12 characters";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .email("Enter a valid email address");

const nameSchema = z.string().trim().min(1, "Name is required").max(100);
const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(50)
  .regex(/^[A-Za-z0-9._@-]+$/, "Username may contain letters, digits, and . _ @ - only");

/** First-run setup. `email` is the account identity; `username` remains
 * accepted because the existing admin panel's setup form only sends that.
 * At least one of the two is required. */
export const setupSchema = z
  .object({
    name: nameSchema.optional(),
    email: emailSchema.optional(),
    username: usernameSchema.optional(),
    password: z.string().min(12, PASSWORD_MIN).max(200),
    // Only consulted in production, where first-run setup additionally
    // requires a pre-shared SETUP_TOKEN. See auth.controller.ts.
    setupToken: z.string().optional(),
  })
  .refine((v) => v.email || v.username, { message: "Email is required", path: ["email"] });

/** Sign in with `email`, or with the legacy `username` field (which may also
 * hold an email address). */
export const loginSchema = z
  .object({
    email: z.string().trim().max(254).optional(),
    username: z.string().trim().max(254).optional(),
    password: z.string().min(1).max(200),
  })
  .refine((v) => v.email || v.username, { message: "Email is required", path: ["email"] });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(12, PASSWORD_MIN).max(200),
});

export const updateProfileSchema = z
  .object({
    name: nameSchema.optional(),
    email: emailSchema.optional(),
  })
  .refine((v) => v.name !== undefined || v.email !== undefined, { message: "Nothing to update" });
