Evaluate developer commit activity against Continuous Integration frequency rules.

### Requirements

Implement `EvaluateCommitFrequency(commits, maxIntervalHours, now)`:
- `commits`: Array of `CommitEntry(string Hash, long Timestamp)`.
- `maxIntervalHours`: Maximum allowed hours between consecutive commits.
- `now`: Current timestamp in milliseconds.

Rules:
- If `commits` is empty, return `CiEvaluationResult(false, 0, "No commits recorded")`.
- Sort commits by timestamp ascending.
- Calculate gap hours: `(t2 - t1) / 3600000.0`.
- Calculate gap between last commit and `now`: `(now - lastT) / 3600000.0`.
- Find `maxGapHours` (rounded to 2 decimal places).
- If `maxGapHours > maxIntervalHours`, return `CiEvaluationResult(false, maxGapHours, "Commit gap exceeds threshold")`.
- Otherwise return `CiEvaluationResult(true, maxGapHours, "Commit frequency satisfies CI policy")`.
