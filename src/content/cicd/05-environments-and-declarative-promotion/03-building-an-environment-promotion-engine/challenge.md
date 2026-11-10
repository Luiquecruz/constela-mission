Promotion by Git means a release moves to the next environment by a commit that pins the artifact's digest in that environment's overlay. Write the planner that decides whether the promotion is allowed and produces that commit's patch.

### Requirements

Export `planPromotion(request, gate, history, environments)`. `request` is `{ artifactDigest, targetEnv, serviceName }`, `gate` is `{ status }`, `history` is a list of `{ artifactDigest, env, status }` and `environments` is the ordered list of environment names. It returns `{ success, reason, patch }` where `patch` is `{ path, content }` or `null`.

Check, in this order:

1. The artifact digest must be `sha256:` followed by 64 hexadecimal characters; otherwise throw an `Error` with `Invalid artifact digest format`. Digests are used in lower case from here on.
2. The quality gate status must be `PASSED`; otherwise the plan is `{ success: false, reason: 'Quality gate check failed', patch: null }`.
3. The target must be in the environment order; otherwise `{ success: false, reason: 'Unknown target environment', patch: null }`.
4. Every environment except the first needs proof from the environment immediately before it: a history entry for that environment, with status `VERIFIED`, for this same digest. Otherwise `{ success: false, reason: 'Verification missing in <previous environment>', patch: null }`.

When everything passes, the plan is `{ success: true, reason: 'Artifact promoted successfully', patch }`. The patch has the path `overlays/<environment>/kustomization.yaml` and exactly this content, with a final newline and two-space indentation:

```
images:
  - name: <serviceName>
    digest: <digest>
```
