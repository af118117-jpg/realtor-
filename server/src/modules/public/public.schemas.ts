import { z } from "zod";

// Mirrors docs/DATA_MODEL.md §7 LeadSubmission, plus two anti-spam fields
// that don't exist in the public payload's "real" data:
//  - `company` is a honeypot: a real visitor never sees or fills this field
//    (hidden via CSS in the form); a bot that fills every field trips it.
//  - `renderedAt` is a client-set timestamp (ms epoch) from when the form
//    was rendered; a submission arriving unrealistically fast is almost
//    certainly scripted, not a person filling out the form.
export const publicLeadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  phone: z.string().trim().min(1, "Phone is required").max(40),
  email: z.string().trim().email().optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional(),
  propertyRef: z.string().trim().max(200).optional(),
  intent: z.string().trim().max(50).optional(),
  budget: z.string().trim().max(100).optional(),
  timeline: z.string().trim().max(100).optional(),
  locality: z.string().trim().max(200).optional(),
  consent: z.boolean().refine((v) => v === true, "Consent is required"),
  // Accepted at validation so a tripped honeypot returns an ordinary success
  // response — rejecting it here would tell a bot exactly which field caught
  // it. The verdict is applied in public.service.ts instead.
  company: z.string().max(200).optional().default(""),
  renderedAt: z.coerce.number().optional(),
});

export const publicPropertyListQuerySchema = z.object({
  type: z.enum(["buy", "rent", "commercial"]).optional(),
  category: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  beds: z.coerce.number().int().nonnegative().optional(),
});
