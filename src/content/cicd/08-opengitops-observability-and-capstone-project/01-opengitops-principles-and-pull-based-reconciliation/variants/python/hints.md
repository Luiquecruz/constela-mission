Index the live resources by id. Then walk the desired list once to find what is missing and what differs, and walk the live list once to find what Git does not list.
---
Two specs are equal when they have the same keys and the same values. Compare content, not the order of the keys.
---
A resource that exists only in the cluster is drift. Whether it is deleted or only reported depends on `prune`, but either way the cluster is not in sync with Git.
---
Acting is a separate decision from detecting. `applied` needs auto sync and at least one change the controller is allowed to make: an orphan that pruning may not delete is not one.
