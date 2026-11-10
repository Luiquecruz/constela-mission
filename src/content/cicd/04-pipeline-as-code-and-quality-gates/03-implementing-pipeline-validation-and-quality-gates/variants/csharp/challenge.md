A quality gate decides whether a release may continue, and an emergency override lets an authorized person push a blocked release through when waiting would cost more than the risk. An override is only acceptable if it leaves a record: who decided, why, when, and which checks were bypassed.

### Requirements

In the static class `QualityGate`, write `GateResult EvaluateQualityGate(PipelineTelemetry telemetry, QualityGatePolicy policy)`, using the records declared in the file (`PipelineTelemetry`, `QualityGatePolicy`, `GateResult(Status, Violations)`).

Add one violation for each failed check, in this order:

1. Coverage below the minimum: `Line coverage <value>% is below minimum <min>%`.
2. More critical vulnerabilities than allowed: `Critical vulnerabilities <value> exceed maximum <max>`.
3. More high vulnerabilities than allowed: `High vulnerabilities <value> exceed maximum <max>`.
4. Fewer approved reviews than required: `Approved reviews <value> is below minimum <min>`.
5. Status checks are required and not all passed: `Required status checks failed`.

Values exactly at a limit pass. The status is `PASSED` without violations and `BLOCKED` otherwise.

Also write `OverrideResult ApplyEmergencyOverride(GateResult gate, OverrideRequest request, QualityGatePolicy policy, long now)`, where `OverrideRequest(Author, Justification)` and `now` is a timestamp in milliseconds. It returns `OverrideResult(Success, Status, AuditLog)` with `AuditLog(Author, Justification, Timestamp, Violations)`.

- A gate that already passed needs no override: `OverrideResult(true, "PASSED", null)`.
- If the policy does not allow overrides, or the justification is empty or only whitespace: `OverrideResult(false, "BLOCKED", null)`.
- Otherwise the release passes with `OverrideResult(true, "PASSED_WITH_OVERRIDE", auditLog)`, where the audit log holds the `author`, the `justification`, the `timestamp` (the `now` that was passed in) and a copy of the gate's `violations`.
