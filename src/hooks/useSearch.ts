'use client';

import { useState, useEffect } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export function useSearchPosts(query: string) {
  const { session, isAuthenticated, isLoading } = useAuth();
  const isGuest = !isLoading && !isAuthenticated;

  return useInfiniteQuery({
    queryKey: ['searchPosts', query, isGuest],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      if (!query.trim()) return { items: [], cursor: undefined };

      const endpoint = isGuest ? '/api/public/search' : '/api/search/posts';
      const params = new URLSearchParams({ q: query });
      if (pageParam) params.set('cursor', pageParam);

      const res = await fetch(`${endpoint}?${params.toString()}`);
      if (!res.ok) throw new Error('Search failed');
      return res.json() as Promise<{ items: any[]; cursor: string | null }>;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor ?? undefined,
    enabled: query.length >= 2,
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
  const { session, isAuthenticated, isLoading } = useAuth();
  const isGuest = !isLoading && !isAuthenticated;

  return useQuery({
    queryKey: ['searchActors', term, isGuest],
    queryFn: async () => {
      if (!term.trim()) return [];

      const endpoint = isGuest ? '/api/public/search-actors' : '/api/graph/search';
      const params = isGuest
        ? `q=${encodeURIComponent(term)}`
        : `term=${encodeURIComponent(term)}`;

      const res = await fetch(`${endpoint}?${params}`);
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
    enabled: term.length >= 2,
    staleTime: 30_000,
  });
}
