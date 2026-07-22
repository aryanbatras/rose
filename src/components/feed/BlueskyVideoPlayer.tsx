'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import type { FeedItem } from '@/types/atproto';

interface BlueskyVideoPlayerProps {
  item: FeedItem;
  variant?: 'reels' | 'inline';
  autoPlay?: boolean;
  muted?: boolean;
}

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

  useEffect(() => {
    return () => {
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    };
  }, []);

  const embed = item.record.embed;
  const playlistUrl = embed?.playlist || embed?.video?.playlist;
  const thumbnailUrl = embed?.thumbnail || embed?.video?.thumbnail;
  const isReels = variant === 'reels';

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playlistUrl) return;

    let hls: any = null;
    let observer: IntersectionObserver | null = null;

    const canPlayHlsNative = video.canPlayType('application/vnd.apple.mpegurl') !== '';

    if (canPlayHlsNative) {
      video.src = playlistUrl;
    } else {
      import('hls.js')
        .then((HlsModule) => {
          const Hls = HlsModule.default;
          if (Hls.isSupported()) {
            hls = new Hls({ enableWorker: true, lowLatencyMode: true });
            hls.loadSource(playlistUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (autoPlay && isMuted) video.play().catch(() => {});
            });
            hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
              if (data.fatal) setError('Video playback failed');
            });
          }
        })
        .catch(() => {});
    }

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
          });
        },
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
        {!isPlaying && thumbnailUrl && (
          <img src={thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}

        <video
          ref={videoRef}
          className="h-full w-full object-contain"
          playsInline
          loop
          muted={isMuted}
          preload="metadata"
          onClick={(e) => e.stopPropagation()}
        />

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center" onClick={togglePlay}>
            <div className="h-16 w-16 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm transition-transform hover:scale-110">
              <Play className="h-8 w-8 text-white ml-1 fill-white" strokeWidth={0} />
            </div>
          </div>
        )}

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
              {isPlaying ? <Pause className="h-6 w-6 fill-white" strokeWidth={0} /> : <Play className="h-6 w-6 ml-0.5 fill-white" strokeWidth={0} />}
            </button>
            <button
              onClick={toggleMute}
              className="text-white hover:text-white/80 transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </button>
            <span className="text-white/70 text-xs font-mono">
              {item.author.displayName || item.author.handle}
            </span>
          </div>
        </div>

        {isPlaying && isMuted && (
          <div className="absolute top-4 right-4">
            <div className="h-8 w-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <VolumeX className="h-4 w-4 text-white" />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl bg-black/40 cursor-pointer group"
      onClick={togglePlay}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
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

      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-14 w-14 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm transition-transform group-hover:scale-110">
            <Play className="h-7 w-7 text-white ml-0.5 fill-white" strokeWidth={0} />
          </div>
        </div>
      )}

      {isPlaying && (
        <button
          onClick={toggleMute}
          className="absolute bottom-3 right-3 h-9 w-9 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
        </button>
      )}
    </div>
  );
}
