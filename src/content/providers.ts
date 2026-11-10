import type { ProviderRegistry } from './types.ts';

/**
 * Platforms a track can show examples for.
 */
export const PROVIDERS: ProviderRegistry = {
  github: { label: 'GitHub Actions' },
  azure: { label: 'Azure Pipelines' },
  aws: { label: 'AWS' },
  gcp: { label: 'Google Cloud' },
};
