import { z } from "zod";

export const updateSettingsSchema = z
  .object({
    shopName: z.string().min(1, "shopName cannot be empty").optional(),
    currency: z
      .string()
      .min(1, "currency is required when provided")
      .max(16, "currency code is too long")
      .optional(),
    taxPercentage: z
      .number()
      .int("taxPercentage must be a whole number")
      .min(0, "taxPercentage must be at least 0")
      .max(100, "taxPercentage cannot exceed 100")
      .optional(),
    notificationsEnabled: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "At least one field is required",
    path: ["body"],
  });

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
