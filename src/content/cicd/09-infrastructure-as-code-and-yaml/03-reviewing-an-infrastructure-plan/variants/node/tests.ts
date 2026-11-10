const policy = { protectedTypes: ['aws_db_instance', 'aws_s3_bucket'], requiredTags: ['Owner'] };
const change = (address: string, type: string, actions: string[], after: Record<string, unknown> | null = { tags: { Owner: 'platform' } }) => ({ address, type, change: { actions, after } });
const plan = (...resource_changes: unknown[]) => ({ resource_changes });

test('approves a plan of tagged changes and ignores no-op and read entries in the summary', async () => {
  const review = mod.reviewPlan(plan(
    change('aws_instance.web', 'aws_instance', ['create']),
    change('aws_instance.api', 'aws_instance', ['update']),
    change('aws_vpc.main', 'aws_vpc', ['no-op']),
    change('data.aws_ami.base', 'aws_ami', ['read']),
  ), policy);
  expect(review).toEqual({ decision: 'APPROVE', summary: { create: 1, update: 1, replace: 0, delete: 0 }, findings: [] });
});

test('counts a delete and a create in either order as one replacement', async () => {
  const review = mod.reviewPlan(plan(change('aws_instance.a', 'aws_instance', ['delete', 'create']), change('aws_instance.b', 'aws_instance', ['create', 'delete'])), policy);
  expect(review.summary).toEqual({ create: 0, update: 0, replace: 2, delete: 0 });
});

// beginner mistake: reading a replacement as a harmless update and missing that it destroys the old resource
test('requires approval when a protected resource is replaced or deleted', async () => {
  const review = mod.reviewPlan(plan(change('aws_db_instance.main', 'aws_db_instance', ['delete', 'create']), change('aws_s3_bucket.logs', 'aws_s3_bucket', ['delete'], null)), policy);
  expect(review.decision).toBe('REQUIRES_APPROVAL');
  expect(review.findings).toEqual([
    { address: 'aws_db_instance.main', rule: 'protected-destroy', message: 'Destroying aws_db_instance.main needs approval' },
    { address: 'aws_s3_bucket.logs', rule: 'protected-destroy', message: 'Destroying aws_s3_bucket.logs needs approval' },
  ]);
});

test('lets an unprotected resource be deleted without approval', async () => {
  const review = mod.reviewPlan(plan(change('aws_instance.old', 'aws_instance', ['delete'], null)), policy);
  expect(review).toEqual({ decision: 'APPROVE', summary: { create: 0, update: 0, replace: 0, delete: 1 }, findings: [] });
});

test('rejects resources that lack a required tag, including null tags, and skips resources without a tags attribute', async () => {
  const review = mod.reviewPlan(plan(
    change('aws_instance.a', 'aws_instance', ['create'], { tags: { Team: 'x' } }),
    change('aws_instance.b', 'aws_instance', ['create'], { tags: null }),
    change('aws_iam_policy.c', 'aws_iam_policy', ['create'], { name: 'read' }),
  ), policy);
  expect(review.decision).toBe('REJECT');
  expect(review.findings).toEqual([
    { address: 'aws_instance.a', rule: 'missing-tag', message: "aws_instance.a is missing tag 'Owner'" },
    { address: 'aws_instance.b', rule: 'missing-tag', message: "aws_instance.b is missing tag 'Owner'" },
  ]);
});

test('rejects a publicly accessible resource and lets a rejection outweigh a required approval', async () => {
  const review = mod.reviewPlan(plan(
    change('aws_db_instance.main', 'aws_db_instance', ['delete', 'create'], { tags: { Owner: 'platform' }, publicly_accessible: true }),
  ), policy);
  expect(review.decision).toBe('REJECT');
  expect(review.findings.map((finding: { rule: string }) => finding.rule)).toEqual(['protected-destroy', 'public-access']);
  expect(() => mod.reviewPlan(plan(change('x.y', 'x', ['forget'])), policy)).toThrow('Unsupported actions: forget');
});
