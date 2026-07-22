'use client';

import { useEffect } from 'react';
import { useBookmarkStore } from '@/stores/bookmark-store';
import type { FeedItem } from '@/types/atproto';
import { Bookmark } from 'lucide-react';

interface BookmarkButtonProps {
  item: FeedItem;
  size?: 'sm' | 'md';
  /** 'light' variant for dark backgrounds (reels) */
  variant?: 'default' | 'light';
}

export function BookmarkButton({ item, size = 'sm', variant = 'default' }: BookmarkButtonProps) {
  const { isBookmarked, addBookmark, removeBookmark, loaded, fetchBookmarks } = useBookmarkStore();
  const saved = isBookmarked(item.uri);

  // Fetch bookmarks once on mount
  useEffect(() => {
    if (!loaded) fetchBookmarks();
  }, [loaded, fetchBookmarks]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saved) {
      await removeBookmark(item.uri);
    } else {
      await addBookmark(item);
    }
  };

  const lightStyle = variant === 'light' ? 'text-white/80 hover:text-white' : '';

  return (
    <button
      onClick={handleToggle}
      className={`transition-colors ${variant === 'default' ? 'interact-btn' : ''} ${
        saved
          ? 'text-brand'
          : variant === 'light'
            ? 'text-white/80 hover:text-white'
            : 'text-muted-foreground'
      }`}
      aria-label={saved ? 'Remove bookmark' : 'Bookmark'}
    >
      <Bookmark
        className="h-5 w-5"
        fill={saved ? 'currentColor' : 'none'}
        strokeWidth={saved ? 0 : 2}
      />
    </button>
  );
}
