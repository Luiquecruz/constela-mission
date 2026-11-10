export interface SlsaSubjectItem {
  name: string;
  digest: Record<string, string>;
}

export interface SlsaBuilderInfo {
  id: string;
}

export interface SlsaProvenanceStatement {
  predicateType: string;
  builder: SlsaBuilderInfo;
  subject: SlsaSubjectItem[];
}

export interface SlsaVerificationPolicy {
  expectedPredicateType: string;
  allowedBuilderIds: string[];
}

export interface SlsaVerificationResult {
  valid: boolean;
  reason: string;
}

const DIGEST_REGEX = /^sha256:[a-f0-9]{64}$/i;

export function verifySlsaProvenance(
  artifactDigest: string,
  provenance: SlsaProvenanceStatement,
  policy: SlsaVerificationPolicy
): SlsaVerificationResult {
  if (!DIGEST_REGEX.test(artifactDigest)) {
    throw new Error("Invalid artifact digest format");
  }

  if (provenance.predicateType !== policy.expectedPredicateType) {
    return {
      valid: false,
      reason: "Unsupported SLSA predicate type",
    };
  }

  const rawHash = artifactDigest.slice(7).toLowerCase();

  const foundSubject = provenance.subject.some(
    (s) => s.digest.sha256 && s.digest.sha256.toLowerCase() === rawHash
  );

  if (!foundSubject) {
    return {
      valid: false,
      reason: "Artifact digest not found in provenance subject",
    };
  }

  if (!policy.allowedBuilderIds.includes(provenance.builder.id)) {
    return {
      valid: false,
      reason: "Builder ID not trusted by SLSA policy",
    };
  }

  return {
    valid: true,
    reason: "SLSA provenance verified successfully",
  };
}
