import cron from "node-cron";
import { logger } from "@/config/logger.config";
import * as subscriptionService from "@/services/subscription/subscription.service";

/**
 * Initialize subscription-related cron jobs
 */
export const initSubscriptionJobs = () => {
  logger.info("[SubscriptionJob] -> Initializing subscription jobs");

  // Run every day at midnight
  cron.schedule("0 0 * * *", async () => {
    logger.info("[SubscriptionJob] -> Running daily subscription expiry check");
    try {
      const result = await subscriptionService.checkAndSuspendExpiredSubscriptions();
      logger.info(`[SubscriptionJob] -> Expiry check completed. Suspended ${result.count} shops.`);
    } catch (error: any) {
      logger.error(`[SubscriptionJob] -> Expiry check failed: ${error.message}`);
    }
  });

  logger.info("[SubscriptionJob] -> Daily expiry check job scheduled (0 0 * * *)");
};
