'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSuggestions } from '@/hooks/useProfile';
import { useFeedSourceStore } from '@/stores/feed-source-store';
import { useDebouncedSearch } from '@/hooks/useSearch';
import { Avatar } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Search, LayoutGrid, Users, Bookmark, Sparkles } from 'lucide-react';
import { CURATED_FEEDS } from '@/services/feeds';

interface FeedInfo {
  uri: string;
  label: string;
  description: string;
  avatar?: string;
  creatorDid?: string;
  creatorHandle?: string;
  creatorDisplayName?: string;
  likeCount?: number;
}

type Tab = 'discover' | 'people' | 'saved';

export default function DiscoverPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: suggestions, isLoading: suggestionsLoading } = useSuggestions();
  const { savedFeeds, addSavedFeed, removeSavedFeed, setActiveSource } = useFeedSourceStore();

  const [activeTab, setActiveTab] = useState<Tab>('discover');
  const { query, setQuery, debouncedQuery } = useDebouncedSearch(300);

  // ── Popular feeds (default, no search) ──────────────────────────
  const [popularFeeds, setPopularFeeds] = useState<FeedInfo[]>([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const [popularLoadingMore, setPopularLoadingMore] = useState(false);
  const popularCursorRef = useRef<string | null>(null);
  const popularSentinelRef = useRef<HTMLDivElement | null>(null);
  const fetchingPopularRef = useRef(false);

  // ── Search results ─────────────────────────────────────────────
  const [searchResults, setSearchResults] = useState<FeedInfo[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchCursorRef = useRef<string | null>(null);

  const hasQuery = debouncedQuery.trim().length >= 1;

  // Fetch popular feeds on mount (no search query) — cached
  useEffect(() => {
    if (hasQuery) return;
    if (popularFeeds.length > 0) return; // cache hit — don't re-fetch
    setPopularLoading(true);
    popularCursorRef.current = null;

    const endpoint = isAuthenticated ? '/api/feed/generators?mode=popular&limit=25' : '/api/public/discover?mode=curated';

    async function load() {
      try {
        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          setPopularFeeds(data.feeds || []);
          popularCursorRef.current = data.cursor || null;
        } else {
          setPopularFeeds([]);
        }
      } catch {
        setPopularFeeds([]);
      }
      setPopularLoading(false);
    }
    load();
  }, [isAuthenticated, hasQuery]);

  // Infinite scroll for popular feeds (with fetching guard)
  useEffect(() => {
    if (!isAuthenticated || hasQuery || popularLoading || !popularCursorRef.current) return;
    const el = popularSentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || !popularCursorRef.current || fetchingPopularRef.current) return;
        fetchingPopularRef.current = true;
        setPopularLoadingMore(true);
        const cursor = popularCursorRef.current;
        popularCursorRef.current = null;
        fetch(`/api/feed/generators?mode=popular&limit=25&cursor=${encodeURIComponent(cursor)}`)
          .then((r) => r.ok ? r.json() : { feeds: [] })
          .then((data) => {
            setPopularFeeds((prev) => [...prev, ...(data.feeds || [])]);
            popularCursorRef.current = data.cursor || null;
          })
          .catch(() => {})
          .finally(() => {
            setPopularLoadingMore(false);
            fetchingPopularRef.current = false;
          });
      },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isAuthenticated, hasQuery, popularLoading]);

  // Search when debounced query changes
  useEffect(() => {
    if (!hasQuery) return;

    // For guests, filter the static CURATED_FEEDS list (no search API for feeds)
    if (!isAuthenticated) {
      const q = debouncedQuery.toLowerCase();
      setSearchResults(
        CURATED_FEEDS.filter(
          (f) =>
            f.label.toLowerCase().includes(q) ||
            f.description.toLowerCase().includes(q)
        ).map((f) => ({
          uri: f.uri,
          label: f.label,
          description: f.description,
          avatar: f.avatar,
          creatorHandle: '',
          creatorDisplayName: '',
          likeCount: 0,
        }))
      );
      setHasSearched(true);
      setSearching(false);
      return;
    }

    async function searchFeeds() {
      setSearching(true);
      setHasSearched(true);
      searchCursorRef.current = null;
      try {
        const res = await fetch(`/api/feed/generators?mode=popular&query=${encodeURIComponent(debouncedQuery)}&limit=30`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.feeds || []);
          searchCursorRef.current = data.cursor || null;
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }
    searchFeeds();
  }, [isAuthenticated, debouncedQuery, hasQuery]);

  // Auth redirect
  useEffect(() => {
    // Guests can browse discover
  }, [isAuthenticated, authLoading, router]);

  const isSubscribed = useCallback(
    (uri: string) => savedFeeds.some((f) => f.uri === uri),
    [savedFeeds]
  );

  const handleSubscribe = useCallback(
    (feed: FeedInfo) => {
      addSavedFeed({ type: 'custom', uri: feed.uri, label: feed.label });
      toast.success(`Added "${feed.label}"`);
    },
    [addSavedFeed]
  );

  const handleUnsubscribe = useCallback(
    (uri: string) => {
      removeSavedFeed(uri);
      toast.success('Feed removed');
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
      <header className="sticky top-0 z-40 bg-surface-base/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-lg font-bold font-heading text-foreground">Discover</h1>
        </div>

        <div className="flex px-4 gap-4">
          {(['discover', 'people', 'saved'] as Tab[]).map((tab) => {
            const icons = { discover: Search, people: Users, saved: Bookmark };
            const Icon = icons[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors capitalize inline-flex items-center gap-1.5 ${
                  activeTab === tab
                    ? 'text-brand border-brand'
                    : 'text-muted-foreground border-transparent hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} />
                {tab === 'discover' ? 'Search Feeds' : tab}
              </button>
            );
          })}
        </div>
      </header>

      <main>
        {activeTab === 'discover' && (
          <section className="px-4 pt-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" strokeWidth={2} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search 50,000+ feeds..."
                className="w-full rounded-2xl border border-border bg-surface-elevated/80 px-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/60 transition-all"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                  aria-label="Clear"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {hasQuery ? (
              searching ? (
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
              ) : hasSearched && searchResults.length === 0 ? (
                <div className="py-16 text-center">
                  <Search className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" strokeWidth={1.5} />
                  <p className="text-muted-foreground">No feeds found for &ldquo;{debouncedQuery}&rdquo;</p>
                  <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
                </div>
              ) : (
                <FeedList
                  feeds={searchResults}
                  isSubscribed={isSubscribed}
                  onSubscribe={handleSubscribe}
                  onUnsubscribe={handleUnsubscribe}
                />
              )
            ) : (
              <>
                {popularLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3">
                        <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                          <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : popularFeeds.length === 0 ? (
                  <div className="py-16 text-center">
                    <Sparkles className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" strokeWidth={1.5} />
                    <p className="text-muted-foreground">No popular feeds right now</p>
                    <p className="text-sm text-muted-foreground mt-1">Try searching instead</p>
                  </div>
                ) : (
                  <>
                    <FeedList
                      feeds={popularFeeds}
                      isSubscribed={isSubscribed}
                      onSubscribe={handleSubscribe}
                      onUnsubscribe={handleUnsubscribe}
                    />
                    <div ref={popularSentinelRef} className="h-4" />
                    {popularLoadingMore && (
                      <div className="py-6 flex justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-brand/70" />
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </section>
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
                <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" strokeWidth={1.5} />
                <p className="text-muted-foreground">No suggestions yet</p>
                <p className="text-sm text-muted-foreground mt-1">Follow more users to get better suggestions</p>
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
                      <p className="text-sm font-semibold text-foreground">{s.displayName || s.handle}</p>
                      <p className="text-xs text-muted-foreground">@{s.handle}</p>
                    </div>
                    <div className="text-xs text-muted-foreground tabular-nums">{s.count} mutual</div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'saved' && (
          <section className="px-4 pt-4">
            <h2 className="text-base font-bold text-foreground mb-3">
              Your Feeds ({savedFeeds.length})
            </h2>
            {savedFeeds.length === 0 ? (
              <div className="py-16 text-center">
                <Bookmark className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" strokeWidth={1.5} />
                <p className="text-muted-foreground">No feeds saved yet</p>
                <p className="text-sm text-muted-foreground mt-1">Search and add feeds you love</p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors"
                >
                  Search Feeds
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {savedFeeds.map((feed) => (
                  <div
                    key={feed.uri}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/30 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-xl bg-brand/15 flex items-center justify-center shrink-0">
                      <LayoutGrid className="h-5 w-5 text-brand" strokeWidth={1.5} />
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
                        className="px-4 py-1.5 rounded-full bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors"
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

// ─── Feed List ──────────────────────────────────────────────────
function FeedList({
  feeds,
  isSubscribed,
  onSubscribe,
  onUnsubscribe,
}: {
  feeds: FeedInfo[];
  isSubscribed: (uri: string) => boolean;
  onSubscribe: (feed: FeedInfo) => void;
  onUnsubscribe: (uri: string) => void;
}) {
  const router = useRouter();
  const { setActiveSource } = useFeedSourceStore();

  const handleViewFeed = (feed: FeedInfo) => {
    setActiveSource({ type: 'custom', uri: feed.uri, label: feed.label });
    router.push('/feed');
  };

  return (
    <div className="space-y-1">
      {feeds.map((feed) => {
        return (
          <div
            key={feed.uri}
            className="flex items-center gap-4 p-4 rounded-2xl transition-colors hover:bg-accent/40 group"
          >
            {feed.avatar ? (
              <img
                src={feed.avatar}
                alt={feed.label}
                className="h-11 w-11 rounded-xl object-cover shrink-0"
              />
            ) : (
              <div className="h-11 w-11 rounded-xl bg-brand/15 flex items-center justify-center shrink-0 group-hover:bg-brand/20 transition-colors">
                <LayoutGrid className="h-5 w-5 text-brand" strokeWidth={1.5} />
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
              <p className="text-xs text-muted-foreground truncate leading-relaxed">
                {feed.description || (feed.creatorHandle ? `by @${feed.creatorHandle}` : '')}
              </p>
            </div>

            <button
              onClick={() => handleViewFeed(feed)}
              className="px-4 py-1.5 rounded-full bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors shrink-0"
            >
              View
            </button>
          </div>
        );
      })}
    </div>
  );
}
