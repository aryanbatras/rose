'use client';

import { useViewModeStore } from '@/stores/view-mode-store';
import type { ViewMode } from '@/types/atproto';

const MODES: { mode: ViewMode; label: string; icon: string }[] = [
  { mode: 'grid', label: 'Grid', icon: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z' },
  { mode: 'classic', label: 'Classic', icon: 'M4 6h16M4 12h16M4 18h16' },
  { mode: 'reels', label: 'Reels', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
  { mode: 'compact', label: 'Compact', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
];

export function ViewModeToggle() {
  const { mode, setMode } = useViewModeStore();

  return (
    <div className="flex items-center gap-0.5 bg-background/60 border border-border/60 rounded-xl p-0.5 backdrop-blur-sm">
      {MODES.map((m) => (
        <button
          key={m.mode}
          onClick={() => setMode(m.mode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
            mode === m.mode
              ? 'bg-brand text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          }`}
          aria-label={m.label}
          title={m.label}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={m.icon} />
          </svg>
          <span className="hidden sm:inline">{m.label}</span>
        </button>
      ))}
    </div>
  );
}
