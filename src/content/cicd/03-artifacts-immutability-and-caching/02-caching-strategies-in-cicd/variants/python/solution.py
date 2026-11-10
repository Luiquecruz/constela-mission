def generate_cache_key(prefix: str, lockfile_hash: str) -> str:
    return f"{prefix}-{lockfile_hash}"


def _newest(entries: list):
    return max(entries, key=lambda entry: entry["createdAt"]) if entries else None


def resolve_cache(entries: list, request: dict, now: int) -> dict:
    visible = [
        entry
        for entry in entries
        if now - entry["createdAt"] <= entry["ttlMs"] and entry["branch"] in (request["branch"], request["defaultBranch"])
    ]

    exact = _newest([entry for entry in visible if entry["key"] == request["primaryKey"]])
    if exact:
        return {"hit": True, "matchedKey": exact["key"], "exact": True, "reason": "Exact cache hit"}

    for restore_key in request["restoreKeys"]:
        partial = _newest([entry for entry in visible if entry["key"].startswith(restore_key)])
        if partial:
            return {"hit": True, "matchedKey": partial["key"], "exact": False, "reason": "Restored from fallback key"}

    return {"hit": False, "matchedKey": None, "exact": False, "reason": "Cache miss"}
