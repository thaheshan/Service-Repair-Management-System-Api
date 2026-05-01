import { prisma } from "@/db/prisma";
import { DEFAULT_FEATURE_FLAGS, KNOWN_FEATURE_FLAGS, type FeatureFlagsMap, type KnownFeatureFlag } from "@/types/featureFlags.types";
import { invalidateFlags } from "@/services/cache/cache";

function mergeFlags(stored: unknown): FeatureFlagsMap {
  if (!stored || typeof stored !== "object") return { ...DEFAULT_FEATURE_FLAGS };
  return { ...DEFAULT_FEATURE_FLAGS, ...(stored as Record<string, boolean>) };
}

export function isKnownFlag(flagName: string): flagName is KnownFeatureFlag {
  return (KNOWN_FEATURE_FLAGS as readonly string[]).includes(flagName);
}

export async function getFeatureFlags(tenantId: string): Promise<FeatureFlagsMap> {
  const row = await prisma.shopSettings.upsert({
    where: { tenantId },
    create: { tenantId, featureFlags: {} },
    update: {},
    select: { featureFlags: true },
  });
  return mergeFlags(row.featureFlags);
}

export async function updateFeatureFlag(
  tenantId: string,
  adminId: string,
  flagName: KnownFeatureFlag,
  enabled: boolean,
): Promise<FeatureFlagsMap> {
  const current = await prisma.shopSettings.upsert({
    where: { tenantId },
    create: { tenantId, featureFlags: {} },
    update: {},
    select: { featureFlags: true },
  });
  const currentMerged = mergeFlags(current.featureFlags);
  const oldVal = Boolean(currentMerged[flagName]);

  // Atomic JSONB update; safe because we guarantee a row exists via upsert above.
  const updated = await prisma.shopSettings.update({
    where: { tenantId },
    data: {
      featureFlags: {
        ...(currentMerged as Record<string, boolean>),
        [flagName]: enabled,
      },
    },
    select: { featureFlags: true },
  });

  const newMerged = mergeFlags(updated.featureFlags);

  await prisma.auditLog.create({
    data: {
      tenantId,
      adminId,
      flagName,
      oldVal,
      newVal: Boolean(newMerged[flagName]),
    },
  });

  await invalidateFlags(tenantId);

  return newMerged;
}

