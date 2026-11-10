def generate_cache_key(prefix: str, lockfile_hash: str) -> str:
    # TODO: join the prefix and the lockfile hash with a dash.
    return prefix


def resolve_cache(entries: list, request: dict, now: int) -> dict:
    # TODO: keep only entries that are not expired and were written by the current or the default branch.
    # TODO: prefer an exact match on the primary key, then try each restore key in order and take the newest entry.
    return {"hit": False, "matchedKey": None, "exact": False, "reason": "Cache miss"}
