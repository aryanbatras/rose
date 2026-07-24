'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePostThread } from '@/hooks/useFeed';
import { useGuestThread } from '@/hooks/useGuest';
import { FeedCard } from '@/components/feed/FeedCard';
import { ReplyThread } from '@/components/feed/ReplyThread';
import { FeedCardSkeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function PostThreadPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, session } = useAuth();
  const uri = decodeURIComponent(params.uri as string);

  const isGuest = !authLoading && !isAuthenticated;

  const authThread = usePostThread(uri);
  const guestThread = useGuestThread(uri);

  const { data: thread, isLoading, error } = isGuest ? guestThread : authThread;
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Guests can view threads
  }, [isAuthenticated, authLoading, router]);

  const handleSubmitReply = async () => {
    if (!replyText.trim() || isSubmitting || isGuest) {
      if (isGuest) router.push('/login');
      return;
    }
    setIsSubmitting(true);
    try {
      const mainPost = thread?.post || thread;
      const replyCid = mainPost?.cid || '';
      const replyAuthor = mainPost?.author?.handle || '';
      const replyTextPreview = (mainPost?.record?.text || '').slice(0, 100);
      const params = new URLSearchParams({
        replyUri: uri,
        replyCid,
        replyAuthor,
        replyText: replyTextPreview,
        text: replyText.trim(),
      });
      router.push(`/compose?${params}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[100dvh] bg-surface-base">
        <header className="sticky top-0 z-40 border-b border-border bg-surface-base/80 backdrop-blur-lg">
          <div className="mx-auto flex max-w-lg items-center px-4 py-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-full hover:bg-accent transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <h1 className="ml-2 text-lg font-bold font-heading">Post</h1>
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
        <header className="sticky top-0 z-40 border-b border-border bg-surface-base/80 backdrop-blur-lg">
          <div className="mx-auto flex max-w-lg items-center px-4 py-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-full hover:bg-accent transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <h1 className="ml-2 text-lg font-bold font-heading">Post</h1>
          </div>
        </header>
        <main className="mx-auto max-w-lg px-4 py-20 text-center">
          <p className="text-muted-foreground">Post not found</p>
        </main>
      </div>
    );
  }

  const replyCount = thread.replies?.length || 0;

  return (
    <div className="min-h-[100dvh] bg-surface-base">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-base/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-lg items-center px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-accent transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="ml-2 text-lg font-bold font-heading">Post</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg pb-24">
        {/* Main post */}
        <FeedCard item={thread.post} />

        {/* Replies count header */}
        {replyCount > 0 && (
          <div className="px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
            </p>
          </div>
        )}

        {/* Replies */}
        {thread.replies?.length > 0 && (
          <div className="px-2">
            <ReplyThread replies={thread.replies} depth={0} />
          </div>
        )}

        {/* Empty state for replies */}
        {replyCount === 0 && (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No replies yet. Be the first to reply!
            </p>
          </div>
        )}
      </main>

      {/* Reply composer - fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface-base/95 backdrop-blur-lg safe-bottom shadow-[0_-1px_3px_rgba(0,0,0,0.04)]">
        <div className="mx-auto max-w-lg px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-accent shrink-0 overflow-hidden">
              {session?.handle && (
                <div className="h-full w-full flex items-center justify-center text-xs font-semibold text-muted-foreground">
                  {session.handle.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 relative">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={isGuest ? "Sign in to reply..." : "Write a reply..."}
                onClick={() => isGuest && router.push('/login')}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none border-none py-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitReply();
                  }
                }}
              />
            </div>

            {replyText.trim() && !isGuest && (
              <button
                onClick={handleSubmitReply}
                disabled={isSubmitting}
                className="text-sm font-semibold text-brand hover:text-brand-hover transition-colors disabled:opacity-50"
              >
                {isSubmitting ? '...' : 'Post'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
