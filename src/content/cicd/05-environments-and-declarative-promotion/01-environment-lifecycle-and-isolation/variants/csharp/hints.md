Count the pool from the environments that are `ACTIVE` only. A terminated environment has released its resources, so it must not hold a slot.
---
Check the pool limit first, then whether the pull request already has an active environment. The limit is reached when the active count is greater than or equal to the maximum.
---
The name is `preview-pr-` followed by the pull request id, and a new environment is `ACTIVE` with the time of the action as its creation time.
---
Teardown looks only at active environments: it returns the same environment with the status `TERMINATED`, or reports that none was found.
