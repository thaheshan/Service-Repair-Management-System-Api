import { sendVerification } from "@/controllers/shop.onboarding.controller";
import { Router } from "express";

const router = Router();

router.post("/send-verification", sendVerification);

export default router;