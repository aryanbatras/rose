'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFeedSourceStore, PRESET_FEEDS } from '@/stores/feed-source-store';
import { CURATED_FEEDS } from '@/services/feeds';
import { ChevronDown, Home, Compass, Check, LayoutGrid, X } from 'lucide-react';
import type { FeedSource } from '@/types/atproto';

export function FeedSourcePicker() {
  const router = useRouter();
  const { activeSource, savedFeeds, setActiveSource, removeSavedFeed } = useFeedSourceStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (source: FeedSource) => {
    setActiveSource(source);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-foreground hover:bg-accent/50 transition-colors"
        aria-label="Select feed source"
      >
        {activeSource.label}
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-4 top-full mt-1 z-50 w-80 bg-surface-elevated border border-border rounded-xl shadow-xl overflow-hidden">
            <div className="max-h-96 overflow-y-auto p-1.5">
              {/* ─── Preset Feeds ──────────────── */}
              {PRESET_FEEDS.map((source) => {
                const isActive = activeSource.type === source.type && activeSource.uri === source.uri;
                return (
                  <button
                    key={source.type}
                    onClick={() => handleSelect(source)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-brand/10 text-brand font-semibold' : 'text-foreground hover:bg-accent'
                    }`}
                  >
                    {source.type === 'following' ? (
                      <Home className="h-4 w-4 shrink-0" />
                    ) : (
                      <Compass className="h-4 w-4 shrink-0" />
                    )}
                    <span className="truncate">{source.label}</span>
                    {isActive && <Check className="h-4 w-4 ml-auto shrink-0 stroke-[2.5]" />}
                  </button>
                );
              })}

              {/* ─── Saved Custom Feeds ────────── */}
              {savedFeeds.length > 0 && (
                <>
                  <div className="my-1.5 border-t border-border" />
                  {savedFeeds.map((feed) => {
                    const isActive = activeSource.uri === feed.uri && activeSource.type === 'custom';
                    return (
                      <div
                        key={feed.uri}
                        onClick={() => handleSelect(feed)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleSelect(feed)}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                          isActive ? 'bg-brand/10 text-brand font-semibold' : 'text-foreground hover:bg-accent'
                        }`}
                      >
                        <LayoutGrid className="h-4 w-4 shrink-0" />
                        <span className="truncate flex-1 text-left">{feed.label}</span>
                        {isActive && <Check className="h-4 w-4 shrink-0 stroke-[2.5]" />}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSavedFeed(feed.uri!);
                          }}
                          className="p-0.5 rounded text-muted-foreground hover:text-destructive transition-colors"
                          aria-label={`Remove ${feed.label}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </>
              )}

              {/* ─── Curated Feeds (browse only) ─ */}
              {CURATED_FEEDS.length > 0 && (
                <>
                  <div className="my-1.5 border-t border-border" />
                  {CURATED_FEEDS.map((feed) => {
                    const isActive = activeSource.uri === feed.uri && activeSource.type === 'custom';
                    return (
                      <button
                        key={feed.uri}
                        onClick={() => handleSelect({ type: 'custom', uri: feed.uri, label: feed.label })}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          isActive ? 'bg-brand/10 text-brand font-semibold' : 'text-foreground hover:bg-accent'
                        }`}
                      >
                        <LayoutGrid className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="flex-1 text-left min-w-0">
                          <p className="truncate">{feed.label}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{feed.description}</p>
                        </div>
                        {isActive && <Check className="h-4 w-4 shrink-0 stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border p-1.5">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/discover');
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 rounded-lg text-xs text-muted-foreground hover:bg-accent transition-colors"
              >
                Browse more feeds in Discover
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
