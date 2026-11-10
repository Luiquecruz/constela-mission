Give each severity a rank (`low` 1 to `critical` 4) and compare ranks. Comparing the names as text puts `medium` after `high`, which is the wrong way round.
---
The threshold is inclusive: a vulnerability whose rank equals the threshold rank blocks the build, and so does everything above it.
---
Coverage is checked first, so its message comes before any vulnerability message; vulnerabilities keep the order of the input list.
---
Coverage exactly at the minimum is fine: only a value strictly below it is a violation.
