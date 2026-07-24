'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarkStore } from '@/stores/bookmark-store';
import { Play } from 'lucide-react';

export default function BookmarksPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { bookmarks, removeBookmark, loading, loaded, fetchBookmarks } = useBookmarkStore();

  useEffect(() => {
    if (isAuthenticated && !loaded && !loading) fetchBookmarks();
  }, [isAuthenticated, loaded, loading, fetchBookmarks]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-pulse rounded-full bg-brand/30" /></div>;
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface-base/80 backdrop-blur-lg border-b border-border">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold font-heading text-foreground">Bookmarks</h1>
          {bookmarks.length > 0 && (
            <span className="text-xs text-muted-foreground">{bookmarks.length} saved</span>
          )}
        </div>
      </header>

      {loading ? (
        <div className="py-20 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-brand/60 mx-auto" />
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg font-medium text-foreground">No bookmarks yet</p>
          <p className="text-sm text-muted-foreground mt-1">Bookmark posts to save them for later</p>
          <button onClick={() => router.push('/feed')} className="mt-4 px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors">
            Browse feed
          </button>
        </div>
      ) : (
        <div className="px-2 pt-2 pb-20">
          <div className="grid grid-cols-2 gap-2">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.uri}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/feed/${encodeURIComponent(bookmark.uri)}`)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push(`/feed/${encodeURIComponent(bookmark.uri)}`); }}
                className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface-elevated group cursor-pointer shadow-sm"
              >
                {bookmark.thumbnail ? (
                  <>
                    <img src={bookmark.thumbnail} alt="" className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" loading="lazy" />
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                      <div className="absolute bottom-0 left-0 right-0 p-2.5">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-5 w-5 rounded-full overflow-hidden ring-1 ring-white/30 shrink-0">
                            {bookmark.author.avatar && <img src={bookmark.author.avatar} alt="" className="h-full w-full object-cover" />}
                          </div>
                          <span className="text-xs font-semibold text-white truncate drop-shadow-sm">{bookmark.author.displayName || bookmark.author.handle}</span>
                        </div>
                        {bookmark.text && (
                          <p className="text-[10px] text-white/70 line-clamp-2">{bookmark.text}</p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand/20 to-brand/5 p-4">
                    <p className="text-xs text-muted-foreground text-center line-clamp-6">{bookmark.text || 'No preview'}</p>
                  </div>
                )}
                {bookmark.isVideo && (
                  <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <Play className="h-3 w-3 text-white fill-white ml-0.5" strokeWidth={0} />
                  </div>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); removeBookmark(bookmark.uri); }}
                  className="absolute top-2 left-2 h-6 w-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove bookmark"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
