export interface CacheLifeProfile {
  stale: number;
  revalidate: number;
  expire: number;
}

export type BuiltinProfileName = 'hours' | 'days' | 'max';

export const BUILTIN_PROFILES: Record<BuiltinProfileName, CacheLifeProfile> = {
  hours: { stale: 300, revalidate: 3600, expire: 86400 },
  days: { stale: 300, revalidate: 86400, expire: 604800 },
  max: { stale: 300, revalidate: 2592000, expire: 31536000 },
};

export interface CacheKeyInput {
  buildId: string;
  fnId: string;
  args: unknown[];
  closureVars?: Record<string, unknown>;
}

export function buildCacheKey({ buildId, fnId, args, closureVars }: CacheKeyInput): string {
  // TODO: Strip top-level 'children' from plain-object args and return
  // `${buildId}:${fnId}:${JSON.stringify(sanitizedArgs)}:${JSON.stringify(closureVars ?? {})}`
  void buildId;
  void fnId;
  void args;
  void closureVars;
  return '';
}

export function mergeCacheLifetimes(profiles: CacheLifeProfile[]): CacheLifeProfile {
  // TODO: Return the minimum stale, revalidate, and expire values across all profiles
  return profiles[0] ?? BUILTIN_PROFILES.hours;
}

export interface CreateCachedFunctionOptions {
  buildId: string;
  fnId: string;
  profile?: BuiltinProfileName | string | CacheLifeProfile;
  customProfiles?: Record<string, CacheLifeProfile>;
  closureVars?: Record<string, unknown>;
  now?: () => number;
}

export interface CachedResult<T> {
  value: T;
  status: 'HIT' | 'STALE' | 'MISS';
  profile: CacheLifeProfile;
}

export function createCachedFunction<TArgs extends unknown[], TResult>(
  options: CreateCachedFunctionOptions,
  loader: (...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<CachedResult<TResult>> {
  // TODO: Implement HIT (< revalidate), STALE (>= revalidate && < expire with deduplicated background refresh),
  // and MISS (cold or >= expire)
  return async (...args: TArgs) => {
    const value = await loader(...args);
    return {
      value,
      status: 'MISS',
      profile: BUILTIN_PROFILES.hours,
    };
  };
}
