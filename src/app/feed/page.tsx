'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useGSAPScrollAnimation } from '@/hooks/useGSDPScrollAnimation';
import { useAuth } from '@/hooks/useAuth';
import { useFeed } from '@/hooks/useFeed';
import { useViewModeStore } from '@/stores/view-mode-store';
import { useFilterStore } from '@/stores/filter-store';
import { useFeedSourceStore, PRESET_FEEDS } from '@/stores/feed-source-store';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { FeedCard } from '@/components/feed/FeedCard';
import { BlueskyVideoPlayer } from '@/components/feed/BlueskyVideoPlayer';
import { ViewModeToggle } from '@/components/feed/ViewModeToggle';
import { FilterPanel } from '@/components/feed/FilterPanel';
import { FeedSourcePicker } from '@/components/feed/FeedSourcePicker';
import { FeedCardSkeleton } from '@/components/ui/skeleton';
import type { FeedItem, ViewMode } from '@/types/atproto';

function applyClientFilters(posts: FeedItem[], content: any, mute: any): FeedItem[] {
  let filtered = [...posts];

  if (content.hideReposts) {
    filtered = filtered.filter((p) => !p.reason?.$type?.includes('reasonRepost'));
  }
  if (content.hideReplies) {
    filtered = filtered.filter((p) => !p.reply);
  }
  if (content.mediaOnly) {
    filtered = filtered.filter((p) => !!p.record.embed);
  }
  if (content.videoOnly) {
    filtered = filtered.filter(
      (p) => (p.record.embed?.$type || '').includes('video')
    );
  }
  if (mute.mutedWords.length > 0) {
    const lowerWords = mute.mutedWords.map((w: string) => w.toLowerCase());
    filtered = filtered.filter(
      (p) => !lowerWords.some((w: string) => p.record.text.toLowerCase().includes(w))
    );
  }

  return filtered;
}

