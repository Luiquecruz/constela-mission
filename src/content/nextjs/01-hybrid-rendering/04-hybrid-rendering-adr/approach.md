1. Set `adr.status = 'accepted'` and `adr.layer = 'hybrid-rendering'`.
2. Write `adr.context` (>= 80 chars) describing PulseCommerce's `340 KB` client `bundle` and how migrating to Next.js `Server Components` eliminates unnecessary client JavaScript and protects wholesale data.
3. Write `adr.decision` (>= 40 chars) starting with `'We will'` (for example: `'We will render static and confidential product sections as Server Components, isolate interactive variant state in leaf Client Components, and use next/form for search navigation.'`).
4. Populate `adr.alternatives` with at least 2 rejected options (e.g., keeping the entire page as a `'use client'` SPA, or using POST Server Actions for search queries) and `adr.consequences` with `positive` (>= 2 items) and `negative` (>= 1 item).
5. Map all 4 components in `componentBoundaries` to their coherent boundary (`'server-component'`, `'server-component'`, `'client-component'`, and `'next-form'`).
