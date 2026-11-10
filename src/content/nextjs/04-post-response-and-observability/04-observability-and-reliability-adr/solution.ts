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

export const adr: ObservabilityADR = {
  id: 'ADR-004',
  title: 'FinLedger Post-Response Execution and Server Observability Architecture',
  status: 'accepted',
  layer: 'observability',
  context:
    'FinLedger triggers both best-effort telemetry and critical financial workflows during checkout. We need clear boundaries between Next.js after() post-response callbacks, durable queues, and centralized error reporting via onRequestError in instrumentation.ts.',
  decision:
    'We will schedule sub-second best-effort telemetry and cache warming in next/server after(), dispatch financial settlements and payment captures to a durable queue, and standardize server exception tracking with onRequestError and runtime-aware OpenTelemetry registration.',
  alternatives: [
    {
      option: 'Run all checkout background tasks inside next/server after()',
      reason:
        'Rejected because after() has no persistence across pod crashes or invocation timeouts, risking lost tax settlements and uncaptured payments.',
    },
    {
      option: 'Route every analytics beacon and cache warm through the durable queue',
      reason:
        'Rejected because synchronous broker enqueueing adds unnecessary latency and infrastructure cost for high-frequency, best-effort telemetry.',
    },
  ],
  consequences: {
    positive: [
      'Zero TTFB overhead for pageview analytics and read-cache warming via after() and waitUntil().',
      'Guaranteed multi-hour retries and dead-letter visibility for legally required tax settlements and payment captures.',
      'Unified server error correlation across Node.js and Edge runtimes using onRequestError and err.digest.',
    ],
    negative: [
      'Engineers must maintain both Next.js post-response hooks and external durable queue workers.',
    ],
  },
};

export const taskDispatchPlan: TaskDispatchEntry[] = [
  {
    task: 'analytics-pageview-beacon',
    mechanism: 'after',
    reason:
      'Best-effort sub-second telemetry that should never add latency to the HTTP response and is safe to drop on rare pod crashes.',
  },
  {
    task: 'search-cache-warm',
    mechanism: 'after',
    reason:
      'Idempotent and non-critical read cache warming that runs right after the product update response flushes.',
  },
  {
    task: 'invoice-tax-settlement',
    mechanism: 'durable-queue',
    reason:
      'Legally required financial ledger entry requiring multi-hour retry guarantees and persistence across container restarts.',
  },
  {
    task: 'payment-capture-webhook',
    mechanism: 'durable-queue',
    reason:
      'Critical customer card charge and atomic order state transition requiring durable retries and dead-letter queue recovery.',
  },
];
