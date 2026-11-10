Manage the lifecycle of ephemeral environments for Pull Request previews.

### Requirements

Implement `ManageEphemeralEnvironment(action, activeEnvironments, maxActivePool)`:
- `action`: `EphemeralAction(string Type, string PrId, long Now)`.
- `activeEnvironments`: `EphemeralEnvironment[]`.
- `maxActivePool`: int.
- Returns `EphemeralManagementResult(bool Success, string Reason, EphemeralEnvironment Environment)`.
