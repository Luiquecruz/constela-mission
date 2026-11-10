A registry is the record of which exact bytes a version number stands for. Once a version is published, its digest must never change: a deployment that asks for `api-service:1.0.0` next month must get what it got today. Model that record.

### Requirements

Write a class `ArtifactRegistry` with the methods `Register`, `Resolve` and `ListVersions`. An invalid digest throws `ArgumentException`; an immutable or unknown version throws `InvalidOperationException`. `Register` returns the record `RegistrationResult(Registered, Digest)` declared in the file.

- `Register(name, version, digest)` stores the digest of a version.
  - The digest must be `sha256:` followed by 64 hexadecimal characters, in any letter case; otherwise fail with `Invalid SHA256 digest format`.
  - Digests are stored in lower case.
  - A version that is not yet known is stored and the result is `RegistrationResult(true, digest)`.
  - Registering a known version with the same digest changes nothing and the result is `RegistrationResult(false, digest)`.
  - Registering a known version with a different digest fails with `Artifact <name>:<version> is immutable` and keeps the stored digest.
- `Resolve(name, version)` returns the stored digest, or fails with `Artifact <name>:<version> not found` when the artifact or the version is unknown.
- `ListVersions(name)` returns the versions of an artifact in the order they were first registered, and an empty list for an unknown artifact.
