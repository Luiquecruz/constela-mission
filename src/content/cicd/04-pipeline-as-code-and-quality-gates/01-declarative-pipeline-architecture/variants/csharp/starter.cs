using System.Text.Json;

public record NeutralTask(string Id, string[] Dependencies, string[] Commands);

public static class PipelineNormalizer
{
    public static NeutralTask[] NormalizePipeline(string provider, JsonElement definition)
    {
        // TODO: throw ArgumentException for a provider other than github, azure, gcp and aws.
        // TODO: GitHub jobs use "needs" and "run" steps; Azure jobs use "dependsOn" and "script" steps.
        // TODO: Cloud Build steps wait for every earlier step unless "waitFor" says otherwise; CodeBuild phases run one after another.
        // TODO: throw InvalidOperationException when a task depends on an id that is not in the pipeline.
        return [];
    }
}
