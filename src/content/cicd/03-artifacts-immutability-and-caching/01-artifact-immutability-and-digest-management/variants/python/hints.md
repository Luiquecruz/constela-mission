Check the expected value first: it must be `sha256:` followed by exactly 64 hexadecimal characters, with nothing before or after. Anything else is an error, not a mismatch.
---
A mismatch is a normal answer: the check ran, so it reports `verified: true` with `match: false` instead of throwing.
---
Compare the digests as lower-case text, so `ABC...` and `abc...` count as the same hash.
---
A tag such as `latest` or `1.4.0` is a label that can move; it is never equal to a digest, so it simply does not match.
