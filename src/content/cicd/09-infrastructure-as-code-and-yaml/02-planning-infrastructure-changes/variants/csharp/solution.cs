public record InfraResource(string Id, string Type, Dictionary<string, string> Properties, string[] DependsOn, string[] Immutable);

public record PlannedChange(string Action, string Id);

public record InfraSummary(int Create, int Update, int Replace, int Delete);

public record InfraPlan(PlannedChange[] Changes, InfraSummary Summary);

public static class InfraPlanner
{
    private static string[] DependencyOrder(InfraResource[] resources)
    {
        var ids = resources.Select(resource => resource.Id).ToHashSet();
        foreach (var resource in resources)
        {
            foreach (var dependency in resource.DependsOn)
            {
                if (!ids.Contains(dependency))
                {
                    throw new InvalidOperationException($"Unknown dependency: {dependency}");
                }
            }
        }

        var remaining = resources.OrderBy(resource => resource.Id, StringComparer.Ordinal).ToList();
        var done = new HashSet<string>();
        var order = new List<string>();
        while (remaining.Count > 0)
        {
            var next = remaining.FirstOrDefault(resource => resource.DependsOn.All(done.Contains));
            if (next is null)
            {
                throw new InvalidOperationException("Dependency cycle detected");
            }
            remaining.Remove(next);
            order.Add(next.Id);
            done.Add(next.Id);
        }
        return order.ToArray();
    }

    private static string[] ChangedKeys(Dictionary<string, string> desired, Dictionary<string, string> current) =>
        desired.Keys.Union(current.Keys).Where(key => !desired.TryGetValue(key, out var wanted) || !current.TryGetValue(key, out var existing) || wanted != existing).ToArray();

    public static InfraPlan PlanChanges(InfraResource[] desired, InfraResource[] current)
    {
        var desiredById = desired.ToDictionary(resource => resource.Id);
        var currentById = current.ToDictionary(resource => resource.Id);
        var changes = new List<PlannedChange>();

        foreach (var id in DependencyOrder(desired))
        {
            var wanted = desiredById[id];
            if (!currentById.TryGetValue(id, out var existing))
            {
                changes.Add(new PlannedChange("create", id));
                continue;
            }
            var differences = ChangedKeys(wanted.Properties, existing.Properties);
            if (differences.Length == 0)
            {
                continue;
            }
            changes.Add(new PlannedChange(differences.Any(key => wanted.Immutable.Contains(key)) ? "replace" : "update", id));
        }

        foreach (var id in DependencyOrder(current).Reverse())
        {
            if (!desiredById.ContainsKey(id))
            {
                changes.Add(new PlannedChange("delete", id));
            }
        }

        int Count(string action) => changes.Count(change => change.Action == action);
        return new InfraPlan(changes.ToArray(), new InfraSummary(Count("create"), Count("update"), Count("replace"), Count("delete")));
    }
}
