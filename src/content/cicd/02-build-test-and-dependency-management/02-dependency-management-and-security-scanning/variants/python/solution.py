SEVERITY_RANK = {"low": 1, "medium": 2, "high": 3, "critical": 4}

def evaluate_test_and_security_summary(summary: dict, policy: dict) -> dict:
    violations = []
    coverage = summary.get("lineCoveragePercent", 0.0)
    min_coverage = policy.get("minLineCoveragePercent", 0.0)

    if coverage < min_coverage:
        violations.append(
            f"Line coverage {coverage}% is below minimum required {min_coverage}%"
        )

    threshold = policy.get("securityThreshold", "critical")
    threshold_rank = SEVERITY_RANK.get(threshold, 4)

    for vuln in summary.get("vulnerabilities", []):
        sev = vuln.get("severity", "low")
        vuln_rank = SEVERITY_RANK.get(sev, 1)
        if vuln_rank >= threshold_rank:
            vuln_id = vuln.get("id", "")
            pkg = vuln.get("package", "")
            violations.append(
                f"Vulnerability {vuln_id} ({sev}) in package {pkg} exceeds allowed threshold {threshold}"
            )

    return {
        "approved": len(violations) == 0,
        "violations": violations
    }
