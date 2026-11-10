export type RoutingPattern =
  | 'route-groups'
  | 'parallel-and-intercepting'
  | 'parallel-slots'
  | 'slot-default-tsx';

export type CloudStudioRequirement =
  | 'marketing-vs-console-layouts'
  | 'asset-preview-overlay'
  | 'independent-billing-and-usage-panels'
  | 'missing-default-fallback-guard';

export interface RoutingDecisionItem {
  requirement: CloudStudioRequirement;
  pattern: RoutingPattern;
  reason: string;
}

export interface RoutingADR {
  id: string;
  title: string;
  status: 'proposed' | 'accepted' | 'deprecated';
  layer: 'routing';
  context: string;
  decision: string;
  alternatives: Array<{ option: string; reason: string }>;
  consequences: {
    positive: string[];
    negative: string[];
  };
}

export const adr: RoutingADR = {
  id: 'ADR-005',
  title: 'CloudStudio App Router Layout, Parallel Slot, and Modal Architecture',
  status: 'accepted',
  layer: 'routing',
  context:
    'CloudStudio requires separate root shells for marketing and the workspace console, independent streaming and error isolation on billing panels via parallel routes, and shareable asset preview overlays using intercepting routes.',
  decision:
    'We will partition root shells with Route Groups, isolate multi-panel dashboards and modals with Parallel Routes (@slot) guarded by default.tsx, and pair @modal with Intercepting Routes for asset previews.',
  alternatives: [
    {
      option: 'Client-state modal with query parameters (?assetId=123)',
      reason:
        'Fails to render a dedicated standalone Server Component asset page automatically on hard navigation or direct link sharing.',
    },
    {
      option: 'URL-prefixed folders (/marketing/* and /console/*)',
      reason:
        'Pollutes public marketing and workspace URLs with internal organizational folder names instead of keeping clean paths.',
    },
  ],
  consequences: {
    positive: [
      'Each billing panel (@invoices, @usage) streams and recovers from errors via its own error.tsx without unmounting sibling panels.',
      'Soft navigation from /gallery opens /asset/[id] in a modal overlay while hard refreshes render the canonical standalone asset page.',
    ],
    negative: [
      'Engineers must maintain default.tsx fallbacks across every parallel slot to satisfy build-time verification and define hard-reload behavior on sub-routes.',
    ],
  },
};

export const routingDecisions: RoutingDecisionItem[] = [
  {
    requirement: 'marketing-vs-console-layouts',
    pattern: 'route-groups',
    reason:
      'Route Groups ((marketing) and (console)) allow distinct root layouts without adding URL path prefixes.',
  },
  {
    requirement: 'asset-preview-overlay',
    pattern: 'parallel-and-intercepting',
    reason:
      'Combining @modal with (.)asset/[id] renders an overlay on soft navigation and the canonical asset page on hard reload.',
  },
  {
    requirement: 'independent-billing-and-usage-panels',
    pattern: 'parallel-slots',
    reason:
      'Parallel @slot directories give the billing and usage panels independent loading.tsx and error.tsx boundaries.',
  },
  {
    requirement: 'missing-default-fallback-guard',
    pattern: 'slot-default-tsx',
    reason:
      'Providing default.tsx in each parallel slot satisfies Next.js build verification and defines hard-reload fallback rendering when a slot lacks the active sub-route.',
  },
];
