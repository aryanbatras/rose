'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useFeedSourceStore } from '@/stores/feed-source-store';
import { Heart, MessageCircle, Play, X, ChevronDown } from 'lucide-react';
import type { FeedItem } from '@/types/atproto';

/**
 * HLS video player component using hls.js.
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

/** Feed source option for the dropdown */
interface FeedOption {
  type: string;
  uri?: string;
  label: string;
}

const PRESET_FEEDS: FeedOption[] = [
  { type: 'discover', label: 'Discover' },
  { type: 'following', label: 'Following' },
  { type: 'trending', label: 'Trending' },
];

export default function ReelsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { savedFeeds } = useFeedSourceStore();

  const [reels, setReels] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [liking, setLiking] = useState<Set<string>>(new Set());

  // Feed picker state
  const [showFeedPicker, setShowFeedPicker] = useState(false);
  const [activeFeed, setActiveFeed] = useState<FeedOption>(PRESET_FEEDS[0]);
  const cursorRef = useRef<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, authLoading, router]);

  // Fetch video posts from a specific feed source
  const fetchVideos = useCallback(async (reset = false) => {
    if (!isAuthenticated) return;
    if (reset) {
      setLoading(true);
      cursorRef.current = null;
    } else {
      setLoadingMore(true);
    }

    try {
      let endpoint = `/api/feed?sourceType=${activeFeed.type}&limit=20`;
      if (activeFeed.type === 'custom' && activeFeed.uri) {
        endpoint = `/api/feed?sourceType=custom&feedUri=${encodeURIComponent(activeFeed.uri)}&limit=20`;
      }
      if (cursorRef.current && !reset) {
        endpoint += `&cursor=${encodeURIComponent(cursorRef.current)}`;
      }

      const res = await fetch(endpoint);
      if (!res.ok) {
        if (reset) setReels([]);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      const data = await res.json();
      const items: FeedItem[] = (data.items || []).filter((p: any) => {
        const em = p.record?.embed;
        if (!em) return false;
        return (em.$type || '').includes('video') || !!em.playlist;
      });

      cursorRef.current = data.cursor || null;
      setHasMore(!!data.cursor && items.length > 0);

      if (reset) {
        setReels(items);
      } else {
        setReels((prev) => {
          const seen = new Set(prev.map((v) => v.uri));
          const newItems = items.filter((v) => !seen.has(v.uri));
          return [...prev, ...newItems];
        });
      }
    } catch {
      if (reset) setReels([]);
    }
    setLoading(false);
    setLoadingMore(false);
  }, [isAuthenticated, activeFeed]);

  // Fetch when feed changes
  useEffect(() => {
    if (isAuthenticated) fetchVideos(true);
  }, [isAuthenticated, fetchVideos]);

  // Load more when reaching the last few reels
  useEffect(() => {
    if (!hasMore || loadingMore || loading || reels.length === 0) return;
    if (currentIndex >= reels.length - 3) {
      fetchVideos(false);
    }
  }, [currentIndex, hasMore, loadingMore, loading, reels.length, fetchVideos]);

  // Track scroll position to update current index and play/pause
  useEffect(() => {
    const container = containerRef.current;
    if (!container || reels.length === 0) return;

    const handleScroll = () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

      scrollTimeoutRef.current = setTimeout(() => {
        const videos = container.querySelectorAll('video');
        videos.forEach((v) => v.pause());

        const childNodes = Array.from(container.children) as HTMLElement[];
        for (let i = 0; i < childNodes.length; i++) {
          const rect = childNodes[i].getBoundingClientRect();
          if (rect.top >= 0 && rect.top < window.innerHeight / 2) {
            setCurrentIndex(i);
            const video = childNodes[i].querySelector('video');
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

  // Auto-scroll to first reel when loaded
  useEffect(() => {
    if (reels.length > 0 && containerRef.current) {
      const firstReel = containerRef.current.children[0] as HTMLElement;
      if (firstReel) {
        firstReel.scrollIntoView({ block: 'start' });
      }
    }
  }, [reels.length]);

  // Like/unlike toggle
  const handleLikeToggle = useCallback(
    async (item: FeedItem) => {
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
        console.error('Like toggle failed:', e);
      } finally {
        setLiking((prev) => {
          const next = new Set(prev);
          next.delete(item.uri);
          return next;
        });
      }
    },
    [liking]
  );

  // Change feed source
  const handleSelectFeed = useCallback((feed: FeedOption) => {
    setActiveFeed(feed);
    cursorRef.current = null;
    setCurrentIndex(0);
    setShowFeedPicker(false);
  }, []);

  // Build all feed options: presets + saved feeds
  const allFeedOptions: FeedOption[] = [
    ...PRESET_FEEDS,
    ...savedFeeds.map((f) => ({
      type: 'custom',
      uri: f.uri,
      label: f.label,
    })),
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
      {/* ── Top bar ── */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pt-4">
        <button
          onClick={() => router.back()}
          className="h-10 w-10 rounded-2xl bg-black/30 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:bg-black/50 transition-all active:scale-95"
          aria-label="Close reels"
        >
          <X className="h-5 w-5" strokeWidth={2.5} />
        </button>

        {/* Feed picker button */}
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
                    {feed.type === 'discover' && <span className="text-xs">🌐</span>}
                    {feed.type === 'following' && <span className="text-xs">👤</span>}
                    {feed.type === 'trending' && <span className="text-xs">🔥</span>}
                    {feed.type === 'custom' && <span className="text-xs">📋</span>}
                    <span className="truncate">{feed.label}</span>
                    {activeFeed.type === feed.type && activeFeed.label === feed.label && (
                      <span className="ml-auto">
                        <div className="h-2 w-2 rounded-full bg-brand" />
                      </span>
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
            <p className="text-sm text-white/30 font-medium">Loading reels...</p>
          </div>
        </div>
      ) : reels.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center px-8">
          <div className="h-20 w-20 rounded-2xl bg-white/5 flex items-center justify-center mb-5">
            <Play className="h-10 w-10 text-white/20" strokeWidth={1.5} />
          </div>
          <p className="text-lg font-medium text-white/60">No reels yet</p>
          <p className="text-sm text-white/30 mt-1.5 max-w-xs">
            No videos found in &ldquo;{activeFeed.label}&rdquo;. Try a different feed.
          </p>
          <button
            onClick={() => router.push('/feed')}
            className="mt-7 px-7 py-2.5 rounded-2xl bg-white/10 text-white/90 text-sm font-semibold hover:bg-white/20 transition-all backdrop-blur-sm active:scale-95"
          >
            Browse Feed
          </button>
        </div>
      ) : (
        <>
          <div
            ref={containerRef}
            className="h-full w-full overflow-y-auto snap-y snap-mandatory scrollbar-none"
          >
            {reels.map((item, index) => {
              const em = item.record.embed;
              const playlistUrl = em?.playlist || em?.video?.playlist || '';
              const thumbnail = em?.thumbnail || em?.video?.thumbnail || '';
              const caption = item.record.text || '';
              const displayName = item.author.displayName || item.author.handle;
              const handle = item.author.handle;
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
                        {item.author.avatar ? (
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

            {/* Loading more indicator */}
            {loadingMore && (
              <div className="h-16 w-full snap-start flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-white/40" />
              </div>
            )}
          </div>

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 text-[10px] font-medium text-white/40 bg-black/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
            {currentIndex + 1} / {reels.length}
          </div>
        </>
      )}
    </div>
  );
}
