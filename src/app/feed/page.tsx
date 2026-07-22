'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFeed } from '@/hooks/useFeed';
import { FeedCard } from '@/components/feed/FeedCard';
import { FeedCardSkeleton } from '@/components/ui/skeleton';
import { Navbar } from '@/components/navigation/Navbar';

export default function FeedPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useFeed();

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  if (authLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-surface-base">
        <div className="h-8 w-8 animate-pulse rounded-full bg-brand/30" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will be redirected by layout
  }

  const allPosts = data?.pages.flatMap((page: any) => page.items || []) ?? [];

  return (
    <div className="min-h-[100dvh] bg-surface-base">
      <header className="sticky top-0 z-40 border-b border-border bg-surface-base/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold font-heading text-foreground">Feed</h1>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-sm text-brand hover:text-brand-hover transition-colors"
          >
            Top
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg pb-20">
        {isLoading ? (
          <div>
            {Array.from({ length: 5 }).map((_, i) => (
              <FeedCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground">Failed to load feed</p>
            <p className="text-sm text-muted-foreground mt-1">Pull down to retry</p>
          </div>
        ) : allPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg font-medium text-foreground">No posts yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Follow some users to see their posts here
            </p>
          </div>
        ) : (
          <>
            {allPosts.map((item: any, index: number) => {
              const isVoicePost = item.record?.$type === 'voiceflow.voice.post';
              return (
                <FeedCard
                  key={`${item.uri}-${index}`}
                  item={item}
                  isVoicePost={isVoicePost}
                />
              );
            })}

            {/* Infinite scroll trigger */}
            <div ref={loadMoreRef} className="py-8">
              {isFetchingNextPage && (
                <div>
                  {Array.from({ length: 2 }).map((_, i) => (
                    <FeedCardSkeleton key={i} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <Navbar />
    </div>
  );
}
