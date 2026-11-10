using Dojo;

public static class ArtifactDigestTests
{
    private const string Digest = "sha256:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c";
    private const string Other = "sha256:7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730";

    private static ArtifactMeta Artifact(string digest) => new("api-service", "1.4.0", digest);

    [Test("confirms an artifact whose digest equals the expected one")]
    public static void ConfirmsMatch()
    {
        Assert.Equal(new VerificationResult(true, true, "Artifact digest matches expected checksum"), ArtifactVerifier.VerifyArtifactImmutability(Artifact(Digest), Digest));
    }

    [Test("reports a different digest as a mismatch without failing")]
    public static void ReportsMismatch()
    {
        Assert.Equal(new VerificationResult(true, false, "Artifact digest mismatch detected"), ArtifactVerifier.VerifyArtifactImmutability(Artifact(Other), Digest));
    }

    [Test("compares hexadecimal digits without regard to letter case")]
    public static void IgnoresCase()
    {
        Assert.True(ArtifactVerifier.VerifyArtifactImmutability(Artifact("sha256:" + "b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c".ToUpperInvariant()), Digest).Match);
    }

    // beginner mistake: trusting a mutable tag such as latest as if it were a digest
    [Test("never matches a mutable tag against a digest")]
    public static void TagNeverMatches()
    {
        Assert.False(ArtifactVerifier.VerifyArtifactImmutability(Artifact("latest"), Digest).Match);
        Assert.False(ArtifactVerifier.VerifyArtifactImmutability(Artifact("1.4.0"), Digest).Match);
    }

    [Test("rejects an expected value that is not a sha256 digest")]
    public static void RejectsNonDigest()
    {
        foreach (var bad in new[] { "b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c", "sha256:abc123", "sha1:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f2", "sha256:" + new string('g', 64) })
        {
            var error = Assert.Throws<ArgumentException>(() => ArtifactVerifier.VerifyArtifactImmutability(Artifact(Digest), bad));
            Assert.Contains("Invalid SHA256 digest format", error.Message);
        }
    }

    [Test("rejects a sha256 digest with the wrong length")]
    public static void RejectsWrongLength()
    {
        var error = Assert.Throws<ArgumentException>(() => ArtifactVerifier.VerifyArtifactImmutability(Artifact(Digest), "sha256:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c00"));
        Assert.Contains("Invalid SHA256 digest format", error.Message);
    }
}
