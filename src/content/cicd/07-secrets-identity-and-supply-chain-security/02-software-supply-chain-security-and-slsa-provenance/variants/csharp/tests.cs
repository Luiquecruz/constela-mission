using Dojo;

public static class SlsaProvenanceTests
{
    private const string Digest = "b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c";
    private const string Other = "7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730";
    private const string Predicate = "https://slsa.dev/provenance/v1";
    private const string Builder = "https://github.com/actions/runner/github-hosted";

    private static readonly SlsaVerificationPolicy Policy = new(Predicate, [Builder]);

    private static SlsaSubjectItem Subject(string name, string sha256) => new(name, new Dictionary<string, string> { ["sha256"] = sha256 });

    private static SlsaProvenanceStatement Statement(string predicateType = Predicate, string builder = Builder, SlsaSubjectItem[]? subjects = null) =>
        new(predicateType, new SlsaBuilderInfo(builder), subjects ?? [Subject("api-service.tar.gz", Digest)]);

    [Test("verifies a provenance statement from a trusted builder for the same artifact")]
    public static void VerifiesTrustedProvenance()
    {
        Assert.Equal(new SlsaVerificationResult(true, "SLSA provenance verified successfully"), SlsaProvenanceVerifier.VerifySlsaProvenance($"sha256:{Digest}", Statement(), Policy));
    }

    [Test("finds the artifact among several subjects regardless of hexadecimal case")]
    public static void FindsArtifactAmongSubjects()
    {
        var subjects = new[] { Subject("checksums.txt", Other), Subject("api-service.tar.gz", Digest.ToUpperInvariant()) };
        Assert.True(SlsaProvenanceVerifier.VerifySlsaProvenance($"sha256:{Digest}", Statement(subjects: subjects), Policy).Valid);
    }

    // beginner mistake: trusting the builder and never comparing the artifact digest with the subjects
    [Test("rejects provenance whose subjects do not include the artifact digest")]
    public static void RejectsMissingDigest()
    {
        Assert.Equal(new SlsaVerificationResult(false, "Artifact digest not found in provenance subject"), SlsaProvenanceVerifier.VerifySlsaProvenance($"sha256:{Other}", Statement(), Policy));
    }

    [Test("rejects provenance produced by a builder outside the policy")]
    public static void RejectsUntrustedBuilder()
    {
        Assert.Equal(new SlsaVerificationResult(false, "Builder ID not trusted by SLSA policy"), SlsaProvenanceVerifier.VerifySlsaProvenance($"sha256:{Digest}", Statement(builder: "https://ci.example/self-hosted"), Policy));
    }

    [Test("rejects a statement with an unexpected predicate type")]
    public static void RejectsPredicateType()
    {
        Assert.Equal(new SlsaVerificationResult(false, "Unsupported SLSA predicate type"), SlsaProvenanceVerifier.VerifySlsaProvenance($"sha256:{Digest}", Statement(predicateType: "https://spdx.dev/Document"), Policy));
    }

    [Test("refuses a malformed artifact digest before reading the statement")]
    public static void RefusesMalformedDigest()
    {
        var shortDigest = Assert.Throws<ArgumentException>(() => SlsaProvenanceVerifier.VerifySlsaProvenance("sha256:abc123", Statement(), Policy));
        Assert.Contains("Invalid artifact digest format", shortDigest.Message);
        var noPrefix = Assert.Throws<ArgumentException>(() => SlsaProvenanceVerifier.VerifySlsaProvenance(Digest, Statement(), Policy));
        Assert.Contains("Invalid artifact digest format", noPrefix.Message);
    }
}
