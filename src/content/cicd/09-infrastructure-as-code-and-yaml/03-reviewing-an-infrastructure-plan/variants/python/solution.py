def _classify(actions: list) -> str:
    key = ",".join(actions)
    if key in ("no-op", "read"):
        return "none"
    if key in ("create", "update", "delete"):
        return key
    if key in ("delete,create", "create,delete"):
        return "replace"
    raise ValueError(f"Unsupported actions: {key}")


def review_plan(plan: dict, policy: dict) -> dict:
    summary = {"create": 0, "update": 0, "replace": 0, "delete": 0}
    findings = []

    for resource in plan["resource_changes"]:
        kind = _classify(resource["change"]["actions"])
        if kind == "none":
            continue
        summary[kind] += 1
        address = resource["address"]

        if kind in ("delete", "replace") and resource["type"] in policy["protectedTypes"]:
            findings.append({"address": address, "rule": "protected-destroy", "message": f"Destroying {address} needs approval"})

        after = resource["change"]["after"]
        if kind != "delete" and after is not None:
            if "tags" in after:
                tags = after["tags"] or {}
                for tag in policy["requiredTags"]:
                    if tag not in tags:
                        findings.append({"address": address, "rule": "missing-tag", "message": f"{address} is missing tag '{tag}'"})
            if after.get("publicly_accessible") is True:
                findings.append({"address": address, "rule": "public-access", "message": f"{address} is publicly accessible"})

    blocking = any(finding["rule"] in ("missing-tag", "public-access") for finding in findings)
    decision = "REJECT" if blocking else "REQUIRES_APPROVAL" if findings else "APPROVE"
    return {"decision": decision, "summary": summary, "findings": findings}
