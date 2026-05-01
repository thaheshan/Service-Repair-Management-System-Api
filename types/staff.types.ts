/** Roles assignable via Staff API and included in staff list (excludes CUSTOMER). */
export const STAFF_ASSIGNABLE_ROLES = ["ADMIN", "MANAGER", "TECHNICIAN"] as const;

export type StaffAssignableRole = (typeof STAFF_ASSIGNABLE_ROLES)[number];
