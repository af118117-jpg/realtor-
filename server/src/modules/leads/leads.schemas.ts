import { z } from "zod";
import { ACCEPTED_LEAD_STATUSES, CANONICAL_LEAD_STATUSES } from "./leads.status";

/** `status` accepts both vocabularies (see leads.status.ts);
 * `pipelineStatus` accepts only the canonical one. */
export const leadStatusInput = z.enum(ACCEPTED_LEAD_STATUSES);
export const pipelineStatusInput = z.enum(CANONICAL_LEAD_STATUSES);

// `name` is the only hard requirement to save, matching the admin leads page.
export const leadWriteSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  phone: z.string().trim().max(40).default(""),
  // Deliberately not format-validated: staff log whatever contact detail the
  // enquirer gave by phone, and a lead already saved with an imperfect email
  // must stay editable. The public form (public.schemas.ts) does validate.
  email: z.string().trim().max(254).nullish(),
  propertyId: z.string().trim().max(64).nullish(),
  message: z.string().max(5000).nullish(),
  source: z.string().trim().min(1).max(50).optional(),
  status: leadStatusInput.optional(),
  pipelineStatus: pipelineStatusInput.optional(),
  notes: z.string().max(10000).nullish(),
  intent: z.string().trim().max(50).nullish(),
  budget: z.string().trim().max(100).nullish(),
  timeline: z.string().trim().max(100).nullish(),
  locality: z.string().trim().max(200).nullish(),
});

export const leadStatusPatchSchema = z
  .object({ status: leadStatusInput.optional(), pipelineStatus: pipelineStatusInput.optional() })
  .refine((v) => v.status || v.pipelineStatus, { message: "status is required", path: ["status"] });

export const leadListQuerySchema = z.object({
  status: leadStatusInput.optional(),
  pipelineStatus: pipelineStatusInput.optional(),
  propertyId: z.string().max(64).optional(),
  source: z.string().max(50).optional(),
  q: z.string().max(200).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
});
