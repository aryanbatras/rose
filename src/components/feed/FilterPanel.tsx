'use client';

import { useState } from 'react';
import { useFilterStore } from '@/stores/filter-store';

export function FilterPanel() {
  const {
    content, mute, display,
    setContent, setDisplay, setMute,
    addMutedWord, removeMutedWord, resetAll,
    activeFilterCount,
  } = useFilterStore();

  const [isOpen, setIsOpen] = useState(false);
  const [wordInput, setWordInput] = useState('');
  const count = activeFilterCount();

  const handleAddWord = () => {
    const trimmed = wordInput.trim().toLowerCase();
    if (trimmed && !mute.mutedWords.includes(trimmed)) {
      addMutedWord(trimmed);
      setWordInput('');
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-accent/50 text-muted-foreground hover:text-foreground"
        aria-label="Filters"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filters
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
            {count}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-surface-elevated border-l border-border shadow-xl overflow-y-auto">
            <div className="sticky top-0 z-10 bg-surface-elevated border-b border-border px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Feed Filters</h2>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-full hover:bg-accent transition-colors" aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Content Filters */}
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Content</h3>
                <div className="space-y-2.5">
                  {[
                    { key: 'hideReposts', label: 'Hide reposts' },
                    { key: 'hideReplies', label: 'Hide replies' },
                    { key: 'hideQuotePosts', label: 'Hide quote posts' },
                    { key: 'mediaOnly', label: 'Media only' },
                    { key: 'videoOnly', label: 'Video only' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center justify-between cursor-pointer group">
                      <span className="text-sm text-foreground">{label}</span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={(content as any)[key]}
                          onChange={() => setContent({ [key]: !(content as any)[key] })}
                          className="sr-only peer"
                        />
                        <div className="h-5 w-9 rounded-full border border-border bg-background peer-checked:bg-brand peer-checked:border-brand transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-4" />
                      </div>
                    </label>
                  ))}
                </div>
              </section>

              {/* Muted Words */}
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Muted Words</h3>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={wordInput}
                    onChange={(e) => setWordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
                    placeholder="Type a word and press Enter"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand transition-colors"
                  />
                  <button
                    onClick={handleAddWord}
                    disabled={!wordInput.trim()}
                    className="px-3 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Add
                  </button>
                </div>
                {mute.mutedWords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {mute.mutedWords.map((word) => (
                      <span key={word} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
                        {word}
                        <button onClick={() => removeMutedWord(word)} className="hover:text-destructive/80" aria-label={`Remove ${word}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </section>

              {/* Display */}
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Display</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm text-foreground">Hide like/repost counts</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={display.hideEngagementMetrics}
                        onChange={() => setDisplay({ hideEngagementMetrics: !display.hideEngagementMetrics })}
                        className="sr-only peer"
                      />
                      <div className="h-5 w-9 rounded-full border border-border bg-background peer-checked:bg-brand peer-checked:border-brand transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-4" />
                    </div>
                  </label>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Feed density</span>
                    <select
                      value={display.feedDensity}
                      onChange={(e) => setDisplay({ feedDensity: e.target.value as 'comfortable' | 'compact' })}
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-brand transition-colors"
                    >
                      <option value="comfortable">Comfortable</option>
                      <option value="compact">Compact</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Reset */}
              <div className="pt-4 border-t border-border">
                <button
                  onClick={resetAll}
                  className="w-full py-2.5 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/5 transition-colors"
                >
                  Reset all filters to defaults
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
