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
  let hash = 0x811c9dc5;
  for (const character of `${key}:${userId}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash % 100;
}

export function evaluateFeatureFlag(flag: FeatureFlagConfig, context: UserContext): FlagEvaluationResult {
  if (flag.emergencyKillSwitch) {
    return { active: false, reason: 'Emergency kill switch is active' };
  }
  if (!flag.enabled) {
    return { active: false, reason: 'Feature flag is disabled' };
  }
  if (flag.targetSegments.length > 0 && !flag.targetSegments.includes(context.userSegment)) {
    return { active: false, reason: 'User segment not targeted' };
  }
  if (bucketFor(flag.key, context.userId) >= flag.rolloutPercent) {
    return { active: false, reason: 'User outside rollout percentage' };
  }
  return { active: true, reason: 'Feature flag active for user' };
}
