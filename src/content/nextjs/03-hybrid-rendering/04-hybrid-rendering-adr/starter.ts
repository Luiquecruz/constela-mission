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

// TODO 1: Complete the PulseCommerce Hybrid Rendering ADR
export const adr: HybridRenderingAdr = {
  id: 'ADR-001',
  title: 'PulseCommerce Product Page Hybrid Rendering Boundaries',
  status: 'proposed', // Fix to 'accepted'
  layer: 'hybrid-rendering',
  context: 'TODO: Explain the client bundle problem and why Server Components are needed.',
  decision: 'TODO: Start with "We will" and explain the boundary strategy.',
  alternatives: [],
  consequences: {
    positive: [],
    negative: [],
  },
};

// TODO 2: Assign the coherent boundary for each of the 4 PulseCommerce components
export const componentBoundaries: ComponentBoundaryDecision[] = [
  {
    component: 'ProductMarkdownSpecification',
    boundary: 'client-component', // Fix boundary and reason
    reason: 'TODO',
  },
  {
    component: 'SupplierWholesaleMarginCalculator',
    boundary: 'client-component', // Fix boundary and reason
    reason: 'TODO',
  },
  {
    component: 'InteractiveSizeAndColorPicker',
    boundary: 'server-component', // Fix boundary and reason
    reason: 'TODO',
  },
  {
    component: 'CatalogFilterSearchForm',
    boundary: 'client-component', // Fix boundary and reason
    reason: 'TODO',
  },
];
