HOUR = 3600000
T = 1700000000000


def commit(hash_value, hours_after_start):
    return {"hash": hash_value, "timestamp": T + round(hours_after_start * HOUR)}


@test("accepts commits that stay within the allowed interval and rounds the largest gap")
def _():
    commits = [commit("a1", 0), commit("b2", 1 / 3)]
    result = mod.evaluate_commit_frequency(commits, 1, T + round((2 / 3) * HOUR))
    assert result == {"compliant": True, "maxGapHours": 0.33, "reason": "Commit frequency satisfies CI policy"}


@test("sorts the commits by time before measuring the gaps")
def _():
    unsorted = [commit("c3", 5), commit("a1", 0), commit("b2", 2)]
    result = mod.evaluate_commit_frequency(unsorted, 4, T + 6 * HOUR)
    assert result == {"compliant": True, "maxGapHours": 3, "reason": "Commit frequency satisfies CI policy"}


# beginner mistake: measuring only the gaps between commits and forgetting the time since the last one
@test("counts the time since the last commit as a gap")
def _():
    result = mod.evaluate_commit_frequency([commit("a1", 0), commit("b2", 1)], 4, T + 11 * HOUR)
    assert result == {"compliant": False, "maxGapHours": 10, "reason": "Commit gap exceeds threshold"}


@test("treats a gap equal to the threshold as compliant")
def _():
    assert mod.evaluate_commit_frequency([commit("a1", 0), commit("b2", 4)], 4, T + 5 * HOUR)["compliant"] is True


@test("flags a long gap in the middle of the history")
def _():
    commits = [commit("a1", 0), commit("b2", 1), commit("c3", 9.5), commit("d4", 10)]
    result = mod.evaluate_commit_frequency(commits, 8, T + round(10.5 * HOUR))
    assert result == {"compliant": False, "maxGapHours": 8.5, "reason": "Commit gap exceeds threshold"}


@test("reports a history without commits as not compliant")
def _():
    assert mod.evaluate_commit_frequency([], 4, T) == {"compliant": False, "maxGapHours": 0, "reason": "No commits recorded"}
