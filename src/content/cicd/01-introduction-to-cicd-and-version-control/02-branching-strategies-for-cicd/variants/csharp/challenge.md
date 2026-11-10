Evaluate Git branch metadata against organizational branching policies.

### Requirements

Implement `EvaluateBranchPolicy(branch, policy, now)`:
- `branch`: `BranchInfo(string Name, long CreatedAt)`.
- `policy`: `BranchPolicy(string[] AllowedPrefixes, double MaxAgeDays)`.
- `now`: Current timestamp in milliseconds.

Rules:
- Calculate branch age in days: `(now - branch.CreatedAt) / 86400000.0`.
- If branch age exceeds `policy.MaxAgeDays`, return `BranchEvaluationResult(false, "Branch age exceeds maximum threshold")`.
- If `branch.Name` does not start with any string in `policy.AllowedPrefixes`, return `BranchEvaluationResult(false, "Branch name violates prefix policy")`.
- Otherwise return `BranchEvaluationResult(true, "Branch complies with branching policy")`.
