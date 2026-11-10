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
  const source = [...pattern]
    .map((character) => {
      if (character === '*') {
        return '.*';
      }
      if (character === '?') {
        return '.';
      }
      return character.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    })
    .join('');
  return new RegExp(`^${source}$`).test(subject);
}

export function validateOidcClaims(claims: OidcTokenClaims, policy: OidcTrustPolicy, now: number): OidcValidationResult {
  if (claims.iss !== policy.expectedIssuer) {
    throw new Error('Invalid OIDC issuer');
  }
  if (claims.aud !== policy.expectedAudience) {
    throw new Error('Invalid OIDC audience');
  }
  if (claims.exp <= now) {
    throw new Error('OIDC token expired');
  }
  if (!policy.allowedRepositories.includes(claims.repository)) {
    return { authorized: false, reason: 'Repository not allowed by OIDC policy' };
  }
  if (!policy.allowedSubjects.some((pattern) => matchesSubject(pattern, claims.sub))) {
    return { authorized: false, reason: 'Subject not allowed by OIDC policy' };
  }
  return { authorized: true, reason: 'OIDC token claims validated and authorized' };
}
