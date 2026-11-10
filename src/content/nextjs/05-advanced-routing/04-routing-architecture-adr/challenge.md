# Challenge: CloudStudio Routing Architecture ADR

Author the **Architectural Decision Record (`adr`)** and **Requirement-to-Pattern Matrix (`routingDecisions`)** in `adr.ts` for CloudStudio's Next.js App Router architecture.

## Requirements

1. **`adr` (`RoutingADR`)**:
   - `id`: non-empty string (e.g. `'ADR-005'`).
   - `title`: descriptive title (> 5 characters).
   - `status`: `'accepted'`.
   - `layer`: `'routing'`.
   - `context`: at least 80 characters explaining the multi-shell, **parallel** slot, and **intercept**ing modal forces in CloudStudio (must mention both `parallel` and `intercept` case-insensitively).
   - `decision`: at least 40 characters starting with `'We will'` stating the chosen routing architecture.
   - `alternatives`: at least **2** distinct rejected alternatives, each with `option` (> 3 chars) and `reason` (>= 20 chars).
   - `consequences.positive`: at least **2** positive architectural outcomes.
   - `consequences.negative`: at least **1** operational trade-off or maintenance cost.

2. **`routingDecisions` (`RoutingDecisionItem[]`)**:
   Map each `CloudStudioRequirement` to its exact `RoutingPattern` with a clear `reason` (>= 20 characters):
   - `'marketing-vs-console-layouts'` -> `'route-groups'`
   - `'asset-preview-overlay'` -> `'parallel-and-intercepting'`
   - `'independent-billing-and-usage-panels'` -> `'parallel-slots'`
   - `'missing-default-fallback-guard'` -> `'slot-default-tsx'`

