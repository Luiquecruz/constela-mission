import re

DIGEST_PATTERN = re.compile(r"^sha256:[a-f0-9]{64}$", re.IGNORECASE)


def plan_promotion(request: dict, gate: dict, history: list, environments: list) -> dict:
    if not DIGEST_PATTERN.match(request["artifactDigest"]):
        raise ValueError("Invalid artifact digest format")
    digest = request["artifactDigest"].lower()

    if gate["status"] != "PASSED":
        return {"success": False, "reason": "Quality gate check failed", "patch": None}

    if request["targetEnv"] not in environments:
        return {"success": False, "reason": "Unknown target environment", "patch": None}

    position = environments.index(request["targetEnv"])
    if position > 0:
        previous = environments[position - 1]
        verified = any(
            entry["env"] == previous and entry["status"] == "VERIFIED" and entry["artifactDigest"].lower() == digest
            for entry in history
        )
        if not verified:
            return {"success": False, "reason": f"Verification missing in {previous}", "patch": None}

    content = "\n".join(["images:", f"  - name: {request['serviceName']}", f"    digest: {digest}", ""])
    return {
        "success": True,
        "reason": "Artifact promoted successfully",
        "patch": {"path": f"overlays/{request['targetEnv']}/kustomization.yaml", "content": content},
    }
