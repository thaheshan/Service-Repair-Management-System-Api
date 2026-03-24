import {
  getShops,
  getShopById,
  createShop,
  updateShop,
  deleteShop,
  generateShopIds,
  registerShop,
  sendVerification,
} from "@/controllers/shop.controller";
import { Router } from "express";
import { authorizeRoles } from "@/middlewares/auth.middleware";

const router = Router();

router.get("/", authorizeRoles("ADMIN", "MANAGER"), getShops);
router.get("/:id", authorizeRoles("ADMIN", "MANAGER"), getShopById);
router.post("/", authorizeRoles("ADMIN", "MANAGER"), createShop);
router.patch("/:id", authorizeRoles("ADMIN", "MANAGER"), updateShop);
router.delete("/:id", authorizeRoles("ADMIN"), deleteShop);

// Onboarding
router.post("/generate-ids", generateShopIds);
router.post("/register", registerShop);
router.post("/send-verification", sendVerification);

export default router;