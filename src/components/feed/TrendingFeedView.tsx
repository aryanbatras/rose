'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useFeedSourceStore } from '@/stores/feed-source-store';
import { toast } from 'sonner';
import { TrendingUp, Flame } from 'lucide-react';

interface TrendingFeed {
  uri: string;
  label: string;
  description: string;
  avatar?: string;
  creatorDid?: string;
  creatorHandle?: string;
  creatorDisplayName?: string;
  likeCount: number;
}

export function TrendingFeedView() {
  const router = useRouter();
  const { session } = useAuth();
  const { savedFeeds, addSavedFeed, removeSavedFeed, setActiveSource } = useFeedSourceStore();
  const [feeds, setFeeds] = useState<TrendingFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchFeeds = useCallback(async (cursorVal?: string) => {
    if (!session) return;
    try {
      const params = new URLSearchParams({ mode: 'popular', limit: '20' });
      if (cursorVal) params.set('cursor', cursorVal);
      const res = await fetch(`/api/feed/generators?${params}`);
      if (!res.ok) throw new Error('Failed to fetch trending feeds');
      const data = await res.json();
      if (cursorVal) {
        setFeeds((prev) => [...prev, ...(data.feeds || [])]);
      } else {
        setFeeds(data.feeds || []);
      }
      setCursor(data.cursor);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load trending feeds');
    }
  }, [session]);

  useEffect(() => {
    setLoading(true);
    fetchFeeds().finally(() => setLoading(false));
  }, [fetchFeeds]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !cursor) return;
    setLoadingMore(true);
    await fetchFeeds(cursor);
    setLoadingMore(false);
  }, [loadingMore, cursor, fetchFeeds]);

  const isSubscribed = useCallback(
    (uri: string) => savedFeeds.some((f) => f.uri === uri),
    [savedFeeds]
  );

  const handleSubscribe = useCallback(
    (feed: TrendingFeed) => {
      addSavedFeed({ type: 'custom', uri: feed.uri, label: feed.label });
      toast.success(`Subscribed to "${feed.label}"`);
    },
    [addSavedFeed]
  );

  const handleUnsubscribe = useCallback(
    (uri: string) => {
      removeSavedFeed(uri);
      toast.success('Feed unsubscribed');
    },
    [removeSavedFeed]
  );

  return (
    <div className="px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-10 w-10 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
          <Flame className="h-5 w-5 text-orange-500" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">Trending Feeds</h2>
          <p className="text-xs text-muted-foreground">
            Popular community feeds across Bluesky
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-3 w-48 animate-pulse rounded bg-muted/50" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => { setLoading(true); fetchFeeds().finally(() => setLoading(false)); }}
            className="mt-3 px-4 py-2 rounded-lg bg-brand text-black text-xs font-semibold hover:bg-brand-hover transition-colors"
          >
            Retry
          </button>
        </div>
      ) : feeds.length === 0 ? (
        <div className="py-12 text-center">
          <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">No trending feeds available right now</p>
        </div>
      ) : (
        <>
          <div className="space-y-1">
            {feeds.map((feed) => {
              const subbed = isSubscribed(feed.uri);
              return (
                <div
                  key={feed.uri}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/30 transition-colors group"
                >
                  {feed.avatar ? (
                    <img
                      src={feed.avatar}
                      alt={feed.label}
                      className="h-10 w-10 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 group-hover:bg-orange-500/15 transition-colors">
                      <Flame className="h-5 w-5 text-orange-500/60" strokeWidth={1.5} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{feed.label}</p>
                      {feed.likeCount > 0 && (
                        <span className="text-xs text-muted-foreground shrink-0 tabular-nums hidden sm:inline">
                          {feed.likeCount >= 1000
                            ? `${(feed.likeCount / 1000).toFixed(1)}k`
                            : feed.likeCount}{' '}
                          likes
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {feed.description || (feed.creatorHandle ? `by @${feed.creatorHandle}` : '')}
                    </p>
                  </div>

                  {subbed ? (
                    <button
                      onClick={() => handleUnsubscribe(feed.uri)}
                      className="px-4 py-1.5 rounded-full border border-border text-xs font-medium text-muted-foreground hover:bg-accent transition-colors shrink-0"
                    >
                      Added
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(feed)}
                      className="px-4 py-1.5 rounded-full bg-brand text-black text-xs font-semibold hover:bg-brand-hover transition-colors shrink-0"
                    >
                      + Add
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Load more */}
          {cursor && (
            <div className="pt-4 pb-2 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2 rounded-xl bg-surface-elevated border border-border text-sm font-medium text-foreground hover:bg-accent/50 disabled:opacity-50 transition-colors"
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
