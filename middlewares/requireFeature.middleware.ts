import { getFlags } from "@/services/cache/cache";
import type { AuthRequest } from "@/types/auth.types";
import type { NextFunction, Response } from "express";
import type { KnownFeatureFlag } from "@/types/featureFlags.types";

export function requireFeature(flagName: KnownFeatureFlag) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const flags = await getFlags(tenantId);
    if (flags[flagName] !== true) {
      return res.status(403).json({ error: "FEATURE_NOT_ENABLED" });
    }

    return next();
  };
}

