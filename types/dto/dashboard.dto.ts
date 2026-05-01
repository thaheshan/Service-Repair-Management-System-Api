import { z } from "zod";

export const dashboardAuthSchema = z.object({
  user_id: z.string(),
  role: z.enum(["ADMIN", "MANAGER", "TECHNICIAN"]), // Removed CUSTOMER
  tenant_id: z.string(),
  shop_id: z.string().optional(),
});

export interface DashboardAuthContext {
  user_id: string;
  role: "ADMIN" | "MANAGER" | "TECHNICIAN";
  tenant_id: string;
  shop_id?: string;
}

export interface TodayRepairsResponse {
  todayRepairs: number;
  date: string;
}