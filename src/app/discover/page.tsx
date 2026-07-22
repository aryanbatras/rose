'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSuggestions } from '@/hooks/useProfile';
import { useFeedSourceStore } from '@/stores/feed-source-store';
import { Avatar } from '@/components/ui/avatar';
import { FeedCardSkeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface FeedInfo {
  uri: string;
  label: string;
  description: string;
  avatar?: string;
}

export default function DiscoverPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: suggestions, isLoading: suggestionsLoading } = useSuggestions();
  const { savedFeeds, addSavedFeed, removeSavedFeed, activeSource, setActiveSource } = useFeedSourceStore();

  const [curatedFeeds, setCuratedFeeds] = useState<FeedInfo[]>([]);
  const [feedsLoading, setFeedsLoading] = useState(true);
  const [customFeedUri, setCustomFeedUri] = useState('');
  const [customFeedLookup, setCustomFeedLookup] = useState<FeedInfo | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [activeTab, setActiveTab] = useState<'people' | 'feeds'>('feeds');

  // Fetch curated feeds
  useEffect(() => {
    async function loadFeeds() {
      try {
        const res = await fetch('/api/feed/generators');
        if (res.ok) {
          const data = await res.json();
          setCuratedFeeds(data.feeds || []);
        }
      } catch {
        // Silently fail — curated fallback will show
      } finally {
        setFeedsLoading(false);
      }
    }
    if (isAuthenticated) loadFeeds();
  }, [isAuthenticated]);

  // Check auth
  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, authLoading, router]);

  const isSubscribed = useCallback(
    (uri: string) => savedFeeds.some((f) => f.uri === uri),
    [savedFeeds]
  );

  const handleSubscribe = useCallback(
    (feed: FeedInfo) => {
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

  const handleLookupFeed = async () => {
    const uri = customFeedUri.trim();
    if (!uri) return;

    // Validate URI format
    if (!uri.startsWith('at://')) {
      toast.error('Invalid feed URI. Must start with at://');
      return;
    }

    setLookingUp(true);
    setCustomFeedLookup(null);
    try {
      const res = await fetch(`/api/feed/generators?uris=${encodeURIComponent(uri)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.feeds?.length > 0) {
          setCustomFeedLookup(data.feeds[0]);
          toast.success(`Found feed: ${data.feeds[0].label}`);
        } else {
          // Fallback: use the URI as the label
          const label = uri.split('/').pop() || 'Custom Feed';
          setCustomFeedLookup({ uri, label, description: 'Custom feed' });
        }
      } else {
        toast.error('Feed not found. Check the URI and try again.');
      }
    } catch {
      toast.error('Failed to look up feed');
    } finally {
      setLookingUp(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="h-8 w-8 animate-pulse rounded-full bg-brand/30" />
      </div>
    );
  }

  const subscribedUris = savedFeeds.map((f) => f.uri);

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-40 border-b border-border bg-surface-base/80 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-lg font-bold font-heading text-foreground">Discover</h1>
          <button
            onClick={() => router.push('/search')}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            aria-label="Search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-4 gap-4">
          <button
            onClick={() => setActiveTab('feeds')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'feeds'
                ? 'text-brand border-brand'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            Feeds
          </button>
          <button
            onClick={() => setActiveTab('people')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'people'
                ? 'text-brand border-brand'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            People
          </button>
        </div>
      </header>

      <main className="pb-20">
        {activeTab === 'feeds' && (
          <>
            {/* Add custom feed */}
            <section className="px-4 pt-4">
              <h2 className="text-base font-bold text-foreground mb-3">Add a Feed</h2>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customFeedUri}
                  onChange={(e) => setCustomFeedUri(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookupFeed()}
                  placeholder="Paste a feed URI (e.g., at://...)"
                  className="flex-1 rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand transition-colors"
                />
                <button
                  onClick={handleLookupFeed}
                  disabled={lookingUp || !customFeedUri.trim()}
                  className="px-5 py-3 rounded-xl bg-brand text-black text-sm font-semibold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {lookingUp ? '...' : 'Add'}
                </button>
              </div>

              {/* Custom feed lookup result */}
              {customFeedLookup && (
                <div className="mt-3 p-3 rounded-xl border border-border bg-surface-elevated flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-brand/20 flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{customFeedLookup.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{customFeedLookup.description || customFeedLookup.uri}</p>
                  </div>
                  {isSubscribed(customFeedLookup.uri) ? (
                    <span className="text-xs text-muted-foreground font-medium">Added</span>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(customFeedLookup)}
                      className="px-4 py-1.5 rounded-full bg-brand text-black text-xs font-semibold hover:bg-brand-hover transition-colors"
                    >
                      Add Feed
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* Curated feeds */}
            <section className="px-4 pt-6">
              <h2 className="text-base font-bold text-foreground mb-3">Popular Feeds</h2>
              {feedsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {curatedFeeds.map((feed) => {
                    const subbed = isSubscribed(feed.uri);
                    return (
                      <div
                        key={feed.uri}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/30 transition-colors"
                      >
                        <div className="h-10 w-10 rounded-xl bg-brand/15 flex items-center justify-center shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{feed.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{feed.description}</p>
                        </div>
                        {subbed ? (
                          <button
                            onClick={() => handleUnsubscribe(feed.uri)}
                            className="px-4 py-1.5 rounded-full border border-border text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
                          >
                            Added
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSubscribe(feed)}
                            className="px-4 py-1.5 rounded-full bg-brand text-black text-xs font-semibold hover:bg-brand-hover transition-colors"
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Saved feeds */}
            {savedFeeds.length > 0 && (
              <section className="px-4 pt-6">
                <h2 className="text-base font-bold text-foreground mb-3">Your Feeds</h2>
                <div className="space-y-1">
                  {savedFeeds.map((feed) => (
                    <div
                      key={feed.uri}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/30 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-xl bg-blue/15 flex items-center justify-center shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{feed.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{feed.uri}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setActiveSource(feed);
                            router.push('/feed');
                          }}
                          className="px-4 py-1.5 rounded-full bg-brand text-black text-xs font-semibold hover:bg-brand-hover transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleUnsubscribe(feed.uri!)}
                          className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          aria-label={`Remove ${feed.label}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {activeTab === 'people' && (
          <section className="px-4 pt-4">
            <h2 className="text-base font-bold text-foreground mb-3">Suggested for you</h2>
            {suggestionsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !suggestions?.length ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No suggestions yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Follow more users to get better suggestions
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {suggestions.map((s: any) => (
                  <button
                    key={s.did}
                    onClick={() => router.push(`/profile/${s.handle}`)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-accent/30"
                  >
                    <Avatar src={s.avatar} alt={s.displayName || s.handle} size="md" />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-foreground">
                        {s.displayName || s.handle}
                      </p>
                      <p className="text-xs text-muted-foreground">@{s.handle}</p>
                    </div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      {s.count} mutual
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
