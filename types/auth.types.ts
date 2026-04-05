import type { Request } from "express";

export const AUTH_ROLES = ["ADMIN", "MANAGER", "TECHNICIAN", "CUSTOMER"] as const;
export type AuthRole = (typeof AUTH_ROLES)[number];

export type AuthUser = {
  id: string;
  email: string;
  role: AuthRole;
  tenantId: string;
  shopId: string | null;
};

export type AuthRequest = Request & { user?: AuthUser };
