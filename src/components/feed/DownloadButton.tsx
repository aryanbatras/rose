'use client';

import { useState, useCallback } from 'react';
import { Download, Loader2, Check } from 'lucide-react';
import { downloadMedia, hasMedia } from '@/lib/media-download';
import type { FeedItem } from '@/types/atproto';

interface DownloadButtonProps {
  item: FeedItem;
  variant?: 'default' | 'light';
  className?: string;
}

export function DownloadButton({ item, variant = 'default', className = '' }: DownloadButtonProps) {
  const [state, setState] = useState<'idle' | 'downloading' | 'done'>('idle');

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (state === 'downloading' || !hasMedia(item)) return;

      setState('downloading');
      try {
        await downloadMedia(item);
        setState('done');
        setTimeout(() => setState('idle'), 1500);
      } catch {
        setState('idle');
      }
    },
    [state, item]
  );

  if (!hasMedia(item)) return null;

  const isLight = variant === 'light';
  const baseClass = isLight
    ? 'text-white/80 hover:text-white'
    : 'text-muted-foreground hover:text-foreground';

  return (
    <button
      onClick={handleClick}
      disabled={state === 'downloading'}
      className={`${baseClass} transition-colors disabled:opacity-50 ${className}`}
      aria-label="Download media"
    >
      {state === 'downloading' ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : state === 'done' ? (
        <Check className="h-5 w-5 text-green-500" />
      ) : (
        <Download className="h-5 w-5" />
      )}
    </button>
  );
}
