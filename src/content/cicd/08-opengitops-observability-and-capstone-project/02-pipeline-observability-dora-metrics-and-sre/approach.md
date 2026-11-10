1. Reject a window that is not positive and return zeros for no deployments.
2. Compute frequency, failure rate and mean lead time from the deployments.
3. Compute the mean restore time from the resolved incidents only.
4. Walk the tier table from ELITE down and return the first tier whose limits all hold, or LOW.
5. Compute the allowed failures from the objective, subtract the failures that happened and allow releases while the remainder is positive.
