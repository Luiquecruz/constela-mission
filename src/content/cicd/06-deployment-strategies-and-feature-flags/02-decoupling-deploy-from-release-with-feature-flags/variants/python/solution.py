def bucket_for(key: str, user_id: str) -> int:
    value = 0x811C9DC5
    for byte in f"{key}:{user_id}".encode("utf-8"):
        value ^= byte
        value = (value * 0x01000193) & 0xFFFFFFFF
    return value % 100


def evaluate_feature_flag(flag: dict, context: dict) -> dict:
    if flag["emergencyKillSwitch"]:
        return {"active": False, "reason": "Emergency kill switch is active"}
    if not flag["enabled"]:
        return {"active": False, "reason": "Feature flag is disabled"}
    if flag["targetSegments"] and context["userSegment"] not in flag["targetSegments"]:
        return {"active": False, "reason": "User segment not targeted"}
    if bucket_for(flag["key"], context["userId"]) >= flag["rolloutPercent"]:
        return {"active": False, "reason": "User outside rollout percentage"}
    return {"active": True, "reason": "Feature flag active for user"}
