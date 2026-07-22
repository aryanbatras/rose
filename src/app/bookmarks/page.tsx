'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarkStore } from '@/stores/bookmark-store';

export default function BookmarksPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { bookmarks, removeBookmark, clearAll } = useBookmarkStore();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-pulse rounded-full bg-brand/30" /></div>;
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface-base/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 h-[53px]">
          <h1 className="text-lg font-bold font-heading text-foreground">Bookmarks</h1>
          {bookmarks.length > 0 && (
            <button
              onClick={clearAll}
              className="text-sm text-destructive hover:text-destructive/80 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </header>

      {bookmarks.length === 0 ? (
        <div className="py-20 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <p className="text-lg font-medium text-foreground">No bookmarks yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Bookmark posts to save them for later
          </p>
          <button
            onClick={() => router.push('/feed')}
            className="mt-4 px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors"
          >
            Browse feed
          </button>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {bookmarks.map((bookmark) => (
            <button
              key={bookmark.uri}
              onClick={() => router.push(`/feed/${encodeURIComponent(bookmark.uri)}`)}
              className="flex w-full items-start gap-3 px-4 py-3 hover:bg-accent/30 transition-colors text-left group"
            >
              <div className="h-10 w-10 shrink-0 rounded-full bg-accent overflow-hidden">
                {bookmark.author.avatar && (
                  <img src={bookmark.author.avatar} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {bookmark.author.displayName || bookmark.author.handle}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    @{bookmark.author.handle}
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(bookmark.savedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 line-clamp-2 leading-snug mt-0.5">
                  {bookmark.text}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeBookmark(bookmark.uri);
                }}
                className="shrink-0 p-1.5 rounded-full text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                aria-label="Remove bookmark"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
