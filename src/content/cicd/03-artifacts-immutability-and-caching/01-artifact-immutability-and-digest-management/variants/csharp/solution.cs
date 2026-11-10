using System;
using System.Text.RegularExpressions;

public record ArtifactMeta(string Name, string Version, string Digest);

public record VerificationResult(bool Verified, bool Match, string Reason);

public static class ArtifactVerifier
{
    private static readonly Regex DigestRegex = new(@"^sha256:[a-f0-9]{64}$", RegexOptions.IgnoreCase);

    public static VerificationResult VerifyArtifactImmutability(ArtifactMeta artifact, string expectedDigest)
    {
        if (string.IsNullOrEmpty(expectedDigest) || !DigestRegex.IsMatch(expectedDigest))
        {
            throw new ArgumentException("Invalid SHA256 digest format");
        }

        bool match = string.Equals(artifact.Digest, expectedDigest, StringComparison.OrdinalIgnoreCase);

        return new VerificationResult(
            true,
            match,
            match ? "Artifact digest matches expected checksum" : "Artifact digest mismatch detected"
        );
    }
}
