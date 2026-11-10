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

// TODO: Complete the ADR and domain caching plan for MercadoPulse
export const adr: CachingADR = {
  id: 'ADR-003',
  title: 'TODO',
  status: 'proposed',
  layer: 'caching',
  context: 'TODO',
  decision: 'TODO',
  alternatives: [],
  consequences: {
    positive: [],
    negative: [],
  },
};

export const cachingPlan: DomainCachingRule[] = [];
