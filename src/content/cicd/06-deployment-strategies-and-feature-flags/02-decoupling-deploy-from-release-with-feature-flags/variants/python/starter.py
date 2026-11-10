def bucket_for(key: str, user_id: str) -> int:
    # TODO: hash the text "<key>:<user_id>" with FNV-1a (32 bit, offset 0x811C9DC5, prime 0x01000193) and return the hash modulo 100.
    return 0


def evaluate_feature_flag(flag: dict, context: dict) -> dict:
    # TODO: the kill switch wins, then the enabled switch, then the target segments, then the rollout percentage.
    return {"active": True, "reason": "Feature flag active for user"}
