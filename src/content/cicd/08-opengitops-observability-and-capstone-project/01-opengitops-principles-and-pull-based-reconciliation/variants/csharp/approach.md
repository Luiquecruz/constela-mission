1. Index the live resources by id and collect the desired ids.
2. Collect the ids to create and to update, in desired order.
3. Collect the live ids that are not desired.
4. Split them into delete and orphaned according to `prune`.
5. Compute `inSync` and `applied` from the lists and the options.
