import { Router } from "express";
import * as onboardingController from "@/controllers/onboarding.controller";

const router = Router();

router.post("/request", onboardingController.requestRegistration);
router.post("/approve/:token", onboardingController.approveRegistration);
router.get("/status/:id", onboardingController.getStatus);
router.post("/resend/:id", onboardingController.resendAdminNotification);
router.post("/create-payment-intent", onboardingController.createPaymentIntent);
router.post("/finalize", onboardingController.finalizeRegistration);
router.post("/staff-request", onboardingController.registerStaff);
export default router;
