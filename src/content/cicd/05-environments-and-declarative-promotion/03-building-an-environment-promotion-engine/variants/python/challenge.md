Promotion by Git means a release moves to the next environment by a commit that pins the artifact's digest in that environment's overlay. Write the planner that decides whether the promotion is allowed and produces that commit's patch.

### Requirements

Write `plan_promotion(request, gate, history, environments)`. `request` is a dict with `artifactDigest`, `targetEnv` and `serviceName`, `gate` has `status`, `history` is a list of dicts with `artifactDigest`, `env` and `status`, and `environments` is the ordered list of names. It returns a dict with `success`, `reason` and `patch`, where `patch` is a dict with `path` and `content` or `None`.

Check, in this order:

1. The artifact digest must be `sha256:` followed by 64 hexadecimal characters; otherwise raise `ValueError` with `Invalid artifact digest format`. Digests are used in lower case from here on.
2. The quality gate status must be `PASSED`; otherwise the plan is `{ "success": False, "reason": "Quality gate check failed", "patch": None }`.
3. The target must be in the environment order; otherwise `{ "success": False, "reason": "Unknown target environment", "patch": None }`.
4. Every environment except the first needs proof from the environment immediately before it: a history entry for that environment, with status `VERIFIED`, for this same digest. Otherwise `{ "success": False, "reason": "Verification missing in <previous environment>", "patch": None }`.

When everything passes, the plan is `{ "success": True, "reason": "Artifact promoted successfully", "patch": patch }`. The patch has the path `overlays/<environment>/kustomization.yaml` and exactly this content, with a final newline and two-space indentation:

```
images:
  - name: <serviceName>
    digest: <digest>
```
