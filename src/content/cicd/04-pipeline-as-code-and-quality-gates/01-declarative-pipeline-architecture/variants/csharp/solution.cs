using System.Text.Json;

public record NeutralTask(string Id, string[] Dependencies, string[] Commands);

public static class PipelineNormalizer
{
    private static string[] ToList(JsonElement parent, string property)
    {
        if (!parent.TryGetProperty(property, out var value))
        {
            return [];
        }
        return value.ValueKind == JsonValueKind.Array ? value.EnumerateArray().Select(item => item.GetString()!).ToArray() : [value.GetString()!];
    }

    private static string[] Commands(JsonElement job, string key)
    {
        if (!job.TryGetProperty("steps", out var steps))
        {
            return [];
        }
        return steps.EnumerateArray().Where(step => step.TryGetProperty(key, out _)).Select(step => step.GetProperty(key).GetString()!).ToArray();
    }

    private static List<NeutralTask> FromGithub(JsonElement definition) =>
        definition.GetProperty("jobs").EnumerateObject().Select(job => new NeutralTask(job.Name, ToList(job.Value, "needs"), Commands(job.Value, "run"))).ToList();

    private static List<NeutralTask> FromAzure(JsonElement definition) =>
        definition.GetProperty("jobs").EnumerateArray().Select(job => new NeutralTask(job.GetProperty("job").GetString()!, ToList(job, "dependsOn"), Commands(job, "script"))).ToList();

    private static List<NeutralTask> FromGcp(JsonElement definition)
    {
        var steps = definition.GetProperty("steps").EnumerateArray().ToArray();
        var ids = steps.Select((step, index) => step.TryGetProperty("id", out var id) ? id.GetString()! : $"step-{index + 1}").ToArray();
        var tasks = new List<NeutralTask>();
        for (var index = 0; index < steps.Length; index++)
        {
            var step = steps[index];
            string[] dependencies;
            if (!step.TryGetProperty("waitFor", out _))
            {
                dependencies = ids.Take(index).ToArray();
            }
            else
            {
                var waitFor = ToList(step, "waitFor");
                dependencies = waitFor.Contains("-") ? [] : waitFor;
            }
            var program = step.TryGetProperty("entrypoint", out var entrypoint) ? entrypoint.GetString()! : step.GetProperty("name").GetString()!;
            var args = ToList(step, "args");
            tasks.Add(new NeutralTask(ids[index], dependencies, [string.Join(" ", new[] { program }.Concat(args))]));
        }
        return tasks;
    }

    private static List<NeutralTask> FromAws(JsonElement definition)
    {
        var phases = definition.GetProperty("phases");
        var present = new[] { "install", "pre_build", "build", "post_build" }.Where(phase => phases.TryGetProperty(phase, out _)).ToArray();
        return present.Select((phase, index) => new NeutralTask(phase, index == 0 ? [] : [present[index - 1]], ToList(phases.GetProperty(phase), "commands"))).ToList();
    }

    public static NeutralTask[] NormalizePipeline(string provider, JsonElement definition)
    {
        var tasks = provider switch
        {
            "github" => FromGithub(definition),
            "azure" => FromAzure(definition),
            "gcp" => FromGcp(definition),
            "aws" => FromAws(definition),
            _ => throw new ArgumentException($"Unsupported provider: {provider}"),
        };
        var ids = tasks.Select(task => task.Id).ToHashSet();
        foreach (var task in tasks)
        {
            foreach (var dependency in task.Dependencies)
            {
                if (!ids.Contains(dependency))
                {
                    throw new InvalidOperationException($"Dependency {dependency} is missing from pipeline jobs");
                }
            }
        }
        return tasks.ToArray();
    }
}
