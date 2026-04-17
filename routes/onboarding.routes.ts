import { Router } from "express";
import * as onboardingController from "@/controllers/onboarding.controller";

const router = Router();

router.post("/request", onboardingController.requestRegistration);
router.get("/approve/:token", onboardingController.approveRegistration);
router.get("/status/:id", onboardingController.getStatus);
router.post("/create-payment-intent", onboardingController.createPaymentIntent);
router.post("/finalize", onboardingController.finalizeRegistration);

export default router;
