Validate the digest before looking at anything else: a malformed digest is an error, not a refusal.
---
Branch on the target environment. Staging is refused only when this artifact already failed there; production needs proof that this artifact was verified in staging.
---
Proof has three parts and all must match: the same digest, the staging environment and the `VERIFIED` status. A verified run of another artifact, a failed run or a verified run in another environment proves nothing.
---
Anything that is not staging or production is an unknown environment and is refused.
