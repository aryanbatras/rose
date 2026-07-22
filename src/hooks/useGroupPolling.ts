'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { GroupInfo } from '@/types/chat';

const POLL_INTERVAL = 30_000; // 30 seconds

interface UseGroupPollingOptions {
  isAuthenticated: boolean;
  /** Callback fired with fresh groups data on each poll. */
  onUpdate: (groups: GroupInfo[]) => void;
  /** If true, polls immediately on mount. Default true. */
  immediate?: boolean;
}

/**
 * Polls /api/groups every 30 seconds while the component is mounted
 * and the user is authenticated. Returns a `refreshNow` function for
 * manual one-off refreshes (e.g. after creating a group).
 */
export function useGroupPolling({
  isAuthenticated,
  onUpdate,
  immediate = true,
}: UseGroupPollingOptions) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const poll = useCallback(async () => {
    try {
      const res = await fetch('/api/groups');
      if (res.ok) {
        const data = await res.json();
        onUpdateRef.current(data.groups || []);
      }
    } catch {
      // Silently ignore — next poll will retry
    }
  }, []);

  // Start/stop polling based on auth state
  useEffect(() => {
    if (!isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (immediate) poll();

    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, immediate, poll]);

  return { refreshNow: poll };
}
