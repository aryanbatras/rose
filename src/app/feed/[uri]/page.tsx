'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePostThread } from '@/hooks/useFeed';
import { FeedCard } from '@/components/feed/FeedCard';
import { ReplyThread } from '@/components/feed/ReplyThread';
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

        {/* Replies — recursive nesting */}
        {'replies' in thread && thread.replies?.length > 0 && (
          <div className="border-t border-border">
            <ReplyThread replies={thread.replies} />
          </div>
        )}

        {/* Reply composer */}
        <div className="sticky bottom-0 border-t border-border bg-surface-base/95 backdrop-blur-lg px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-accent shrink-0" />
            <input
              type="text"
              placeholder="Write your reply..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none border-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  const mainPost = 'post' in thread ? thread.post : thread;
                  const replyAuthor = mainPost?.author?.handle || '';
                  const replyText = mainPost?.record?.text || '';
                  const params = new URLSearchParams({
                    replyUri: uri,
                    replyCid: mainPost?.cid || '',
                    replyAuthor,
                    replyText: replyText.slice(0, 100),
                  });
                  router.push(`/compose?${params}`);
                }
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
