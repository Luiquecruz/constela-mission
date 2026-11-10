Your cloud account trusts tokens from the CI provider only through a trust policy: the issuer and audience must match exactly, the token must not be expired, and the token's subject must match one of the allowed subject patterns, the way an AWS trust policy uses `StringLike` on `token.actions.githubusercontent.com:sub`.

### Requirements

Write `matches_subject(pattern: str, subject: str) -> bool`:

- `*` matches any sequence of characters, including an empty one.
- `?` matches exactly one character.
- Every other character is literal: `.` in a pattern matches only a dot.

Write `validate_oidc_claims(claims, policy, now)`, where `claims` is a dict with the keys `iss`, `sub`, `aud`, `exp` and `repository`, and `policy` a dict with `expectedIssuer`, `expectedAudience`, `allowedRepositories` and `allowedSubjects`. It returns a dict with `authorized` and `reason`.

Checks, in this order:

1. `iss` differs from `expectedIssuer`: raise `ValueError` with the message `Invalid OIDC issuer`.
2. `aud` differs from `expectedAudience`: raise `ValueError` with the message `Invalid OIDC audience`.
3. `exp` is less than or equal to `now`: raise `ValueError` with the message `OIDC token expired`.
4. `repository` is not in `allowedRepositories`: return `{"authorized": False, "reason": "Repository not allowed by OIDC policy"}`.
5. `sub` matches none of `allowedSubjects`: return `{"authorized": False, "reason": "Subject not allowed by OIDC policy"}`.
6. Otherwise return `{"authorized": True, "reason": "OIDC token claims validated and authorized"}`.

`now` and `exp` are Unix timestamps in seconds.
