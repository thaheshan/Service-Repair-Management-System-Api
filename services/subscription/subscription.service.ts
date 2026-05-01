import { prisma } from "@/db/prisma";
import { logger } from "@/config/logger.config";
import { SubscriptionStatus } from "@prisma/client";

/**
 * Service to handle subscription-related operations
 */
export const checkAndSuspendExpiredSubscriptions = async () => {
  logger.info(`[checkAndSuspendExpiredSubscriptions] -> Running automated expiry check`);

  try {
    const now = new Date();

    // Find shops with active subscriptions that have passed their end date
    const expiredShops = await prisma.shop.findMany({
      where: {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionEndDate: {
          lt: now,
        },
      },
    });

    if (expiredShops.length === 0) {
      logger.info(`[checkAndSuspendExpiredSubscriptions] -> No expired subscriptions found`);
      return { success: true, count: 0 };
    }

    logger.info(`[checkAndSuspendExpiredSubscriptions] -> Found ${expiredShops.length} expired shops`);

    // Update them to SUSPENDED
    const result = await prisma.shop.updateMany({
      where: {
        id: {
          in: expiredShops.map((s) => s.id),
        },
      },
      data: {
        subscriptionStatus: SubscriptionStatus.SUSPENDED,
      },
    });

    logger.info(`[checkAndSuspendExpiredSubscriptions] -> Successfully suspended ${result.count} shops`);
    return { success: true, count: result.count };
  } catch (error: any) {
    logger.error(`[checkAndSuspendExpiredSubscriptions] -> Failed to process expiries: ${error.message}`);
    throw error;
  }
};
