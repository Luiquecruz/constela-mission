AUTO = {"autoSync": True, "prune": False}


def resource(resource_id, spec=None):
    return {"id": resource_id, "spec": spec if spec is not None else {"image": "api:1", "replicas": "2"}}


@test("reports a cluster that matches Git as in sync with nothing to do")
def _():
    state = [resource("deployment/api"), resource("service/api", {"port": "80"})]
    assert mod.reconcile(state, state, AUTO) == {"inSync": True, "toCreate": [], "toUpdate": [], "toDelete": [], "orphaned": [], "applied": False}


@test("creates what is missing and updates what differs, in the order Git lists them")
def _():
    desired = [resource("service/api", {"port": "80"}), resource("deployment/api", {"image": "api:2", "replicas": "2"}), resource("config/api", {"mode": "prod"})]
    live = [resource("deployment/api"), resource("service/api", {"port": "80"})]
    assert mod.reconcile(desired, live, AUTO) == {"inSync": False, "toCreate": ["config/api"], "toUpdate": ["deployment/api"], "toDelete": [], "orphaned": [], "applied": True}


# beginner mistake: ignoring resources that exist in the cluster but not in Git
@test("treats a resource that only the cluster has as drift: deleted with prune, reported without it")
def _():
    desired = [resource("deployment/api")]
    live = [resource("deployment/api"), resource("deployment/debug")]
    assert mod.reconcile(desired, live, {"autoSync": True, "prune": True}) == {"inSync": False, "toCreate": [], "toUpdate": [], "toDelete": ["deployment/debug"], "orphaned": [], "applied": True}
    assert mod.reconcile(desired, live, {"autoSync": True, "prune": False}) == {"inSync": False, "toCreate": [], "toUpdate": [], "toDelete": [], "orphaned": ["deployment/debug"], "applied": False}


@test("reports drift without changing anything when auto sync is off")
def _():
    result = mod.reconcile([resource("deployment/api", {"image": "api:2", "replicas": "2"})], [resource("deployment/api")], {"autoSync": False, "prune": True})
    assert result["inSync"] is False
    assert result["toUpdate"] == ["deployment/api"]
    assert result["applied"] is False


@test("compares specs by content, not by key order, and sees an added or removed key as a difference")
def _():
    live = [resource("deployment/api", {"image": "api:1", "replicas": "2"})]
    assert mod.reconcile([resource("deployment/api", {"replicas": "2", "image": "api:1"})], live, AUTO)["inSync"] is True
    assert mod.reconcile([resource("deployment/api", {"image": "api:1", "replicas": "2", "env": "prod"})], live, AUTO)["toUpdate"] == ["deployment/api"]
    assert mod.reconcile([resource("deployment/api", {"image": "api:1"})], live, AUTO)["toUpdate"] == ["deployment/api"]


@test("applies nothing when the only drift is an orphan that pruning is not allowed to remove")
def _():
    result = mod.reconcile([resource("deployment/api")], [resource("deployment/api"), resource("job/leftover")], AUTO)
    assert result == {"inSync": False, "toCreate": [], "toUpdate": [], "toDelete": [], "orphaned": ["job/leftover"], "applied": False}
