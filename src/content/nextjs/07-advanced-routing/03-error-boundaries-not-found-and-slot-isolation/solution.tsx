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
  const [analyticsError, setAnalyticsError] = useState(initialAnalyticsError);
  const [missingInvoice, setMissingInvoice] = useState(initialMissingInvoice);

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <section aria-label="Main Workspace" className="border p-4 rounded space-y-3">
        <h2>Main Workspace</h2>
        <button type="button" onClick={() => setEdits((c) => c + 1)}>
          Increment workspace edits (count: {edits})
        </button>

        {missingInvoice ? (
          <div className="border-t pt-3">
            <h3>Invoice not found</h3>
            <p>Could not find requested invoice #INV-999.</p>
            <button type="button" onClick={() => setMissingInvoice(false)}>
              Back to invoices
            </button>
          </div>
        ) : (
          <div className="border-t pt-3">
            <p>Invoice #INV-100: Paid</p>
            <button type="button" onClick={() => setMissingInvoice(true)}>
              Open missing invoice #INV-999
            </button>
          </div>
        )}
      </section>

      <section aria-label="Analytics Slot" className="border p-4 rounded space-y-3">
        <h2>Analytics Slot</h2>
        {analyticsError ? (
          <div role="alert" className="space-y-2">
            <h3>Analytics failed to load</h3>
            <button type="button" onClick={() => setAnalyticsError(false)}>
              Retry analytics
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p>Live conversion: 4.8%</p>
            <button type="button" onClick={() => setAnalyticsError(true)}>
              Trigger analytics error
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default IsolatedWorkspace;
