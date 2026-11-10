Manage the lifecycle of ephemeral environments for Pull Request previews.

### Requirements

Implement `manage_ephemeral_environment(action, active_environments, max_active_pool)`:
- `action`: Dict `{ "type": "PROVISION" | "TEARDOWN", "prId": str, "now": int }`.
- `active_environments`: List of dicts `{ "prId": str, "name": str, "createdAt": int, "status": str }`.
- `max_active_pool`: Int maximum active pool size.
- Return dict `{ "success": bool, "reason": str, "environment": dict | None }`.
