def task(task_id, dependencies=None):
    return {"id": task_id, "name": f"Step {task_id}", "dependencies": dependencies or []}


def vulnerability(vulnerability_id, severity):
    return {"id": vulnerability_id, "severity": severity, "package": "lodash"}


@test("schedules a diamond into three batches")
def _():
    tasks = [task("checkout"), task("build", ["checkout"]), task("unit", ["build"]), task("lint", ["build"]), task("publish", ["unit", "lint"])]
    assert mod.schedule_dag_tasks(tasks) == [["checkout"], ["build"], ["unit", "lint"], ["publish"]]


@test("schedules independent chains side by side")
def _():
    tasks = [task("a1"), task("a2", ["a1"]), task("b1"), task("b2", ["b1"])]
    assert mod.schedule_dag_tasks(tasks) == [["a1", "b1"], ["a2", "b2"]]


@test("rejects a missing dependency and a cycle with distinct errors")
async def _():
    error = await capture_error(lambda: mod.schedule_dag_tasks([task("a", ["ghost"])]))
    assert "Missing dependency: ghost" in str(error)
    error = await capture_error(lambda: mod.schedule_dag_tasks([task("a", ["b"]), task("b", ["a"])]))
    assert "Cyclic dependency detected" in str(error)


# beginner mistake: comparing severity names as text instead of by rank
@test("passes when every vulnerability is below the threshold rank")
def _():
    assert mod.evaluate_scan_results([vulnerability("1", "low"), vulnerability("2", "medium")], "high") is True


@test("fails when a vulnerability reaches the threshold exactly")
def _():
    assert mod.evaluate_scan_results([vulnerability("1", "low"), vulnerability("2", "high")], "high") is False
    assert mod.evaluate_scan_results([vulnerability("3", "critical")], "low") is False


@test("passes when the scan found nothing")
def _():
    assert mod.evaluate_scan_results([], "low") is True
