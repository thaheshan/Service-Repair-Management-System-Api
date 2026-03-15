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

const router = Router();

// CRUD
router.get("/", getShops);
router.get("/:id", getShopById);
router.post("/", createShop);
router.patch("/:id", updateShop);
router.delete("/:id", deleteShop);

// Onboarding
router.post("/generate-ids", generateShopIds);
router.post("/register", registerShop);
router.post("/send-verification", sendVerification);

export default router;