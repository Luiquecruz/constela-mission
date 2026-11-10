def task(task_id, dependencies=None):
    return {"id": task_id, "dependencies": dependencies or [], "command": f"run {task_id}"}


@test("groups a diamond of tasks into batches that run in parallel")
def _():
    tasks = [task("install"), task("lint", ["install"]), task("test", ["install"]), task("package", ["lint", "test"])]
    assert mod.resolve_build_order(tasks) == [["install"], ["lint", "test"], ["package"]]


@test("puts every task without dependencies in the first batch, in input order")
def _():
    assert mod.resolve_build_order([task("docs"), task("lint"), task("test")]) == [["docs", "lint", "test"]]


@test("keeps the input order inside a batch even when the input is shuffled")
def _():
    tasks = [task("package", ["lint", "test"]), task("test", ["install"]), task("install"), task("lint", ["install"])]
    assert mod.resolve_build_order(tasks) == [["install"], ["test", "lint"], ["package"]]


@test("returns no batches for an empty task list")
def _():
    assert mod.resolve_build_order([]) == []


# beginner mistake: treating a task that depends on itself as ready to run
@test("rejects a cycle, including a task that depends on itself")
async def _():
    error = await capture_error(lambda: mod.resolve_build_order([task("a", ["a"])]))
    assert "Cyclic dependency detected" in str(error)
    error = await capture_error(lambda: mod.resolve_build_order([task("setup"), task("a", ["b"]), task("b", ["c"]), task("c", ["a"])]))
    assert "Cyclic dependency detected" in str(error)


@test("names the missing dependency before looking for cycles")
async def _():
    error = await capture_error(lambda: mod.resolve_build_order([task("a", ["b"]), task("b", ["a"]), task("c", ["ghost"])]))
    assert "Missing dependency: ghost" in str(error)
