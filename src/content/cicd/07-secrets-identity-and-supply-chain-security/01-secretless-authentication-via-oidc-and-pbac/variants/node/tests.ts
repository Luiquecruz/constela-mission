const ISSUER = 'https://token.actions.githubusercontent.com';
const AUDIENCE = 'sts.amazonaws.com';
const MAIN = 'repo:org/api-service:ref:refs/heads/main';
const NOW = 1_700_000_000;

const claimsFor = (sub: string, overrides: Record<string, unknown> = {}) => ({
  iss: ISSUER,
  sub,
  aud: AUDIENCE,
  exp: NOW + 300,
  repository: 'org/api-service',
  ...overrides,
});

const policy = (allowedSubjects: string[]) => ({
  expectedIssuer: ISSUER,
  expectedAudience: AUDIENCE,
  allowedRepositories: ['org/api-service'],
  allowedSubjects,
});

test('authorizes a main branch token whose subject matches an exact pattern', async () => {
  const result = mod.validateOidcClaims(claimsFor(MAIN), policy([MAIN]), NOW);
  expect(result).toEqual({ authorized: true, reason: 'OIDC token claims validated and authorized' });
});

test('matches wildcard subject patterns for environments and single characters', async () => {
  const environments = policy(['repo:org/api-service:environment:*']);
  expect(mod.validateOidcClaims(claimsFor('repo:org/api-service:environment:production'), environments, NOW).authorized).toBe(true);
  expect(mod.matchesSubject('repo:org/app-?:pull_request', 'repo:org/app-1:pull_request')).toBe(true);
  expect(mod.matchesSubject('repo:org/app-?:pull_request', 'repo:org/app-12:pull_request')).toBe(false);
  expect(mod.matchesSubject('repo:org/a.b:*', 'repo:org/aXb:ref:refs/heads/main')).toBe(false);
});

test('rejects a token minted for another audience or issuer', async () => {
  expect(() => mod.validateOidcClaims(claimsFor(MAIN, { aud: 'api://AzureADTokenExchange' }), policy([MAIN]), NOW)).toThrow('Invalid OIDC audience');
  expect(() => mod.validateOidcClaims(claimsFor(MAIN, { iss: 'https://issuer.example' }), policy([MAIN]), NOW)).toThrow('Invalid OIDC issuer');
});

test('treats a token that expires at the current second as expired', async () => {
  expect(() => mod.validateOidcClaims(claimsFor(MAIN, { exp: NOW }), policy([MAIN]), NOW)).toThrow('OIDC token expired');
  expect(mod.validateOidcClaims(claimsFor(MAIN, { exp: NOW + 1 }), policy([MAIN]), NOW).authorized).toBe(true);
});

// beginner mistake: trusting every token from the right repository and never checking the subject
test('denies a pull request token even when the repository is trusted', async () => {
  const result = mod.validateOidcClaims(claimsFor('repo:org/api-service:pull_request'), policy([MAIN]), NOW);
  expect(result).toEqual({ authorized: false, reason: 'Subject not allowed by OIDC policy' });
});

test('denies a token from a repository outside the trust policy', async () => {
  const claims = claimsFor('repo:attacker/fork:ref:refs/heads/main', { repository: 'attacker/fork' });
  const result = mod.validateOidcClaims(claims, policy(['repo:*:ref:refs/heads/main']), NOW);
  expect(result).toEqual({ authorized: false, reason: 'Repository not allowed by OIDC policy' });
});
