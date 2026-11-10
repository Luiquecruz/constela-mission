using System.Text.Json;
using Dojo;

public static class PipelineNormalizerTests
{
    private static JsonElement Json(string text) => JsonDocument.Parse(text).RootElement;

    private static string Describe(NeutralTask[] tasks) =>
        string.Join(" ; ", tasks.Select(task => $"{task.Id}[{string.Join(",", task.Dependencies)}]({string.Join(" && ", task.Commands)})"));

    [Test("reads GitHub Actions jobs, needs and run steps and ignores action steps")]
    public static void ReadsGithub()
    {
        var github = Json("""
            { "jobs": {
                "install": { "steps": [ { "uses": "actions/checkout@v4" }, { "run": "npm ci" } ] },
                "lint": { "needs": "install", "steps": [ { "run": "npm run lint" } ] },
                "test": { "needs": ["install"], "steps": [ { "run": "npm test" } ] },
                "package": { "needs": ["lint", "test"], "steps": [ { "run": "npm run build" } ] } } }
            """);
        Assert.Equal("install[](npm ci) ; lint[install](npm run lint) ; test[install](npm test) ; package[lint,test](npm run build)", Describe(PipelineNormalizer.NormalizePipeline("github", github)));
    }

    [Test("reads Azure Pipelines jobs, dependencies and script steps and ignores task steps")]
    public static void ReadsAzure()
    {
        var azure = Json("""
            { "jobs": [
                { "job": "install", "steps": [ { "script": "npm ci" } ] },
                { "job": "test", "dependsOn": "install", "steps": [ { "task": "PublishTestResults@2" }, { "script": "npm test" } ] },
                { "job": "package", "dependsOn": ["install", "test"], "steps": [ { "script": "npm run build" } ] } ] }
            """);
        Assert.Equal("install[](npm ci) ; test[install](npm test) ; package[install,test](npm run build)", Describe(PipelineNormalizer.NormalizePipeline("azure", azure)));
    }

    // beginner mistake: assuming Cloud Build steps run in parallel when they do not name what they wait for
    [Test("makes a Cloud Build step wait for every earlier step by default")]
    public static void CloudBuildDefaultsToSequential()
    {
        var gcp = Json("""
            { "steps": [
                { "id": "install", "name": "node", "entrypoint": "npm", "args": ["ci"] },
                { "id": "lint", "name": "node", "entrypoint": "npm", "args": ["run", "lint"] },
                { "name": "node", "entrypoint": "npm", "args": ["test"] } ] }
            """);
        Assert.Equal("install[](npm ci) ; lint[install](npm run lint) ; step-3[install,lint](npm test)", Describe(PipelineNormalizer.NormalizePipeline("gcp", gcp)));
    }

    [Test("honors the wait list in Cloud Build, including the dash that starts a step immediately")]
    public static void CloudBuildWaitFor()
    {
        var gcp = Json("""
            { "steps": [
                { "id": "install", "name": "node", "entrypoint": "npm", "args": ["ci"] },
                { "id": "test", "name": "node", "entrypoint": "npm", "args": ["test"], "waitFor": ["install"] },
                { "id": "docs", "name": "node", "args": ["run", "docs"], "waitFor": ["-"] } ] }
            """);
        Assert.Equal("install[](npm ci) ; test[install](npm test) ; docs[](node run docs)", Describe(PipelineNormalizer.NormalizePipeline("gcp", gcp)));
    }

    [Test("chains the CodeBuild phases that exist and skips the missing ones")]
    public static void ChainsCodeBuildPhases()
    {
        var aws = Json("""
            { "phases": {
                "post_build": { "commands": ["echo done"] },
                "install": { "commands": ["npm ci"] },
                "build": { "commands": ["npm run build", "npm test"] } } }
            """);
        Assert.Equal("install[](npm ci) ; build[install](npm run build && npm test) ; post_build[build](echo done)", Describe(PipelineNormalizer.NormalizePipeline("aws", aws)));
    }

    [Test("rejects a dependency on an unknown job and a provider that is not supported")]
    public static void RejectsInvalidInput()
    {
        var broken = Json("""{ "jobs": { "lint": { "needs": "ghost", "steps": [ { "run": "npm run lint" } ] } } }""");
        var missing = Assert.Throws<InvalidOperationException>(() => PipelineNormalizer.NormalizePipeline("github", broken));
        Assert.Equal("Dependency ghost is missing from pipeline jobs", missing.Message);
        var waiting = Json("""{ "steps": [ { "id": "a", "name": "node", "waitFor": ["ghost"] } ] }""");
        var ghost = Assert.Throws<InvalidOperationException>(() => PipelineNormalizer.NormalizePipeline("gcp", waiting));
        Assert.Equal("Dependency ghost is missing from pipeline jobs", ghost.Message);
        var unsupported = Assert.Throws<ArgumentException>(() => PipelineNormalizer.NormalizePipeline("jenkins", Json("{}")));
        Assert.Equal("Unsupported provider: jenkins", unsupported.Message);
    }
}
