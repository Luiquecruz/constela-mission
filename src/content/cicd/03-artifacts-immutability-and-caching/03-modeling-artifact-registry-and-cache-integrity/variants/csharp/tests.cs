using Dojo;

public static class ArtifactRegistryTests
{
    private const string Digest = "sha256:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c";
    private const string Other = "sha256:7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730";

    [Test("registers versions and resolves each one to its digest")]
    public static void RegistersAndResolves()
    {
        var registry = new ArtifactRegistry();
        Assert.Equal(new RegistrationResult(true, Digest), registry.Register("api-service", "1.0.0", Digest));
        registry.Register("api-service", "1.1.0", Other);
        Assert.Equal(Digest, registry.Resolve("api-service", "1.0.0"));
        Assert.Equal(Other, registry.Resolve("api-service", "1.1.0"));
        Assert.SequenceEqual(["1.0.0", "1.1.0"], registry.ListVersions("api-service"));
    }

    [Test("stores digests in lower case")]
    public static void LowerCases()
    {
        var registry = new ArtifactRegistry();
        var result = registry.Register("api-service", "1.0.0", "sha256:" + "b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c".ToUpperInvariant());
        Assert.Equal(Digest, result.Digest);
        Assert.Equal(Digest, registry.Resolve("api-service", "1.0.0"));
    }

    [Test("treats registering the same digest again as a no-op")]
    public static void Idempotent()
    {
        var registry = new ArtifactRegistry();
        registry.Register("api-service", "1.0.0", Digest);
        Assert.Equal(new RegistrationResult(false, Digest), registry.Register("api-service", "1.0.0", "sha256:" + "b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c".ToUpperInvariant()));
        Assert.SequenceEqual(["1.0.0"], registry.ListVersions("api-service"));
    }

    // beginner mistake: overwriting a published version with a different build
    [Test("refuses to replace a published version with a different digest")]
    public static void Immutable()
    {
        var registry = new ArtifactRegistry();
        registry.Register("api-service", "1.0.0", Digest);
        var error = Assert.Throws<InvalidOperationException>(() => registry.Register("api-service", "1.0.0", Other));
        Assert.Equal("Artifact api-service:1.0.0 is immutable", error.Message);
        Assert.Equal(Digest, registry.Resolve("api-service", "1.0.0"));
    }

    [Test("rejects a digest that is not a sha256 hash")]
    public static void RejectsBadDigest()
    {
        var registry = new ArtifactRegistry();
        foreach (var bad in new[] { "b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c", "sha256:abc", "sha1:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f2", "latest" })
        {
            var error = Assert.Throws<ArgumentException>(() => registry.Register("api-service", "1.0.0", bad));
            Assert.Contains("Invalid SHA256 digest format", error.Message);
        }
        Assert.Equal(0, registry.ListVersions("api-service").Length);
    }

    [Test("fails to resolve a version or an artifact that was never registered")]
    public static void ResolvesUnknown()
    {
        var registry = new ArtifactRegistry();
        registry.Register("api-service", "1.0.0", Digest);
        var version = Assert.Throws<InvalidOperationException>(() => registry.Resolve("api-service", "9.9.9"));
        Assert.Equal("Artifact api-service:9.9.9 not found", version.Message);
        var artifact = Assert.Throws<InvalidOperationException>(() => registry.Resolve("web-app", "1.0.0"));
        Assert.Equal("Artifact web-app:1.0.0 not found", artifact.Message);
        Assert.Equal(0, registry.ListVersions("web-app").Length);
    }
}
