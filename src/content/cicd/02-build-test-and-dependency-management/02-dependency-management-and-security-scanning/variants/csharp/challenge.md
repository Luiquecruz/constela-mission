Evaluate test coverage and dependency security scan metrics against quality gate policies.

### Requirements

Implement `EvaluateTestAndSecuritySummary(summary, policy)`:
- `summary`: `TestSecuritySummary(double LineCoveragePercent, VulnerabilityItem[] Vulnerabilities)`.
- `policy`: `SecurityCoveragePolicy(double MinLineCoveragePercent, string SecurityThreshold)`.

Rules:
- Check coverage requirement.
- Compare vulnerability severity against policy threshold rank (`low`: 1, `medium`: 2, `high`: 3, `critical`: 4).
- Return `PolicyEvaluationResult(bool Approved, string[] Violations)`.
