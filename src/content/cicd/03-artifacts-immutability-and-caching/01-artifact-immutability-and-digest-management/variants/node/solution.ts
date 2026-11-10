export interface ArtifactMeta {
  name: string;
  version: string;
  digest: string;
}

export interface VerificationResult {
  verified: boolean;
  match: boolean;
  reason: string;
}

const DIGEST_REGEX = /^sha256:[a-f0-9]{64}$/i;

export function verifyArtifactImmutability(
  artifact: ArtifactMeta,
  expectedDigest: string
): VerificationResult {
  if (!DIGEST_REGEX.test(expectedDigest)) {
    throw new Error("Invalid SHA256 digest format");
  }

  const match = artifact.digest.toLowerCase() === expectedDigest.toLowerCase();

  return {
    verified: true,
    match,
    reason: match
      ? "Artifact digest matches expected checksum"
      : "Artifact digest mismatch detected",
  };
}
