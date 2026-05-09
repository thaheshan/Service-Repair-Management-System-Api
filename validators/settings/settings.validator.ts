import { z } from "zod";

export const updateSettingsSchema = z
  .object({
    shopName: z.string().min(1, "shopName cannot be empty").optional(),
    currency: z.string().min(1).optional(),
    timezone: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    website: z.string().optional().or(z.literal("")),
    taxNumber: z.string().optional().or(z.literal("")),
    notificationPreferences: z.record(z.string(), z.any()).optional(),
    taxPercentage: z.number().min(0).max(100).optional(),
    notificationsEnabled: z.boolean().optional(),
    appearance: z.record(z.string(), z.any()).optional(),
    securityRules: z.record(z.string(), z.any()).optional(),
    language: z.string().optional(),
    logoUrl: z.string().url().optional().or(z.literal("")),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
