import { Request, Response } from "express";
import * as registrationService from "@/services/registration/registration.service";
import * as stripeService from "@/services/stripe/stripe.service";
import { logger } from "@/config/logger.config";

export const requestRegistration = async (req: Request, res: Response) => {
  try {
    const result = await registrationService.createRegistrationRequest(req.body);
    return res.status(201).json(result);
  } catch (error: any) {
    logger.error(`[OnboardingController] Error: ${error.message}`);
    return res.status(error.status || 500).json({ message: error.message || "Internal server error" });
  }
};

export const approveRegistration = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    await registrationService.approveRegistrationRequest(token as string);
    
    // Redirect to a simple success page or frontend
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.redirect(`${frontendUrl}/registration/approved-success`);
  } catch (error: any) {
    logger.error(`[OnboardingController] Error approving: ${error.message}`);
    return res.status(error.status || 500).json({ message: error.message || "Internal server error" });
  }
};

export const getStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await registrationService.getRegistrationRequestStatus(id as string);
    return res.json(result);
  } catch (error: any) {
    return res.status(error.status || 500).json({ message: error.message || "Internal server error" });
  }
};

export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.body;
    const request = await registrationService.getRegistrationRequestStatus(requestId);
    
    if (request.status !== "APPROVED") {
      return res.status(400).json({ message: "Registration not yet approved by admin" });
    }

    const fee = parseInt(process.env.REGISTRATION_FEE_LKR || "25");
    const intent = await stripeService.createPaymentIntent(fee, "lkr", { requestId });
    
    return res.json(intent);
  } catch (error: any) {
    logger.error(`[OnboardingController] Error creating intent: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

export const finalizeRegistration = async (req: Request, res: Response) => {
  try {
    const { requestId, paymentIntentId } = req.body;
    const result = await registrationService.finalizeRegistration(requestId, paymentIntentId);
    return res.status(200).json({ message: "Registration successful", result });
  } catch (error: any) {
    logger.error(`[OnboardingController] Error finalizing: ${error.message}`);
    return res.status(error.status || 500).json({ message: error.message || "Internal server error" });
  }
};
