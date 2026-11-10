export interface OidcTokenClaims {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  repository: string;
}

export interface OidcTrustPolicy {
  expectedIssuer: string;
  expectedAudience: string;
  allowedRepositories: string[];
  allowedSubjects: string[];
}

export interface OidcValidationResult {
  authorized: boolean;
  reason: string;
}

export function matchesSubject(pattern: string, subject: string): boolean {
  // TODO: treat "*" as any sequence of characters and "?" as exactly one character; every other character is literal.
  return pattern === subject;
}

export function validateOidcClaims(claims: OidcTokenClaims, policy: OidcTrustPolicy, now: number): OidcValidationResult {
  // TODO: throw for a wrong issuer, a wrong audience or an expired token.
  // TODO: deny a repository outside the policy, then a subject that matches no allowed pattern.
  return { authorized: true, reason: 'OIDC token claims validated and authorized' };
}
