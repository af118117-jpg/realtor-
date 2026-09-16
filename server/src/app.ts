import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import { corsOrigins, env, trustProxy } from "./config/env";
import { requireAdminRequestHeader } from "./middleware/auth";
import { openapiSpec } from "./docs/openapi";
import { logger } from "./lib/logger";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import { globalLimiter } from "./middleware/rateLimiters";
import { auditRouter } from "./modules/audit/audit.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { healthRouter } from "./modules/health/health.routes";
import { leadsRouter } from "./modules/leads/leads.routes";
import { mediaRouter } from "./modules/media/media.routes";
import { propertiesRouter } from "./modules/properties/properties.routes";
import { publicRouter } from "./modules/public/public.routes";
import { settingsRouter } from "./modules/settings/settings.routes";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  // Only trust as many proxy hops as are actually in front of this process —
  // over-trusting lets a client forge X-Forwarded-For and sidestep every
  // per-IP rate limit below. Configured via TRUST_PROXY, default: none.
  app.set("trust proxy", trustProxy);

  app.use(
    helmet({
      // The API serves JSON/files, not HTML pages, so a strict default CSP
      // is safe here — it isn't rendering any of its own markup.
      contentSecurityPolicy: { directives: { defaultSrc: ["'none'"] } },
      crossOriginResourcePolicy: { policy: "cross-origin" }, // media files are <img>/<video> src'd from the static site's origin
    }),
  );
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
      allowedHeaders: ["Content-Type", "X-Admin-Request"],
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/healthz" } }));
  app.use(globalLimiter);

  app.use(healthRouter);

  // The docs enumerate every admin endpoint; that's useful while building and
  // needless exposure once deployed.
  if (env.NODE_ENV !== "production") {
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));
  }

  // Public routes are mounted first and without the CSRF header requirement:
  // they are unauthenticated by design (the website's own listing fetch and
  // contact form), so there is no cookie-derived authority for CSRF to abuse.
  app.use("/api/v1/public", publicRouter);

  // Everything below is admin surface — state-changing requests must carry
  // the custom header, whether or not the individual route requires a session.
  app.use("/api/v1", requireAdminRequestHeader);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/properties", propertiesRouter);
  app.use("/api/v1/media", mediaRouter);
  app.use("/api/v1/leads", leadsRouter);
  app.use("/api/v1/settings", settingsRouter);
  app.use("/api/v1/audit-logs", auditRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
