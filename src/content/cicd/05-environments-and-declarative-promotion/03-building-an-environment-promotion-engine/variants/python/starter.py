def plan_promotion(request: dict, gate: dict, history: list, environments: list) -> dict:
    # TODO: raise ValueError for a malformed digest, then refuse a gate that did not pass, then a target outside the environment order.
    # TODO: every environment after the first needs a verified run of this digest in the environment before it.
    # TODO: build the Kustomize patch for overlays/<environment>/kustomization.yaml that pins the image to the digest.
    return {"success": False, "reason": "Not implemented", "patch": None}
