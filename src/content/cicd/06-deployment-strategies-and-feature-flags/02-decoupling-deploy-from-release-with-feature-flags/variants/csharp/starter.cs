using System.Text;

public record FeatureFlagConfig(string Key, bool Enabled, bool EmergencyKillSwitch, string[] TargetSegments, int RolloutPercent);

public record UserContext(string UserId, string UserSegment);

public record FlagEvaluationResult(bool Active, string Reason);

public static class FeatureFlags
{
    public static int BucketFor(string key, string userId)
    {
        // TODO: hash the UTF-8 bytes of "<key>:<userId>" with FNV-1a (32 bit, offset 0x811C9DC5, prime 0x01000193) and return the hash modulo 100.
        return 0;
    }

    public static FlagEvaluationResult EvaluateFeatureFlag(FeatureFlagConfig flag, UserContext context)
    {
        // TODO: the kill switch wins, then the enabled switch, then the target segments, then the rollout percentage.
        return new FlagEvaluationResult(true, "Feature flag active for user");
    }
}
