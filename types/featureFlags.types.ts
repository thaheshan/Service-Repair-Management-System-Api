export const KNOWN_FEATURE_FLAGS = [
  "inventory_management",
  "sms_notifications",
  "advanced_reports",
  "pos_module",
] as const;

export type KnownFeatureFlag = (typeof KNOWN_FEATURE_FLAGS)[number];

export type FeatureFlagsMap = Record<KnownFeatureFlag, boolean> & Record<string, boolean>;

export const DEFAULT_FEATURE_FLAGS: Record<KnownFeatureFlag, boolean> = {
  inventory_management: false,
  sms_notifications: false,
  advanced_reports: false,
  pos_module: false,
};

