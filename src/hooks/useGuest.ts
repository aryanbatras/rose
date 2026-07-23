'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

export function useGuestFeed(limit = 30) {
  return useInfiniteQuery({
    queryKey: ['guestFeed'],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (pageParam) params.set('cursor', pageParam);
      const res = await fetch(`/api/public/feed?${params}`);
      if (!res.ok) throw new Error('Failed to fetch feed');
      return res.json();
    },
    getNextPageParam: (lastPage: any) => lastPage?.cursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000,
  });
}

export function useGuestAuthorFeed(handle: string, limit = 30) {
  return useInfiniteQuery({
    queryKey: ['guestAuthorFeed', handle],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ actor: handle, limit: String(limit) });
      if (pageParam) params.set('cursor', pageParam);
      const res = await fetch(`/api/public/feed?${params}`);
      if (!res.ok) throw new Error('Failed to fetch author feed');
      return res.json();
    },
    getNextPageParam: (lastPage: any) => lastPage?.cursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!handle,
    staleTime: 30_000,
  });
}

export function useGuestProfile(handle: string) {
  return useQuery({
    queryKey: ['guestProfile', handle],
    queryFn: async () => {
      const res = await fetch(`/api/public/profile?actor=${encodeURIComponent(handle)}`);
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    },
    enabled: !!handle,
    staleTime: 30_000,
  });
}

export function useGuestSearch(query: string) {
  return useInfiniteQuery({
    queryKey: ['guestSearch', query],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ q: query, limit: '25' });
      if (pageParam) params.set('cursor', pageParam);
      const res = await fetch(`/api/public/search?${params}`);
      if (!res.ok) throw new Error('Failed to search');
      return res.json();
    },
    getNextPageParam: (lastPage: any) => lastPage?.cursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}

export function useGuestThread(uri: string) {
  return useQuery({
    queryKey: ['guestThread', uri],
    queryFn: async () => {
      const res = await fetch(`/api/public/thread?uri=${encodeURIComponent(uri)}`);
      if (!res.ok) throw new Error('Failed to fetch thread');
      return res.json();
    },
    enabled: !!uri,
    staleTime: 15_000,
  });
}
