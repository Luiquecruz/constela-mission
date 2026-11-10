def evaluate_commit_frequency(commits: list, max_interval_hours: float, now: int) -> dict:
    if not commits:
        return {
            "compliant": False,
            "maxGapHours": 0,
            "reason": "No commits recorded"
        }

    sorted_commits = sorted(commits, key=lambda c: c["timestamp"])
    max_gap_ms = 0

    for i in range(1, len(sorted_commits)):
        gap = sorted_commits[i]["timestamp"] - sorted_commits[i - 1]["timestamp"]
        if gap > max_gap_ms:
            max_gap_ms = gap

    last_gap = now - sorted_commits[-1]["timestamp"]
    if last_gap > max_gap_ms:
        max_gap_ms = last_gap

    max_gap_hours = round(max_gap_ms / 3600000.0, 2)

    if max_gap_hours > max_interval_hours:
        return {
            "compliant": False,
            "maxGapHours": max_gap_hours,
            "reason": "Commit gap exceeds threshold"
        }

    return {
        "compliant": True,
        "maxGapHours": max_gap_hours,
        "reason": "Commit frequency satisfies CI policy"
    }
