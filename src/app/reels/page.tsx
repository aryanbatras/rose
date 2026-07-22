'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useFeedSourceStore } from '@/stores/feed-source-store';
import { Heart, MessageCircle, Play, X, ChevronDown } from 'lucide-react';
import { BookmarkButton } from '@/components/feed/BookmarkButton';
import type { FeedItem } from '@/types/atproto';

/**
 * HLS video player using hls.js, falls back to native HLS on Safari.
 */
function ReelVideo({ playlistUrl, thumbnail }: { playlistUrl: string; thumbnail?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playlistUrl) return;
    let hls: any = null;

    const initHls = async () => {
      try {
        const Hls = (await import('hls.js')).default;
        if (Hls.isSupported()) {
          hls = new Hls({ enableWorker: false, lowLatencyMode: true });
          hls.loadSource(playlistUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setLoaded(true);
            video.play().catch(() => {});
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = playlistUrl;
          video.addEventListener('loadedmetadata', () => {
            setLoaded(true);
            video.play().catch(() => {});
          });
        }
      } catch {
        setLoaded(true);
      }
    };

    initHls();
    return () => { if (hls) hls.destroy(); };
  }, [playlistUrl]);

  return (
    <video
      ref={videoRef}
      poster={thumbnail}
      muted
      loop
      playsInline
      preload="metadata"
      className="h-full w-full object-contain"
    />
  );
}

/** Check if a post has a video embed. */
function isVideoPost(item: FeedItem): boolean {
  const em = item.record?.embed;
  if (!em) return false;
  const t = em.$type || '';
  return t.includes('video') || !!em.playlist || !!em.video?.playlist;
}

/** Feed source option for the dropdown */
interface FeedOption {
  type: string;
  uri?: string;
  label: string;
}

const PRESET_FEEDS: FeedOption[] = [
  { type: 'all', label: 'All Sources' },
  { type: 'following', label: 'Following' },
  { type: 'trending', label: 'Trending' },
];

const MAX_PAGES = 5;
const SOURCE_TARGET = 15;

