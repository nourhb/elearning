'use client';

import { useEffect, useRef } from 'react';

export function ChunkReloader() {
  const hasReloadedRef = useRef(false);

  useEffect(() => {
    function onError(event: ErrorEvent) {
      const name = (event.error && (event.error as any).name) || '';
      const message = event.message || '';
      const isChunkError = name === 'ChunkLoadError' || message.includes('ChunkLoadError');
      if (isChunkError && !hasReloadedRef.current) {
        hasReloadedRef.current = true;
        // Force a full reload to fetch fresh chunks
        window.location.reload();
      }
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      const reason = (event && (event.reason || {})) as any;
      const name = reason?.name || '';
      const message = String(reason?.message || reason || '');
      const isChunkError = name === 'ChunkLoadError' || message.includes('ChunkLoadError');
      if (isChunkError && !hasReloadedRef.current) {
        hasReloadedRef.current = true;
        window.location.reload();
      }
    }

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}


