Evaluate developer commit activity against Continuous Integration frequency rules.

### Requirements

Implement `evaluateCommitFrequency(commits, maxIntervalHours, now)`:
- `commits`: Array of `{ hash: string, timestamp: number }`.
- `maxIntervalHours`: Maximum allowed hours between consecutive commits.
- `now`: Current timestamp in milliseconds.

Rules:
- If `commits` is empty, return `{ compliant: false, maxGapHours: 0, reason: "No commits recorded" }`.
- Sort commits by timestamp ascending.
- Calculate gap hours between consecutive commits: `(t2 - t1) / 3600000`.
- Calculate gap between the last commit and `now`: `(now - lastT) / 3600000`.
- Find `maxGapHours` (rounded to 2 decimal places).
- If `maxGapHours > maxIntervalHours`, return `{ compliant: false, maxGapHours, reason: "Commit gap exceeds threshold" }`.
- Otherwise return `{ compliant: true, maxGapHours, reason: "Commit frequency satisfies CI policy" }`.
