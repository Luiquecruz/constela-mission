Do the validation and the empty case first: a window that is not positive is an error, and without deployments every metric is zero, which also avoids dividing by zero.
---
An incident that is still open has no resolution time yet. Leave it out of the restore time instead of counting it as zero minutes, which would flatter the average.
---
Write the tiers as a table of four limits and walk it from the best tier down; the first tier whose four limits all hold is the answer, which is the same as letting the weakest measure decide.
---
The error budget is a count of failures the objective tolerates. Release is allowed only while some of it is left, so a budget of exactly zero already stops releases.
