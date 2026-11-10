Build a regular expression from the pattern one character at a time: `*` becomes "any characters", `?` becomes "one character", and every other character is escaped so a dot stays a dot. Anchor it at both ends.
---
Identity problems (issuer, audience, expiration) are errors: the token itself is not valid. Policy problems (repository, subject) are denials: the token is valid but not allowed here. Keep that order.
---
A token that expires at exactly `now` is already expired, so the check is `exp <= now`, not `exp < now`.
---
The subject check passes when at least one allowed pattern matches the token's subject.
