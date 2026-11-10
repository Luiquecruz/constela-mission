1. Refuse the deployment when the available capacity is below 20%.
2. Decide whether the change needs a canary: risk of 70 or more, or a database migration.
3. If it does, refuse when the cluster allows no canary traffic, otherwise choose the canary.
4. Choose a rolling update for every other change.
