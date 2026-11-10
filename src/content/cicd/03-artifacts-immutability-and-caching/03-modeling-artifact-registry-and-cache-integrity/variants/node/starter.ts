export interface RegistrationResult {
  registered: boolean;
  digest: string;
}

export class ArtifactRegistry {
  register(name: string, version: string, digest: string): RegistrationResult {
    // TODO: reject a digest that is not "sha256:" followed by 64 hexadecimal characters.
    // TODO: store the digest in lower case; accept the same digest again, refuse a different one for a published version.
    return { registered: false, digest };
  }

  resolve(name: string, version: string): string {
    // TODO: return the digest of a published version or throw when it was never registered.
    return '';
  }

  listVersions(name: string): string[] {
    // TODO: return the versions of an artifact in the order they were first registered.
    return [];
  }
}
