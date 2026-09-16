import type { Role } from "@prisma/client";

/** Privilege rank: a higher number can do everything a lower one can. */
const RANK: Record<Role, number> = {
  EDITOR: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

export const ROLES = Object.keys(RANK) as Role[];

/** True when `role` is `minimum` or more privileged. */
export function hasRoleAtLeast(role: Role | undefined, minimum: Role): boolean {
  return role != null && RANK[role] != null && RANK[role] >= RANK[minimum];
}
