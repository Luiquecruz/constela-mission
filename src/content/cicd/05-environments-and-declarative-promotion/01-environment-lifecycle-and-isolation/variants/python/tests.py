NOW = 1_700_000_000_000


def active(pr_id):
    return {"prId": pr_id, "name": f"preview-pr-{pr_id}", "createdAt": NOW - 1000, "status": "ACTIVE"}


def terminated(pr_id):
    return {**active(pr_id), "status": "TERMINATED"}


@test("provisions a preview environment named after the pull request")
def _():
    result = mod.manage_ephemeral_environment({"type": "PROVISION", "prId": "42", "now": NOW}, [], 3)
    assert result == {
        "success": True,
        "reason": "Environment provisioned successfully",
        "environment": {"prId": "42", "name": "preview-pr-42", "createdAt": NOW, "status": "ACTIVE"},
    }


@test("refuses to provision when the active pool is full")
def _():
    result = mod.manage_ephemeral_environment({"type": "PROVISION", "prId": "9", "now": NOW}, [active("1"), active("2")], 2)
    assert result == {"success": False, "reason": "Active ephemeral environment pool limit reached", "environment": None}


# beginner mistake: counting terminated environments against the pool and never freeing the slot
@test("does not count terminated environments against the pool")
def _():
    result = mod.manage_ephemeral_environment({"type": "PROVISION", "prId": "9", "now": NOW}, [active("1"), terminated("2"), terminated("3")], 2)
    assert result["success"] is True


@test("refuses a second environment for a pull request that already has one")
def _():
    result = mod.manage_ephemeral_environment({"type": "PROVISION", "prId": "1", "now": NOW}, [active("1")], 5)
    assert result == {"success": False, "reason": "Environment already provisioned for this PR", "environment": None}


@test("provisions again for a pull request whose previous environment was torn down")
def _():
    result = mod.manage_ephemeral_environment({"type": "PROVISION", "prId": "1", "now": NOW}, [terminated("1")], 5)
    assert result["success"] is True
    assert result["environment"]["status"] == "ACTIVE"


@test("tears down the active environment of a pull request and reports an unknown one")
def _():
    done = mod.manage_ephemeral_environment({"type": "TEARDOWN", "prId": "1", "now": NOW}, [active("1"), active("2")], 5)
    assert done == {"success": True, "reason": "Environment torn down successfully", "environment": {**active("1"), "status": "TERMINATED"}}
    missing = mod.manage_ephemeral_environment({"type": "TEARDOWN", "prId": "7", "now": NOW}, [active("1"), terminated("7")], 5)
    assert missing == {"success": False, "reason": "Environment not found for teardown", "environment": None}
