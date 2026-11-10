Evaluate test coverage and dependency security scan metrics against quality gate policies.

### Requirements

Implement `EvaluateTestAndSecuritySummary(summary, policy)`:
- `summary`: `TestSecuritySummary(double LineCoveragePercent, VulnerabilityItem[] Vulnerabilities)`, where a vulnerability has an id, a package and a severity.
- `policy`: `SecurityCoveragePolicy(double MinLineCoveragePercent, string SecurityThreshold)`.

Severity ranks: `low` (1), `medium` (2), `high` (3), `critical` (4).

Rules:
- If `LineCoveragePercent` is below `MinLineCoveragePercent`, add the violation `"Line coverage <coverage>% is below minimum required <min>%"`. A coverage equal to the minimum passes.
- For each vulnerability whose severity rank is greater than or equal to the rank of `SecurityThreshold`, add the violation `"Vulnerability <id> (<severity>) in package <package> exceeds allowed threshold <threshold>"`. The comparison is inclusive: a `high` vulnerability blocks a `high` threshold, and a `high` vulnerability does not block a `critical` threshold.
- List the coverage violation first and then the vulnerabilities in the order they appear in the input.
- Return `PolicyEvaluationResult(bool Approved, string[] Violations)`. `Approved` is `true` when `Violations` is empty.
