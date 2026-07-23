import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ShortcutBinding {
  id: string;
  label: string;
  description: string;
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

interface ShortcutsState {
  enabled: boolean;
  bindings: ShortcutBinding[];
  setBinding: (id: string, key: string, ctrl?: boolean, shift?: boolean, alt?: boolean) => void;
  resetBindings: () => void;
  toggleEnabled: () => void;
}

const DEFAULT_BINDINGS: ShortcutBinding[] = [
  { id: 'nextPost', label: 'Next post', description: 'Move to the next post in the feed', key: 'j' },
  { id: 'prevPost', label: 'Previous post', description: 'Move to the previous post in the feed', key: 'k' },
  { id: 'like', label: 'Like post', description: 'Like/unlike the currently focused post', key: 'l' },
  { id: 'reply', label: 'Reply', description: 'Open reply composer for the focused post', key: 'r' },
  { id: 'share', label: 'Share', description: 'Copy link to the focused post', key: 's' },
  { id: 'bookmark', label: 'Bookmark', description: 'Bookmark/unbookmark the focused post', key: 'b' },
  { id: 'search', label: 'Search', description: 'Focus the search bar', key: '/' },
  { id: 'compose', label: 'Compose', description: 'Open the post composer', key: 'n' },
  { id: 'escape', label: 'Close / Back', description: 'Close modal or go back', key: 'Escape' },
  { id: 'viewClassic', label: 'Classic view', description: 'Switch to classic single-column view', key: '1' },
  { id: 'viewGrid', label: 'Grid view', description: 'Switch to grid view', key: '2' },
  { id: 'help', label: 'Show shortcuts', description: 'Display keyboard shortcuts help', key: '?' },
];

export const useShortcutsStore = create<ShortcutsState>()(
  persist(
    (set) => ({
      enabled: true,
      bindings: [...DEFAULT_BINDINGS],
      setBinding: (id, key, ctrl, shift, alt) =>
        set((state) => ({
          bindings: state.bindings.map((b) =>
            b.id === id ? { ...b, key, ctrl, shift, alt } : b
          ),
        })),
      resetBindings: () => set({ bindings: [...DEFAULT_BINDINGS] }),
      toggleEnabled: () => set((state) => ({ enabled: !state.enabled })),
    }),
    { name: 'rose-shortcuts' }
  )
);
