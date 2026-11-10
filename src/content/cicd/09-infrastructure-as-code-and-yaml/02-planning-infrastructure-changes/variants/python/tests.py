def resource(resource_id, depends_on=None, properties=None, immutable=None):
    return {"id": resource_id, "type": "generic", "properties": properties if properties is not None else {"size": "small"}, "dependsOn": depends_on or [], "immutable": immutable or []}


NETWORK = resource("network")
SUBNET = resource("subnet", ["network"])
VM = resource("vm", ["subnet"], {"size": "small", "zone": "a"}, ["zone"])


def ids(plan):
    return [f"{change['action']}:{change['id']}" for change in plan["changes"]]


@test("creates new resources after the resources they depend on, whatever the order of the list")
def _():
    plan = mod.plan_changes([VM, NETWORK, SUBNET], [])
    assert ids(plan) == ["create:network", "create:subnet", "create:vm"]
    assert plan["summary"] == {"create": 3, "update": 0, "replace": 0, "delete": 0}


@test("updates in place when a mutable property changes and replaces when an immutable one does")
def _():
    current = [NETWORK, SUBNET, VM]
    resized = {**VM, "properties": {"size": "large", "zone": "a"}}
    moved = {**VM, "properties": {"size": "small", "zone": "b"}}
    both = {**VM, "properties": {"size": "large", "zone": "b"}}
    assert ids(mod.plan_changes([NETWORK, SUBNET, resized], current)) == ["update:vm"]
    assert ids(mod.plan_changes([NETWORK, SUBNET, moved], current)) == ["replace:vm"]
    assert ids(mod.plan_changes([NETWORK, SUBNET, both], current)) == ["replace:vm"]


@test("treats an added or removed property as a change")
def _():
    added = {**SUBNET, "properties": {"size": "small", "tier": "gold"}}
    removed = {**VM, "properties": {"size": "small"}}
    assert ids(mod.plan_changes([NETWORK, added, VM], [NETWORK, SUBNET, VM])) == ["update:subnet"]
    assert ids(mod.plan_changes([NETWORK, SUBNET, removed], [NETWORK, SUBNET, VM])) == ["replace:vm"]


# beginner mistake: deleting a resource before the resources that depend on it
@test("deletes what is no longer desired in reverse dependency order, after the other changes")
def _():
    assert ids(mod.plan_changes([], [NETWORK, SUBNET, VM])) == ["delete:vm", "delete:subnet", "delete:network"]
    plan = mod.plan_changes([resource("queue")], [NETWORK, SUBNET])
    assert ids(plan) == ["create:queue", "delete:subnet", "delete:network"]
    assert plan["summary"] == {"create": 1, "update": 0, "replace": 0, "delete": 2}


@test("plans nothing when the desired state equals the current state")
def _():
    assert mod.plan_changes([NETWORK, SUBNET, VM], [VM, SUBNET, NETWORK]) == {"changes": [], "summary": {"create": 0, "update": 0, "replace": 0, "delete": 0}}


@test("rejects an unknown dependency and a dependency cycle")
async def _():
    error = await capture_error(lambda: mod.plan_changes([resource("app", ["ghost"])], []))
    assert "Unknown dependency: ghost" in str(error)
    error = await capture_error(lambda: mod.plan_changes([resource("a", ["b"]), resource("b", ["a"])], []))
    assert "Dependency cycle detected" in str(error)
