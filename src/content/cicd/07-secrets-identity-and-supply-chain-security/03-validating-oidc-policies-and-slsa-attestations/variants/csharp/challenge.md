Before a deployment job signs in to a cloud, a gate checks two things: that the workload identity token would be accepted by the target cloud's trust configuration, and that the artifact about to be deployed is the one the trusted builder produced. AWS and Azure read the same GitHub Actions token differently: AWS expects the audience `sts.amazonaws.com` and its trust policies can match the subject with wildcards (`StringLike`), while Azure expects `api://AzureADTokenExchange` and a federated credential compares the subject exactly.

### Requirements

In the static class `DeploymentGate`, write `string ExpectedAudience(string target)`: `"sts.amazonaws.com"` for `"aws"`, `"api://AzureADTokenExchange"` for `"azure"`, and `ArgumentException("Unsupported cloud target")` for anything else.

Also write `DeploymentDecision AuthorizeDeployment(DeploymentRequest request, DeploymentPolicy policy, long now)`, using the records declared in the file: `DeploymentRequest(Target, Claims, ArtifactDigest, Provenance)`, `WorkloadClaims(Iss, Aud, Sub, Exp)`, `ProvenanceSummary(PredicateType, BuilderId, SubjectDigests)`, `DeploymentPolicy(Issuer, AwsSubjectPatterns, AzureSubjects, TrustedBuilders)` and `DeploymentDecision(Allowed, Reasons)`. `Reasons` lists every failed check in the order below.

Checks, in this order, each one adding its reason when it fails:

1. `iss` differs from the policy issuer: `Issuer is not trusted`.
2. `aud` differs from the target's expected audience: `Audience does not match the cloud target`.
3. `exp` is less than or equal to `now`: `Token expired`.
4. The subject is not trusted for the target: `Subject is not trusted for this cloud`. For `aws`, the subject must match one of the AWS subject patterns, where `*` matches any sequence of characters and `?` one character. For `azure`, it must equal one of the Azure subjects exactly; a `*` there is just a character.
5. The predicate type is not `https://slsa.dev/provenance/v1`: `Unsupported provenance predicate type`.
6. The artifact digest is none of the provenance subject digests, compared without regard to case: `Artifact digest not found in provenance`.
7. The builder id is not a trusted builder: `Builder is not trusted`.

The decision is allowed only when no reason was added. An unknown target fails before any check with the message `Unsupported cloud target`.
