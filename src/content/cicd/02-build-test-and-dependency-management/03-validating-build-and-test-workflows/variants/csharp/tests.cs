using Dojo;

public static class WorkflowValidatorTests
{
    private static BuildTask Task(string id, params string[] dependencies) => new(id, dependencies, $"Step {id}");

    private static VulnerabilityItem Vulnerability(string id, string severity) => new(id, "lodash", severity);

    private static string Describe(string[][] batches) => string.Join(" | ", batches.Select(batch => string.Join(",", batch)));

    [Test("schedules a diamond into three batches")]
    public static void SchedulesDiamond()
    {
        var tasks = new[] { Task("checkout"), Task("build", "checkout"), Task("unit", "build"), Task("lint", "build"), Task("publish", "unit", "lint") };
        Assert.Equal("checkout | build | unit,lint | publish", Describe(WorkflowValidator.ScheduleDagTasks(tasks)));
    }

    [Test("schedules independent chains side by side")]
    public static void SchedulesChains()
    {
        var tasks = new[] { Task("a1"), Task("a2", "a1"), Task("b1"), Task("b2", "b1") };
        Assert.Equal("a1,b1 | a2,b2", Describe(WorkflowValidator.ScheduleDagTasks(tasks)));
    }

    [Test("rejects a missing dependency and a cycle with distinct errors")]
    public static void RejectsInvalidGraphs()
    {
        var missing = Assert.Throws<InvalidOperationException>(() => WorkflowValidator.ScheduleDagTasks([Task("a", "ghost")]));
        Assert.Equal("Missing dependency: ghost", missing.Message);
        var cycle = Assert.Throws<InvalidOperationException>(() => WorkflowValidator.ScheduleDagTasks([Task("a", "b"), Task("b", "a")]));
        Assert.Equal("Cyclic dependency detected", cycle.Message);
    }

    // beginner mistake: comparing severity names as text instead of by rank
    [Test("passes when every vulnerability is below the threshold rank")]
    public static void PassesBelowThreshold()
    {
        Assert.True(WorkflowValidator.EvaluateScanResults([Vulnerability("1", "low"), Vulnerability("2", "medium")], "high"));
    }

    [Test("fails when a vulnerability reaches the threshold exactly")]
    public static void FailsAtThreshold()
    {
        Assert.False(WorkflowValidator.EvaluateScanResults([Vulnerability("1", "low"), Vulnerability("2", "high")], "high"));
        Assert.False(WorkflowValidator.EvaluateScanResults([Vulnerability("3", "critical")], "low"));
    }

    [Test("passes when the scan found nothing")]
    public static void PassesWhenEmpty()
    {
        Assert.True(WorkflowValidator.EvaluateScanResults([], "low"));
    }
}
