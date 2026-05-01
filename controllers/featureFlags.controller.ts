import { logger } from "@/config/logger.config";
import { getFlags } from "@/services/cache/cache";
import { isKnownFlag, updateFeatureFlag } from "@/services/featureFlags/featureFlags.service";
import type { AuthRequest } from "@/types/auth.types";
import { patchFeatureFlagSchema } from "@/validators/settings/featureFlags.validator";
import type { Response } from "express";

export const getFeatureFlagsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const featureFlags = await getFlags(tenantId);
    return res.status(200).json({ featureFlags });
  } catch (error: any) {
    logger.error(`[getFeatureFlags] -> ${error?.message ?? error}`);
    return res.status(500).json({ error: "Unable to retrieve feature flags" });
  }
};

export const patchFeatureFlagHandler = async (req: AuthRequest, res: Response) => {
  const flagName = req.params.flagName as string;
  if (!isKnownFlag(flagName)) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: [{ path: ["flagName"], message: "Unknown feature flag" }],
    });
  }

  const parsed = patchFeatureFlagSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn(`[patchFeatureFlag] -> Validation failed: ${parsed.error.message}`);
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: parsed.error.issues,
    });
  }

  try {
    const featureFlags = await updateFeatureFlag(req.user!.tenantId, req.user!.id, flagName, parsed.data.enabled);
    return res.status(200).json({ featureFlags });
  } catch (error: any) {
    logger.error(`[patchFeatureFlag] -> ${error?.message ?? error}`);
    return res.status(500).json({ error: "Unable to update feature flag" });
  }
};

