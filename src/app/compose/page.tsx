'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useVoiceRecorder } from '@/hooks/useVoice';
import { VoiceRecorder } from '@/components/voice/VoiceRecorder';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navigation/Navbar';
import { toast } from 'sonner';

export default function ComposePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [text, setText] = useState('');
  const [tags, setTags] = useState('');
  const [mood, setMood] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleVoiceComplete = (blob: Blob, duration: number) => {
    setAudioBlob(blob);
    setAudioDuration(duration);
    toast.success('Recording captured! Add details below.');
  };

  const handleSubmit = async () => {
    if (!text.trim() && !audioBlob) {
      toast.error('Add some text or a voice recording');
      return;
    }

    setIsSubmitting(true);
    try {
      const body: any = {};
      if (audioBlob) {
        // Convert blob to base64 for API transport
        const buffer = await audioBlob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        body.audioData = base64;
        body.audioMimeType = audioBlob.type;
        body.duration = audioDuration;
      }
      if (text.trim()) body.text = text.trim();
      if (tags.trim()) body.tags = tags.split(',').map((t) => t.trim()).filter(Boolean);
      if (mood.trim()) body.mood = mood.trim();

      const res = await fetch('/api/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success('Posted!');
        router.push('/feed');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to post');
      }
    } catch {
      toast.error('Failed to post. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-surface-base">
        <div className="h-8 w-8 animate-pulse rounded-full bg-brand/30" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-surface-base">
      <header className="sticky top-0 z-40 border-b border-border bg-surface-base/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <h1 className="text-lg font-bold font-heading text-foreground">New Post</h1>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || (!text.trim() && !audioBlob)}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-lg pb-20">
        <div className="space-y-4 p-4">
          {/* Text input */}
          <div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              maxLength={300}
              className="w-full resize-none rounded-lg border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="mt-1 text-right text-xs text-muted-foreground tabular-nums">
              {text.length}/300
            </div>
          </div>

          {/* Voice recording */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Voice Recording
            </label>
            <VoiceRecorder onComplete={handleVoiceComplete} />
          </div>

          {/* Tags */}
          <Input
            label="Tags"
            placeholder="music, tech, coding..."
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />

          {/* Mood */}
          <Input
            label="Mood"
            placeholder="Happy, chill, energetic..."
            value={mood}
            onChange={(e) => setMood(e.target.value)}
          />

          {/* Preview */}
          {(text.trim() || audioBlob) && (
            <div className="rounded-lg border border-border bg-surface-elevated p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Preview</h3>
              {text.trim() && (
                <p className="text-sm text-foreground whitespace-pre-wrap">{text}</p>
              )}
              {audioBlob && (
                <div className="mt-2 flex items-center gap-2 text-sm text-brand">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                  Voice recording ({Math.floor(audioDuration / 1000)}s)
                </div>
              )}
              {mood && <span className="mt-2 inline-block rounded-full bg-brand-muted px-2 py-0.5 text-xs text-brand">{mood}</span>}
              {tags && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {tags.split(',').map((t, i) => (
                    <span key={i} className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                      #{t.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Navbar />
    </div>
  );
}
