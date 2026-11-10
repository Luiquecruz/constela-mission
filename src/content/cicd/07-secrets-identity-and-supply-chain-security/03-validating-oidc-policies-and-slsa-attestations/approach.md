1. Map the target to its audience and fail on an unknown target.
2. Start an empty list of reasons.
3. Check the issuer, the audience and the expiration, adding a reason for each failure.
4. Check the subject: wildcard patterns for AWS, exact values for Azure.
5. Check the predicate type, then look for the artifact digest among the provenance subjects, then check the builder.
6. Return the decision: allowed when no reason was added, with the reasons in the order they were found.
