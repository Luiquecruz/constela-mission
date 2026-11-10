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

// TODO: Complete the accepted Routing ADR and requirement-to-pattern matrix
export const adr: RoutingADR = {
  id: 'ADR-005',
  title: 'CloudStudio Routing Architecture',
  status: 'proposed',
  layer: 'routing',
  context: '',
  decision: '',
  alternatives: [],
  consequences: {
    positive: [],
    negative: [],
  },
};

export const routingDecisions: RoutingDecisionItem[] = [];

