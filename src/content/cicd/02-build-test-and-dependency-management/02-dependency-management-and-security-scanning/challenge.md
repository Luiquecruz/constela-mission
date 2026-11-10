Evaluate test coverage and dependency security scan metrics against quality gate policies.

### Requirements

Implement `evaluateTestAndSecuritySummary(summary, policy)`:
- `summary`: Object containing `{ lineCoveragePercent: number, vulnerabilities: Array<{ id: string, package: string, severity: string }> }`.
- `policy`: Object containing `{ minLineCoveragePercent: number, securityThreshold: string }`.

Severity ranks: `low` (1), `medium` (2), `high` (3), `critical` (4).

Rules:
- If `summary.lineCoveragePercent < policy.minLineCoveragePercent`, add violation: `"Line coverage <coverage>% is below minimum required <min>%"`.
- For each vulnerability whose severity rank is greater than or equal to `policy.securityThreshold` rank, add violation: `"Vulnerability <id> (<severity>) in package <package> exceeds allowed threshold <threshold>"`.
- Return `{ approved: boolean, violations: string[] }`. `approved` is `true` if `violations` is empty.
