'use client';

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSuggestions } from '@/hooks/useProfile';
import { useFeedSourceStore } from '@/stores/feed-source-store';
import { FEED_CATEGORIES } from '@/services/feeds';
import { Avatar } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface FeedInfo {
  uri: string;
  label: string;
  description: string;
  avatar?: string;
  creatorDid?: string;
  creatorHandle?: string;
  creatorDisplayName?: string;
  likeCount?: number;
  category?: string;
}

type Tab = 'browse' | 'people' | 'saved';

export default function DiscoverPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: suggestions, isLoading: suggestionsLoading } = useSuggestions();
  const { savedFeeds, addSavedFeed, removeSavedFeed, setActiveSource } = useFeedSourceStore();

  const [activeTab, setActiveTab] = useState<Tab>('browse');
  const [curatedFeeds, setCuratedFeeds] = useState<FeedInfo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [feedsLoading, setFeedsLoading] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [feedsError, setFeedsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FeedInfo[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [customFeedUri, setCustomFeedUri] = useState('');
  const [customFeedLookup, setCustomFeedLookup] = useState<FeedInfo | null>(null);
  const [lookingUp, setLookingUp] = useState(false);

  // Fetch categories metadata
  useEffect(() => {
    if (!isAuthenticated) return;
    fetch('/api/feed/generators?mode=categories')
      .then((r) => (r.ok ? r.json() : { counts: {} }))
      .then((data: { counts?: Record<string, number> }) => {
        if (data.counts) setCategoryCounts(data.counts);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  // Fetch curated feeds (optionally filtered by category)
  useEffect(() => {
    if (!isAuthenticated) return;
    async function load() {
      setFeedsLoading(true);
      setFeedsError(null);
      try {
        const cat = selectedCategory ? `&category=${encodeURIComponent(selectedCategory)}` : '';
        const res = await fetch(`/api/feed/generators?mode=curated&limit=30${cat}`);
        if (res.ok) {
          const data = await res.json();
          setCuratedFeeds(data.feeds || []);
        } else {
          setFeedsError('Failed to load feeds');
        }
      } catch {
        setFeedsError('Failed to load feeds. Check your connection.');
      }
      setFeedsLoading(false);
    }
    load();
  }, [isAuthenticated, selectedCategory]);

  // Search feeds
  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    setSearchResults(null);
    try {
      const res = await fetch(`/api/feed/generators?mode=popular&limit=30&query=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.feeds || []);
        if (data.feeds?.length === 0) toast.info('No feeds found for that search');
      }
    } catch {
      toast.error('Search failed');
    }
    setSearching(false);
  }, [searchQuery]);

  // Custom feed lookup
  const handleLookupFeed = useCallback(async () => {
    const uri = customFeedUri.trim();
    if (!uri) return;
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
          const label = uri.split('/').pop() || 'Custom Feed';
          setCustomFeedLookup({ uri, label, description: 'Custom feed' });
        }
      } else {
        toast.error('Feed not found. Check the URI and try again.');
      }
    } catch {
      toast.error('Failed to look up feed');
    }
    setLookingUp(false);
  }, [customFeedUri]);

  // Auth redirect
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

  if (authLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="h-8 w-8 animate-pulse rounded-full bg-brand/30" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] pb-20">
      {/* ─── Header ───────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-surface-base/80 backdrop-blur-lg">
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
          {(['browse', 'people', 'saved'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'text-brand border-brand'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              {tab === 'browse' ? 'Browse Feeds' : tab === 'saved' ? 'My Feeds' : tab}
            </button>
          ))}
        </div>
      </header>

      <main>
        {/* ─── BROWSE FEEDS TAB ──────────────────────── */}
        {activeTab === 'browse' && (
          <>
            {/* Category chip scroll */}
            <div className="sticky top-[113px] z-30 bg-surface-base/90 backdrop-blur-md border-b border-border">
              <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                    !selectedCategory
                      ? 'bg-brand text-black'
                      : 'bg-surface-elevated text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  All Feeds
                </button>
                {FEED_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                    className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                      selectedCategory === cat
                        ? 'bg-brand text-black'
                        : 'bg-surface-elevated text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    {cat}
                    {categoryCounts[cat] > 0 && (
                      <span className="ml-1.5 opacity-60">{categoryCounts[cat]}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Search bar */}
              <div className="px-4 pb-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (!e.target.value.trim()) setSearchResults(null);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Search 50,000+ community feeds..."
                      className="w-full rounded-xl bg-surface-elevated border border-border px-4 py-2.5 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand transition-colors"
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={searching || !searchQuery.trim()}
                    className="px-4 py-2.5 rounded-xl bg-brand text-black text-sm font-semibold hover:bg-brand-hover disabled:opacity-50 transition-colors shrink-0"
                  >
                    {searching ? '...' : 'Search'}
                  </button>
                </div>
              </div>
            </div>

            {/* Custom feed URI input */}
            <section className="px-4 pt-4">
              <details className="group">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Add feed by URI
                </summary>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={customFeedUri}
                    onChange={(e) => setCustomFeedUri(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLookupFeed()}
                    placeholder="at://did:plc:xxx/app.bsky.feed.generator/name"
                    className="flex-1 rounded-xl border border-border bg-surface-elevated px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand transition-colors"
                  />
                  <button
                    onClick={handleLookupFeed}
                    disabled={lookingUp || !customFeedUri.trim()}
                    className="px-4 py-2.5 rounded-xl bg-brand text-black text-sm font-semibold hover:bg-brand-hover disabled:opacity-50 transition-colors shrink-0"
                  >
                    {lookingUp ? '...' : 'Lookup'}
                  </button>
                </div>
                {customFeedLookup && (
                  <div className="mt-2 p-3 rounded-xl border border-border bg-surface-elevated flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-brand/20 flex items-center justify-center shrink-0">
                      <FeedIcon />
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
                        className="px-4 py-1.5 rounded-full bg-brand text-black text-xs font-semibold hover:bg-brand-hover transition-colors shrink-0"
                      >
                        Add Feed
                      </button>
                    )}
                  </div>
                )}
              </details>
            </section>

            {/* Search results */}
            {searchResults !== null && (
              <section className="px-4 pt-4">
                <h2 className="text-base font-bold text-foreground mb-2">
                  Results for &ldquo;{searchQuery}&rdquo;
                </h2>
                {searchResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No feeds found</p>
                ) : (
                  <FeedList
                    feeds={searchResults}
                    isSubscribed={isSubscribed}
                    onSubscribe={handleSubscribe}
                    onUnsubscribe={handleUnsubscribe}
                  />
                )}
              </section>
            )}

            {/* Curated feeds */}
            <section className="px-4 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-foreground">
                  {selectedCategory || 'All Feeds'}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {curatedFeeds.length} feed{curatedFeeds.length !== 1 ? 's' : ''}
                </span>
              </div>

              {feedsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : feedsError ? (
                <div className="py-12 text-center">
                  <WarningIcon className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">{feedsError}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-3 px-4 py-2 rounded-lg bg-brand text-black text-xs font-semibold hover:bg-brand-hover transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : curatedFeeds.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted-foreground">No feeds in this category yet</p>
                </div>
              ) : (
                <FeedList
                  feeds={curatedFeeds}
                  isSubscribed={isSubscribed}
                  onSubscribe={handleSubscribe}
                  onUnsubscribe={handleUnsubscribe}
                  showCategory={!selectedCategory}
                />
              )}
            </section>
          </>
        )}

        {/* ─── PEOPLE TAB ──────────────────────────────── */}
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

        {/* ─── SAVED FEEDS TAB ──────────────────────────── */}
        {activeTab === 'saved' && (
          <section className="px-4 pt-4">
            <h2 className="text-base font-bold text-foreground mb-3">
              Your Feeds ({savedFeeds.length})
            </h2>
            {savedFeeds.length === 0 ? (
              <div className="py-16 text-center">
                <SavedFeedsIcon className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">No feeds saved yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Browse categories or search to find feeds you love
                </p>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-brand text-black text-sm font-semibold hover:bg-brand-hover transition-colors"
                >
                  Browse Feeds
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {savedFeeds.map((feed) => (
                  <div
                    key={feed.uri}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/30 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-xl bg-blue/15 flex items-center justify-center shrink-0">
                      <SavedFeedsIcon className="h-5 w-5 text-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{feed.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{feed.uri}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
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
            )}
          </section>
        )}
      </main>
    </div>
  );
}

// ─── SVG Icon Components ────────────────────────────────────────
function FeedIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  );
}

function SavedFeedsIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

// ─── Shared Feed List Component ─────────────────────────────────
function FeedList({
  feeds,
  isSubscribed,
  onSubscribe,
  onUnsubscribe,
  showCategory = false,
}: {
  feeds: FeedInfo[];
  isSubscribed: (uri: string) => boolean;
  onSubscribe: (feed: FeedInfo) => void;
  onUnsubscribe: (uri: string) => void;
  showCategory?: boolean;
}) {
  return (
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
              <div className="h-10 w-10 rounded-xl bg-brand/15 flex items-center justify-center shrink-0 group-hover:bg-brand/20 transition-colors">
                <FeedIcon />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground truncate">{feed.label}</p>
                {feed.likeCount !== undefined && feed.likeCount > 0 && (
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
              {feed.category && showCategory && (
                <span className="text-[10px] text-muted-foreground/60 mt-0.5 block">
                  {feed.category}
                </span>
              )}
            </div>

            {subbed ? (
              <button
                onClick={() => onUnsubscribe(feed.uri)}
                className="px-4 py-1.5 rounded-full border border-border text-xs font-medium text-muted-foreground hover:bg-accent transition-colors shrink-0"
              >
                Added
              </button>
            ) : (
              <button
                onClick={() => onSubscribe(feed)}
                className="px-4 py-1.5 rounded-full bg-brand text-black text-xs font-semibold hover:bg-brand-hover transition-colors shrink-0"
              >
                + Add
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

