using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

public record SlsaSubjectItem(string Name, Dictionary<string, string> Digest);

public record SlsaBuilderInfo(string Id);

public record SlsaProvenanceStatement(
    string PredicateType,
    SlsaBuilderInfo Builder,
    SlsaSubjectItem[] Subject
);

public record SlsaVerificationPolicy(string ExpectedPredicateType, string[] AllowedBuilderIds);

public record SlsaVerificationResult(bool Valid, string Reason);

public static class SlsaProvenanceVerifier
{
    private static readonly Regex DigestRegex = new(@"\Asha256:[a-f0-9]{64}\z", RegexOptions.IgnoreCase);

    public static SlsaVerificationResult VerifySlsaProvenance(
        string artifactDigest,
        SlsaProvenanceStatement provenance,
        SlsaVerificationPolicy policy
    )
    {
        if (string.IsNullOrEmpty(artifactDigest) || !DigestRegex.IsMatch(artifactDigest))
        {
            throw new ArgumentException("Invalid artifact digest format");
        }

        if (!string.Equals(provenance.PredicateType, policy.ExpectedPredicateType, StringComparison.Ordinal))
        {
            return new SlsaVerificationResult(false, "Unsupported SLSA predicate type");
        }

        string rawHash = artifactDigest.Substring(7);

        var subjects = provenance.Subject ?? Array.Empty<SlsaSubjectItem>();
        bool foundSubject = subjects.Any(s =>
            s.Digest != null &&
            s.Digest.TryGetValue("sha256", out var hashVal) &&
            string.Equals(hashVal, rawHash, StringComparison.OrdinalIgnoreCase)
        );

        if (!foundSubject)
        {
            return new SlsaVerificationResult(false, "Artifact digest not found in provenance subject");
        }

        var allowedBuilders = policy.AllowedBuilderIds ?? Array.Empty<string>();
        if (!allowedBuilders.Contains(provenance.Builder.Id))
        {
            return new SlsaVerificationResult(false, "Builder ID not trusted by SLSA policy");
        }

        return new SlsaVerificationResult(true, "SLSA provenance verified successfully");
    }
}
