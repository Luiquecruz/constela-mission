def evaluate_quality_gate(telemetry: dict, policy: dict) -> dict:
    violations = []

    if telemetry["lineCoveragePercent"] < policy["minLineCoveragePercent"]:
        violations.append(f"Line coverage {telemetry['lineCoveragePercent']}% is below minimum {policy['minLineCoveragePercent']}%")
    if telemetry["criticalVulnerabilities"] > policy["maxCriticalVulnerabilities"]:
        violations.append(f"Critical vulnerabilities {telemetry['criticalVulnerabilities']} exceed maximum {policy['maxCriticalVulnerabilities']}")
    if telemetry["highVulnerabilities"] > policy["maxHighVulnerabilities"]:
        violations.append(f"High vulnerabilities {telemetry['highVulnerabilities']} exceed maximum {policy['maxHighVulnerabilities']}")
    if telemetry["approvedReviews"] < policy["minApprovedReviews"]:
        violations.append(f"Approved reviews {telemetry['approvedReviews']} is below minimum {policy['minApprovedReviews']}")
    if policy["requireAllChecksPassed"] and not telemetry["requiredChecksPassed"]:
        violations.append("Required status checks failed")

    return {"status": "PASSED" if not violations else "BLOCKED", "violations": violations}


def apply_emergency_override(gate: dict, override: dict, policy: dict, now: int) -> dict:
    if gate["status"] == "PASSED":
        return {"success": True, "status": "PASSED", "auditLog": None}
    if not policy["allowOverride"] or not override["justification"].strip():
        return {"success": False, "status": "BLOCKED", "auditLog": None}
    return {
        "success": True,
        "status": "PASSED_WITH_OVERRIDE",
        "auditLog": {
            "author": override["author"],
            "justification": override["justification"],
            "timestamp": now,
            "violations": list(gate["violations"]),
        },
    }