export default function ReelsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { savedFeeds } = useFeedSourceStore();

  const [reels, setReels] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [liking, setLiking] = useState<Set<string>>(new Set());

  // Feed picker state
  const [showFeedPicker, setShowFeedPicker] = useState(false);
  const [activeFeed, setActiveFeed] = useState<FeedOption>(PRESET_FEEDS[0]);

  // Refs for pagination (avoid stale closures and infinite loops)
  const cursorRef = useRef<Record<string, string | null>>({});
  const hasMoreRef = useRef<Record<string, boolean>>({});
  const fetchingRef = useRef(false);
  const allVideosRef = useRef<FeedItem[]>([]);

  /**
   * Fetch a single page from one feed source.
   */
  const fetchSourcePage = useCallback(async (
    sourceType: string,
    feedUri?: string,
    cursor?: string,
    limit = 50
  ): Promise<{ items: FeedItem[]; cursor: string | null }> => {
    if (!isAuthenticated) return { items: [], cursor: null };
    let endpoint = `/api/feed?sourceType=${sourceType}&limit=${limit}`;
    if (sourceType === 'custom' && feedUri) {
      endpoint = `/api/feed?sourceType=custom&feedUri=${encodeURIComponent(feedUri)}&limit=${limit}`;
    }
    if (cursor) endpoint += `&cursor=${encodeURIComponent(cursor)}`;

    try {
      const res = await fetch(endpoint);
      if (!res.ok) return { items: [], cursor: null };
      const data = await res.json();
      const items = (data.items || []).filter(isVideoPost);
      return { items, cursor: data.cursor || null };
    } catch {
      return { items: [], cursor: null };
    }
  }, [isAuthenticated]);

  /**
   * Stable fetch function — uses refs for accumulation to avoid dependency cycles.
   */
  const fetchVideosRef = useRef<(reset: boolean) => Promise<void>>(async () => {});

  fetchVideosRef.current = useCallback(async (reset: boolean) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    if (reset) {
      setLoading(true);
      cursorRef.current = {};
      hasMoreRef.current = {};
      allVideosRef.current = [];
    } else {
      setLoadingMore(true);
    }

    const sourceKey = activeFeed.type + (activeFeed.uri || '');
    const safeCur = reset ? undefined : (cursorRef.current[sourceKey] || undefined);

    try {
      if (activeFeed.type === 'all') {
        const sources = [
          { type: 'discover' as const },
          { type: 'following' as const },
        ];

        let anyHasMore = false;

        for (const source of sources) {
          const sk = source.type;
          let srcCursor: string | undefined = reset ? undefined : (cursorRef.current[sk] || undefined);
          const accKey = 'all_' + sk;
          let pageCount = 0;
          let sourceCount = 0;

          while (pageCount < MAX_PAGES) {
            const { items, cursor } = await fetchSourcePage(source.type, undefined, srcCursor);
            const newItems = items.filter(
              (v) => !allVideosRef.current.some((x) => x.uri === v.uri)
            );
            allVideosRef.current.push(...newItems);
            sourceCount += newItems.length;
            srcCursor = cursor ?? undefined;
            cursorRef.current[accKey] = cursor;
            pageCount++;

            if (!cursor || sourceCount >= SOURCE_TARGET) break;
          }
          if (cursorRef.current[accKey]) anyHasMore = true;
        }

        hasMoreRef.current[sourceKey] = anyHasMore;
        setReels([...allVideosRef.current]);
      } else {
        let srcCursor: string | undefined = safeCur;
        let pageCount = 0;

        while (pageCount < MAX_PAGES) {
          const { items, cursor } = await fetchSourcePage(activeFeed.type, activeFeed.uri, srcCursor);
          const newItems = items.filter(
            (v) => !allVideosRef.current.some((x) => x.uri === v.uri)
          );
          allVideosRef.current.push(...newItems);
          srcCursor = cursor ?? undefined;
          cursorRef.current[sourceKey] = cursor;
          pageCount++;

          if (!cursor || allVideosRef.current.length >= 30) break;
        }

        hasMoreRef.current[sourceKey] = !!cursorRef.current[sourceKey];
        setReels([...allVideosRef.current]);
      }
    } catch {
      if (reset) setReels([]);
    }

    setLoading(false);
    setLoadingMore(false);
    fetchingRef.current = false;
  }, [isAuthenticated, activeFeed, fetchSourcePage]);

  // Fetch when feed changes
  useEffect(() => {
    if (isAuthenticated) fetchVideosRef.current!(true);
  }, [isAuthenticated, activeFeed]);

  // Load more when approaching the last reel (stable, no dependency cycles)
  useEffect(() => {
    if (loading || loadingMore || reels.length === 0 || fetchingRef.current) return;
    const sk = activeFeed.type + (activeFeed.uri || '');
    if (!hasMoreRef.current[sk]) return;
    // Pre-load more when user has scrolled through 70% of loaded reels
    const threshold = Math.floor(reels.length * 0.7);
    if (currentIndex < threshold) return;
    fetchVideosRef.current!(false);
  }, [currentIndex, loading, loadingMore, reels.length, activeFeed]);

  // Track scroll position for play/pause
  useEffect(() => {
    const container = containerRef.current;
    if (!container || reels.length === 0) return;

    const handleScroll = () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        const videos = container.querySelectorAll('video');
        videos.forEach((v) => v.pause());

        const children = Array.from(container.children) as HTMLElement[];
        for (let i = 0; i < children.length; i++) {
          const rect = children[i].getBoundingClientRect();
          if (rect.top >= 0 && rect.top < window.innerHeight / 2) {
            setCurrentIndex(i);
            const video = children[i].querySelector('video');
            if (video) {
              video.muted = false;
              video.play().catch(() => {});
            }
            break;
          }
        }
      }, 150);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [reels.length]);

  // Auto-scroll to first reel only on initial load (not when appending more)
  const initialLoadedRef = useRef(false);
  useEffect(() => {
    if (reels.length > 0 && !initialLoadedRef.current && containerRef.current) {
      const first = containerRef.current.children[0] as HTMLElement;
      if (first) first.scrollIntoView({ block: 'start' });
      initialLoadedRef.current = true;
    }
  }, [reels.length]);

  // Like/unlike toggle
  const handleLikeToggle = useCallback(async (item: FeedItem) => {
    if (liking.has(item.uri)) return;
    setLiking((prev) => new Set(prev).add(item.uri));

    try {
      if (item.viewer?.like) {
        await fetch('/api/interact/unlike', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ likeUri: item.viewer.like }),
        });
        item.likeCount = Math.max(0, (item.likeCount || 0) - 1);
        if (item.viewer) delete item.viewer.like;
      } else {
        await fetch('/api/interact/like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uri: item.uri, cid: item.cid }),
        });
        item.likeCount = (item.likeCount || 0) + 1;
        (item.viewer ??= {} as any).like = 'pending';
      }
      setReels((prev) => [...prev]);
    } catch (e) {
      console.error('Like failed:', e);
    } finally {
      setLiking((prev) => {
        const next = new Set(prev);
        next.delete(item.uri);
        return next;
      });
    }
  }, [liking]);

  // Change feed source
  const handleSelectFeed = useCallback((feed: FeedOption) => {
    setActiveFeed(feed);
    cursorRef.current = {};
    allVideosRef.current = [];
    setCurrentIndex(0);
    initialLoadedRef.current = false;
    setShowFeedPicker(false);
  }, []);

  const allFeedOptions: FeedOption[] = [
    ...PRESET_FEEDS,
    ...savedFeeds.map((f) => ({ type: 'custom', uri: f.uri, label: f.label })),
  ];

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'oklch(0.04 0.003 80)' }}>
        <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50" style={{ background: 'oklch(0.04 0.003 80)' }}>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pt-4">
        <button
          onClick={() => router.back()}
          className="h-10 w-10 rounded-2xl bg-black/30 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:bg-black/50 transition-all active:scale-95"
          aria-label="Close reels"
        >
          <X className="h-5 w-5" strokeWidth={2.5} />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowFeedPicker(!showFeedPicker)}
            className="flex items-center gap-1.5 text-xs font-medium text-white/70 bg-black/25 px-3 py-1.5 rounded-full backdrop-blur-sm hover:bg-black/40 transition-all active:scale-95"
          >
            {activeFeed.label}
            <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showFeedPicker ? 'rotate-180' : ''}`} />
          </button>

          {showFeedPicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowFeedPicker(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 w-52 py-1.5 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-white/10 shadow-2xl">
                {allFeedOptions.map((feed) => (
                  <button
                    key={`${feed.type}-${feed.uri || feed.label}`}
                    onClick={() => handleSelectFeed(feed)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                      activeFeed.type === feed.type && activeFeed.label === feed.label
                        ? 'text-white bg-white/10'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {feed.type === 'all' && <span className="text-xs">🌐</span>}
                    {feed.type === 'following' && <span className="text-xs">👤</span>}
                    {feed.type === 'trending' && <span className="text-xs">🔥</span>}
                    {feed.type === 'custom' && <span className="text-xs">📋</span>}
                    <span className="truncate">{feed.label}</span>
                    {activeFeed.type === feed.type && activeFeed.label === feed.label && (
                      <span className="ml-auto"><div className="h-2 w-2 rounded-full bg-brand" /></span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-white/40" />
            <p className="text-sm text-white/30 font-medium">Finding reels...</p>
          </div>
        </div>
      ) : reels.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center px-8">
          <div className="h-20 w-20 rounded-2xl bg-white/5 flex items-center justify-center mb-5">
            <Play className="h-10 w-10 text-white/20" strokeWidth={1.5} />
          </div>
          <p className="text-lg font-medium text-white/60">No reels found</p>
          <p className="text-sm text-white/30 mt-1.5 max-w-xs leading-relaxed">
            Video posts are still rare on Bluesky. Try switching to &ldquo;All Sources&rdquo; or a different feed.
          </p>
          <button
            onClick={() => handleSelectFeed(PRESET_FEEDS[0])}
            className="mt-7 px-7 py-2.5 rounded-2xl bg-white/10 text-white/90 text-sm font-semibold hover:bg-white/20 transition-all backdrop-blur-sm active:scale-95"
          >
            Try All Sources
          </button>
        </div>
      ) : (
        <>
          <div
            ref={containerRef}
            className="h-full w-full overflow-y-auto snap-y snap-mandatory scrollbar-none"
          >
            {reels.map((item, index) => {
              const em = item.record?.embed;
              const playlistUrl = em?.playlist || em?.video?.playlist || '';
              const thumbnail = em?.thumbnail || em?.video?.thumbnail || '';
              const caption = item.record?.text || '';
              const displayName = item.author?.displayName || item.author?.handle || '';
              const handle = item.author?.handle || '';
              const isLiked = !!item.viewer?.like;

              return (
                <section
                  key={`${item.uri}-${item.cid}`}
                  className="h-full w-full snap-start snap-always relative flex items-center justify-center"
                >
                  <div className="relative h-full w-full flex items-center justify-center p-2">
                    <div className="relative h-full w-full max-h-[95vh] overflow-hidden rounded-2xl bg-black shadow-2xl">
                      {playlistUrl ? (
                        <ReelVideo playlistUrl={playlistUrl} thumbnail={thumbnail} />
                      ) : thumbnail ? (
                        <img
                          src={thumbnail}
                          alt=""
                          className="h-full w-full object-contain"
                          loading={index === 0 ? 'eager' : 'lazy'}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Play className="h-20 w-20 text-white/10" strokeWidth={1} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-black/70 via-black/15 to-transparent pointer-events-none" />

                  <div className="absolute bottom-0 left-0 right-0 p-5 pb-12 z-10">
                    <div className="flex items-center gap-3 mb-2.5">
                      <button
                        onClick={() => router.push(`/profile/${handle}`)}
                        className="h-9 w-9 rounded-full overflow-hidden shrink-0 shadow-lg"
                        style={{ boxShadow: '0 0 0 2px rgba(255,255,255,0.3)' }}
                      >
                        {item.author?.avatar ? (
                          <img src={item.author.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-white/20 flex items-center justify-center text-sm font-semibold text-white">
                            {displayName[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                      </button>
                      <button
                        onClick={() => router.push(`/profile/${handle}`)}
                        className="font-semibold text-sm text-white/90 hover:text-white transition-colors drop-shadow-sm"
                      >
                        {displayName}
                      </button>
                    </div>
                    {caption && (
                      <p className="text-sm text-white/80 line-clamp-2 leading-relaxed drop-shadow-sm">{caption}</p>
                    )}
                  </div>

                  <div className="absolute bottom-28 right-4 z-10 flex flex-col items-center gap-6">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleLikeToggle(item); }}
                      disabled={liking.has(item.uri)}
                      className="flex flex-col items-center gap-0.5 transition-all active:scale-90 disabled:opacity-60"
                    >
                      <div className={`h-11 w-11 rounded-2xl backdrop-blur-md flex items-center justify-center transition-all duration-200 group ${
                        isLiked ? 'bg-white/20' : 'bg-white/10 hover:bg-white/15'
                      }`}>
                        <Heart
                          className={`h-6 w-6 transition-all duration-200 ${
                            isLiked ? 'fill-destructive text-destructive scale-110' : 'text-white/80 group-hover:text-white'
                          }`}
                          strokeWidth={isLiked ? 2 : 1.5}
                        />
                      </div>
                      <span className={`text-[11px] font-semibold ${isLiked ? 'text-destructive' : 'text-white/70'}`}>
                        {item.likeCount || 0}
                      </span>
                    </button>

                    <button
                      onClick={() => router.push(`/feed/${encodeURIComponent(item.uri)}`)}
                      className="flex flex-col items-center gap-0.5 transition-all active:scale-90"
                    >
                      <div className="h-11 w-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/15 transition-colors">
                        <MessageCircle className="h-6 w-6 text-white/80" strokeWidth={1.5} />
                      </div>
                      <span className="text-[11px] font-semibold text-white/70">{item.replyCount || 0}</span>
                    </button>

                    <div className="flex flex-col items-center gap-0.5">
                      <div className="h-11 w-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/15 transition-colors">
                        <BookmarkButton item={item} variant="light" />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (index > 0) {
                        const prev = containerRef.current?.children[index - 1] as HTMLElement;
                        prev?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className="absolute left-0 top-1/4 bottom-1/4 w-1/3 z-10"
                    aria-label="Previous reel"
                  />
                  <button
                    onClick={() => {
                      if (index < reels.length - 1) {
                        const next = containerRef.current?.children[index + 1] as HTMLElement;
                        next?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className="absolute right-0 top-1/4 bottom-1/4 w-1/3 z-10"
                    aria-label="Next reel"
                  />
                </section>
              );
            })}

            {loadingMore && (
              <div className="h-16 w-full snap-start flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-white/40" />
              </div>
            )}
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 text-xs font-medium text-white/50 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
            {currentIndex + 1} / {reels.length}
          </div>
        </>
      )}
    </div>
  );
}
