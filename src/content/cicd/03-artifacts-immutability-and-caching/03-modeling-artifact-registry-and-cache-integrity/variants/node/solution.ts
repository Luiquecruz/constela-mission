export interface RegistrationResult {
  registered: boolean;
  digest: string;
}

const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/i;

export class ArtifactRegistry {
  private readonly versions = new Map<string, Map<string, string>>();

  register(name: string, version: string, digest: string): RegistrationResult {
    if (!DIGEST_PATTERN.test(digest)) {
      throw new Error('Invalid SHA256 digest format');
    }
    const normalized = digest.toLowerCase();
    const known = this.versions.get(name) ?? new Map<string, string>();
    const existing = known.get(version);

    if (existing === undefined) {
      known.set(version, normalized);
      this.versions.set(name, known);
      return { registered: true, digest: normalized };
    }
    if (existing !== normalized) {
      throw new Error(`Artifact ${name}:${version} is immutable`);
    }
    return { registered: false, digest: existing };
  }

  resolve(name: string, version: string): string {
    const digest = this.versions.get(name)?.get(version);
    if (digest === undefined) {
      throw new Error(`Artifact ${name}:${version} not found`);
    }
    return digest;
  }

  listVersions(name: string): string[] {
    return [...(this.versions.get(name)?.keys() ?? [])];
  }
}
