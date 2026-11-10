NOW = 1700000000000
HOUR = 3600000
DAY = 86400000


def entry(key, age_ms, branch="main", ttl_ms=7 * DAY):
    return {"key": key, "createdAt": NOW - age_ms, "ttlMs": ttl_ms, "branch": branch}


def request(primary_key, restore_keys=None, branch="main"):
    return {"primaryKey": primary_key, "restoreKeys": restore_keys or [], "branch": branch, "defaultBranch": "main"}


@test("composes the cache key from a prefix and a lockfile hash")
def _():
    assert mod.generate_cache_key("npm-linux", "9f2c41") == "npm-linux-9f2c41"


@test("restores the exact key before trying any fallback")
def _():
    entries = [entry("npm-v2", HOUR), entry("npm-v1", HOUR // 6)]
    assert mod.resolve_cache(entries, request("npm-v2", ["npm-"]), NOW) == {"hit": True, "matchedKey": "npm-v2", "exact": True, "reason": "Exact cache hit"}


@test("falls back to the newest entry of the first restore key that matches")
def _():
    entries = [entry("npm-a", 3 * DAY), entry("npm-b", DAY), entry("node-x", HOUR)]
    fallback = {"hit": True, "matchedKey": "npm-b", "exact": False, "reason": "Restored from fallback key"}
    assert mod.resolve_cache(entries, request("npm-zzz", ["npm-", "node-"]), NOW) == fallback
    assert mod.resolve_cache(entries, request("npm-zzz", ["node-", "npm-"]), NOW)["matchedKey"] == "node-x"


@test("ignores expired entries and keeps one that is exactly at its time to live")
def _():
    at_limit = [entry("k", DAY, "main", DAY)]
    expired = [entry("k", DAY + 1, "main", DAY)]
    assert mod.resolve_cache(at_limit, request("k"), NOW)["hit"] is True
    assert mod.resolve_cache(expired, request("k"), NOW) == {"hit": False, "matchedKey": None, "exact": False, "reason": "Cache miss"}


# beginner mistake: restoring a cache written by another feature branch, which lets that branch poison this one
@test("shows caches from the current and default branches but never from other branches")
def _():
    assert mod.resolve_cache([entry("npm-v1", HOUR, "feature/other")], request("npm-v1", [], "feature/mine"), NOW)["hit"] is False
    assert mod.resolve_cache([entry("npm-v1", HOUR, "main")], request("npm-v1", [], "feature/mine"), NOW)["hit"] is True
    assert mod.resolve_cache([entry("npm-v1", HOUR, "feature/mine")], request("npm-v1", [], "feature/mine"), NOW)["hit"] is True


@test("reports a miss when no entry matches")
def _():
    assert mod.resolve_cache([], request("npm-v1", ["npm-"]), NOW) == {"hit": False, "matchedKey": None, "exact": False, "reason": "Cache miss"}
    assert mod.resolve_cache([entry("pip-v1", HOUR)], request("npm-v1", ["npm-"]), NOW)["hit"] is False
