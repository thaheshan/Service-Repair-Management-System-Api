import type { AuthRole } from "@/types/auth.types";

export interface TodayRepairsResponse {
  todayRepairs: number;
  date: string;
}

export interface DashboardAuthContext {
  user_id: string;
  role: AuthRole;
  tenant_id: string;
}