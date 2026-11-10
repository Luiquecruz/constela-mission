public record InfraResource(string Id, string Type, Dictionary<string, string> Properties, string[] DependsOn, string[] Immutable);

public record PlannedChange(string Action, string Id);

public record InfraSummary(int Create, int Update, int Replace, int Delete);

public record InfraPlan(PlannedChange[] Changes, InfraSummary Summary);

public static class InfraPlanner
{
    public static InfraPlan PlanChanges(InfraResource[] desired, InfraResource[] current)
    {
        // TODO: order the resources so that each one comes after the resources it depends on (ties by id); throw InvalidOperationException on an unknown dependency or a cycle.
        // TODO: walk the desired resources in that order: create the missing ones, update the ones that differ, replace them when an immutable property differs.
        // TODO: then delete the current resources that are no longer desired, in reverse dependency order.
        return new InfraPlan([], new InfraSummary(0, 0, 0, 0));
    }
}
