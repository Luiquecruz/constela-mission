import React, { useState } from 'react';

export interface SegmentLayer {
  segment: string;
  kind: 'layout' | 'template' | 'page';
  file: string;
}

const ROUTES = ['/dashboard', '/dashboard/billing', '/dashboard/settings'] as const;

// TODO 1: Return the ordered SegmentLayer[] from root layout down to the leaf page
export function resolveSegmentChain(pathname: string): SegmentLayer[] {
  return [{ segment: '/', kind: 'layout', file: 'app/layout.tsx' }];
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [note, setNote] = useState('');
  const [layoutCount, setLayoutCount] = useState(0);

  return (
    <div
      data-testid="dashboard-layout"
      style={{ border: '2px solid #0284c7', borderRadius: 8, padding: 14, marginTop: 12 }}
    >
      <h3 style={{ margin: '0 0 8px 0' }}>app/dashboard/layout.tsx (Persistent)</h3>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <input
          aria-label="Layout note"
          type="text"
          placeholder="Type persistent note..."
          value={note}
          onChange={(event) => setNote(event.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
        />
        <button type="button" onClick={() => setLayoutCount((c) => c + 1)}>
          Increment layout counter
        </button>
        <span>Layout counter: {layoutCount}</span>
      </div>
      {children}
    </div>
  );
}

function DashboardTemplate({
  activePath,
  children,
}: {
  activePath: string;
  children: React.ReactNode;
}) {
  const [templateCount, setTemplateCount] = useState(0);

  return (
    <div
      data-testid="dashboard-template"
      style={{ border: '2px dashed #7c3aed', borderRadius: 8, padding: 14, background: '#faf5ff' }}
    >
      <h4 style={{ margin: '0 0 8px 0' }}>
        app/dashboard/template.tsx (Fresh per navigation — {activePath})
      </h4>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
        <button type="button" onClick={() => setTemplateCount((c) => c + 1)}>
          Increment template counter
        </button>
        <span>Template counter: {templateCount}</span>
      </div>
      {children}
    </div>
  );
}

export function LayoutVsTemplateDemo() {
  const [activePath, setActivePath] = useState<string>('/dashboard');
  const chain = resolveSegmentChain(activePath);

  return (
    <section style={{ fontFamily: 'sans-serif', maxWidth: 700, margin: '0 auto', padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Layouts vs. Templates</h2>

      <nav aria-label="Dashboard routes" style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {ROUTES.map((route) => (
          <button
            key={route}
            type="button"
            aria-current={activePath === route ? 'page' : undefined}
            onClick={() => setActivePath(route)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              background: activePath === route ? '#0f172a' : '#f8fafc',
              color: activePath === route ? '#ffffff' : '#0f172a',
              cursor: 'pointer',
            }}
          >
            {route}
          </button>
        ))}
      </nav>

      <div data-testid="segment-chain" style={{ fontSize: 13, color: '#334155', marginBottom: 8 }}>
        <strong>Active layer stack:</strong>{' '}
        {chain.map((layer) => layer.file).join(' → ')}
      </div>

      <DashboardLayout>
        {/* TODO 2: Ensure DashboardTemplate remounts with fresh state whenever activePath changes */}
        <DashboardTemplate activePath={activePath}>
          <div style={{ padding: 10, background: '#ffffff', borderRadius: 6, border: '1px solid #e2e8f0' }}>
            <strong>Leaf Page:</strong> <code>{activePath}</code>
          </div>
        </DashboardTemplate>
      </DashboardLayout>
    </section>
  );
}

export default LayoutVsTemplateDemo;
