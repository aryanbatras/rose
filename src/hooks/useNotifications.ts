'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export function useNotifications() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (!session) throw new Error('Not authenticated');
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    },
    enabled: !!session,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}

export function useUnreadCount() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['unreadCount'],
    queryFn: async () => {
      if (!session) throw new Error('Not authenticated');
      const res = await fetch('/api/notifications/unread');
      if (!res.ok) throw new Error('Failed to fetch unread count');
      return res.json();
    },
    enabled: !!session,
    refetchInterval: 15_000,
    staleTime: 5_000,
  });
}

export function useMarkRead() {
  const { session } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!session) throw new Error('Not authenticated');
      const res = await fetch('/api/notifications/read', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to mark read');
    },
  });
}
