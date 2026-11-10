Your cloud account trusts tokens from the CI provider only through a trust policy: the issuer and audience must match exactly, the token must not be expired, and the token's subject must match one of the allowed subject patterns, the way an AWS trust policy uses `StringLike` on `token.actions.githubusercontent.com:sub`.

### Requirements

Export `matchesSubject(pattern: string, subject: string): boolean`:

- `*` matches any sequence of characters, including an empty one.
- `?` matches exactly one character.
- Every other character is literal: `.` in a pattern matches only a dot.

Export `validateOidcClaims(claims, policy, now)`, where `claims` is `{ iss, sub, aud, exp, repository }` and `policy` is `{ expectedIssuer, expectedAudience, allowedRepositories, allowedSubjects }`. It returns `{ authorized, reason }`.

Checks, in this order:

1. `iss` differs from `expectedIssuer`: throw an `Error` with the message `Invalid OIDC issuer`.
2. `aud` differs from `expectedAudience`: throw an `Error` with the message `Invalid OIDC audience`.
3. `exp` is less than or equal to `now`: throw an `Error` with the message `OIDC token expired`.
4. `repository` is not in `allowedRepositories`: return `{ authorized: false, reason: 'Repository not allowed by OIDC policy' }`.
5. `sub` matches none of `allowedSubjects`: return `{ authorized: false, reason: 'Subject not allowed by OIDC policy' }`.
6. Otherwise return `{ authorized: true, reason: 'OIDC token claims validated and authorized' }`.

`now` and `exp` are Unix timestamps in seconds.
