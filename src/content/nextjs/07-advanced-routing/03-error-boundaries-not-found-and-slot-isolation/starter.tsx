import React, { useState } from 'react';

export interface IsolatedWorkspaceProps {
  initialAnalyticsError?: boolean;
  initialMissingInvoice?: boolean;
}

export function IsolatedWorkspace({
  initialAnalyticsError = false,
  initialMissingInvoice = false,
}: IsolatedWorkspaceProps) {
  const [edits, setEdits] = useState(0);

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <section aria-label="Main Workspace">
        <h2>Main Workspace</h2>
        <button type="button" onClick={() => setEdits((c) => c + 1)}>
          Increment workspace edits (count: {edits})
        </button>
        {/* TODO: Render Invoice #INV-100 or not-found.tsx UI when initialMissingInvoice / #INV-999 is active */}
        <p>Missing invoice state: {String(initialMissingInvoice)}</p>
      </section>

      <section aria-label="Analytics Slot">
        <h2>Analytics Slot</h2>
        {/* TODO: Isolate analytics error.tsx boundary from Main Workspace */}
        <p>Analytics error state: {String(initialAnalyticsError)}</p>
      </section>
    </div>
  );
}

export default IsolatedWorkspace;
