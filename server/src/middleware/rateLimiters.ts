import rateLimit from "express-rate-limit";

/** Light global ceiling — the real protection is on the sensitive routes below. */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

/** Login/refresh — the classic credential-stuffing / brute-force target. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});

/** Public lead submissions — no auth in front of this route, so it's the
 * public site's main spam/abuse surface (docs/SECURITY_PLAN.md, docs/LEAD_GENERATION.md). */
export const publicLeadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions. Please try again later or call/WhatsApp us directly." },
});
