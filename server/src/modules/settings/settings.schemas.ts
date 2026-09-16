import { z } from "zod";

// Deliberately loose (passthrough) — this mirrors the existing admin
// settings-page.js contract, which already owns validation/shape on the
// client for a single-admin internal tool. The server's job here is the
// deep-merge semantics (see settings.service.ts), not re-validating every
// nested business-info field.
export const settingsPatchSchema = z.record(z.string(), z.unknown());
