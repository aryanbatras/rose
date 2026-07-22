'use client';

import { useVoiceRecorder } from '@/hooks/useVoice';

interface VoiceRecorderProps {
  onComplete: (blob: Blob, duration: number) => void;
  maxDuration?: number;
}

function formatDuration(ms: number) {
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const remainingSecs = secs % 60;
  return `${mins}:${String(remainingSecs).padStart(2, '0')}`;
}

export function VoiceRecorder({ onComplete, maxDuration = 120000 }: VoiceRecorderProps) {
  const { state, startRecording, stopRecording, discardRecording } = useVoiceRecorder(maxDuration);

  const handleConfirm = () => {
    if (state.audioBlob) {
      onComplete(state.audioBlob, state.duration);
      discardRecording();
    }
  };

  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-4">
      {state.status === 'idle' && (
        <button
          onClick={startRecording}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-white font-medium hover:bg-brand-hover transition-colors active:scale-[0.98]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z" />
            <path d="M17 11a5 5 0 01-10 0H5a7 7 0 0014 0h-2z" />
            <path d="M11 19.93V22h2v-2.07A7.93 7.93 0 0019.93 14h-2A6 6 0 0112 20a6 6 0 01-5.93-6h-2A7.93 7.93 0 0011 19.93z" />
          </svg>
          Start Recording
        </button>
      )}

      {state.status === 'recording' && (
        <div className="space-y-3">
          {/* Live waveform indicator */}
          <div className="flex items-center justify-center gap-1 h-12">
            <div className="flex items-end gap-0.5 h-full">
              {Array.from({ length: 30 }, (_, i) => {
                const height = Math.sin((i / 30) * Math.PI * 2 + Date.now() / 500) * 0.4 + 0.6;
                return (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-destructive transition-all duration-75"
                    style={{ height: `${height * 100}%` }}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
              <span className="text-sm tabular-nums text-destructive font-medium">
                {formatDuration(state.duration)}
              </span>
              <span className="text-xs text-muted-foreground">
                / {formatDuration(maxDuration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={discardRecording}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Discard
              </button>
              <button
                onClick={stopRecording}
                className="flex items-center gap-1.5 rounded-md bg-destructive px-3 py-1.5 text-sm text-white font-medium hover:bg-destructive/90 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <rect x="6" y="6" width="8" height="8" rx="1" />
                </svg>
                Stop
              </button>
            </div>
          </div>
        </div>
      )}

      {state.status === 'preview' && state.audioBlob && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
              <span className="text-sm font-medium text-foreground">
                Recording complete
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatDuration(state.duration)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={discardRecording}
              className="flex-1 rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            >
              Re-record
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 rounded-md bg-brand px-3 py-2 text-sm text-white font-medium hover:bg-brand-hover transition-colors active:scale-[0.98]"
            >
              Use Recording
            </button>
          </div>
        </div>
      )}

      {state.status === 'error' && (
        <div className="space-y-2">
          <p className="text-sm text-destructive">{state.error || 'Recording failed'}</p>
          <button
            onClick={startRecording}
            className="rounded-md bg-brand px-4 py-2 text-sm text-white font-medium hover:bg-brand-hover transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
