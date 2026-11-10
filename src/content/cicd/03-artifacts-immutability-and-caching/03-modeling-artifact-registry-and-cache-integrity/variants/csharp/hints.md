Validate the digest before touching any state, so a rejected registration leaves the registry exactly as it was.
---
Normalize the digest to lower case once, and compare the normalized values: `ABC...` and `abc...` are the same hash.
---
A known version has three outcomes: the same digest is accepted without changing anything, a different digest is an immutability violation, and an unknown version is stored.
---
Remember the order of registration: keep the versions of each artifact in a structure that preserves insertion order.
