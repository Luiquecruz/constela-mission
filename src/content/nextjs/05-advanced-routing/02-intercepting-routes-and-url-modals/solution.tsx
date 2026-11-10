import React, { useState } from 'react';

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

  const photoId = path.startsWith('/photo/') ? path.replace('/photo/', '') : null;
  const activePhoto = photoId ? PHOTOS.find((p) => p.id === photoId) ?? null : null;

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
      <section>
        <h1>Photo Feed</h1>
        <p>Current URL: {path}</p>
        <div className="flex gap-2">
          {PHOTOS.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => {
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

      {activePhoto && navType === 'soft' && (
        <div role="dialog" aria-label={activePhoto.title} className="border p-4 rounded">
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
