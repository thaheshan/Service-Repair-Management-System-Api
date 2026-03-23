export interface TodayRepairsResponse {
  todayRepairs: number;
  date: string;
}

export interface DashboardAuthContext {
  user_id: string;
  role: "ADMIN" | "MANAGER" | "TECHNICIAN" | "CUSTOMER";
  tenant_id: string;
}