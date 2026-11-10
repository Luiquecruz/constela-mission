using System;
using System.Collections.Generic;
using System.Linq;

public record BuildTask(string Id, string[] Dependencies, string Command);

public static class BuildTaskResolver
{
    public static string[][] ResolveBuildOrder(BuildTask[] tasks)
    {
        var taskMap = tasks.ToDictionary(t => t.Id);

        foreach (var task in tasks)
        {
            foreach (var dep in task.Dependencies)
            {
                if (!taskMap.ContainsKey(dep))
                {
                    throw new InvalidOperationException($"Missing dependency: {dep}");
                }
            }
        }

        var remaining = tasks.ToList();
        var completed = new HashSet<string>();
        var batches = new List<string[]>();

        while (remaining.Count > 0)
        {
            var batch = remaining
                .Where(t => t.Dependencies.All(d => completed.Contains(d)))
                .Select(t => t.Id)
                .ToArray();

            if (batch.Length == 0)
            {
                throw new InvalidOperationException("Cyclic dependency detected");
            }

            batches.Add(batch);
            foreach (var id in batch)
            {
                completed.Add(id);
            }
            remaining.RemoveAll(t => completed.Contains(t.Id));
        }

        return batches.ToArray();
    }
}
