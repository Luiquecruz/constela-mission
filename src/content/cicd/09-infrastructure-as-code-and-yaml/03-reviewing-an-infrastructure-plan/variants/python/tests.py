POLICY = {"protectedTypes": ["aws_db_instance", "aws_s3_bucket"], "requiredTags": ["Owner"]}


def change(address, resource_type, actions, after="default"):
    body = {"tags": {"Owner": "platform"}} if after == "default" else after
    return {"address": address, "type": resource_type, "change": {"actions": actions, "after": body}}


def plan(*changes):
    return {"resource_changes": list(changes)}


@test("approves a plan of tagged changes and ignores no-op and read entries in the summary")
def _():
    review = mod.review_plan(plan(
        change("aws_instance.web", "aws_instance", ["create"]),
        change("aws_instance.api", "aws_instance", ["update"]),
        change("aws_vpc.main", "aws_vpc", ["no-op"]),
        change("data.aws_ami.base", "aws_ami", ["read"]),
    ), POLICY)
    assert review == {"decision": "APPROVE", "summary": {"create": 1, "update": 1, "replace": 0, "delete": 0}, "findings": []}


@test("counts a delete and a create in either order as one replacement")
def _():
    review = mod.review_plan(plan(change("aws_instance.a", "aws_instance", ["delete", "create"]), change("aws_instance.b", "aws_instance", ["create", "delete"])), POLICY)
    assert review["summary"] == {"create": 0, "update": 0, "replace": 2, "delete": 0}


# beginner mistake: reading a replacement as a harmless update and missing that it destroys the old resource
@test("requires approval when a protected resource is replaced or deleted")
def _():
    review = mod.review_plan(plan(change("aws_db_instance.main", "aws_db_instance", ["delete", "create"]), change("aws_s3_bucket.logs", "aws_s3_bucket", ["delete"], None)), POLICY)
    assert review["decision"] == "REQUIRES_APPROVAL"
    assert review["findings"] == [
        {"address": "aws_db_instance.main", "rule": "protected-destroy", "message": "Destroying aws_db_instance.main needs approval"},
        {"address": "aws_s3_bucket.logs", "rule": "protected-destroy", "message": "Destroying aws_s3_bucket.logs needs approval"},
    ]


@test("lets an unprotected resource be deleted without approval")
def _():
    review = mod.review_plan(plan(change("aws_instance.old", "aws_instance", ["delete"], None)), POLICY)
    assert review == {"decision": "APPROVE", "summary": {"create": 0, "update": 0, "replace": 0, "delete": 1}, "findings": []}


@test("rejects resources that lack a required tag, including null tags, and skips resources without a tags attribute")
def _():
    review = mod.review_plan(plan(
        change("aws_instance.a", "aws_instance", ["create"], {"tags": {"Team": "x"}}),
        change("aws_instance.b", "aws_instance", ["create"], {"tags": None}),
        change("aws_iam_policy.c", "aws_iam_policy", ["create"], {"name": "read"}),
    ), POLICY)
    assert review["decision"] == "REJECT"
    assert review["findings"] == [
        {"address": "aws_instance.a", "rule": "missing-tag", "message": "aws_instance.a is missing tag 'Owner'"},
        {"address": "aws_instance.b", "rule": "missing-tag", "message": "aws_instance.b is missing tag 'Owner'"},
    ]


@test("rejects a publicly accessible resource and lets a rejection outweigh a required approval")
async def _():
    review = mod.review_plan(plan(change("aws_db_instance.main", "aws_db_instance", ["delete", "create"], {"tags": {"Owner": "platform"}, "publicly_accessible": True})), POLICY)
    assert review["decision"] == "REJECT"
    assert [finding["rule"] for finding in review["findings"]] == ["protected-destroy", "public-access"]
    error = await capture_error(lambda: mod.review_plan(plan(change("x.y", "x", ["explode"])), POLICY))
    assert "Unsupported actions: explode" in str(error)
