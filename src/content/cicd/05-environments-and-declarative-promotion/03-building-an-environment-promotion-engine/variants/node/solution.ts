export interface PromotionRequest {
  artifactDigest: string;
  targetEnv: string;
  serviceName: string;
}

export interface GateResult {
  status: 'PASSED' | 'BLOCKED';
}

export interface DeploymentHistoryEntry {
  artifactDigest: string;
  env: string;
  status: 'VERIFIED' | 'FAILED';
}

export interface ManifestPatch {
  path: string;
  content: string;
}

export interface PromotionPlan {
  success: boolean;
  reason: string;
  patch: ManifestPatch | null;
}

const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/i;

export function planPromotion(request: PromotionRequest, gate: GateResult, history: DeploymentHistoryEntry[], environments: string[]): PromotionPlan {
  if (!DIGEST_PATTERN.test(request.artifactDigest)) {
    throw new Error('Invalid artifact digest format');
  }
  const digest = request.artifactDigest.toLowerCase();

  if (gate.status !== 'PASSED') {
    return { success: false, reason: 'Quality gate check failed', patch: null };
  }

  const position = environments.indexOf(request.targetEnv);
  if (position < 0) {
    return { success: false, reason: 'Unknown target environment', patch: null };
  }

  if (position > 0) {
    const previous = environments[position - 1];
    const verified = history.some((entry) => entry.env === previous && entry.status === 'VERIFIED' && entry.artifactDigest.toLowerCase() === digest);
    if (!verified) {
      return { success: false, reason: `Verification missing in ${previous}`, patch: null };
    }
  }

  const content = ['images:', `  - name: ${request.serviceName}`, `    digest: ${digest}`, ''].join('\n');
  return { success: true, reason: 'Artifact promoted successfully', patch: { path: `overlays/${request.targetEnv}/kustomization.yaml`, content } };
}
