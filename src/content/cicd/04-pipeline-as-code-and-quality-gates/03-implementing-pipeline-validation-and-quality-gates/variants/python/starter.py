def evaluate_quality_gate(telemetry: dict, policy: dict) -> dict:
    violations = []
    # TODO: add one violation per failed check, in this order: coverage, critical vulnerabilities, high vulnerabilities, reviews, status checks.
    return {"status": "PASSED", "violations": violations}


def apply_emergency_override(gate: dict, override: dict, policy: dict, now: int) -> dict:
    # TODO: a passed gate needs no override; refuse an override that the policy forbids or that has a blank justification.
    # TODO: an accepted override passes with an audit log that records who, why, when and which violations were bypassed.
    return {"success": False, "status": "BLOCKED", "auditLog": None}
