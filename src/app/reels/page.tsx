'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Heart, MessageCircle, Play } from 'lucide-react';
import type { FeedItem } from '@/types/atproto';

/**
 * HLS video player component using hls.js for cross-browser support.
 * Falls back to native video tag on Safari which supports HLS natively.
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
          hls = new Hls({
            enableWorker: false,
            lowLatencyMode: true,
          });
          hls.loadSource(playlistUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setLoaded(true);
            video.play().catch(() => {});
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Safari native HLS support
          video.src = playlistUrl;
          video.addEventListener('loadedmetadata', () => {
            setLoaded(true);
            video.play().catch(() => {});
          });
        }
      } catch {
        // Fallback: just show the thumbnail
        setLoaded(true);
      }
    };

    initHls();

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
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

export default function ReelsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [reels, setReels] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, authLoading, router]);

  // Fetch video posts from discover feed + popular feed for more variety
  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);

    async function fetchVideos() {
      const allVideos: FeedItem[] = [];

      // Try multiple sources to get more videos
      const sources = [
        fetch('/api/feed?sourceType=discover&limit=100'),
        fetch('/api/feed?sourceType=following&limit=50'),
      ];

      const results = await Promise.allSettled(sources);
      for (const result of results) {
        if (result.status === 'fulfilled') {
          try {
            const data = await result.value.json();
            const items = (data.items || []).filter((p: any) => {
              const em = p.record?.embed;
              if (!em) return false;
              return (em.$type || '').includes('video') || !!em.playlist;
            });
            allVideos.push(...items);
          } catch {}
        }
      }

      // Deduplicate by URI
      const seen = new Set<string>();
      const unique = allVideos.filter((v) => {
        if (seen.has(v.uri)) return false;
        seen.add(v.uri);
        return true;
      });

      setReels(unique.length > 0 ? unique : []);
      setLoading(false);
    }

    fetchVideos();
  }, [isAuthenticated]);

  // Track scroll position to update current index and play/pause videos
  useEffect(() => {
    const container = containerRef.current;
    if (!container || reels.length === 0) return;

    const handleScroll = () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

      scrollTimeoutRef.current = setTimeout(() => {
        const videos = container.querySelectorAll('video');
        // Pause all videos
        videos.forEach((v) => v.pause());

        const childNodes = Array.from(container.children) as HTMLElement[];
        for (let i = 0; i < childNodes.length; i++) {
          const rect = childNodes[i].getBoundingClientRect();
          if (rect.top >= 0 && rect.top < window.innerHeight / 2) {
            setCurrentIndex(i);
            // Play the video for this reel
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

  // Auto-scroll: scroll to first reel when loaded
  useEffect(() => {
    if (reels.length > 0 && containerRef.current) {
      const firstReel = containerRef.current.children[0] as HTMLElement;
      if (firstReel) {
        firstReel.scrollIntoView({ block: 'start' });
      }
    }
  }, [reels.length]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-pulse rounded-full bg-white/30" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Close button */}
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 z-50 h-9 w-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
        aria-label="Close reels"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {loading ? (
        <div className="flex h-full items-center justify-center">
          <div className="h-10 w-10 animate-pulse rounded-full bg-white/20" />
        </div>
      ) : reels.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center px-8">
          <Play className="h-16 w-16 text-white/20 mb-4" strokeWidth={1} />
          <p className="text-lg font-medium text-white/70">No reels found</p>
          <p className="text-sm text-white/40 mt-1">Try switching feeds or check back later</p>
          <button
            onClick={() => router.push('/feed')}
            className="mt-6 px-6 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors"
          >
            Go to Feed
          </button>
        </div>
      ) : (
        <>
          {/* Counter indicator */}
          <div className="absolute top-4 right-4 z-50 text-xs text-white/50 font-medium bg-black/30 px-2.5 py-1 rounded-full backdrop-blur-sm">
            {currentIndex + 1} / {reels.length}
          </div>

          {/* Reels scroll container — CSS snap for smooth vertical scrolling */}
          <div
            ref={containerRef}
            className="h-full w-full overflow-y-auto snap-y snap-mandatory scrollbar-none"
          >
            {reels.map((item, index) => {
              const em = item.record.embed;
              // Video embed: playlist is the HLS URL
              const playlistUrl = em?.playlist || em?.video?.playlist || '';
              const thumbnail = em?.thumbnail || em?.video?.thumbnail || '';
              const caption = item.record.text || '';
              const displayName = item.author.displayName || item.author.handle;
              const handle = item.author.handle;

              return (
                <section
                  key={`${item.uri}-${item.cid}`}
                  className="h-full w-full snap-start snap-always relative flex items-center justify-center bg-black"
                >
                  {/* Video player */}
                  {playlistUrl ? (
                    <ReelVideo playlistUrl={playlistUrl} thumbnail={thumbnail} />
                  ) : thumbnail ? (
                    /* Fallback: show thumbnail if no playlist URL */
                    <img
                      src={thumbnail}
                      alt=""
                      className="h-full w-full object-contain"
                      loading={index === 0 ? 'eager' : 'lazy'}
                    />
                  ) : (
                    <div className="flex items-center justify-center">
                      <Play className="h-20 w-20 text-white/20" strokeWidth={1} />
                    </div>
                  )}

                  {/* Gradient overlay for text readability */}
                  <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                  {/* Bottom info — Instagram-style: left-aligned */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 pb-10 z-10">
                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={() => router.push(`/profile/${handle}`)}
                        className="h-9 w-9 rounded-full overflow-hidden shrink-0 ring-2 ring-white/40"
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
                        className="font-semibold text-sm text-white hover:underline drop-shadow-sm"
                      >
                        {displayName}
                      </button>
                    </div>

                    {caption && (
                      <p className="text-sm text-white/90 line-clamp-2 leading-relaxed drop-shadow-sm">{caption}</p>
                    )}
                  </div>

                  {/* Right-side action buttons — Instagram-style */}
                  <div className="absolute bottom-24 right-4 z-10 flex flex-col items-center gap-5">
                    <button
                      onClick={() => router.push(`/feed/${encodeURIComponent(item.uri)}`)}
                      className="flex flex-col items-center gap-0.5 text-white/80 hover:text-white transition-colors"
                    >
                      <div className="h-11 w-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                        <Heart className="h-6 w-6" strokeWidth={1.5} />
                      </div>
                      <span className="text-[11px] font-medium">{item.likeCount || 0}</span>
                    </button>
                    <button
                      onClick={() => router.push(`/feed/${encodeURIComponent(item.uri)}`)}
                      className="flex flex-col items-center gap-0.5 text-white/80 hover:text-white transition-colors"
                    >
                      <div className="h-11 w-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                        <MessageCircle className="h-6 w-6" strokeWidth={1.5} />
                      </div>
                      <span className="text-[11px] font-medium">{item.replyCount || 0}</span>
                    </button>
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
