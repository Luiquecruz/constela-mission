Validate the artifact digest before anything else: it must be `sha256:` followed by exactly 64 hexadecimal characters. A malformed digest is an error, not a failed verification.
---
Compare the predicate type first, then look for the artifact among all subjects, then check the builder. Each check has its own reason, so the order decides which reason a statement gets.
---
Strip the `sha256:` prefix and compare the hexadecimal part without regard to case: tools print digests in lower case, but nothing forbids upper case.
---
A statement can list several subjects. The artifact is verified when any one of them carries its digest.
