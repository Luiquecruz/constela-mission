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
  const sanitizedArgs = args.map((arg) => {
    if (typeof arg === 'object' && arg !== null && !Array.isArray(arg)) {
      const { children: _children, ...rest } = arg as Record<string, unknown>;
      return rest;
    }
    return arg;
  });

  return `${buildId}:${fnId}:${JSON.stringify(sanitizedArgs)}:${JSON.stringify(closureVars ?? {})}`;
}

export function mergeCacheLifetimes(profiles: CacheLifeProfile[]): CacheLifeProfile {
  if (profiles.length === 0) {
    return { ...BUILTIN_PROFILES.hours };
  }
  return {
    stale: Math.min(...profiles.map((p) => p.stale)),
    revalidate: Math.min(...profiles.map((p) => p.revalidate)),
    expire: Math.min(...profiles.map((p) => p.expire)),
  };
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

interface CacheEntry<T> {
  value: T;
  createdAt: number;
  inFlight?: Promise<T>;
}

function resolveProfile(
  profile: CreateCachedFunctionOptions['profile'],
  customProfiles?: Record<string, CacheLifeProfile>,
): CacheLifeProfile {
  if (!profile) {
    return BUILTIN_PROFILES.hours;
  }
  if (typeof profile === 'string') {
    if (customProfiles && profile in customProfiles) {
      return customProfiles[profile];
    }
    if (profile in BUILTIN_PROFILES) {
      return BUILTIN_PROFILES[profile as BuiltinProfileName];
    }
    throw new Error(`Unknown cacheLife profile: ${profile}`);
  }
  return profile;
}

export function createCachedFunction<TArgs extends unknown[], TResult>(
  options: CreateCachedFunctionOptions,
  loader: (...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<CachedResult<TResult>> {
  const clock = options.now ?? (() => Date.now());
  const resolvedProfile = resolveProfile(options.profile, options.customProfiles);
  const store = new Map<string, CacheEntry<TResult>>();

  return async (...args: TArgs): Promise<CachedResult<TResult>> => {
    const key = buildCacheKey({
      buildId: options.buildId,
      fnId: options.fnId,
      args,
      closureVars: options.closureVars,
    });

    const currentTime = clock();
    const existing = store.get(key);

    if (existing) {
      const ageMs = currentTime - existing.createdAt;
      const revalidateMs = resolvedProfile.revalidate * 1000;
      const expireMs = resolvedProfile.expire * 1000;

      if (ageMs < revalidateMs) {
        return {
          value: existing.value,
          status: 'HIT',
          profile: resolvedProfile,
        };
      }

      if (ageMs < expireMs) {
        if (!existing.inFlight) {
          existing.inFlight = Promise.resolve(loader(...args))
            .then((freshValue) => {
              store.set(key, {
                value: freshValue,
                createdAt: clock(),
              });
              return freshValue;
            })
            .finally(() => {
              const current = store.get(key);
              if (current) {
                delete current.inFlight;
              }
            });
        }

        return {
          value: existing.value,
          status: 'STALE',
          profile: resolvedProfile,
        };
      }
    }

    const freshValue = await loader(...args);
    store.set(key, {
      value: freshValue,
      createdAt: clock(),
    });

    return {
      value: freshValue,
      status: 'MISS',
      profile: resolvedProfile,
    };
  };
}
