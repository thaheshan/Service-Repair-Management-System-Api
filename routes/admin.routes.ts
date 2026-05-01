import { Router } from "express";
import * as adminController from "@/controllers/admin.controller";

const router = Router();

router.get("/stats", adminController.getStats);
router.get("/shops", adminController.listShops);

export default router;
