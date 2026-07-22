'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useFeed } from '@/hooks/useFeed';
import { FeedCard } from '@/components/feed/FeedCard';
import { FeedCardSkeleton } from '@/components/ui/skeleton';

export default function FeedPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useFeed();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, authLoading, router]);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
      });
      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-pulse rounded-full bg-brand/30" /></div>;
  }

  const allPosts = data?.pages.flatMap((page: any) => page.items || []) ?? [];

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface-base/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 h-[53px]">
          <h1 className="text-lg font-bold font-heading text-foreground">Home</h1>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-sm text-blue hover:text-blue-hover transition-colors">Top</button>
        </div>
      </header>

      {isLoading ? (
        Array.from({ length: 8 }).map((_, i) => <FeedCardSkeleton key={i} />)
      ) : error ? (
        <div className="py-20 text-center"><p className="text-muted-foreground">Failed to load feed</p></div>
      ) : allPosts.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg font-medium text-foreground">Welcome to VoiceFlow!</p>
          <p className="text-sm text-muted-foreground mt-1">Follow some users to see their posts here</p>
        </div>
      ) : (
        <>
          {allPosts.map((item: any, index: number) => (
            <FeedCard key={`${item.uri}-${index}`} item={item} reason={item.reason} />
          ))}
          <div ref={loadMoreRef} className="py-8">
            {isFetchingNextPage && Array.from({ length: 3 }).map((_, i) => <FeedCardSkeleton key={i} />)}
          </div>
        </>
      )}
    </>
  );
}
