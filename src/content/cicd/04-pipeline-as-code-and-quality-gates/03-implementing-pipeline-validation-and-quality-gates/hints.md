Build the gate as a list of independent checks and add a violation for each one that fails, so the result names everything that is wrong, not only the first problem.
---
At a limit, the check passes: coverage equal to the minimum, or vulnerabilities equal to the maximum, are not violations.
---
Test the override conditions in the order of the requirements. Trim the justification before testing it: a string of spaces is not a justification.
---
Never read the clock inside the function. The caller passes `now`, which keeps the audit record reproducible, and copy the violations so later changes to the gate do not rewrite the record.
