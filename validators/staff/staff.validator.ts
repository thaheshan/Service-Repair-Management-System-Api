import { z } from "zod";

const staffRoleSchema = z.enum(["TECHNICIAN", "MANAGER"]);

export const validateShopIdSchema = z.object({
  shop_id: z.string().min(1, "shop_id is required"),
});

export const registerStaffSchema = z.object({
  full_name: z.string().min(1, "full_name is required"),
  phone: z.string().min(8, "phone is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  shop_id: z.string().min(1, "shop_id is required"),
  role: z
    .string()
    .transform((value) => value.trim().toUpperCase())
    .pipe(staffRoleSchema),
});
