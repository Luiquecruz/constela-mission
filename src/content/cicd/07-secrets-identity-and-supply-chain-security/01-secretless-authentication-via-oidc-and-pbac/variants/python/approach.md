1. Write the pattern matcher first: translate each character of the pattern into a regular expression fragment and match the whole subject.
2. Compare the issuer and the audience with the policy and fail on the first mismatch.
3. Reject an expired token, counting the current second as expired.
4. Deny a repository that is not in the allowed list.
5. Deny a subject that no allowed pattern matches.
6. Authorize everything else.
