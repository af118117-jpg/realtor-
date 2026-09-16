import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CORS_ORIGINS: z.string().default("http://localhost:5273"),

  // Number of reverse proxies in front of the API, or "false" when it is
  // exposed directly. Getting this wrong lets a client spoof its own IP via
  // X-Forwarded-For and walk straight past the rate limiters, so it is
  // deliberately explicit rather than a permissive default.
  TRUST_PROXY: z.string().default("false"),

  // Required in production before the unauthenticated first-run /auth/setup
  // endpoint will create an admin account. Leave unset to disable setup
  // entirely and create the admin with the seed script instead.
  SETUP_TOKEN: z.string().min(16).optional(),

  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 characters"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 characters"),
  JWT_ACCESS_TTL_MIN: z.coerce.number().int().positive().default(15),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(14),

  MEDIA_STORAGE_DIR: z.string().default("./storage"),
  MEDIA_MAX_IMAGE_MB: z.coerce.number().positive().default(15),
  MEDIA_MAX_VIDEO_MB: z.coerce.number().positive().default(500),
  MEDIA_MAX_DOCUMENT_MB: z.coerce.number().positive().default(25),

  SEED_ADMIN_EMAIL: z.string().optional(),
  SEED_ADMIN_NAME: z.string().optional(),
  SEED_ADMIN_USERNAME: z.string().optional(),
  SEED_ADMIN_PASSWORD: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const corsOrigins = env.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean);

/** Express's `trust proxy` value: `false`, `true`, or a hop count. */
export const trustProxy: boolean | number =
  env.TRUST_PROXY === "false"
    ? false
    : env.TRUST_PROXY === "true"
      ? true
      : Number.isFinite(Number(env.TRUST_PROXY))
        ? Number(env.TRUST_PROXY)
        : false;