function GridView({ items }: { items: FeedItem[] }) {
  const router = useRouter();
  const mediaItems = items.filter((p) => {
    const em = p.record.embed;
    if (!em) return false;
    // Bluesky returns embed.$type with #view suffix in hydrated form
    const t = em.$type || '';
    return t.includes('images') || t.includes('video') || t.includes('external');
  });

  if (mediaItems.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">No media posts to show in grid view</p>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
      className="grid grid-cols-2 md:grid-cols-3 gap-1 p-1"
    >
      {mediaItems.map((item) => {
        const em = item.record.embed;
        // Try all possible thumbnail locations
        const thumbUrl =
          em?.images?.[0]?.thumb ||
          em?.images?.[0]?.fullsize ||
          em?.external?.thumb ||
          em?.thumbnail ||
          em?.video?.thumbnail ||
          null;
        return (
          <motion.button
            key={`${item.uri}-${item.cid}`}
            variants={{
              hidden: { opacity: 0, scale: 0.95 },
              visible: { opacity: 1, scale: 1 },
            }}
            onClick={() => router.push(`/feed/${encodeURIComponent(item.uri)}`)}
            className="relative aspect-square overflow-hidden rounded-lg bg-surface-elevated group cursor-pointer"
          >
            {thumbUrl ? (
              <img
                src={thumbUrl}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand/20 to-brand/5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-brand/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-xs text-white font-medium truncate drop-shadow-lg">
                {item.author.displayName || item.author.handle}
              </p>
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );
}

function CompactView({ items }: { items: FeedItem[] }) {
  const router = useRouter();
  return (
    <div>
      {items.map((item) => (
        <button
          key={`${item.uri}-${item.cid}`}
          onClick={() => router.push(`/feed/${encodeURIComponent(item.uri)}`)}
          className="flex w-full items-start gap-3 px-4 py-2.5 hover:bg-accent/30 transition-colors text-left"
        >
          <div className="h-8 w-8 shrink-0 rounded-full bg-accent overflow-hidden">
            {item.author.avatar && (
              <img src={item.author.avatar} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground truncate">
                {item.author.displayName || item.author.handle}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {new Date(item.indexedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <p className="text-sm text-foreground/90 line-clamp-2 leading-snug mt-0.5">
              {item.record.text}
            </p>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>{item.likeCount} likes</span>
              <span>{item.replyCount} replies</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function ReelsView({ items }: { items: FeedItem[] }) {
  const router = useRouter();
  const videoItems = items.filter((p) => {
    const t = p.record.embed?.$type || '';
    return t.includes('video');
  });

  if (videoItems.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">No video posts to show in Reels view</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {videoItems.map((item, index) => (
        <motion.div
          key={`${item.uri}-${item.cid}`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
          className="relative h-[100dvh] w-full snap-start snap-always"
        >
          {/* Full-screen video player */}
          <div className="absolute inset-0">
            <BlueskyVideoPlayer item={item} variant="reels" autoPlay muted />
          </div>

          {/* Bottom overlay with author info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 pb-12 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none">
            <div className="flex items-center gap-3 pointer-events-auto">
              <button
                onClick={(e) => { e.stopPropagation(); router.push(`/profile/${item.author.handle}`); }}
                className="flex items-center gap-3"
              >
                <div className="h-11 w-11 rounded-full overflow-hidden ring-2 ring-white/50 shrink-0">
                  {item.author.avatar ? (
                    <img src={item.author.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-accent" />
                  )}
                </div>
                <div className="text-left">
                  <span className="text-white font-semibold text-[15px] block drop-shadow-lg">
                    {item.author.displayName || item.author.handle}
                  </span>
                  <span className="text-white/70 text-sm drop-shadow-lg">
                    @{item.author.handle}
                  </span>
                </div>
              </button>
            </div>
            {item.record.text && (
              <p className="text-white/90 text-[15px] mt-3 line-clamp-2 drop-shadow-lg pointer-events-auto">
                {item.record.text}
              </p>
            )}
          </div>

          {/* Right side action bar */}
          <div className="absolute bottom-24 right-4 flex flex-col items-center gap-5 z-10">
            <button
              onClick={(e) => { e.stopPropagation(); /* like */ }}
              className="flex flex-col items-center gap-1 text-white drop-shadow-lg"
              aria-label="Like"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-xs font-medium">{item.likeCount}</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); router.push(`/feed/${encodeURIComponent(item.uri)}`); }}
              className="flex flex-col items-center gap-1 text-white drop-shadow-lg"
              aria-label="Reply"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-xs font-medium">{item.replyCount}</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); router.push(`/profile/${item.author.handle}`); }}
              className="flex flex-col items-center gap-1 text-white drop-shadow-lg"
              aria-label="Profile"
            >
              <div className="h-8 w-8 rounded-full overflow-hidden ring-2 ring-white/50">
                {item.author.avatar ? (
                  <img src={item.author.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-accent" />
                )}
              </div>
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function FeedPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, session } = useAuth();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useFeed();
  const { mode, setMode } = useViewModeStore();
  const { content, mute, display } = useFilterStore();
  const { activeSource } = useFeedSourceStore();
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);

  useKeyboardShortcuts({
    onSearch: useCallback(() => router.push('/search'), [router]),
    onCompose: useCallback(() => router.push('/compose'), [router]),
    onEscape: useCallback(() => setShowShortcutHelp(false), []),
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, authLoading, router]);

  // GSAP scroll-triggered fade-in for feed cards in classic/compact mode
  useGSAPScrollAnimation('.feed-card', { stagger: 0.06 });

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
      });
      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-pulse rounded-full bg-brand/30" /></div>;
  }

  const allPosts = data?.pages.flatMap((page: any) => page.items || []) ?? [];
  const uniquePosts = Array.from(
    new Map(allPosts.map((p: any) => [p.uri, p])).values()
  );
  const filteredPosts = applyClientFilters(uniquePosts, content, mute);

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface-base/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 h-[53px]">
          <div className="flex items-center gap-2">
            <FeedSourcePicker />
          </div>
          <div className="flex items-center gap-2">
            <FilterPanel />
            <ViewModeToggle />
            <button
              onClick={() => setShowShortcutHelp(!showShortcutHelp)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors hidden sm:block"
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts (?)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Keyboard shortcut help modal */}
      {showShortcutHelp && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowShortcutHelp(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowShortcutHelp(false)}>
            <div className="bg-surface-elevated border border-border rounded-xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4">Keyboard Shortcuts</h2>
              <div className="space-y-2">
                {[
                  { key: 'j', desc: 'Next post' },
                  { key: 'k', desc: 'Previous post' },
                  { key: 'l', desc: 'Like post' },
                  { key: '/', desc: 'Focus search' },
                  { key: 'n', desc: 'New post' },
                  { key: '1-4', desc: 'Switch view mode' },
                  { key: 'Esc', desc: 'Close modals' },
                  { key: '?', desc: 'Show help' },
                ].map(({ key, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{desc}</span>
                    <kbd className="px-2 py-0.5 rounded bg-accent text-xs text-muted-foreground font-mono">{key}</kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {isLoading ? (
        <div className={mode === 'compact' ? '' : 'space-y-0'}>
          {Array.from({ length: 8 }).map((_, i) => <FeedCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Failed to load feed</p>
          <button onClick={() => window.location.reload()} className="mt-2 text-sm text-brand hover:underline">
            Try again
          </button>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg font-medium text-foreground">
            {uniquePosts.length > 0 ? 'No posts match your filters' : 'Welcome to VoiceFlow!'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {uniquePosts.length > 0
              ? 'Try adjusting your filters'
              : 'Follow some users to see their posts here'}
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {mode === 'classic' && (
              <div>
                {filteredPosts.map((item: any, index: number) => (
                  <FeedCard key={`${item.uri}-${item.cid || index}`} item={item} reason={item.reason} />
                ))}
              </div>
            )}
            {mode === 'grid' && <GridView items={filteredPosts} />}
            {mode === 'reels' && <ReelsView items={filteredPosts} />}
            {mode === 'compact' && <CompactView items={filteredPosts} />}
          </motion.div>

          <div ref={loadMoreRef} className="py-8">
            {isFetchingNextPage && Array.from({ length: 3 }).map((_, i) => <FeedCardSkeleton key={i} />)}
          </div>
        </AnimatePresence>
      )}
    </>
  );
}
