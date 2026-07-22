'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export function useSearchPosts(query: string) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['searchPosts', query],
    queryFn: async () => {
      if (!session) throw new Error('Not authenticated');
      if (!query.trim()) return { items: [], cursor: undefined };
      const res = await fetch(`/api/search/posts?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
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
