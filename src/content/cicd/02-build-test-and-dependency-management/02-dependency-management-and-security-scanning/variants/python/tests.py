POLICY = {"minLineCoveragePercent": 80, "securityThreshold": "high"}


def vulnerability(vulnerability_id, severity, package="lodash"):
    return {"id": vulnerability_id, "severity": severity, "package": package}


@test("approves a build with enough coverage and no blocking vulnerability")
def _():
    summary = {"lineCoveragePercent": 91, "vulnerabilities": [vulnerability("CVE-1", "low"), vulnerability("CVE-2", "medium")]}
    assert mod.evaluate_test_and_security_summary(summary, POLICY) == {"approved": True, "violations": []}


@test("reports coverage below the minimum with both numbers")
def _():
    result = mod.evaluate_test_and_security_summary({"lineCoveragePercent": 72, "vulnerabilities": []}, POLICY)
    assert result == {"approved": False, "violations": ["Line coverage 72% is below minimum required 80%"]}


@test("accepts coverage exactly at the minimum")
def _():
    assert mod.evaluate_test_and_security_summary({"lineCoveragePercent": 80, "vulnerabilities": []}, POLICY)["approved"] is True


# beginner mistake: comparing severity names as text instead of by rank
@test("blocks only vulnerabilities at or above the threshold rank")
def _():
    summary = {"lineCoveragePercent": 90, "vulnerabilities": [vulnerability("CVE-1", "medium"), vulnerability("CVE-2", "high", "express"), vulnerability("CVE-3", "critical", "tar")]}
    assert mod.evaluate_test_and_security_summary(summary, POLICY)["violations"] == [
        "Vulnerability CVE-2 (high) in package express exceeds allowed threshold high",
        "Vulnerability CVE-3 (critical) in package tar exceeds allowed threshold high",
    ]


@test("lets a critical-only threshold ignore high vulnerabilities")
def _():
    summary = {"lineCoveragePercent": 90, "vulnerabilities": [vulnerability("CVE-2", "high"), vulnerability("CVE-3", "critical")]}
    result = mod.evaluate_test_and_security_summary(summary, {**POLICY, "securityThreshold": "critical"})
    assert result["violations"] == ["Vulnerability CVE-3 (critical) in package lodash exceeds allowed threshold critical"]


@test("lists the coverage violation first and then each vulnerability in input order")
def _():
    summary = {"lineCoveragePercent": 50, "vulnerabilities": [vulnerability("B", "critical"), vulnerability("A", "high")]}
    result = mod.evaluate_test_and_security_summary(summary, POLICY)
    assert result["approved"] is False
    assert [" ".join(line.split(" ")[:2]) for line in result["violations"]] == ["Line coverage", "Vulnerability B", "Vulnerability A"]
