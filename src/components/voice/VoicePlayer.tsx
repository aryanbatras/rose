'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface VoicePlayerProps {
  duration: number;
  transcript?: string;
  mood?: string;
  audioUrl?: string;
  waveformData?: number[];
}

export function VoicePlayer({ duration, transcript, mood, audioUrl, waveformData: _waveformData }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Generate simulated bars for waveform visualization
  const bars = Array.from({ length: 40 }, (_, i) => {
    const normalized = Math.sin((i / 40) * Math.PI) * 0.8 + Math.random() * 0.2;
    return Math.max(0.15, normalized);
  });

  const togglePlay = useCallback(() => {
    if (!audioRef.current) {
      setIsPlaying(!isPlaying);
      if (!isPlaying) {
        // Simulate playback progress
        const startTime = Date.now();
        intervalRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const pct = Math.min(elapsed / duration, 1);
          setProgress(pct);
          if (pct >= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsPlaying(false);
          }
        }, 50);
      }
    } else {
      if (isPlaying) {
        audioRef.current.pause();
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, duration]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const formatTime = (ms: number) => {
    const secs = Math.floor(ms / 1000);
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  };

  const currentTime = progress * duration;

  return (
    <div className="mt-2 rounded-lg border border-border bg-surface-elevated p-3">
      {mood && (
        <span className="mb-2 inline-block rounded-full bg-brand-muted px-2 py-0.5 text-[10px] font-medium text-brand">
          {mood}
        </span>
      )}

      {/* Waveform */}
      <div className="flex items-end gap-0.5 h-12 mb-2">
        {bars.map((height, i) => {
          const isActive = (i / bars.length) <= progress;
          return (
            <div
              key={i}
              className="flex-1 rounded-full transition-all duration-150"
              style={{
                height: `${height * 100}%`,
                backgroundColor: isActive ? 'var(--brand)' : 'var(--muted-foreground)',
                opacity: isActive ? 1 : 0.3,
              }}
            />
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white hover:bg-brand-hover transition-colors active:scale-95"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <div className="text-xs tabular-nums text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {transcript && (
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showTranscript ? 'Hide' : 'Transcript'}
          </button>
        )}
      </div>

      {/* Transcript */}
      {showTranscript && transcript && (
        <div className="mt-2 rounded bg-muted p-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {transcript}
          </p>
        </div>
      )}

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setProgress(audioRef.current.currentTime / (audioRef.current.duration || 1));
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setProgress(0);
          }}
          preload="none"
        />
      )}
    </div>
  );
}
