'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ComposePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [text]);

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast.error('Write something to post');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
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

  return (
    <div>
      <header className="sticky top-0 z-40 bg-surface-base/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 h-[53px]">
          <button onClick={() => router.back()} className="text-sm text-foreground hover:text-muted-foreground transition-colors">
            Cancel
          </button>
          <Button size="sm" onClick={handleSubmit} disabled={isSubmitting || !text.trim()}>
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </header>

      <div className="flex gap-3 p-4">
        <div className="h-10 w-10 rounded-full bg-brand/20 shrink-0" />
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind?"
            rows={4}
            maxLength={300}
            className="w-full resize-none bg-transparent text-lg text-foreground placeholder:text-muted-foreground focus:outline-none border-none leading-normal"
            autoFocus
          />
          <div className="mt-1 text-right text-sm text-muted-foreground tabular-nums">
            {text.length}/300
          </div>
        </div>
      </div>
    </div>
  );
}
