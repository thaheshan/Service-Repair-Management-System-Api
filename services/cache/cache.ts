import { env } from "@/config/env";
import { getRedis } from "@/config/redis";
import { logger } from "@/config/logger.config";
import { prisma } from "@/db/prisma";
import { DEFAULT_FEATURE_FLAGS, type FeatureFlagsMap } from "@/types/featureFlags.types";

const TTL_SECONDS = 300;

function prefixedKey(suffix: string): string {
  const raw = env.REDIS_PREFIX?.trim() ?? "";
  const p = raw.replace(/^:+|:+$/g, "");
  if (!p) return suffix;
  return `${p}:${suffix}`;
}

function keyForTenant(tenantId: string) {
  return prefixedKey(`ff:tenant:${tenantId}`);
}

function mergeFlags(stored: unknown): FeatureFlagsMap {
  if (!stored || typeof stored !== "object") {
    return { ...DEFAULT_FEATURE_FLAGS };
  }
  return { ...DEFAULT_FEATURE_FLAGS, ...(stored as Record<string, boolean>) };
}

export async function getFlags(tenantId: string): Promise<FeatureFlagsMap> {
  const redis = getRedis();
  const key = keyForTenant(tenantId);

  if (redis) {
    try {
      const cached = await redis.get(key);
      if (cached) {
        return mergeFlags(JSON.parse(cached));
      }
    } catch (e: any) {
      logger.warn(`[getFlags] Redis read failed: ${e?.message ?? e}`);
    }
  }

  const settings = await prisma.shopSettings.upsert({
    where: { tenantId },
    create: { tenantId, featureFlags: {} },
    update: {},
    select: { featureFlags: true },
  });

  const merged = mergeFlags(settings.featureFlags);

  if (redis) {
    try {
      await redis.set(key, JSON.stringify(merged), "EX", TTL_SECONDS);
    } catch (e: any) {
      logger.warn(`[getFlags] Redis write failed: ${e?.message ?? e}`);
    }
  }

  return merged;
}

export async function invalidateFlags(tenantId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(keyForTenant(tenantId));
  } catch (e: any) {
    logger.warn(`[invalidateFlags] Redis del failed: ${e?.message ?? e}`);
  }
}

