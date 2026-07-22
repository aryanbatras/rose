import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ViewMode } from '@/types/atproto';

interface ViewModeState {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
}

export const useViewModeStore = create<ViewModeState>()(
  persist(
    (set) => ({
      mode: 'grid',
      setMode: (mode) => set({ mode }),
    }),
    { name: 'rose-view-mode' }
  )
);
