'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { MessageView } from '@/types/chat';

const POLL_INTERVAL = 8_000; // 8 seconds for chat feel

interface UseGroupMessagePollingOptions {
  isAuthenticated: boolean;
  convoId: string | undefined;
  /** Callback fired with merged fresh messages on each poll. */
  onMessagesUpdate: (messages: MessageView[]) => void;
  /** If true, polls immediately on mount. Default true. */
  immediate?: boolean;
}

/**
 * Polls /api/groups/[convoId]?scope=messages every 8 seconds while the
 * component is mounted and the user is authenticated. Merges incoming
 * messages with existing messages (deduplicated by id).
 */
export function useGroupMessagePolling({
  isAuthenticated,
  convoId,
  onMessagesUpdate,
  immediate = true,
}: UseGroupMessagePollingOptions) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onUpdateRef = useRef(onMessagesUpdate);
  onUpdateRef.current = onMessagesUpdate;

  const poll = useCallback(async () => {
    if (!convoId) return;
    try {
      const res = await fetch(`/api/groups/${convoId}?scope=messages&limit=50`);
      if (res.ok) {
        const data = await res.json();
        onUpdateRef.current(data.messages || []);
      }
    } catch {
      // Silently ignore — next poll will retry
    }
  }, [convoId]);

  // Start/stop polling based on auth + convoId
  useEffect(() => {
    if (!isAuthenticated || !convoId) {
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
  }, [isAuthenticated, convoId, immediate, poll]);

  return { refreshNow: poll };
}
