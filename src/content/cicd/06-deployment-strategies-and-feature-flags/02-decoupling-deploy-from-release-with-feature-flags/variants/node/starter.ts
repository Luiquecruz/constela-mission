export interface FeatureFlagConfig {
  key: string;
  enabled: boolean;
  emergencyKillSwitch: boolean;
  targetSegments: string[];
  rolloutPercent: number;
}

export interface UserContext {
  userId: string;
  userSegment: string;
}

export interface FlagEvaluationResult {
  active: boolean;
  reason: string;
}

export function bucketFor(key: string, userId: string): number {
  // TODO: hash the text "<key>:<userId>" with FNV-1a (32 bit, offset 0x811c9dc5, prime 0x01000193) and return the hash modulo 100.
  return 0;
}

export function evaluateFeatureFlag(flag: FeatureFlagConfig, context: UserContext): FlagEvaluationResult {
  // TODO: the kill switch wins, then the enabled switch, then the target segments, then the rollout percentage.
  return { active: true, reason: 'Feature flag active for user' };
}
