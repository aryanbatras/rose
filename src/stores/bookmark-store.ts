import { create } from 'zustand';
import type { FeedItem } from '@/types/atproto';

/**
 * A bookmark synced from the Bluesky server.
 * `uri` = post URI, `bookmarkUri` = the bookmark record URI (needed for deletion).
 */
interface SyncBookmark {
  uri: string;
  cid: string;
  bookmarkUri: string;
  author: { handle: string; displayName?: string; avatar?: string };
  text: string;
  savedAt: string;
  thumbnail?: string;
  isVideo?: boolean;
}

interface BookmarkState {
  bookmarks: SyncBookmark[];
  loaded: boolean;
  loading: boolean;
  /** Fetch bookmarks from the server */
  fetchBookmarks: () => Promise<void>;
  /** Add a bookmark via server API */
  addBookmark: (item: FeedItem) => Promise<void>;
  /** Remove a bookmark by its POST uri via server API */
  removeBookmark: (postUri: string) => Promise<void>;
  /** Check if a post is bookmarked (local check) */
  isBookmarked: (postUri: string) => boolean;
  /** Get the bookmark URI for a post (needed for deletion) */
  getBookmarkUri: (postUri: string) => string | undefined;
}

export const useBookmarkStore = create<BookmarkState>()((set, get) => ({
  bookmarks: [],
  loaded: false,
  loading: false,

  fetchBookmarks: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const res = await fetch('/api/bookmarks');
      if (res.ok) {
        const data = await res.json();
      const items = (data.bookmarks || []).map((b: any) => {
        const item = b.item || {};
        const record = item.record || {};
        const embed = item.embed || record.embed;
        const images = embed?.images || [];
        const thumbnail = images[0]?.thumb || embed?.thumbnail || null;
        const isVideo = (embed?.$type || '').includes('video');

        return {
          uri: item.uri || b.subject?.uri,
          cid: item.cid || b.subject?.cid,
          bookmarkUri: b.subject?.uri || item.uri,
          author: item.author || b.author || { handle: 'unknown' },
          text: record.text || '',
          savedAt: b.createdAt || new Date().toISOString(),
          thumbnail: thumbnail || undefined,
          isVideo,
        };
      });
        set({ bookmarks: items, loaded: true, loading: false });
      } else {
        set({ loaded: true, loading: false });
      }
    } catch {
      set({ loaded: true, loading: false });
    }
  },

  addBookmark: async (item) => {
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri: item.uri, cid: item.cid }),
      });
      if (res.ok) {
        // Re-fetch bookmarks to get the updated list with bookmark URIs
        await get().fetchBookmarks();
      }
    } catch {
      // Re-fetch to rollback to server state
      await get().fetchBookmarks();
    }
  },

  removeBookmark: async (postUri) => {
    const bookmarkUri = get().bookmarks.find((b) => b.uri === postUri)?.bookmarkUri;
    if (!bookmarkUri) return;

    // Optimistic remove
    set((state) => ({
      bookmarks: state.bookmarks.filter((b) => b.uri !== postUri),
    }));

    try {
      await fetch('/api/bookmarks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarkUri }),
      });
    } catch {
      // Rollback on failure
      get().fetchBookmarks();
    }
  },

  isBookmarked: (postUri) => get().bookmarks.some((b) => b.uri === postUri),

  getBookmarkUri: (postUri) => get().bookmarks.find((b) => b.uri === postUri)?.bookmarkUri,
}));
