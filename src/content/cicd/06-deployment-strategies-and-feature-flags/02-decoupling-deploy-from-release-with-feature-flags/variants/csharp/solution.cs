using System.Text;

public record FeatureFlagConfig(string Key, bool Enabled, bool EmergencyKillSwitch, string[] TargetSegments, int RolloutPercent);

public record UserContext(string UserId, string UserSegment);

public record FlagEvaluationResult(bool Active, string Reason);

public static class FeatureFlags
{
    public static int BucketFor(string key, string userId)
    {
        uint hash = 0x811C9DC5;
        foreach (var value in Encoding.UTF8.GetBytes($"{key}:{userId}"))
        {
            hash ^= value;
            hash *= 0x01000193;
        }
        return (int)(hash % 100);
    }

    public static FlagEvaluationResult EvaluateFeatureFlag(FeatureFlagConfig flag, UserContext context)
    {
        if (flag.EmergencyKillSwitch)
        {
            return new FlagEvaluationResult(false, "Emergency kill switch is active");
        }
        if (!flag.Enabled)
        {
            return new FlagEvaluationResult(false, "Feature flag is disabled");
        }
        if (flag.TargetSegments.Length > 0 && !flag.TargetSegments.Contains(context.UserSegment))
        {
            return new FlagEvaluationResult(false, "User segment not targeted");
        }
        if (BucketFor(flag.Key, context.UserId) >= flag.RolloutPercent)
        {
            return new FlagEvaluationResult(false, "User outside rollout percentage");
        }
        return new FlagEvaluationResult(true, "Feature flag active for user");
    }
}
