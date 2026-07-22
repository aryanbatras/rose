'use client';

import { useState, useEffect } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export function useSearchPosts(query: string) {
  const { session } = useAuth();

  return useInfiniteQuery({
    queryKey: ['searchPosts', query],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      if (!session) throw new Error('Not authenticated');
      if (!query.trim()) return { items: [], cursor: undefined };
      const params = new URLSearchParams({ q: query });
      if (pageParam) params.set('cursor', pageParam);
      const res = await fetch(`/api/search/posts?${params.toString()}`);
      if (!res.ok) throw new Error('Search failed');
      return res.json() as Promise<{ items: any[]; cursor: string | null }>;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor ?? undefined,
    enabled: !!session && query.length >= 2,
    staleTime: 30_000,
  });
}

export function useDebouncedSearch(delay = 300) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), delay);
    return () => clearTimeout(timer);
  }, [query, delay]);

  return { query, setQuery, debouncedQuery };
}

export function useSearchActors(term: string) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['searchActors', term],
    queryFn: async () => {
      if (!session) throw new Error('Not authenticated');
      if (!term.trim()) return [];
      const res = await fetch(`/api/graph/search?term=${encodeURIComponent(term)}`);
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
    enabled: !!session && term.length >= 2,
    staleTime: 30_000,
  });
}
