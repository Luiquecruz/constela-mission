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
    passed = []
    batches = []

    def reject(stage, reasons):
        return {"outcome": "REJECTED", "stage": stage, "passedStages": passed, "reasons": reasons, "batches": batches, "patch": None}

    try:
        batches = resolve_build_order(request["tasks"])
    except ValueError as error:
        return reject("build", [str(error)])
    passed.append("build")

    gate_failures = failed_rules(request["rules"], request["facts"])
    if gate_failures:
        return reject("gate", gate_failures)
    passed.append("gate")

    try:
        problem = check_identity(request["oidc"], now)
    except ValueError as error:
        return reject("identity", [str(error)])
    if problem is not None:
        return reject("identity", [problem])
    passed.append("identity")

    provenance_problem = check_provenance(request["artifact"])
    if provenance_problem is not None:
        return reject("provenance", [provenance_problem])
    passed.append("provenance")

    reason, patch = plan_promotion(request["artifact"], request["promotion"])
    if reason is not None:
        return reject("promotion", [reason])
    passed.append("promotion")

    return {"outcome": "RELEASED", "stage": "promotion", "passedStages": passed, "reasons": [], "batches": batches, "patch": patch}
