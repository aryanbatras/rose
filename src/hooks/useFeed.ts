'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import type { FeedSource } from '@/types/atproto';

export function useFeed(feedSource?: FeedSource, limit = 30) {
  const { session } = useAuth();

  const sourceType = feedSource?.type || 'following';
  const feedUri = feedSource?.uri;

  const queryKey = feedUri
    ? ['feed', sourceType, feedUri, session?.did]
    : ['feed', sourceType, session?.did];

  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      if (!session) throw new Error('Not authenticated');
      const params = new URLSearchParams({
        limit: String(limit),
        sourceType,
        ...(feedUri ? { feedUri } : {}),
        ...(pageParam ? { cursor: pageParam } : {}),
      });
      const res = await fetch(`/api/feed?${params}`);
      if (!res.ok) throw new Error('Failed to fetch feed');
      return res.json();
    },
    getNextPageParam: (lastPage: any) => lastPage?.cursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!session,
    staleTime: 30_000,
  });
}

export function useAuthorFeed(handle: string, limit = 30) {
  const { session } = useAuth();

  return useInfiniteQuery({
    queryKey: ['authorFeed', handle],
    queryFn: async ({ pageParam }) => {
      if (!session) throw new Error('Not authenticated');
      const params = new URLSearchParams({
        actor: handle,
        limit: String(limit),
        ...(pageParam ? { cursor: pageParam } : {}),
      });
      const res = await fetch(`/api/feed/author?${params}`);
      if (!res.ok) throw new Error('Failed to fetch author feed');
      return res.json();
    },
    getNextPageParam: (lastPage: any) => lastPage?.cursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!session && !!handle,
    staleTime: 30_000,
  });
}

export function usePostThread(uri: string) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['postThread', uri],
    queryFn: async () => {
      if (!session) throw new Error('Not authenticated');
      const res = await fetch(`/api/feed/thread?uri=${encodeURIComponent(uri)}`);
      if (!res.ok) throw new Error('Failed to fetch thread');
      return res.json();
    },
    enabled: !!session && !!uri,
    staleTime: 15_000,
  });
}

export function useLikes(uri: string, limit = 50) {
  const { session } = useAuth();

  return useInfiniteQuery({
    queryKey: ['likes', uri],
    queryFn: async ({ pageParam }) => {
      if (!session) throw new Error('Not authenticated');
      const params = new URLSearchParams({
        uri,
        limit: String(limit),
        ...(pageParam ? { cursor: pageParam } : {}),
      });
      const res = await fetch(`/api/feed/likes?${params}`);
      if (!res.ok) throw new Error('Failed to fetch likes');
      return res.json();
    },
    getNextPageParam: (lastPage: any) => lastPage?.cursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!session && !!uri,
    staleTime: 15_000,
  });
}
