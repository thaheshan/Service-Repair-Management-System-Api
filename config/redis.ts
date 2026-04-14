import { env } from "@/config/env";
import { logger } from "@/config/logger.config";
import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (redis) return redis;

  const url = env.REDIS_URL?.trim();
  if (url) {
    redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      enableOfflineQueue: true,
    });
  } else {
    const password = env.REDIS_PASSWORD?.trim();
    redis = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      username: env.REDIS_USERNAME?.trim() || undefined,
      password: password || undefined,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: true,
    });
  }

  redis.on("connect", () => logger.info("[redis] connected"));
  redis.on("error", (err) => logger.warn(`[redis] error: ${String(err?.message ?? err)}`));

  return redis;
}

