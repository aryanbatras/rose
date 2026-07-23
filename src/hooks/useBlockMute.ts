'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useBlockMute() {
  const [loading, setLoading] = useState(false);

  const blockUser = useCallback(async (did: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/graph/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ did }),
      });
      if (res.ok) {
        toast.success('User blocked');
        return true;
      }
      toast.error('Failed to block user');
      return false;
    } catch {
      toast.error('Connection error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const unblockUser = useCallback(async (blockUri: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/graph/block', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockUri }),
      });
      if (res.ok) {
        toast.success('User unblocked');
        return true;
      }
      toast.error('Failed to unblock user');
      return false;
    } catch {
      toast.error('Connection error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const muteUser = useCallback(async (did: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/graph/mute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ did }),
      });
      if (res.ok) {
        toast.success('User muted');
        return true;
      }
      toast.error('Failed to mute user');
      return false;
    } catch {
      toast.error('Connection error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const unmuteUser = useCallback(async (did: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/graph/mute', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ did }),
      });
      if (res.ok) {
        toast.success('User unmuted');
        return true;
      }
      toast.error('Failed to unmute user');
      return false;
    } catch {
      toast.error('Connection error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { blockUser, unblockUser, muteUser, unmuteUser, loading };
}
