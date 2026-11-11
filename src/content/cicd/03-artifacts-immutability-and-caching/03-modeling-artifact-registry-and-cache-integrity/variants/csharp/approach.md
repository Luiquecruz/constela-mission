1. Keep, for each artifact name, an ordered record of version and digest.
2. In `Register`, validate and normalize the digest.
3. If the version is unknown, store it and report that it was registered.
4. If it is known with the same digest, report that nothing changed; with a different one, fail with the immutability error.
5. In `Resolve`, return the stored digest or fail with the not-found error.
6. In `ListVersions`, return the versions in registration order.
