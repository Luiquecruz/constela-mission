Evaluate developer commit activity against Continuous Integration frequency rules.

### Requirements

Implement `evaluate_commit_frequency(commits, max_interval_hours, now)`:
- `commits`: List of dicts `{ "hash": str, "timestamp": int }`.
- `max_interval_hours`: Maximum allowed hours between consecutive commits.
- `now`: Current timestamp in milliseconds.

Rules:
- If `commits` is empty, return `{ "compliant": False, "maxGapHours": 0, "reason": "No commits recorded" }`.
- Sort commits by timestamp ascending.
- Calculate gap hours: `(t2 - t1) / 3600000`.
- Calculate gap between last commit and `now`: `(now - last_t) / 3600000`.
- Find `maxGapHours` (rounded to 2 decimal places).
- If `maxGapHours > max_interval_hours`, return `{ "compliant": False, "maxGapHours": maxGapHours, "reason": "Commit gap exceeds threshold" }`.
- Otherwise return `{ "compliant": True, "maxGapHours": maxGapHours, "reason": "Commit frequency satisfies CI policy" }`.
