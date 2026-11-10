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
  // TODO: Call router.back() when historyLength > 1, otherwise router.push(fallbackPath)
  router.push(fallbackPath);
}

export interface PhotoFeedAppProps {
  initialPath?: string;
  initialNavType?: 'soft' | 'hard';
}

export function PhotoFeedApp({
  initialPath = '/feed',
  initialNavType = 'soft',
}: PhotoFeedAppProps) {
  const [path] = useState(initialPath);

  return (
    <div className="p-4">
      <h1>Photo Feed</h1>
      <p>Current URL: {path} ({initialNavType})</p>
      {/* TODO: Render photo buttons, intercepted modal on soft nav, or canonical page on hard nav */}
    </div>
  );
}

export default PhotoFeedApp;
