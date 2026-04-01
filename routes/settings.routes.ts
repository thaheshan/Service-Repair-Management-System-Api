import { getSettings, updateSettings } from "@/controllers/settings.controller";
import { authorizeRoles } from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.get("/", authorizeRoles("ADMIN", "MANAGER", "TECHNICIAN"), getSettings);
router.put("/", authorizeRoles("ADMIN"), updateSettings);

export default router;
