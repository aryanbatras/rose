import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FeedSource } from '@/types/atproto';

export interface DashboardColumn {
  id: string;
  source: FeedSource;
  label: string;
}

interface DashboardState {
  enabled: boolean;
  columns: DashboardColumn[];
  toggleEnabled: () => void;
  addColumn: (source: FeedSource, label: string) => void;
  removeColumn: (id: string) => void;
  updateColumn: (id: string, source: FeedSource, label: string) => void;
}

const DEFAULT_COLUMNS: DashboardColumn[] = [
  { id: 'following', source: { type: 'following', label: 'Following' }, label: 'Following' },
  { id: 'discover', source: { type: 'discover', label: 'Discover' }, label: 'Discover' },
];

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      enabled: false,
      columns: [...DEFAULT_COLUMNS],
      toggleEnabled: () => set((state) => ({ enabled: !state.enabled })),
      addColumn: (source, label) =>
        set((state) => ({
          columns: [...state.columns, { id: Date.now().toString(), source, label }],
        })),
      removeColumn: (id) =>
        set((state) => ({
          columns: state.columns.filter((c) => c.id !== id),
        })),
      updateColumn: (id, source, label) =>
        set((state) => ({
          columns: state.columns.map((c) => (c.id === id ? { ...c, source, label } : c)),
        })),
    }),
    { name: 'rose-dashboard' }
  )
);
