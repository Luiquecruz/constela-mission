Compute the age in days from the two timestamps in milliseconds: one day is 86,400,000 milliseconds.
---
Check the age before the name. A branch that is too old is the bigger problem, so its reason wins when both rules fail.
---
Use a "starts with" comparison for the prefix, not a "contains" search: `experiment/feature/login` contains `feature/` but does not start with it.
---
The age limit is inclusive: only an age strictly greater than the maximum is rejected.
