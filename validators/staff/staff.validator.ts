import { STAFF_ASSIGNABLE_ROLES } from "@/types/staff.types";
import { z } from "zod";

const staffRoleSchema = z.enum(STAFF_ASSIGNABLE_ROLES, {
  message: "role must be ADMIN, MANAGER, or TECHNICIAN",
});

export const createStaffSchema = z.object({
  name: z.string().min(1, "name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z
    .string()
    .transform((v) => v.toUpperCase())
    .pipe(staffRoleSchema),
  phone: z.string().optional(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
