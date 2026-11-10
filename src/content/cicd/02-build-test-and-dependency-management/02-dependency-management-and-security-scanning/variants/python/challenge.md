Evaluate test coverage and dependency security scan metrics against quality gate policies.

### Requirements

Implement `evaluate_test_and_security_summary(summary, policy)`:
- `summary`: Dict `{ "lineCoveragePercent": float, "vulnerabilities": list[dict] }`.
- `policy`: Dict `{ "minLineCoveragePercent": float, "securityThreshold": str }`.

Rules:
- Check line coverage against minimum requirement.
- Check vulnerability severity against policy threshold rank (`low`: 1, `medium`: 2, `high`: 3, `critical`: 4).
- Return `{ "approved": bool, "violations": list[str] }`.
