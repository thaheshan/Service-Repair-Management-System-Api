import { getFeatureFlagsHandler, patchFeatureFlagHandler } from "@/controllers/featureFlags.controller";
import { getSettings, updateSettings } from "@/controllers/settings.controller";
import { authorizeRoles } from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.get("/", authorizeRoles("ADMIN", "MANAGER", "TECHNICIAN"), getSettings);
router.put("/", authorizeRoles("ADMIN"), updateSettings);
router.get("/features", authorizeRoles("ADMIN"), getFeatureFlagsHandler);
router.patch("/features/:flagName", authorizeRoles("ADMIN"), patchFeatureFlagHandler);

export default router;
