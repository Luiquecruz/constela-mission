Evaluate Git branch metadata against organizational branching policies.

### Requirements

Implement `evaluateBranchPolicy(branch, policy, now)`:
- `branch`: Object containing `{ name: string, createdAt: number }`.
- `policy`: Object containing `{ allowedPrefixes: string[], maxAgeDays: number }`.
- `now`: Current timestamp in milliseconds.

Rules:
- Calculate branch age in days: `(now - branch.createdAt) / 86400000`.
- If branch age exceeds `policy.maxAgeDays`, return `{ allowed: false, reason: "Branch age exceeds maximum threshold" }`.
- If `branch.name` does not start with any string in `policy.allowedPrefixes`, return `{ allowed: false, reason: "Branch name violates prefix policy" }`.
- Otherwise return `{ allowed: true, reason: "Branch complies with branching policy" }`.
