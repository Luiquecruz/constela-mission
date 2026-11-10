export type BoundaryChoice = 'server-component' | 'client-component' | 'next-form';

export type PulseComponentName =
  | 'ProductMarkdownSpecification'
  | 'SupplierWholesaleMarginCalculator'
  | 'InteractiveSizeAndColorPicker'
  | 'CatalogFilterSearchForm';

export interface ComponentBoundaryDecision {
  component: PulseComponentName;
  boundary: BoundaryChoice;
  reason: string;
}

export interface HybridRenderingAdr {
  id: string;
  title: string;
  status: 'proposed' | 'accepted' | 'deprecated';
  layer: 'hybrid-rendering';
  context: string;
  decision: string;
  alternatives: Array<{
    option: string;
    reason: string;
  }>;
  consequences: {
    positive: string[];
    negative: string[];
  };
}

export const adr: HybridRenderingAdr = {
  id: 'ADR-001',
  title: 'PulseCommerce Product Page Hybrid Rendering Boundaries',
  status: 'accepted',
  layer: 'hybrid-rendering',
  context:
    'PulseCommerce currently ships a 340 KB client JavaScript bundle on its product page, exposing wholesale pricing logic and slowing mobile Time to First Byte. Migrating to Next.js Server Components lets us keep heavy parsers and confidential calculations on the server.',
  decision:
    'We will render static markdown specifications and confidential wholesale margin calculations in Server Components, isolate variant selection in a leaf Client Component, and use next/form for progressive URL search navigation.',
  alternatives: [
    {
      option: 'Keep the entire product route as a single Client Component SPA shell',
      reason:
        'Rejected because shipping the 180 KB markdown library to the browser inflates the bundle and risks leaking wholesale pricing logic.',
    },
    {
      option: 'Use a POST Server Action for the catalog search filter form',
      reason:
        'Rejected because search queries belong in shareable URL search parameters with prefetched layouts rather than POST mutations.',
    },
  ],
  consequences: {
    positive: [
      'Eliminates 180 KB of markdown and syntax-highlighting JavaScript from the client bundle.',
      'Keeps confidential supplier wholesale contracts strictly on the server behind server-only.',
      'Enables shareable search URLs with prefetched route layouts via next/form.',
    ],
    negative: [
      'Requires strict DTO sanitization and React Flight prop serialization across the client boundary.',
    ],
  },
};

export const componentBoundaries: ComponentBoundaryDecision[] = [
  {
    component: 'ProductMarkdownSpecification',
    boundary: 'server-component',
    reason:
      'Executes the 180 KB markdown and syntax highlighter library exclusively on the server with 0 KB added to the client bundle.',
  },
  {
    component: 'SupplierWholesaleMarginCalculator',
    boundary: 'server-component',
    reason:
      'Reads confidential wholesale contracts on the server and outputs only sanitized public retail price tiers.',
  },
  {
    component: 'InteractiveSizeAndColorPicker',
    boundary: 'client-component',
    reason:
      'Requires browser interactivity with React useState and custom DOM event dispatching for variant selection.',
  },
  {
    component: 'CatalogFilterSearchForm',
    boundary: 'next-form',
    reason:
      'Performs progressive GET navigation to /search?q=... with URL search parameters and automatic layout prefetching.',
  },
];
