def flag(**overrides):
    result = {"key": "checkout-v2", "enabled": True, "emergencyKillSwitch": False, "targetSegments": [], "rolloutPercent": 100}
    result.update(overrides)
    return result


def user(user_id, segment="beta"):
    return {"userId": user_id, "userSegment": segment}


@test("gives every user a stable bucket from 0 to 99 that depends on the flag key")
def _():
    assert mod.bucket_for("checkout-v2", "alice") == 34
    assert mod.bucket_for("checkout-v2", "bob") == 89
    assert mod.bucket_for("checkout-v2", "dave") == 0
    assert mod.bucket_for("search-ui", "alice") == 44


@test("lets the kill switch win over every other setting")
def _():
    result = mod.evaluate_feature_flag(flag(emergencyKillSwitch=True, enabled=True, rolloutPercent=100, targetSegments=["beta"]), user("alice"))
    assert result == {"active": False, "reason": "Emergency kill switch is active"}


@test("keeps a disabled flag off for everyone")
def _():
    assert mod.evaluate_feature_flag(flag(enabled=False), user("alice")) == {"active": False, "reason": "Feature flag is disabled"}


@test("targets only the listed segments and treats an empty list as everyone")
def _():
    targeted = flag(targetSegments=["staff"])
    assert mod.evaluate_feature_flag(targeted, user("alice", "beta")) == {"active": False, "reason": "User segment not targeted"}
    assert mod.evaluate_feature_flag(targeted, user("alice", "staff"))["active"] is True
    assert mod.evaluate_feature_flag(flag(), user("alice", "anything"))["active"] is True


# beginner mistake: drawing a random number on every evaluation so the same user flickers in and out
@test("decides the rollout from the bucket, so the same user always gets the same answer")
def _():
    assert mod.evaluate_feature_flag(flag(rolloutPercent=35), user("alice"))["active"] is True
    assert mod.evaluate_feature_flag(flag(rolloutPercent=34), user("alice")) == {"active": False, "reason": "User outside rollout percentage"}
    assert mod.evaluate_feature_flag(flag(rolloutPercent=0), user("dave"))["active"] is False
    assert mod.evaluate_feature_flag(flag(rolloutPercent=1), user("dave"))["active"] is True
    for _attempt in range(5):
        assert mod.evaluate_feature_flag(flag(rolloutPercent=50), user("bob"))["active"] is False


@test("keeps a user in the rollout when the percentage grows")
def _():
    users = ["alice", "bob", "carol", "dave", "erin", "judy"]
    previous = set()
    for percent in [0, 10, 25, 50, 75, 100]:
        current = {name for name in users if mod.evaluate_feature_flag(flag(rolloutPercent=percent), user(name))["active"]}
        assert previous <= current
        previous = current
    assert len(previous) == len(users)
