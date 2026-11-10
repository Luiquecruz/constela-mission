using System;
using System.Collections.Generic;
using System.Linq;

public record BuildTask(string Id, string[] Dependencies, string Command);

public record VulnerabilityItem(string Id, string Package, string Severity);

public static class WorkflowValidator
{
    private static readonly Dictionary<string, int> SeverityRanks = new(StringComparer.OrdinalIgnoreCase)
    {
        { "low", 1 },
        { "medium", 2 },
        { "high", 3 },
        { "critical", 4 }
    };

    public static string[][] ScheduleDagTasks(BuildTask[] tasks)
    {
        var taskMap = tasks.ToDictionary(t => t.Id);
        foreach (var t in tasks)
        {
            foreach (var d in t.Dependencies)
            {
                if (!taskMap.ContainsKey(d))
                {
                    throw new InvalidOperationException($"Missing dependency: {d}");
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

    public static bool EvaluateScanResults(VulnerabilityItem[] vulnerabilities, string threshold)
    {
        int thresholdRank = SeverityRanks.TryGetValue(threshold, out int tr) ? tr : 4;
        foreach (var v in vulnerabilities)
        {
            int vr = SeverityRanks.TryGetValue(v.Severity, out int r) ? r : 1;
            if (vr >= thresholdRank)
            {
                return false;
            }
        }
        return true;
    }
}
