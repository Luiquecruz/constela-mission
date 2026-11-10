import React, { useState } from 'react';

export interface SlotConfig {
  routes: Record<string, string | null>;
  defaultView?: string | null;
}

export interface ResolveParallelSlotsInput {
  slots: Record<string, SlotConfig>;
  pathname: string;
  navigationType: 'soft' | 'hard';
  previousState?: Record<string, string | null> | null;
}

export interface ResolveParallelSlotsResult {
  status: 200 | 404 | 'build-error';
  missingSlot: string | null;
  rendered: Record<string, string | null> | null;
}

export function resolveParallelSlots({
  slots,
  pathname,
}: ResolveParallelSlotsInput): ResolveParallelSlotsResult {
  // TODO: Implement Next.js parallel slot resolution for soft vs hard navigation,
  // default.tsx calling notFound() (status 404), and missing default.tsx ('build-error')
  const rendered: Record<string, string | null> = {};
  for (const [slotName, slot] of Object.entries(slots)) {
    rendered[slotName] = slot.routes[pathname] ?? null;
  }
  return {
    status: 200,
    missingSlot: null,
    rendered,
  };
}

export const DASHBOARD_SLOTS: Record<string, SlotConfig> = {
  children: {
    routes: {
      '/': 'Workspace Overview',
      '/settings': 'Workspace Settings',
    },
    defaultView: 'Default Workspace',
  },
  analytics: {
    routes: {
      '/': 'Live Metrics Panel',
    },
    defaultView: 'Fallback Analytics (default.tsx)',
  },
  modal: {
    routes: {},
    defaultView: null,
  },
};

export function ParallelDashboardApp() {
  const [pathname] = useState('/');
  const [navigationType] = useState<'soft' | 'hard'>('soft');

  return (
    <div className="p-4">
      <h1>Parallel Routes Inspector</h1>
      <p>Current Path: {pathname} ({navigationType})</p>
      {/* TODO: Add navigation buttons and render resolved @children and @analytics slots */}
    </div>
  );
}

export default ParallelDashboardApp;
