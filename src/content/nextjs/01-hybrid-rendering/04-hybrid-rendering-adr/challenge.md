# Challenge: PulseCommerce Hybrid Rendering ADR

**PulseCommerce** is migrating its legacy client-heavy SPA product page (`340 KB` client JS bundle) to the Next.js App Router. Complete the Architecture Decision Record (`adr`) and component boundary assignments (`componentBoundaries`) in `adr.ts`.

## Briefing: The 4 PulseCommerce Components

1. **`'ProductMarkdownSpecification'`**: Uses a `180 KB` Markdown + syntax highlighter library to render static product specifications from the database; requires zero browser interactivity.
2. **`'SupplierWholesaleMarginCalculator'`**: Reads confidential supplier wholesale contracts on the server to compute public retail price tiers; requires zero browser state.
3. **`'InteractiveSizeAndColorPicker'`**: Uses `useState` to track the selected SKU variant and dispatches custom browser events to the cart drawer.
4. **`'CatalogFilterSearchForm'`**: Navigates to `/search?q=...` using URL search parameters with route layout and loading state prefetching.

## Requirements

1. **`adr` Export**:
   - `id`: non-empty string (e.g., `'ADR-001'`).
   - `title`: non-empty string describing the PulseCommerce hybrid rendering decision.
   - `status`: must be `'accepted'`.
   - `layer`: must be `'hybrid-rendering'`.
   - `context`: at least `80` characters explaining the migration problem, explicitly mentioning both `bundle` and `Server Components`.
   - `decision`: at least `40` characters starting with `'We will'` describing the hybrid rendering strategy.
   - `alternatives`: at least `2` distinct `{ option, reason }` objects (each `reason` at least `20` characters).
   - `consequences`: `{ positive: string[], negative: string[] }` with at least `2` items in `positive` and at least `1` item in `negative`.

2. **`componentBoundaries` Export**:
   - Classify all four PulseCommerce components with `{ component, boundary, reason }` (each `reason` at least `20` characters):
     - `'ProductMarkdownSpecification'` -> `'server-component'`
     - `'SupplierWholesaleMarginCalculator'` -> `'server-component'`
     - `'InteractiveSizeAndColorPicker'` -> `'client-component'`
     - `'CatalogFilterSearchForm'` -> `'next-form'`
