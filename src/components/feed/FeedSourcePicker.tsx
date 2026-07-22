'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFeedSourceStore, PRESET_FEEDS } from '@/stores/feed-source-store';
import { CURATED_FEEDS, FEED_CATEGORIES } from '@/services/feeds';
import { ChevronDown, Home, Compass, Check, LayoutGrid, X, Plus, Search, Loader2 } from 'lucide-react';
import type { FeedSource } from '@/types/atproto';

export function FeedSourcePicker() {
  const router = useRouter();
  const { activeSource, savedFeeds, setActiveSource, addSavedFeed, removeSavedFeed } = useFeedSourceStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [tab, setTab] = useState<'saved' | 'curated' | 'search'>('saved');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ uri: string; label: string; description: string; avatar?: string; likeCount: number }>>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const savedFeedUris = useMemo(() => new Set(savedFeeds.map((f) => f.uri)), [savedFeeds]);

  const visibleCurated = useMemo(() => {
    if (!selectedCategory) return CURATED_FEEDS;
    return CURATED_FEEDS.filter((f) => f.category === selectedCategory);
  }, [selectedCategory]);

  const handleSelect = (source: FeedSource) => {
    setActiveSource(source);
    setIsOpen(false);
  };

  // Focus search input when switching to search tab
  useEffect(() => {
    if (tab === 'search' && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [tab]);

  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/feed/generators?mode=popular&limit=20&query=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.feeds || []);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  }, [searchQuery]);

  const handleToggleFeed = (feed: { uri: string; label: string; description?: string }) => {
    if (savedFeedUris.has(feed.uri)) {
      removeSavedFeed(feed.uri);
    } else {
      addSavedFeed({ type: 'custom', uri: feed.uri, label: feed.label });
    }
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
            {/* Tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setTab('saved')}
                className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${tab === 'saved' ? 'text-brand border-b-2 border-brand' : 'text-muted-foreground hover:text-foreground'}`}
              >
                My Feeds
              </button>
              <button
                onClick={() => setTab('curated')}
                className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${tab === 'curated' ? 'text-brand border-b-2 border-brand' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Curated
              </button>
              <button
                onClick={() => { setTab('search'); setSearchResults([]); setSearched(false); }}
                className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${tab === 'search' ? 'text-brand border-b-2 border-brand' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Search
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {tab === 'saved' && (
                <div className="p-1.5">
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

                  {savedFeeds.length > 0 && (
                    <>
                      <div className="my-1.5 border-t border-border" />
                      {savedFeeds.map((feed) => {
                        const isActive = activeSource.uri === feed.uri && activeSource.type === 'custom';
                        return (
                          <button
                            key={feed.uri}
                            onClick={() => handleSelect(feed)}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
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
                              aria-label={`Unsubscribe from ${feed.label}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </button>
                        );
                      })}
                    </>
                  )}

                  {savedFeeds.length === 0 && (
                    <div className="py-8 text-center">
                      <p className="text-xs text-muted-foreground">No feeds saved yet</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">Switch to Curated tab to browse</p>
                    </div>
                  )}
                </div>
              )}

              {tab === 'curated' && (
                <div>
                  <div className="flex flex-wrap gap-1.5 px-3 pt-3 pb-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                        !selectedCategory ? 'bg-brand text-black' : 'bg-accent/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      All
                    </button>
                    {(showAllCategories ? FEED_CATEGORIES : FEED_CATEGORIES.slice(0, 10)).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                          selectedCategory === cat ? 'bg-brand text-black' : 'bg-accent/50 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                    {!showAllCategories && FEED_CATEGORIES.length > 10 && (
                      <button
                        onClick={() => setShowAllCategories(true)}
                        className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-accent/50 text-muted-foreground hover:text-foreground transition-all"
                      >
                        +{FEED_CATEGORIES.length - 10} more
                      </button>
                    )}
                  </div>

                  <div className="p-1.5 pt-1">
                    {visibleCurated.map((feed) => {
                      const isSaved = savedFeedUris.has(feed.uri);
                      return (
                        <div
                          key={feed.uri}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent/30 transition-colors group"
                        >
                          <button
                            onClick={() => handleSelect({ type: 'custom', uri: feed.uri, label: feed.label })}
                            className="flex-1 min-w-0 text-left"
                          >
                            <p className="text-sm font-medium text-foreground truncate leading-tight">{feed.label}</p>
                            <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">{feed.description}</p>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFeed(feed);
                            }}
                            className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                              isSaved
                                ? 'bg-brand/15 text-brand hover:bg-brand/25'
                                : 'bg-brand text-black hover:bg-brand-hover'
                            }`}
                          >
                            {isSaved ? 'Added' : '+ Add'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ─── SEARCH TAB ──────────────────────────────── */}
            {tab === 'search' && (
              <div className="p-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative flex-1">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (!e.target.value.trim()) {
                          setSearched(false);
                          setSearchResults([]);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearch();
                        }
                      }}
                      placeholder="Search 50,000+ feeds..."
                      className="w-full rounded-lg bg-surface-base border border-border px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand transition-colors"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={searching || !searchQuery.trim()}
                    className="px-4 py-2 rounded-lg bg-brand text-black text-xs font-semibold hover:bg-brand-hover disabled:opacity-50 transition-colors shrink-0"
                  >
                    {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Search'}
                  </button>
                </div>

                {searching ? (
                  <div className="space-y-2 py-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-2">
                        <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
                        <div className="flex-1 space-y-1">
                          <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                          <div className="h-2 w-40 animate-pulse rounded bg-muted/50" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searched && searchResults.length === 0 ? (
                  <div className="py-8 text-center">
                    <Search className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" strokeWidth={1.5} />
                    <p className="text-xs text-muted-foreground">No feeds found for &ldquo;{searchQuery}&rdquo;</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">Try different keywords</p>
                  </div>
                ) : searched && searchResults.length > 0 ? (
                  <>
                    <p className="text-[10px] text-muted-foreground mb-2">
                      Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                    </p>
                    <div className="space-y-0.5">
                      {searchResults.map((feed) => {
                        const isSaved = savedFeedUris.has(feed.uri);
                        return (
                          <div
                            key={feed.uri}
                            className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-accent/30 transition-colors group"
                          >
                            {feed.avatar ? (
                              <img src={feed.avatar} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0" />
                            ) : (
                              <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                                <LayoutGrid className="h-4 w-4 text-brand/60" />
                              </div>
                            )}
                            <button
                              onClick={() => handleSelect({ type: 'custom', uri: feed.uri, label: feed.label })}
                              className="flex-1 min-w-0 text-left"
                            >
                              <p className="text-xs font-medium text-foreground truncate leading-tight">{feed.label}</p>
                              <p className="text-[10px] text-muted-foreground truncate leading-tight">{feed.description}</p>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFeed(feed);
                              }}
                              className={`shrink-0 px-2 py-1 rounded-full text-[9px] font-semibold transition-all ${
                                isSaved
                                  ? 'bg-brand/15 text-brand hover:bg-brand/25'
                                  : 'bg-brand text-black hover:bg-brand-hover'
                              }`}
                            >
                              {isSaved ? 'Added' : '+ Add'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center">
                    <Search className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" strokeWidth={1.5} />
                    <p className="text-xs text-muted-foreground">Search 50,000+ community feeds</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">Type a keyword and press Enter or tap Search</p>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-border p-1.5">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/discover');
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 rounded-lg text-xs text-blue hover:bg-accent transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Browse all feeds in Discover
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
