export type TaskName =
  | 'analytics-pageview-beacon'
  | 'search-cache-warm'
  | 'invoice-tax-settlement'
  | 'payment-capture-webhook';

export interface TaskDispatchEntry {
  task: TaskName;
  mechanism: 'after' | 'durable-queue';
  reason: string;
}

export interface ObservabilityADR {
  id: string;
  title: string;
  status: 'proposed' | 'accepted' | 'deprecated';
  layer: 'observability';
  context: string;
  decision: string;
  alternatives: Array<{ option: string; reason: string }>;
  consequences: {
    positive: string[];
    negative: string[];
  };
}

// TODO: Complete the ADR and classify all four FinLedger tasks in taskDispatchPlan
export const adr: ObservabilityADR = {
  id: 'ADR-004',
  title: 'FinLedger Post-Response Execution and Server Observability Architecture',
  status: 'proposed',
  layer: 'observability',
  context: 'TODO',
  decision: 'TODO',
  alternatives: [],
  consequences: {
    positive: [],
    negative: [],
  },
};

export const taskDispatchPlan: TaskDispatchEntry[] = [
  {
    task: 'analytics-pageview-beacon',
    mechanism: 'durable-queue',
    reason: 'TODO: classify mechanism and explain why',
  },
];
