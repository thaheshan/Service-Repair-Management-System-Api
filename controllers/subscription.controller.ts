import { Request, Response } from "express";
import { prisma } from "@/db/prisma";
import { logger } from "@/config/logger.config";
import { SubscriptionStatus } from "@prisma/client";

export const checkSubscriptionExpiry = async (req: Request, res: Response) => {
  logger.info(`[checkSubscriptionExpiry] -> Running automated expiry check`);

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
      logger.info(`[checkSubscriptionExpiry] -> No expired subscriptions found`);
      return res.status(200).json({ success: true, message: "No expiry processed" });
    }

    logger.info(`[checkSubscriptionExpiry] -> Found ${expiredShops.length} expired shops`);

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

    logger.info(`[checkSubscriptionExpiry] -> Successfully suspended ${result.count} shops`);

    return res.status(200).json({ 
      success: true, 
      message: `${result.count} subscriptions processed`,
      affectedCount: result.count 
    });
  } catch (error: any) {
    logger.error(`[checkSubscriptionExpiry] -> Scheduler failed: ${error.message}`);
    return res.status(500).json({ error: "Scheduler failed" });
  }
};
