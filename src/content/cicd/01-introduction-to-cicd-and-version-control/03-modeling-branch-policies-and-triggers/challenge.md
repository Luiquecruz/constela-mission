A pull request reaches `main` only after an automated check confirms the team's merge rules. Write the check that a required status check, an Azure Repos build validation policy or an AWS CodeBuild pull request build would run.

### Requirements

Export `validatePullRequest(pr, policy)`. `pr` is `{ branchName, targetBranch, filesChangedCount, approversCount }`; `policy` is `{ allowedBranchPrefixes, allowedTargets, maxFilesChanged, minApprovers }`. It returns `{ approved, violations }`.

Check, in this order, and add one violation for each failed rule:

1. The target branch is not in the allowed targets: `Target branch '<targetBranch>' is not allowed`.
2. The branch name starts with none of the allowed prefixes (letter case counts): `Branch name '<branchName>' does not match allowed prefixes`.
3. More files changed than the maximum: `Files changed (<filesChangedCount>) exceeds maximum allowed (<maxFilesChanged>)`. Exactly the maximum is fine.
4. Fewer approvals than the minimum: `Approvers count (<approversCount>) is below minimum required (<minApprovers>)`.

The pull request is approved only when there are no violations.
