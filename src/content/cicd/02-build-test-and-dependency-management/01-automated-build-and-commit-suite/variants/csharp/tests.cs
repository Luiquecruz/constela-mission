using Dojo;

public static class BuildOrderTests
{
    private static BuildTask Task(string id, params string[] dependencies) => new(id, dependencies, $"run {id}");

    private static string Describe(string[][] batches) => string.Join(" | ", batches.Select(batch => string.Join(",", batch)));

    [Test("groups a diamond of tasks into batches that run in parallel")]
    public static void GroupsDiamond()
    {
        var tasks = new[] { Task("install"), Task("lint", "install"), Task("test", "install"), Task("package", "lint", "test") };
        Assert.Equal("install | lint,test | package", Describe(BuildTaskResolver.ResolveBuildOrder(tasks)));
    }

    [Test("puts every task without dependencies in the first batch, in input order")]
    public static void IndependentTasks()
    {
        Assert.Equal("docs,lint,test", Describe(BuildTaskResolver.ResolveBuildOrder([Task("docs"), Task("lint"), Task("test")])));
    }

    [Test("keeps the input order inside a batch even when the input is shuffled")]
    public static void KeepsInputOrder()
    {
        var tasks = new[] { Task("package", "lint", "test"), Task("test", "install"), Task("install"), Task("lint", "install") };
        Assert.Equal("install | test,lint | package", Describe(BuildTaskResolver.ResolveBuildOrder(tasks)));
    }

    [Test("returns no batches for an empty task list")]
    public static void EmptyList()
    {
        Assert.Equal(0, BuildTaskResolver.ResolveBuildOrder([]).Length);
    }

    // beginner mistake: treating a task that depends on itself as ready to run
    [Test("rejects a cycle, including a task that depends on itself")]
    public static void RejectsCycles()
    {
        var selfLoop = Assert.Throws<InvalidOperationException>(() => BuildTaskResolver.ResolveBuildOrder([Task("a", "a")]));
        Assert.Equal("Cyclic dependency detected", selfLoop.Message);
        var longer = Assert.Throws<InvalidOperationException>(() => BuildTaskResolver.ResolveBuildOrder([Task("setup"), Task("a", "b"), Task("b", "c"), Task("c", "a")]));
        Assert.Equal("Cyclic dependency detected", longer.Message);
    }

    [Test("names the missing dependency before looking for cycles")]
    public static void MissingBeforeCycle()
    {
        var error = Assert.Throws<InvalidOperationException>(() => BuildTaskResolver.ResolveBuildOrder([Task("a", "b"), Task("b", "a"), Task("c", "ghost")]));
        Assert.Equal("Missing dependency: ghost", error.Message);
    }
}
