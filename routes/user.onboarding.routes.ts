import { sendVerification, verifyEmail } from "@/controllers/shop.onboarding.controller";
import { Router } from "express";

const router = Router();
router.get("/verify-email", verifyEmail);
router.post("/send-verification", sendVerification);

export default router;