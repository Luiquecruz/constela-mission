import React, { useEffect, useRef, useState } from 'react';

export interface Photo {
  id: string;
  title: string;
  author: string;
}

export const PHOTOS: Photo[] = [
  { id: '1', title: 'Nebula Ridge', author: 'Ada' },
  { id: '2', title: 'Orbital Dawn', author: 'Alan' },
];

export interface RouterLike {
  back: () => void;
  push: (path: string) => void;
}

export function closeInterceptedModal(
  router: RouterLike,
  historyLength: number,
  fallbackPath = '/feed'
): void {
  if (historyLength > 1) {
    router.back();
  } else {
    router.push(fallbackPath);
  }
}

export interface PhotoFeedAppProps {
  initialPath?: string;
  initialNavType?: 'soft' | 'hard';
}

export function PhotoFeedApp({
  initialPath = '/feed',
  initialNavType = 'soft',
}: PhotoFeedAppProps) {
  const [path, setPath] = useState(initialPath);
  const [navType, setNavType] = useState<'soft' | 'hard'>(initialNavType);
  const [historyLength, setHistoryLength] = useState(1);

  const feedRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const invokerRef = useRef<HTMLButtonElement | null>(null);
  const wasModalOpenRef = useRef(false);

  const photoId = path.startsWith('/photo/') ? path.replace('/photo/', '') : null;
  const activePhoto = photoId ? PHOTOS.find((p) => p.id === photoId) ?? null : null;
  const isModalOpen = Boolean(activePhoto && navType === 'soft');

  const router: RouterLike = {
    back: () => {
      setPath('/feed');
      setNavType('soft');
      setHistoryLength((len) => Math.max(1, len - 1));
    },
    push: (targetPath: string) => {
      setPath(targetPath);
      setNavType('soft');
    },
  };

  useEffect(() => {
    const feedEl = feedRef.current;
    if (feedEl) {
      if (isModalOpen) {
        feedEl.setAttribute('inert', '');
      } else {
        feedEl.removeAttribute('inert');
      }
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (isModalOpen && dialogRef.current) {
      wasModalOpenRef.current = true;
      const firstFocusable =
        dialogRef.current.querySelector<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? dialogRef.current;
      firstFocusable.focus();
    } else if (!isModalOpen && wasModalOpenRef.current) {
      wasModalOpenRef.current = false;
      if (navType === 'soft' && invokerRef.current) {
        invokerRef.current.focus();
      }
    }
  }, [isModalOpen, activePhoto?.id, navType]);

  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeInterceptedModal(router, historyLength, '/feed');
      return;
    }

    if (event.key === 'Tab' && dialogRef.current) {
      const focusables = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!active || active === first || !dialogRef.current.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (!active || active === last || !dialogRef.current.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  if (activePhoto && navType === 'hard') {
    return (
      <main className="p-4 space-y-4">
        <h1>Canonical Photo Page: {activePhoto.title}</h1>
        <p>By {activePhoto.author}</p>
        <p>Current URL: {path}</p>
        <button type="button" onClick={() => router.push('/feed')}>
          Back to feed
        </button>
      </main>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <section ref={feedRef} inert={isModalOpen ? true : undefined}>
        <h1>Photo Feed</h1>
        <p>Current URL: {path}</p>
        <div className="flex gap-2">
          {PHOTOS.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={(event) => {
                invokerRef.current = event.currentTarget;
                setPath(`/photo/${photo.id}`);
                setNavType('soft');
                setHistoryLength((len) => len + 1);
              }}
            >
              Open {photo.title}
            </button>
          ))}
        </div>
      </section>

      {isModalOpen && activePhoto && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={activePhoto.title}
          tabIndex={-1}
          onKeyDown={handleDialogKeyDown}
          className="border p-4 rounded"
        >
          <h2>{activePhoto.title}</h2>
          <p>Author: {activePhoto.author}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => closeInterceptedModal(router, historyLength, '/feed')}
            >
              Close modal
            </button>
            <button
              type="button"
              onClick={() => setNavType('hard')}
            >
              Simulate hard reload
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotoFeedApp;
