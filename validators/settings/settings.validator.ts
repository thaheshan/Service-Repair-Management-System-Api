import { z } from "zod";

export const updateSettingsSchema = z
  .object({
    shopName: z.string().min(1, "shopName cannot be empty").optional(),
    currency: z.string().min(1).optional(),
    timezone: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    website: z.string().optional(),
    taxNumber: z.string().optional(),
    notificationPreferences: z.record(z.string(), z.any()).optional(),
    taxPercentage: z.number().min(0).max(100).optional(),
    notificationsEnabled: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
