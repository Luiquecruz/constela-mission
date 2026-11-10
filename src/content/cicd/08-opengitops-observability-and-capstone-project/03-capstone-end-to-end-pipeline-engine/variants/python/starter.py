STAGES = ["build", "gate", "identity", "provenance", "promotion"]


def resolve_build_order(tasks: list) -> list:
    ids = {task["id"] for task in tasks}
    for task in tasks:
        for dependency in task["dependencies"]:
            if dependency not in ids:
                raise ValueError(f"Missing dependency: {dependency}")
    remaining = list(tasks)
    done = set()
    batches = []
    while remaining:
        batch = [task["id"] for task in remaining if all(dependency in done for dependency in task["dependencies"])]
        if not batch:
            raise ValueError("Cyclic dependency detected")
        batches.append(batch)
        done.update(batch)
        remaining = [task for task in remaining if task["id"] not in done]
    return batches


def failed_rules(rules: list, facts: dict) -> list:
    def holds(rule):
        if rule["field"] not in facts:
            return False
        fact = facts[rule["field"]]
        if rule["operator"] == "gte":
            return float(fact) >= float(rule["value"])
        if rule["operator"] == "lte":
            return float(fact) <= float(rule["value"])
        return fact == rule["value"]

    return [rule["message"] for rule in rules if not holds(rule)]


def check_identity(oidc: dict, now: int):
    claims, policy = oidc["claims"], oidc["policy"]
    if claims["iss"] != policy["expectedIssuer"]:
        raise ValueError("Invalid OIDC issuer")
    if claims["aud"] != policy["expectedAudience"]:
        raise ValueError("Invalid OIDC audience")
    if claims["exp"] <= now:
        raise ValueError("OIDC token expired")
    return None if claims["sub"] in policy["allowedSubjects"] else "Subject not allowed by OIDC policy"


def check_provenance(artifact: dict):
    digest = artifact["digest"].lower()
    if not any(subject.lower() == digest for subject in artifact["subjectDigests"]):
        return "Artifact digest not found in provenance"
    return None if artifact["builderId"] in artifact["trustedBuilders"] else "Builder is not trusted"


def plan_promotion(artifact: dict, promotion: dict):
    environments = promotion["environments"]
    if promotion["targetEnv"] not in environments:
        return "Unknown target environment", None
    digest = artifact["digest"].lower()
    position = environments.index(promotion["targetEnv"])
    if position > 0:
        previous = environments[position - 1]
        verified = any(
            entry["env"] == previous and entry["status"] == "VERIFIED" and entry["artifactDigest"].lower() == digest
            for entry in promotion["history"]
        )
        if not verified:
            return f"Verification missing in {previous}", None
    content = "\n".join(["images:", f"  - name: {promotion['serviceName']}", f"    digest: {digest}", ""])
    return None, {"path": f"overlays/{promotion['targetEnv']}/kustomization.yaml", "content": content}


def run_release(request: dict, now: int) -> dict:
    # TODO: run the five stages in the order of STAGES and stop at the first one that fails.
    # TODO: build resolves the task batches; gate collects the failed rules; identity checks the token; provenance checks the artifact; promotion plans the patch.
    # TODO: a stage that raises ValueError is a failed stage whose reason is the error message.
    return {"outcome": "REJECTED", "stage": "build", "passedStages": [], "reasons": ["Not implemented"], "batches": [], "patch": None}
