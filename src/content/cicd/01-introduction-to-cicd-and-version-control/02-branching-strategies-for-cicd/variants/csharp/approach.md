1. Compute the branch age in days from `createdAt` and `now`.
2. Reject the branch with the age reason when the age is greater than the maximum.
3. Check whether the name starts with any allowed prefix, comparing letter case exactly.
4. Reject the branch with the prefix reason when no prefix matches.
5. Otherwise allow it.
