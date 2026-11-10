1. Validate the digest and lower-case it.
2. Return the gate failure when the gate did not pass.
3. Find the target in the environment order and return the unknown-environment failure when it is missing.
4. For a target that is not first, look for a verified run of this digest in the previous environment.
5. Render the Kustomize patch and return the successful plan.
