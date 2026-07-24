'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export function useProfile(handle: string) {
  const { session, isAuthenticated, isLoading } = useAuth();
  const isGuest = !isLoading && !isAuthenticated;

  return useQuery({
    queryKey: ['profile', handle, isGuest],
    queryFn: async () => {
      if (!handle) throw new Error('Handle required');
      const endpoint = isGuest ? '/api/public/profile' : '/api/profile';
      const param = isGuest ? 'actor' : 'actor';
      const res = await fetch(`${endpoint}?${param}=${encodeURIComponent(handle)}`);
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    },
    enabled: !!handle,
    staleTime: 30_000,
  });
}

export function useFollows(handle: string, type: 'followers' | 'following' = 'following') {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['follows', handle, type],
    queryFn: async () => {
      if (!session) throw new Error('Not authenticated');
      const res = await fetch(`/api/graph/${type}?actor=${encodeURIComponent(handle)}`);
      if (!res.ok) throw new Error(`Failed to fetch ${type}`);
      return res.json();
    },
    enabled: !!session && !!handle,
    staleTime: 60_000,
  });
}

export function useFollowUser() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (subjectDid: string) => {
      if (!session) throw new Error('Not authenticated');
      const res = await fetch('/api/graph/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectDid }),
      });
      if (!res.ok) throw new Error('Failed to follow user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['follows'] });
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
    },
  });
}

export function useUnfollowUser() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (followUri: string) => {
      if (!session) throw new Error('Not authenticated');
      const res = await fetch('/api/graph/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unfollow', followUri }),
      });
      if (!res.ok) throw new Error('Failed to unfollow user');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['follows'] });
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
    },
  });
}

export function useSuggestions() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['suggestions'],
    queryFn: async () => {
      if (!session) throw new Error('Not authenticated');
      const res = await fetch('/api/graph/suggestions');
      if (!res.ok) throw new Error('Failed to fetch suggestions');
      return res.json();
    },
    enabled: !!session,
    staleTime: 120_000,
  });
}

export function useSearchActors() {
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (term: string) => {
      if (!session) throw new Error('Not authenticated');
      const res = await fetch(`/api/graph/search?term=${encodeURIComponent(term)}`);
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
  });
}
