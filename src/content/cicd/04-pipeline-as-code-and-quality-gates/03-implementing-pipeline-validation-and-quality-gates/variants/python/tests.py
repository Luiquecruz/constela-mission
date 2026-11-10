POLICY = {"minLineCoveragePercent": 80, "maxCriticalVulnerabilities": 0, "maxHighVulnerabilities": 2, "minApprovedReviews": 2, "requireAllChecksPassed": True, "allowOverride": True}
NOW = 1_700_000_000_000


def telemetry(**overrides):
    result = {"lineCoveragePercent": 90, "criticalVulnerabilities": 0, "highVulnerabilities": 1, "approvedReviews": 2, "requiredChecksPassed": True}
    result.update(overrides)
    return result


@test("passes a release that meets every threshold, including values exactly at the limits")
def _():
    assert mod.evaluate_quality_gate(telemetry(), POLICY) == {"status": "PASSED", "violations": []}
    assert mod.evaluate_quality_gate(telemetry(lineCoveragePercent=80, highVulnerabilities=2), POLICY)["status"] == "PASSED"


@test("blocks a release and lists every violation in check order")
def _():
    bad = telemetry(lineCoveragePercent=70, criticalVulnerabilities=2, highVulnerabilities=5, approvedReviews=1, requiredChecksPassed=False)
    assert mod.evaluate_quality_gate(bad, POLICY) == {
        "status": "BLOCKED",
        "violations": [
            "Line coverage 70% is below minimum 80%",
            "Critical vulnerabilities 2 exceed maximum 0",
            "High vulnerabilities 5 exceed maximum 2",
            "Approved reviews 1 is below minimum 2",
            "Required status checks failed",
        ],
    }


@test("ignores failed status checks when the policy does not require them")
def _():
    relaxed = {**POLICY, "requireAllChecksPassed": False}
    assert mod.evaluate_quality_gate(telemetry(requiredChecksPassed=False), relaxed)["status"] == "PASSED"


@test("needs no override for a gate that already passed")
def _():
    passed = mod.evaluate_quality_gate(telemetry(), POLICY)
    assert mod.apply_emergency_override(passed, {"author": "ana", "justification": "urgent"}, POLICY, NOW) == {"success": True, "status": "PASSED", "auditLog": None}


# beginner mistake: accepting an override whose justification is only whitespace
@test("refuses an override without a real justification or when the policy forbids it")
def _():
    blocked = mod.evaluate_quality_gate(telemetry(approvedReviews=0), POLICY)
    assert mod.apply_emergency_override(blocked, {"author": "ana", "justification": "   "}, POLICY, NOW) == {"success": False, "status": "BLOCKED", "auditLog": None}
    forbidden = {**POLICY, "allowOverride": False}
    assert mod.apply_emergency_override(blocked, {"author": "ana", "justification": "incident 42"}, forbidden, NOW) == {"success": False, "status": "BLOCKED", "auditLog": None}


@test("records who, why, when and what was bypassed when an override is accepted")
def _():
    blocked = mod.evaluate_quality_gate(telemetry(approvedReviews=1, requiredChecksPassed=False), POLICY)
    result = mod.apply_emergency_override(blocked, {"author": "ana", "justification": "incident 42: hotfix for checkout"}, POLICY, NOW)
    assert result == {
        "success": True,
        "status": "PASSED_WITH_OVERRIDE",
        "auditLog": {
            "author": "ana",
            "justification": "incident 42: hotfix for checkout",
            "timestamp": NOW,
            "violations": ["Approved reviews 1 is below minimum 2", "Required status checks failed"],
        },
    }
    assert result["auditLog"]["violations"] is not blocked["violations"]
