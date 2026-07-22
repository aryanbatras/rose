'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFeedSourceStore, PRESET_FEEDS } from '@/stores/feed-source-store';
import type { FeedSource } from '@/types/atproto';

export function FeedSourcePicker() {
  const router = useRouter();
  const { activeSource, savedFeeds, setActiveSource, addSavedFeed, removeSavedFeed } = useFeedSourceStore();
  const [isOpen, setIsOpen] = useState(false);

  const allSources = [...PRESET_FEEDS, ...savedFeeds];

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
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-4 top-full mt-1 z-50 w-72 bg-surface-elevated border border-border rounded-xl shadow-xl overflow-hidden">
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Feed Sources</p>
              {allSources.map((source) => (
                <button
                  key={source.type + (source.uri || '')}
                  onClick={() => handleSelect(source)}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    activeSource.type === source.type && activeSource.uri === source.uri
                      ? 'bg-brand/10 text-brand font-medium'
                      : 'text-foreground hover:bg-accent'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {source.type === 'following' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    ) : source.type === 'discover' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    )}
                  </svg>
                  <span className="truncate">{source.label}</span>
                  {activeSource.type === source.type && activeSource.uri === source.uri && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="border-t border-border p-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/discover');
                }}
                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue hover:bg-accent transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Browse feeds
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
