export interface CachingAlternative {
  option: string;
  reason: string;
}

export interface CachingADR {
  id: string;
  title: string;
  status: 'proposed' | 'accepted' | 'deprecated';
  layer: 'caching';
  context: string;
  decision: string;
  alternatives: CachingAlternative[];
  consequences: {
    positive: string[];
    negative: string[];
  };
}

export type MarketplaceDomain =
  | 'navigation-taxonomy'
  | 'product-catalog'
  | 'seller-price-edit'
  | 'checkout-stock-hold';

export interface DomainCachingRule {
  domain: MarketplaceDomain;
  strategy: 'use-cache' | 'dynamic-suspense';
  invalidation: 'revalidateTag' | 'updateTag' | 'none';
  reason: string;
}

export const adr: CachingADR = {
  id: 'ADR-003',
  title: 'Declarative Caching and Tag Invalidation Strategy for MercadoPulse',
  status: 'accepted',
  layer: 'caching',
  context:
    'MercadoPulse serves shared taxonomy and product catalog data alongside interactive seller price mutations and live checkout stock locks. With cacheComponents enabled, we must avoid serving stale inventory locks or stale seller edits while keeping shared storefront pages fast.',
  decision:
    'We will opt shared taxonomy and catalog loaders into "use cache" with cacheLife profiles and revalidateTag webhooks, use updateTag inside seller Server Actions for immediate read-your-own-writes consistency, and stream checkout stock holds dynamically inside Suspense without caching.',
  alternatives: [
    {
      option: 'Route-wide static revalidation with export const revalidate = 3600',
      reason: 'Forces uniform lifetimes across an entire route and risks caching live checkout stock holds or showing sellers outdated prices after form submissions.',
    },
    {
      option: 'Uncached dynamic rendering for every marketplace query',
      reason: 'Eliminates staleness but creates unnecessary database load and slower Time to First Byte for globally shared taxonomy and product catalog pages.',
    },
  ],
  consequences: {
    positive: [
      'Shared navigation and catalog queries are served from cache and refreshed asynchronously via revalidateTag without blocking shoppers.',
      'Sellers immediately see their updated product prices after submitting Server Actions via updateTag.',
      'Checkout inventory holds are never cached across buyers, preventing double-reservation race conditions.',
    ],
    negative: [
      'Engineers must maintain consistent cacheTag naming conventions across Data Access Layer functions, webhooks, and Server Actions.',
    ],
  },
};

export const cachingPlan: DomainCachingRule[] = [
  {
    domain: 'navigation-taxonomy',
    strategy: 'use-cache',
    invalidation: 'revalidateTag',
    reason: 'Shared by all visitors and updated weekly via CMS webhook; background stale-while-revalidate keeps navigation fast.',
  },
  {
    domain: 'product-catalog',
    strategy: 'use-cache',
    invalidation: 'revalidateTag',
    reason: 'Shared public catalog updated hourly by supplier webhook where brief staleness during background refresh is acceptable.',
  },
  {
    domain: 'seller-price-edit',
    strategy: 'use-cache',
    invalidation: 'updateTag',
    reason: 'Product listings are cached for shoppers, but seller Server Actions must call updateTag so the seller immediately sees their updated price.',
  },
  {
    domain: 'checkout-stock-hold',
    strategy: 'dynamic-suspense',
    invalidation: 'none',
    reason: 'Per-user live inventory lock verified on every checkout request; must stream dynamically inside Suspense and never be cached.',
  },
];
