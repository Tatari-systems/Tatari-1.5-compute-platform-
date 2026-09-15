export const INTERNAL_ROLES = ["reviewer", "approver", "admin"] as const;

export type InternalRole = (typeof INTERNAL_ROLES)[number];

export function isInternalRole(value: string): value is InternalRole {
  return (INTERNAL_ROLES as readonly string[]).includes(value);
}

export function canReview(role: string): boolean {
  return isInternalRole(role);
}

export function canApprove(role: string): boolean {
  return role === "approver" || role === "admin";
}

export function canAdminister(role: string): boolean {
  return role === "admin";
}
