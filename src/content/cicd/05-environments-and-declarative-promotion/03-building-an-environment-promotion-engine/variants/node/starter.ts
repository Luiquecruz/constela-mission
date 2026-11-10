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

export function planPromotion(request: PromotionRequest, gate: GateResult, history: DeploymentHistoryEntry[], environments: string[]): PromotionPlan {
  // TODO: reject a malformed digest, then a gate that did not pass, then a target outside the environment order.
  // TODO: every environment after the first needs a verified run of this digest in the environment before it.
  // TODO: build the Kustomize patch for overlays/<environment>/kustomization.yaml that pins the image to the digest.
  return { success: false, reason: 'Not implemented', patch: null };
}
