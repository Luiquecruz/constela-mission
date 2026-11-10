Validate sequential environment artifact promotion requests.

### Requirements

Implement `ValidateEnvironmentPromotion(request, history)`:
- `request`: `PromotionRequest(string ArtifactDigest, string TargetEnv, string PromotedBy)`.
- `history`: `DeploymentHistoryEntry[]`.
- Returns `PromotionDecision(bool Allowed, string Reason)`.
