Order the rules by how fatal they are: no capacity ends the decision at once, so check it before looking at risk.
---
Two different things make a change risky: a high risk score, and a database migration, which cannot be undone by simply routing traffic back. Either one asks for a canary.
---
Whether a canary is possible depends on the cluster: if it allows no canary traffic, a change that needs one is refused, not downgraded to a rolling update.
---
Mind the boundaries: exactly 20% available is enough, and 70 is already high risk.
