import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Bookmark, FeedItem } from '@/types/atproto';

interface BookmarkState {
  bookmarks: Bookmark[];
  addBookmark: (item: FeedItem) => void;
  removeBookmark: (uri: string) => void;
  isBookmarked: (uri: string) => boolean;
  clearAll: () => void;
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: [],

      addBookmark: (item) =>
        set((state) => {
          if (state.bookmarks.some((b) => b.uri === item.uri)) return state;
          return {
            bookmarks: [
              {
                uri: item.uri,
                cid: item.cid,
                author: {
                  handle: item.author.handle,
                  displayName: item.author.displayName,
                  avatar: item.author.avatar,
                },
                text: item.record.text.slice(0, 200),
                savedAt: new Date().toISOString(),
              },
              ...state.bookmarks,
            ],
          };
        }),

      removeBookmark: (uri) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.uri !== uri),
        })),

      isBookmarked: (uri) => get().bookmarks.some((b) => b.uri === uri),

      clearAll: () => set({ bookmarks: [] }),
    }),
    { name: 'voiceflow-bookmarks' }
  )
);
