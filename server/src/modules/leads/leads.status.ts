import type { LeadStatus } from "@prisma/client";

/*
 * Lead status vocabularies.
 *
 * Canonical (database):   NEW  CONTACTED  QUALIFIED   CLOSED  LOST
 * Legacy (API v1 panel):  NEW  CONTACTED  INTERESTED  CLOSED  (+ FOLLOW_UP)
 *
 * The existing admin panel only knows the legacy list, so API v1 returns
 * `status` in that vocabulary and the canonical value as `pipelineStatus`.
 * Input accepts either. The mapping is:
 *
 *   FOLLOW_UP  → CONTACTED   (a follow-up is a lead already contacted)
 *   INTERESTED ↔ QUALIFIED
 *   LOST       → shown to the legacy panel as CLOSED
 */

export const CANONICAL_LEAD_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "CLOSED", "LOST"] as const;
export const LEGACY_LEAD_STATUSES = ["NEW", "CONTACTED", "FOLLOW_UP", "INTERESTED", "CLOSED"] as const;
export const ACCEPTED_LEAD_STATUSES = [...new Set([...CANONICAL_LEAD_STATUSES, ...LEGACY_LEAD_STATUSES])] as [
  string,
  ...string[],
];

export type LegacyLeadStatus = (typeof LEGACY_LEAD_STATUSES)[number];

/** Any accepted input value → the canonical status stored in the database. */
export function toCanonicalLeadStatus(value: string): LeadStatus {
  if (value === "FOLLOW_UP") return "CONTACTED";
  if (value === "INTERESTED") return "QUALIFIED";
  return value as LeadStatus;
}

/** Canonical status → what the legacy admin panel can display. */
export function toLegacyLeadStatus(status: LeadStatus): LegacyLeadStatus {
  if (status === "QUALIFIED") return "INTERESTED";
  if (status === "LOST") return "CLOSED";
  return status;
}

/**
 * Resolves the status to store on update without letting the legacy panel's
 * narrower vocabulary destroy information. A legacy client re-submits the
 * value it was shown; if that is just the legacy projection of the current
 * status (e.g. it shows CLOSED for a LOST lead), the current status is kept.
 * Clients that speak the canonical vocabulary send `pipelineStatus`, which is
 * always applied as-is.
 */
export function resolveLeadStatusUpdate(
  current: LeadStatus,
  input: { status?: string; pipelineStatus?: LeadStatus },
): LeadStatus {
  if (input.pipelineStatus) return input.pipelineStatus;
  if (!input.status) return current;
  if (input.status === toLegacyLeadStatus(current)) return current;
  return toCanonicalLeadStatus(input.status);
}
