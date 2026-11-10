import React, { useState } from 'react';

export interface CourseRecord {
  slug: string;
  title: string;
  summary: string;
}

const COURSES: Record<string, CourseRecord> = {
  'app-router': {
    slug: 'app-router',
    title: 'App Router Foundations',
    summary: 'File-system routing, nested layouts, templates, and segment boundaries.',
  },
  'server-actions': {
    slug: 'server-actions',
    title: 'Server Actions & Forms',
    summary: 'Progressive form mutations with Server Actions and optimistic UI.',
  },
};

export interface SegmentBoundaryShellProps {
  isLoading?: boolean;
  error?: Error | string | null;
  isNotFound?: boolean;
  onRetry?: () => void;
  children?: React.ReactNode;
}

// TODO: Handle error (role="alert" + "Try again"), isLoading (role="status"),
// and isNotFound ("Resource not found") before rendering children.
export function SegmentBoundaryShell({
  isLoading = false,
  error = null,
  isNotFound = false,
  onRetry,
  children,
}: SegmentBoundaryShellProps) {
  return <div data-testid="segment-content">{children}</div>;
}

type BoundaryMode = 'loaded' | 'loading' | 'error' | 'not-found';

export function CourseViewerApp() {
  const [slug, setSlug] = useState('app-router');
  const [mode, setMode] = useState<BoundaryMode>('loaded');
  const [layoutNote, setLayoutNote] = useState('');

  const course = COURSES[slug] ?? null;
  const effectiveNotFound = mode === 'not-found' || (mode === 'loaded' && !course);
  const effectiveError = mode === 'error' ? new Error('Failed to load course module') : null;

  return (
    <section
      data-testid="course-layout-shell"
      style={{ fontFamily: 'sans-serif', maxWidth: 720, margin: '0 auto', padding: 16 }}
    >
      <header style={{ borderBottom: '2px solid #cbd5e1', paddingBottom: 12, marginBottom: 14 }}>
        <h2 style={{ margin: '0 0 8px 0' }}>Course Layout Shell (Always Mounted)</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <label htmlFor="persistent-layout-notes">Layout notes:</label>
          <input
            id="persistent-layout-notes"
            aria-label="Persistent layout notes"
            type="text"
            placeholder="Stays intact across boundary states..."
            value={layoutNote}
            onChange={(event) => setLayoutNote(event.target.value)}
            style={{ flex: 1, minWidth: 220, padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
          />
        </div>
      </header>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        <span>Courses:</span>
        {['app-router', 'server-actions', 'missing-slug'].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setSlug(item);
              setMode(item === 'missing-slug' ? 'not-found' : 'loaded');
            }}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              background: slug === item ? '#0f172a' : '#f8fafc',
              color: slug === item ? '#ffffff' : '#0f172a',
            }}
          >
            {item}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        <span>Simulate boundary:</span>
        {(
          [
            ['loaded', 'Loaded'],
            ['loading', 'Loading'],
            ['error', 'Error'],
            ['not-found', 'Not Found'],
          ] as const
        ).map(([nextMode, label]) => (
          <button
            key={nextMode}
            type="button"
            onClick={() => setMode(nextMode)}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              background: mode === nextMode ? '#0284c7' : '#ffffff',
              color: mode === nextMode ? '#ffffff' : '#0f172a',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <SegmentBoundaryShell
        isLoading={mode === 'loading'}
        error={effectiveError}
        isNotFound={effectiveNotFound}
        onRetry={() => setMode('loaded')}
      >
        {course ? (
          <article style={{ padding: 14, border: '1px solid #cbd5e1', borderRadius: 8 }}>
            <h3 style={{ margin: '0 0 6px 0' }}>{course.title}</h3>
            <p style={{ margin: 0 }}>{course.summary}</p>
          </article>
        ) : (
          <p>No course selected.</p>
        )}
      </SegmentBoundaryShell>
    </section>
  );
}

export default CourseViewerApp;
