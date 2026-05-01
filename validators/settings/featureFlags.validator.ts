import { KNOWN_FEATURE_FLAGS } from "@/types/featureFlags.types";
import { z } from "zod";

export const featureFlagNameSchema = z
  .string()
  .refine((v) => (KNOWN_FEATURE_FLAGS as readonly string[]).includes(v), {
    message: "Unknown feature flag",
  });

export const patchFeatureFlagSchema = z.object({
  enabled: z.boolean(),
});

export type PatchFeatureFlagInput = z.infer<typeof patchFeatureFlagSchema>;

