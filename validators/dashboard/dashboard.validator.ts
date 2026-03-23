import { z } from "zod";

export const dashboardAuthSchema = z.object({
  user_id: z.string().min(1, "user_id is required"),
  role: z.enum(["ADMIN", "MANAGER", "TECHNICIAN", "CUSTOMER"]),
  tenant_id: z.string().min(1, "tenant_id is required"),
});