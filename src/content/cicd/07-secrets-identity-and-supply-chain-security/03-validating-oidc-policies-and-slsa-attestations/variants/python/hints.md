Resolve the expected audience first: it depends only on the target, and an unknown target must fail before any other check runs.
---
Do not return at the first failure. Keep a list, add the reason of each failed check in the order of the requirements, and decide at the end: allowed means the list is empty.
---
The subject rule is the one that changes per cloud. On AWS, translate the pattern into a regular expression (`*` is any sequence, `?` one character, everything else literal). On Azure, compare strings exactly.
---
A valid identity is not enough. The artifact digest must appear among the provenance subjects, or the job would deploy something the trusted builder never produced.
