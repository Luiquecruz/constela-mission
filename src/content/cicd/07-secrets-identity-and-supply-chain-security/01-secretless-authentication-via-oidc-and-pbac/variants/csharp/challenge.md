Your cloud account trusts tokens from the CI provider only through a trust policy: the issuer and audience must match exactly, the token must not be expired, and the token's subject must match one of the allowed subject patterns, the way an AWS trust policy uses `StringLike` on `token.actions.githubusercontent.com:sub`.

### Requirements

In the static class `OidcTrust`, write `bool MatchesSubject(string pattern, string subject)`:

- `*` matches any sequence of characters, including an empty one.
- `?` matches exactly one character.
- Every other character is literal: `.` in a pattern matches only a dot.

Also write `OidcValidationResult ValidateOidcClaims(OidcTokenClaims claims, OidcTrustPolicy policy, long now)`, using the records `OidcTokenClaims(Iss, Sub, Aud, Exp, Repository)`, `OidcTrustPolicy(ExpectedIssuer, ExpectedAudience, AllowedRepositories, AllowedSubjects)` and `OidcValidationResult(Authorized, Reason)` already declared in the file. The names below follow the claim names (`Iss` for `iss`, `ExpectedIssuer` for `expectedIssuer`).

Checks, in this order:

1. `iss` differs from `expectedIssuer`: throw `InvalidOperationException` with the message `Invalid OIDC issuer`.
2. `aud` differs from `expectedAudience`: throw `InvalidOperationException` with the message `Invalid OIDC audience`.
3. `exp` is less than or equal to `now`: throw `InvalidOperationException` with the message `OIDC token expired`.
4. `repository` is not in `allowedRepositories`: return `new OidcValidationResult(false, "Repository not allowed by OIDC policy")`.
5. `sub` matches none of `allowedSubjects`: return `new OidcValidationResult(false, "Subject not allowed by OIDC policy")`.
6. Otherwise return `new OidcValidationResult(true, "OIDC token claims validated and authorized")`.

`now` and `exp` are Unix timestamps in seconds.
