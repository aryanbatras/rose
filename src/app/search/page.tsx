'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useDebouncedSearch, useSearchPosts, useSearchActors } from '@/hooks/useSearch';
import { Avatar } from '@/components/ui/avatar';
import { Play, Image, LayoutGrid, Loader2 } from 'lucide-react';

export default function SearchPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { query, setQuery, debouncedQuery } = useDebouncedSearch(300);
  const [tab, setTab] = useState<'top' | 'people' | 'posts'>('top');

  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching: postsFetching,
  } = useSearchPosts(debouncedQuery);
  const { data: actorsData, isLoading: actorsLoading } = useSearchActors(debouncedQuery);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const posts = postsData?.pages.flatMap((p) => p.items) || [];
  const actors = actorsData || [];
  const isLoading = postsFetching && !postsData;
  const hasQuery = debouncedQuery.trim().length >= 2;

  // ─── Search results infinite scroll sentinel ──────
  const searchSentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!hasQuery || tab === 'people') return;
    const el = searchSentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasQuery, tab, hasNextPage, isFetchingNextPage, fetchNextPage, posts.length]);

  // ─── Discover grid (no search query) ──────────────
  const [discoverPosts, setDiscoverPosts] = useState<any[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(true);
  const [discoverLoadingMore, setDiscoverLoadingMore] = useState(false);
  const discoverCursorRef = useRef<string | null>(null);
  const discoverFetchingRef = useRef(false);
  const discoverSentinelRef = useRef<HTMLDivElement>(null);

  // Helper: filter posts with image/video embeds, dedup by URI
  const filterMedia = (items: any[], existing: any[]) => {
    const existingUris = new Set(existing.map((p) => p.uri));
    return items.filter((p: any) => {
      const em = p.record?.embed;
      if (!em) return false;
      const t = em.$type || '';
      if (!t.includes('images') && !t.includes('video')) return false;
      return !existingUris.has(p.uri);
    });
  };

  // Initial discover fetch (and reset when user clears search)
  useEffect(() => {
    if (!isAuthenticated || hasQuery) {
      setDiscoverLoading(false);
      return;
    }
    // Cache guard: if we already have data from a previous browse, don't re-fetch
    if (discoverPosts.length > 0) {
      setDiscoverLoading(false);
      return;
    }
    setDiscoverLoading(true);
    discoverCursorRef.current = null;
    discoverFetchingRef.current = true;
    fetch('/api/feed?sourceType=discover&limit=20')
      .then((r) => (r.ok ? r.json() : { items: [], cursor: null }))
      .then((data) => {
        const items = data.items || [];
        discoverCursorRef.current = data.cursor || null;
        setDiscoverPosts(items.filter((p: any) => {
          const em = p.record?.embed;
          if (!em) return false;
          const t = em.$type || '';
          return t.includes('images') || t.includes('video');
        }));
      })
      .catch(() => {})
      .finally(() => {
        discoverFetchingRef.current = false;
        setDiscoverLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, hasQuery]);

  // Infinite scroll for discover grid
  useEffect(() => {
    if (hasQuery) return;
    if (discoverLoading) return;
    const el = discoverSentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        if (discoverFetchingRef.current) return;
        if (!discoverCursorRef.current) return;
        discoverFetchingRef.current = true;
        setDiscoverLoadingMore(true);
        fetch(`/api/feed?sourceType=discover&limit=20&cursor=${encodeURIComponent(discoverCursorRef.current)}`)
          .then((r) => (r.ok ? r.json() : { items: [], cursor: null }))
          .then((data) => {
            const items = data.items || [];
            discoverCursorRef.current = data.cursor || null;
            setDiscoverPosts((prev) => [...prev, ...filterMedia(items, prev)]);
          })
          .catch(() => {})
          .finally(() => {
            discoverFetchingRef.current = false;
            setDiscoverLoadingMore(false);
          });
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasQuery, discoverLoading, discoverPosts.length]);

  return (
    <div className="min-h-[100dvh] bg-surface-base">
      <header className="sticky top-0 z-40 border-b border-border bg-surface-base/80 backdrop-blur-lg">
        <div className="mx-auto max-w-lg px-4 py-3">
          <h1 className="text-lg font-bold font-heading text-foreground mb-3">
            Search
          </h1>
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts and people..."
              className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
              autoComplete="off"
            />
          </div>
        </div>

        {/* Tabs (only when searching) */}
        {hasQuery && (
          <div className="flex border-b border-border">
            {(['top', 'people', 'posts'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                  tab === t
                    ? 'border-b-2 border-brand text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="mx-auto pb-20">
        {!hasQuery ? (
          /* ─── DISCOVER GRID (no query, infinite scroll) ── */
          <>
            {discoverLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-[2px] px-0 pt-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-surface-elevated animate-pulse" />
                ))}
              </div>
            ) : discoverPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <LayoutGrid className="h-12 w-12 text-muted-foreground/30 mb-4" strokeWidth={1} />
                <p className="text-lg font-medium text-foreground">Discover media</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Photos and videos from across the network
                </p>
              </div>
            ) : (
              <div className="px-2 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {discoverPosts.map((item: any) => {
                    const em = item.record?.embed;
                    const images = em?.images || [];
                    const thumbUrl = images[0]?.thumb || images[0]?.fullsize || em?.thumbnail || em?.video?.thumbnail || null;
                    const isVideo = (em?.$type || '').includes('video');
                    const isMultiImage = images.length > 1;
                    const authorName = item.author?.displayName || item.author?.handle || '';

                    return (
                      <button
                        key={item.uri}
                        onClick={() => router.push(`/feed/${encodeURIComponent(item.uri)}`)}
                        className="relative aspect-square overflow-hidden rounded-2xl bg-surface-elevated group cursor-pointer shadow-sm"
                      >
                        {thumbUrl ? (
                          <>
                            <img src={thumbUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" loading="lazy" />
                            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="h-5 w-5 rounded-full overflow-hidden ring-1 ring-white/30 shrink-0">
                                    {item.author?.avatar && <img src={item.author.avatar} alt="" className="h-full w-full object-cover" />}
                                  </div>
                                  <span className="text-xs font-semibold text-white truncate drop-shadow-sm">{authorName}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-white/70">
                                  <span>❤ {item.likeCount || 0}</span>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand/20 to-brand/5">
                            <Play className="h-8 w-8 text-brand/40" strokeWidth={1.5} />
                          </div>
                        )}
                        {isVideo && (
                          <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                            <Play className="h-3 w-3 text-white fill-white ml-0.5" strokeWidth={0} />
                          </div>
                        )}
                        {isMultiImage && (
                          <div className="absolute top-2 left-2 h-5 w-5 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                            <Image className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Discover infinite scroll sentinel + loading indicator */}
                <div ref={discoverSentinelRef} className="flex items-center justify-center py-6">
                  {discoverLoadingMore && (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  )}
                  {!discoverCursorRef.current && discoverPosts.length > 0 && (
                    <p className="text-xs text-muted-foreground/50">No more media</p>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* ─── SEARCH RESULTS ───────────────────────── */}
            {(tab === 'top' || tab === 'people') && actors.length > 0 && (
              <div className="px-4 pt-4">
                {(tab === 'top') && <h2 className="mb-2 text-sm font-semibold text-foreground">People</h2>}
                <div className="space-y-1">
                  {actors.map((actor: any) => (
                    <button
                      key={actor.did}
                      onClick={() => router.push(`/profile/${actor.handle}`)}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/30"
                    >
                      <Avatar src={actor.avatar} alt={actor.displayName || actor.handle} size="md" />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-foreground">{actor.displayName || actor.handle}</p>
                        <p className="text-xs text-muted-foreground">@{actor.handle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(tab === 'top' || tab === 'posts') && (
              <>
                {isLoading ? (
                  /* ─── POSTS LOADING SKELETON ─────────── */
                  <div className="px-2 pt-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="aspect-square rounded-2xl bg-surface-elevated animate-pulse" />
                      ))}
                    </div>
                  </div>
                ) : posts.length > 0 ? (
                  <>
                    <div className="px-2 pt-3">
                      {(tab === 'top') && actors.length > 0 && (
                        <div className="px-2 pb-3">
                          <h2 className="text-sm font-semibold text-foreground">Posts</h2>
                        </div>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {posts.map((item: any, index: number) => {
                          const em = item.record?.embed || item.embed;
                          const images = em?.images || [];
                          const thumbUrl = images[0]?.thumb || images[0]?.fullsize || em?.thumbnail || em?.video?.thumbnail || null;
                          const isVideo = (em?.$type || '').includes('video');
                          const isMultiImage = images.length > 1;
                          const authorName = item.author?.displayName || item.author?.handle || '';

                          return thumbUrl ? (
                            <button
                              key={`${item.uri}-${index}`}
                              onClick={() => router.push(`/feed/${encodeURIComponent(item.uri)}`)}
                              className="relative aspect-square overflow-hidden rounded-2xl bg-surface-elevated group cursor-pointer shadow-sm"
                            >
                              <img src={thumbUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" loading="lazy" />
                              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="h-5 w-5 rounded-full overflow-hidden ring-1 ring-white/30 shrink-0">
                                      {item.author?.avatar && <img src={item.author.avatar} alt="" className="h-full w-full object-cover" />}
                                    </div>
                                    <span className="text-xs font-semibold text-white truncate drop-shadow-sm">{authorName}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-white/70">
                                    <span>❤ {item.likeCount || 0}</span>
                                  </div>
                                </div>
                              </div>
                              {isVideo && (
                                <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                                  <Play className="h-3 w-3 text-white fill-white ml-0.5" strokeWidth={0} />
                                </div>
                              )}
                              {isMultiImage && (
                                <div className="absolute top-2 left-2 h-5 w-5 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                                  <Image className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </button>
                          ) : null;
                        })}
                      </div>
                    </div>

                    {/* Search infinite scroll sentinel + loading indicator */}
                    <div ref={searchSentinelRef} className="flex items-center justify-center py-6">
                      {isFetchingNextPage && (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      )}
                      {!hasNextPage && posts.length > 0 && (
                        <p className="text-xs text-muted-foreground/50">No more results</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="py-16 text-center">
                    <p className="text-muted-foreground">No results for &ldquo;{debouncedQuery}&rdquo;</p>
                    <p className="text-sm text-muted-foreground mt-1">Try a different search</p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
