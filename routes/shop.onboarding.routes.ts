import { generateShopIds, registerShop, sendVerification } from "@/controllers/shop.onboarding.controller";
import { Router } from "express";

const router = Router();

router.post("/generate-ids", generateShopIds);
router.post("/register", registerShop);

export default router;