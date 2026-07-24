'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

function normalizeThreadPost(post: any): any {
  if (!post) return null;
  return {
    uri: post.uri,
    cid: post.cid,
    author: {
      did: post.author?.did || '',
      handle: post.author?.handle || '',
      displayName: post.author?.displayName,
      avatar: post.author?.avatar,
    },
    record: {
      $type: post.record?.$type || 'app.bsky.feed.post',
      text: post.record?.text || '',
      createdAt: post.record?.createdAt || post.indexedAt,
      facets: post.record?.facets,
      embed: post.embed || post.record?.embed,
    },
    indexedAt: post.indexedAt,
    likeCount: post.likeCount || 0,
    replyCount: post.replyCount || 0,
    repostCount: post.repostCount || 0,
    viewer: post.viewer,
    labels: post.labels,
  };
}

function normalizeThreadNode(node: any, depth = 0): any {
  if (!node) return null;
  const post = normalizeThreadPost(node.post);
  if (!post) return null;

  return {
    post,
    replies: (node.replies || [])
      .map((r: any) => normalizeThreadNode(r, depth + 1))
      .filter(Boolean),
    depth,
  };
}

export function useGuestFeed(feedUri?: string, limit = 30) {
  return useInfiniteQuery({
    queryKey: ['guestFeed', feedUri],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (feedUri) params.set('feedUri', feedUri);
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

export function useGuestThread(uri: string) {
  return useQuery({
    queryKey: ['guestThread', uri],
    queryFn: async () => {
      const res = await fetch(`/api/public/thread?uri=${encodeURIComponent(uri)}`);
      if (!res.ok) throw new Error('Failed to fetch thread');
      const data = await res.json();
      // Normalize the thread data to match authenticated format
      if (data.thread) {
        return normalizeThreadNode(data.thread);
      }
      return data;
    },
    enabled: !!uri,
    staleTime: 15_000,
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
