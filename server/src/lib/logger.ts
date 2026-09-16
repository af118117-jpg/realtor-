import pino from "pino";
import { env } from "../config/env";

export const logger = pino({
  // Tests exercise hundreds of requests; their logs would bury the results.
  level: env.NODE_ENV === "test" ? "silent" : env.NODE_ENV === "production" ? "info" : "debug",
  // pino-http's default serializers copy request and response headers
  // verbatim — which would write the session JWT (and, on login, the
  // plaintext refresh token) into every log line. Anyone who could read the
  // logs would then hold a working admin session.
  redact: {
    paths: [
      "req.headers.cookie",
      "req.headers.authorization",
      'res.headers["set-cookie"]',
      "req.body.password",
      "req.body.currentPassword",
      "req.body.newPassword",
    ],
    censor: "[redacted]",
  },
  transport:
    env.NODE_ENV === "production"
      ? undefined
      : { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" } },
});
