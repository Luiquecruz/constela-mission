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
  navigationType,
  previousState,
}: ResolveParallelSlotsInput): ResolveParallelSlotsResult {
  const rendered: Record<string, string | null> = {};

  for (const [slotName, slot] of Object.entries(slots)) {
    if (Object.prototype.hasOwnProperty.call(slot.routes, pathname)) {
      rendered[slotName] = slot.routes[pathname];
    } else if (
      navigationType === 'soft' &&
      previousState &&
      previousState[slotName] !== undefined
    ) {
      rendered[slotName] = previousState[slotName];
    } else if (slot.defaultView === 'notFound') {
      return {
        status: 404,
        missingSlot: slotName,
        rendered: null,
      };
    } else if (slot.defaultView !== undefined) {
      rendered[slotName] = slot.defaultView;
    } else {
      return {
        status: 'build-error',
        missingSlot: slotName,
        rendered: null,
      };
    }
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
  const [state, setState] = useState(() => {
    const initial = resolveParallelSlots({
      slots: DASHBOARD_SLOTS,
      pathname: '/',
      navigationType: 'soft',
      previousState: null,
    });
    return {
      pathname: '/',
      navigationType: 'soft' as 'soft' | 'hard',
      result: initial,
    };
  });

  const navigate = (nextPath: string, nextNavType: 'soft' | 'hard') => {
    setState((prev) => {
      const nextResult = resolveParallelSlots({
        slots: DASHBOARD_SLOTS,
        pathname: nextPath,
        navigationType: nextNavType,
        previousState: prev.result.rendered,
      });
      return {
        pathname: nextPath,
        navigationType: nextNavType,
        result: nextResult,
      };
    });
  };

  return (
    <div className="p-4 space-y-4">
      <h1>Parallel Routes Inspector</h1>
      <p>
        Current Path: <span>{state.pathname}</span> ({state.navigationType})
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => navigate('/settings', 'soft')}
        >
          Soft navigate to /settings
        </button>
        <button
          type="button"
          onClick={() => navigate('/settings', 'hard')}
        >
          Hard reload /settings
        </button>
        <button
          type="button"
          onClick={() => navigate('/', 'soft')}
        >
          Return to /
        </button>
      </div>
      {state.result.status === 200 && state.result.rendered ? (
        <div className="grid grid-cols-2 gap-4">
          <section aria-label="Children Slot">
            <h2>@children</h2>
            <p>{state.result.rendered.children}</p>
          </section>
          <section aria-label="Analytics Slot">
            <h2>@analytics</h2>
            <p>{state.result.rendered.analytics}</p>
          </section>
        </div>
      ) : (
        <div role="alert">
          {state.result.status === 'build-error'
            ? `Build Error: Missing default.tsx for slot ${state.result.missingSlot}`
            : `404 Not Found: default.tsx called notFound() in slot ${state.result.missingSlot}`}
        </div>
      )}
    </div>
  );
}

export default ParallelDashboardApp;
