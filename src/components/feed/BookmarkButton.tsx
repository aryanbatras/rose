'use client';

import { useBookmarkStore } from '@/stores/bookmark-store';
import type { FeedItem } from '@/types/atproto';

interface BookmarkButtonProps {
  item: FeedItem;
  size?: 'sm' | 'md';
}

export function BookmarkButton({ item, size = 'sm' }: BookmarkButtonProps) {
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarkStore();
  const saved = isBookmarked(item.uri);

  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (saved) {
          removeBookmark(item.uri);
        } else {
          addBookmark(item);
        }
      }}
      className={`interact-btn ${saved ? 'text-brand' : ''}`}
      aria-label={saved ? 'Remove bookmark' : 'Bookmark'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={sizeClass}
        fill={saved ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={saved ? 0 : 2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    </button>
  );
}
