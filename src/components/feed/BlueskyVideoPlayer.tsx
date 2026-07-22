'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import type { FeedItem } from '@/types/atproto';

interface BlueskyVideoPlayerProps {
  item: FeedItem;
  /** Reels mode: full-screen vertical snap-scroll with minimal overlay */
  variant?: 'reels' | 'inline';
  /** Auto-play when visible (requires user gesture) */
  autoPlay?: boolean;
  /** Start muted (required for auto-play in most browsers) */
  muted?: boolean;
}

/**
 * BlueskyVideoPlayer renders video from Bluesky's HLS playlist.
 *
 * Data source: item.record.embed.video.playlist (HLS .m3u8 URL)
 * Falls back to native <video> for Safari (native HLS support)
 * Uses hls.js for other browsers (Chrome, Firefox, etc.)
 */
export function BlueskyVideoPlayer({
  item,
  variant = 'inline',
  autoPlay = false,
  muted: initialMuted = true,
}: BlueskyVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [showControls, setShowControls] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up controls timer on unmount
  useEffect(() => {
    return () => {
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    };
  }, []);

  const embed = item.record.embed;
  // Hydrated View form (post.embed):  embed.playlist, embed.thumbnail
  // Raw Main form (record.embed):     embed.video.playlist, embed.video.thumbnail
  const playlistUrl = embed?.playlist || embed?.video?.playlist;
  const thumbnailUrl = embed?.thumbnail || embed?.video?.thumbnail;
  const isReels = variant === 'reels';

  // Initialize video player
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playlistUrl) return;

    let hls: any = null;
    let observer: IntersectionObserver | null = null;

    // Check if browser supports HLS natively (Safari)
    const canPlayHlsNative = video.canPlayType('application/vnd.apple.mpegurl') !== '';

    if (canPlayHlsNative) {
      // Safari — native HLS support via <video src>
      video.src = playlistUrl;
    } else {
      // Other browsers — use hls.js
      import('hls.js')
        .then((HlsModule) => {
          const Hls = HlsModule.default;
          if (Hls.isSupported()) {
            hls = new Hls({
              enableWorker: true,
              lowLatencyMode: true,
            });
            hls.loadSource(playlistUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (autoPlay && isMuted) {
                video.play().catch(() => {});
              }
            });

            hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
              console.error('HLS playback error:', data);
              if (data.fatal) {
                setError('Video playback failed');
              }
            });
          }
        })
        .catch((err) => {
          console.error('Failed to load hls.js:', err);
        });
    }

    // Auto-play when visible using IntersectionObserver
    if (autoPlay && containerRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              video.play().catch(() => {});
              setIsPlaying(true);
            } else {
              video.pause();
              setIsPlaying(false);
            }
          });    },
      { threshold: 0.6 }
    );
      observer.observe(containerRef.current);
    }

    return () => {
      if (observer) observer.disconnect();
      if (hls) hls.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistUrl, autoPlay]);

  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  if (!playlistUrl || error) {
    return (
      <div className="flex items-center justify-center bg-black/40 rounded-xl aspect-video">
        <p className="text-muted-foreground text-sm">{error || 'Video unavailable'}</p>
      </div>
    );
  }

  if (isReels) {
    return (
      <div
        ref={containerRef}
        className="relative h-full w-full flex items-center justify-center bg-black cursor-pointer"
        onClick={togglePlay}
        onMouseMove={showControlsTemporarily}
      >
        {/* Thumbnail fallback while loading */}
        {!isPlaying && thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* Video element */}
        <video
          ref={videoRef}
          className="h-full w-full object-contain"
          playsInline
          loop
          muted={isMuted}
          preload="metadata"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Play button overlay (when paused) */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center" onClick={togglePlay}>
            <div className="h-16 w-16 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm transition-transform hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Controls overlay */}
        <div
          className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="text-white hover:text-white/80 transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                {isPlaying ? (
                  <>
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </>
                ) : (
                  <path d="M8 5v14l11-7z" />
                )}
              </svg>
            </button>

            <button
              onClick={toggleMute}
              className="text-white hover:text-white/80 transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {isMuted ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                ) : (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </>
                )}
              </svg>
            </button>

            <span className="text-white/70 text-xs font-mono">
              {item.author.displayName || item.author.handle}
            </span>
          </div>
        </div>

        {/* Mute indicator */}
        {isPlaying && isMuted && (
          <div className="absolute top-4 right-4">
            <div className="h-8 w-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Inline variant (for FeedCard)
  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl bg-black/40 cursor-pointer group"
      onClick={togglePlay}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Thumbnail fallback */}
      {!isPlaying && thumbnailUrl && (
        <img src={thumbnailUrl} alt="" className="w-full object-cover max-h-96" loading="lazy" />
      )}

      <video
        ref={videoRef}
        className="w-full object-cover max-h-96"
        playsInline
        loop
        muted={isMuted}
        preload="metadata"
      />

      {/* Play button */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-14 w-14 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm transition-transform group-hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Mute/unmute button */}
      {isPlaying && (
        <button
          onClick={toggleMute}
          className="absolute bottom-3 right-3 h-9 w-9 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {isMuted ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            ) : (
              <>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </>
            )}
          </svg>
        </button>
      )}
    </div>
  );
}
