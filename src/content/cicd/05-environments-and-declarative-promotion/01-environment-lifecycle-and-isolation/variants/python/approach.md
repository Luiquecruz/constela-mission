1. Keep only the active environments.
2. For a provision, fail when the pool is full, then fail when the pull request already has an active environment.
3. Otherwise create the active environment from the pull request id and the time of the action.
4. For a teardown, find the active environment of the pull request.
5. Return it as terminated, or report that it was not found.
