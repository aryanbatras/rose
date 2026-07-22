'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePostThread } from '@/hooks/useFeed';
import { FeedCard } from '@/components/feed/FeedCard';
import { FeedCardSkeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';

export default function PostThreadPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const uri = decodeURIComponent(params.uri as string);
  const { data: thread, isLoading, error } = usePostThread(uri);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[100dvh] bg-surface-base">
        <header className="sticky top-0 border-b border-border bg-surface-base/80 backdrop-blur-lg">
          <div className="mx-auto flex max-w-lg items-center px-4 py-3">
            <button onClick={() => router.back()} className="text-foreground hover:text-muted-foreground transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <h1 className="ml-3 text-lg font-bold font-heading">Post</h1>
          </div>
        </header>
        <main className="mx-auto max-w-lg">
          <FeedCardSkeleton />
        </main>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="min-h-[100dvh] bg-surface-base">
        <header className="sticky top-0 border-b border-border bg-surface-base/80 backdrop-blur-lg">
          <div className="mx-auto flex max-w-lg items-center px-4 py-3">
            <button onClick={() => router.back()} className="text-foreground hover:text-muted-foreground transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <h1 className="ml-3 text-lg font-bold font-heading">Post</h1>
          </div>
        </header>
        <main className="mx-auto max-w-lg px-4 py-20 text-center">
          <p className="text-muted-foreground">Post not found</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-surface-base">
      <header className="sticky top-0 z-40 border-b border-border bg-surface-base/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-lg items-center px-4 py-3">
          <button onClick={() => router.back()} className="text-foreground hover:text-muted-foreground transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <h1 className="ml-3 text-lg font-bold font-heading">Post</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg pb-20">
        {/* Main post */}
        {'post' in thread ? (
          <FeedCard item={thread.post} />
        ) : (
          <FeedCard item={thread as any} />
        )}

        {/* Replies */}
        {'replies' in thread && thread.replies?.length > 0 && (
          <div className="border-t border-border">
            {thread.replies.map((reply: any, index: number) => (
              <FeedCard
                key={`${reply.uri || reply.post?.uri}-${index}`}
                item={reply.post || reply}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
