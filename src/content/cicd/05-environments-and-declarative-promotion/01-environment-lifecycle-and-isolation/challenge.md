Manage the lifecycle of ephemeral environments for Pull Request previews.

### Requirements

Implement `manageEphemeralEnvironment(action, activeEnvironments, maxActivePool)`:
- `action`: Object containing `{ type: "PROVISION" | "TEARDOWN", prId: string, now: number }`.
- `activeEnvironments`: Array of `{ prId: string, name: string, createdAt: number, status: "ACTIVE" | "TERMINATED" }`.
- `maxActivePool`: Maximum allowed active ephemeral environments in the cluster.

Rules:
- If `action.type === "PROVISION"`:
  - Check active count (environments where `status === "ACTIVE"`). If active count >= `maxActivePool`, return `{ success: false, reason: "Active ephemeral environment pool limit reached", environment: null }`.
  - Check if active environment already exists for `action.prId`. If so, return `{ success: false, reason: "Environment already provisioned for this PR", environment: null }`.
  - Create environment `{ prId: action.prId, name: "preview-pr-" + action.prId, createdAt: action.now, status: "ACTIVE" }` and return `{ success: true, reason: "Environment provisioned successfully", environment }`.
- If `action.type === "TEARDOWN"`:
  - Find active environment for `action.prId`. If not found, return `{ success: false, reason: "Environment not found for teardown", environment: null }`.
  - Return `{ success: true, reason: "Environment torn down successfully", environment: { ...env, status: "TERMINATED" } }`.
