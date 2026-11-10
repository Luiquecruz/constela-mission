A quality gate decides whether a release may continue, and an emergency override lets an authorized person push a blocked release through when waiting would cost more than the risk. An override is only acceptable if it leaves a record: who decided, why, when, and which checks were bypassed.

### Requirements

Export `evaluateQualityGate(telemetry, policy)`, where `telemetry` is `{ lineCoveragePercent, criticalVulnerabilities, highVulnerabilities, approvedReviews, requiredChecksPassed }` and `policy` is `{ minLineCoveragePercent, maxCriticalVulnerabilities, maxHighVulnerabilities, minApprovedReviews, requireAllChecksPassed, allowOverride }`. It returns `{ status, violations }`.

Add one violation for each failed check, in this order:

1. Coverage below the minimum: `Line coverage <value>% is below minimum <min>%`.
2. More critical vulnerabilities than allowed: `Critical vulnerabilities <value> exceed maximum <max>`.
3. More high vulnerabilities than allowed: `High vulnerabilities <value> exceed maximum <max>`.
4. Fewer approved reviews than required: `Approved reviews <value> is below minimum <min>`.
5. Status checks are required and not all passed: `Required status checks failed`.

Values exactly at a limit pass. The status is `PASSED` without violations and `BLOCKED` otherwise.

Export `applyEmergencyOverride(gate, override, policy, now)`, where `override` is `{ author, justification }` and `now` is a timestamp in milliseconds. It returns `{ success, status, auditLog }`.

- A gate that already passed needs no override: `{ success: true, status: 'PASSED', auditLog: null }`.
- If the policy does not allow overrides, or the justification is empty or only whitespace: `{ success: false, status: 'BLOCKED', auditLog: null }`.
- Otherwise the release passes with `{ success: true, status: 'PASSED_WITH_OVERRIDE', auditLog }`, where the audit log holds the `author`, the `justification`, the `timestamp` (the `now` that was passed in) and a copy of the gate's `violations`.
