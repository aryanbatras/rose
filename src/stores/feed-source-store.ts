import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FeedSource } from '@/types/atproto';

const DEFAULT_SOURCE: FeedSource = { type: 'following', label: 'Following' };

const PRESET_FEEDS: FeedSource[] = [
  { type: 'following', label: 'Following' },
  { type: 'discover', label: 'Discover' },
];

interface FeedSourceState {
  activeSource: FeedSource;
  savedFeeds: FeedSource[];
  setActiveSource: (source: FeedSource) => void;
  addSavedFeed: (source: FeedSource) => void;
  removeSavedFeed: (uri: string) => void;
  resetToDefault: () => void;
}

export const useFeedSourceStore = create<FeedSourceState>()(
  persist(
    (set, get) => ({
      activeSource: DEFAULT_SOURCE,
      savedFeeds: [],

      setActiveSource: (source) => set({ activeSource: source }),

      addSavedFeed: (source) =>
        set((state) => {
          if (state.savedFeeds.some((f) => f.uri === source.uri)) return state;
          return { savedFeeds: [...state.savedFeeds, source] };
        }),

      removeSavedFeed: (uri) =>
        set((state) => ({
          savedFeeds: state.savedFeeds.filter((f) => f.uri !== uri),
        })),

      resetToDefault: () =>
        set({ activeSource: DEFAULT_SOURCE, savedFeeds: [] }),
    }),
    { name: 'voiceflow-feed-sources' }
  )
);

export { PRESET_FEEDS };
