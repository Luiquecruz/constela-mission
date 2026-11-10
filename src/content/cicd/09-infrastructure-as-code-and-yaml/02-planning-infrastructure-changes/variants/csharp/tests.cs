using Dojo;

public static class InfraPlannerTests
{
    private static InfraResource Resource(string id, string[]? dependsOn = null, Dictionary<string, string>? properties = null, string[]? immutable = null) =>
        new(id, "generic", properties ?? new Dictionary<string, string> { ["size"] = "small" }, dependsOn ?? [], immutable ?? []);

    private static Dictionary<string, string> Props(params (string Key, string Value)[] pairs) => pairs.ToDictionary(pair => pair.Key, pair => pair.Value);

    private static readonly InfraResource Network = Resource("network");
    private static readonly InfraResource Subnet = Resource("subnet", ["network"]);
    private static readonly InfraResource Vm = Resource("vm", ["subnet"], Props(("size", "small"), ("zone", "a")), ["zone"]);

    private static string Ids(InfraPlan plan) => string.Join(",", plan.Changes.Select(change => $"{change.Action}:{change.Id}"));

    [Test("creates new resources after the resources they depend on, whatever the order of the list")]
    public static void CreatesInDependencyOrder()
    {
        var plan = InfraPlanner.PlanChanges([Vm, Network, Subnet], []);
        Assert.Equal("create:network,create:subnet,create:vm", Ids(plan));
        Assert.Equal(new InfraSummary(3, 0, 0, 0), plan.Summary);
    }

    [Test("updates in place when a mutable property changes and replaces when an immutable one does")]
    public static void UpdatesOrReplaces()
    {
        var current = new[] { Network, Subnet, Vm };
        var resized = Vm with { Properties = Props(("size", "large"), ("zone", "a")) };
        var moved = Vm with { Properties = Props(("size", "small"), ("zone", "b")) };
        var both = Vm with { Properties = Props(("size", "large"), ("zone", "b")) };
        Assert.Equal("update:vm", Ids(InfraPlanner.PlanChanges([Network, Subnet, resized], current)));
        Assert.Equal("replace:vm", Ids(InfraPlanner.PlanChanges([Network, Subnet, moved], current)));
        Assert.Equal("replace:vm", Ids(InfraPlanner.PlanChanges([Network, Subnet, both], current)));
    }

    [Test("treats an added or removed property as a change")]
    public static void AddedOrRemovedProperty()
    {
        var added = Subnet with { Properties = Props(("size", "small"), ("tier", "gold")) };
        var removed = Vm with { Properties = Props(("size", "small")) };
        Assert.Equal("update:subnet", Ids(InfraPlanner.PlanChanges([Network, added, Vm], [Network, Subnet, Vm])));
        Assert.Equal("replace:vm", Ids(InfraPlanner.PlanChanges([Network, Subnet, removed], [Network, Subnet, Vm])));
    }

    // beginner mistake: deleting a resource before the resources that depend on it
    [Test("deletes what is no longer desired in reverse dependency order, after the other changes")]
    public static void DeletesInReverseOrder()
    {
        Assert.Equal("delete:vm,delete:subnet,delete:network", Ids(InfraPlanner.PlanChanges([], [Network, Subnet, Vm])));
        var plan = InfraPlanner.PlanChanges([Resource("queue")], [Network, Subnet]);
        Assert.Equal("create:queue,delete:subnet,delete:network", Ids(plan));
        Assert.Equal(new InfraSummary(1, 0, 0, 2), plan.Summary);
    }

    [Test("plans nothing when the desired state equals the current state")]
    public static void PlansNothing()
    {
        var plan = InfraPlanner.PlanChanges([Network, Subnet, Vm], [Vm, Subnet, Network]);
        Assert.Equal(0, plan.Changes.Length);
        Assert.Equal(new InfraSummary(0, 0, 0, 0), plan.Summary);
    }

    [Test("rejects an unknown dependency and a dependency cycle")]
    public static void RejectsInvalidGraphs()
    {
        var unknown = Assert.Throws<InvalidOperationException>(() => InfraPlanner.PlanChanges([Resource("app", ["ghost"])], []));
        Assert.Equal("Unknown dependency: ghost", unknown.Message);
        var cycle = Assert.Throws<InvalidOperationException>(() => InfraPlanner.PlanChanges([Resource("a", ["b"]), Resource("b", ["a"])], []));
        Assert.Equal("Dependency cycle detected", cycle.Message);
    }
}
