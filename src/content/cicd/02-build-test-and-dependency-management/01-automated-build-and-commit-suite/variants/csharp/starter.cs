using System;
using System.Collections.Generic;
using System.Linq;

public record BuildTask(string Id, string[] Dependencies, string Command);

public static class BuildTaskResolver
{
    public static string[][] ResolveBuildOrder(BuildTask[] tasks)
    {
        // TODO: Resolve DAG tasks into topological execution batches
        return Array.Empty<string[]>();
    }
}
